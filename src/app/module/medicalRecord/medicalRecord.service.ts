import status from "http-status";
import { MedicalRecord, Prisma } from "../../../generated/prisma/client";
import { AppointmentStatus, NotificationType, Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import {
    medicalRecordFilterableFields,
    medicalRecordIncludeConfig,
    medicalRecordSearchableFields,
} from "./medicalRecord.constant";
import { ICreateMedicalRecordPayload, IUpdateMedicalRecordPayload } from "./medicalRecord.interface";

const defaultMedicalRecordInclude = {
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
            address: true,
        },
    },
    doctor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
            qualification: true,
            currentWorkingPlace: true,
        },
    },
    appointment: {
        select: {
            id: true,
            videoCallingId: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true,
            schedule: true,
        },
    },
};

const createMedicalRecord = async (payload: ICreateMedicalRecordPayload, user: IRequestUser) => {
    // 1. Resolve & validate authenticated doctor
    const doctor = await prisma.doctor.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
        include: {
            user: true,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }

    if (doctor.user.status === UserStatus.BLOCKED || doctor.user.isDeleted || doctor.user.status === UserStatus.DELETED) {
        throw new AppError(status.FORBIDDEN, "Doctor account is not active");
    }

    // 2. Resolve & validate appointment
    const appointment = await prisma.appointment.findUnique({
        where: {
            id: payload.appointmentId,
        },
        include: {
            patient: {
                include: {
                    user: true,
                },
            },
            doctor: true,
        },
    });

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    // 3. Verify appointment status is COMPLETED
    if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new AppError(status.BAD_REQUEST, "Medical record can only be created for completed appointments");
    }

    // 4. Verify appointment doctor matches authenticated doctor
    if (appointment.doctorId !== doctor.id) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to create a medical record for this appointment");
    }

    // 5. Verify patient is active
    if (appointment.patient.isDeleted || appointment.patient.user.isDeleted || appointment.patient.user.status === UserStatus.DELETED) {
        throw new AppError(status.BAD_REQUEST, "Patient account associated with this appointment is deleted or inactive");
    }

    // 6. Prevent duplicate medical records for the same appointment
    const existingMedicalRecord = await prisma.medicalRecord.findUnique({
        where: {
            appointmentId: payload.appointmentId,
        },
    });

    if (existingMedicalRecord) {
        throw new AppError(status.CONFLICT, "A medical record already exists for this appointment");
    }

    // 7. Create medical record in transaction with notification
    const result = await prisma.$transaction(async (tx) => {
        const createdRecord = await tx.medicalRecord.create({
            data: {
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                doctorId: doctor.id,
                diagnosis: payload.diagnosis,
                symptoms: payload.symptoms,
                clinicalNotes: payload.clinicalNotes,
                treatment: payload.treatment,
                advice: payload.advice,
                followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
                followUpNotes: payload.followUpNotes,
            },
            include: defaultMedicalRecordInclude,
        });

        // Notify patient
        await NotificationService.createNotification(
            {
                recipientId: appointment.patient.userId,
                type: NotificationType.MEDICAL_RECORD_CREATED,
                title: "Medical Record Added",
                message: `Dr. ${doctor.name} added a new medical record for your consultation.`,
                data: {
                    medicalRecordId: createdRecord.id,
                    appointmentId: appointment.id,
                    doctorId: doctor.id,
                    patientId: appointment.patientId,
                },
            },
            tx
        );

        return createdRecord;
    });

    return result;
};

const getMedicalRecordById = async (id: string, user: IRequestUser) => {
    const medicalRecord = await prisma.medicalRecord.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: defaultMedicalRecordInclude,
    });

    if (!medicalRecord) {
        throw new AppError(status.NOT_FOUND, "Medical record not found");
    }

    // Role-based authorization & ownership checks
    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!patient || medicalRecord.patientId !== patient.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only view your own medical records");
        }
    } else if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        // Doctor can access if they created it OR have a legitimate treatment history with the patient
        if (medicalRecord.doctorId !== doctor.id) {
            const hasTreatedPatient = await prisma.appointment.findFirst({
                where: {
                    doctorId: doctor.id,
                    patientId: medicalRecord.patientId,
                },
            });

            if (!hasTreatedPatient) {
                throw new AppError(
                    status.FORBIDDEN,
                    "Forbidden access! You can only view medical records of patients you have treated"
                );
            }
        }
    }

    return medicalRecord;
};

const getMyMedicalRecords = async (user: IRequestUser, query: IQueryParams) => {
    let whereFilter: Prisma.MedicalRecordWhereInput = { isDeleted: false };

    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!patient) {
            throw new AppError(status.NOT_FOUND, "Patient profile not found");
        }

        whereFilter = {
            ...whereFilter,
            patientId: patient.id,
        };
    } else if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        whereFilter = {
            ...whereFilter,
            doctorId: doctor.id,
        };
    } else {
        throw new AppError(status.FORBIDDEN, "Forbidden access");
    }

    const queryBuilder = new QueryBuilder<MedicalRecord, Prisma.MedicalRecordWhereInput, Prisma.MedicalRecordInclude>(
        prisma.medicalRecord,
        query,
        {
            searchableFields: medicalRecordSearchableFields,
            filterableFields: medicalRecordFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where(whereFilter)
        .paginate()
        .include(defaultMedicalRecordInclude)
        .dynamicInclude(medicalRecordIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getPatientMedicalRecords = async (patientId: string, user: IRequestUser, query: IQueryParams) => {
    // 1. Verify patient exists
    const patient = await prisma.patient.findFirst({
        where: {
            id: patientId,
            isDeleted: false,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    // 2. Doctor relationship validation
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        const treatmentRelationship = await prisma.appointment.findFirst({
            where: {
                doctorId: doctor.id,
                patientId: patientId,
            },
        });

        if (!treatmentRelationship) {
            throw new AppError(
                status.FORBIDDEN,
                "Forbidden access! You can only view medical records of patients you have treated"
            );
        }
    }

    const queryBuilder = new QueryBuilder<MedicalRecord, Prisma.MedicalRecordWhereInput, Prisma.MedicalRecordInclude>(
        prisma.medicalRecord,
        query,
        {
            searchableFields: medicalRecordSearchableFields,
            filterableFields: medicalRecordFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            patientId,
            isDeleted: false,
        })
        .paginate()
        .include(defaultMedicalRecordInclude)
        .dynamicInclude(medicalRecordIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getAllMedicalRecords = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<MedicalRecord, Prisma.MedicalRecordWhereInput, Prisma.MedicalRecordInclude>(
        prisma.medicalRecord,
        query,
        {
            searchableFields: medicalRecordSearchableFields,
            filterableFields: medicalRecordFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
        })
        .paginate()
        .include(defaultMedicalRecordInclude)
        .dynamicInclude(medicalRecordIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const updateMedicalRecord = async (id: string, payload: IUpdateMedicalRecordPayload, user: IRequestUser) => {
    // 1. Verify medical record exists
    const medicalRecord = await prisma.medicalRecord.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!medicalRecord) {
        throw new AppError(status.NOT_FOUND, "Medical record not found");
    }

    // 2. Doctor ownership validation
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor || medicalRecord.doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only update medical records created by yourself");
        }
    }

    const updateData: Prisma.MedicalRecordUpdateInput = {};

    if (payload.diagnosis !== undefined) updateData.diagnosis = payload.diagnosis;
    if (payload.symptoms !== undefined) updateData.symptoms = payload.symptoms;
    if (payload.clinicalNotes !== undefined) updateData.clinicalNotes = payload.clinicalNotes;
    if (payload.treatment !== undefined) updateData.treatment = payload.treatment;
    if (payload.advice !== undefined) updateData.advice = payload.advice;
    if (payload.followUpDate !== undefined) {
        updateData.followUpDate = payload.followUpDate ? new Date(payload.followUpDate) : null;
    }
    if (payload.followUpNotes !== undefined) updateData.followUpNotes = payload.followUpNotes;

    const result = await prisma.medicalRecord.update({
        where: {
            id,
        },
        data: updateData,
        include: defaultMedicalRecordInclude,
    });

    return result;
};

const deleteMedicalRecord = async (id: string, user: IRequestUser) => {
    // 1. Verify medical record exists
    const medicalRecord = await prisma.medicalRecord.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!medicalRecord) {
        throw new AppError(status.NOT_FOUND, "Medical record not found");
    }

    // 2. Ownership & role validation
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor || medicalRecord.doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only delete medical records created by yourself");
        }
    }

    // 3. Perform soft delete to preserve clinical data integrity
    const result = await prisma.medicalRecord.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
        include: defaultMedicalRecordInclude,
    });

    return result;
};

export const MedicalRecordService = {
    createMedicalRecord,
    getMedicalRecordById,
    getMyMedicalRecords,
    getPatientMedicalRecords,
    getAllMedicalRecords,
    updateMedicalRecord,
    deleteMedicalRecord,
};
