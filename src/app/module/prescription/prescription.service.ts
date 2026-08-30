import status from "http-status";
import { Prescription, Prisma } from "../../../generated/prisma/client";
import { AppointmentStatus, NotificationType, Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import {
    prescriptionFilterableFields,
    prescriptionIncludeConfig,
    prescriptionSearchableFields,
} from "./prescription.constant";
import { ICreatePrescriptionPayload, IUpdatePrescriptionPayload } from "./prescription.interface";

const defaultPrescriptionInclude = {
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
            address: true,
            patientHealthData: {
                select: {
                    bloodGroup: true,
                    gender: true,
                    dateOfBirth: true,
                },
            },
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
    medicalRecord: {
        select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            clinicalNotes: true,
            treatment: true,
            advice: true,
            followUpDate: true,
            followUpNotes: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    medicines: true,
};

const createPrescription = async (payload: ICreatePrescriptionPayload, user: IRequestUser) => {
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

    // 3. Verify appointment is not canceled
    if (appointment.status === AppointmentStatus.CANCELED) {
        throw new AppError(status.BAD_REQUEST, "Prescription cannot be created for canceled appointments");
    }

    // 4. Verify appointment doctor matches authenticated doctor
    if (appointment.doctorId !== doctor.id) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to create a prescription for this appointment");
    }

    // 5. Verify patient is active
    if (appointment.patient.isDeleted || appointment.patient.user.isDeleted || appointment.patient.user.status === UserStatus.DELETED) {
        throw new AppError(status.BAD_REQUEST, "Patient account associated with this appointment is deleted or inactive");
    }

    // 6. Resolve and verify MedicalRecord for this appointment (optional)
    let medicalRecordId = payload.medicalRecordId || null;

    if (medicalRecordId) {
        const medicalRecord = await prisma.medicalRecord.findFirst({
            where: {
                id: medicalRecordId,
                appointmentId: appointment.id,
                isDeleted: false,
            },
        });

        if (!medicalRecord) {
            throw new AppError(status.BAD_REQUEST, "Provided medical record does not match this appointment or is deleted");
        }
    } else {
        const medicalRecord = await prisma.medicalRecord.findUnique({
            where: {
                appointmentId: appointment.id,
            },
        });

        if (medicalRecord && !medicalRecord.isDeleted) {
            medicalRecordId = medicalRecord.id;
        } else {
            medicalRecordId = null;
        }
    }

    // 7. Prevent duplicate prescription for this appointment
    const existingPrescription = await prisma.prescription.findUnique({
        where: {
            appointmentId: payload.appointmentId,
        },
    });

    if (existingPrescription) {
        throw new AppError(status.CONFLICT, "A prescription already exists for this appointment");
    }

    // 8. Atomic transaction for prescription and medicines
    const result = await prisma.$transaction(async (tx) => {
        const createdPrescription = await tx.prescription.create({
            data: {
                appointmentId: appointment.id,
                medicalRecordId: medicalRecordId,
                patientId: appointment.patientId,
                doctorId: doctor.id,
                instructions: payload.instructions,
                notes: payload.notes,
                advice: payload.advice,
                followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
                medicines: {
                    create: payload.medicines.map((medicine) => ({
                        medicineName: medicine.medicineName,
                        dosage: medicine.dosage,
                        frequency: medicine.frequency,
                        duration: medicine.duration,
                        route: medicine.route,
                        instructions: medicine.instructions,
                    })),
                },
            },
            include: defaultPrescriptionInclude,
        });

        // Notify patient
        await NotificationService.createNotification(
            {
                recipientId: appointment.patient.userId,
                type: NotificationType.PRESCRIPTION_CREATED,
                title: "Prescription Issued",
                message: `Dr. ${doctor.name} issued a new prescription for your consultation.`,
                data: {
                    prescriptionId: createdPrescription.id,
                    appointmentId: appointment.id,
                    doctorId: doctor.id,
                    patientId: appointment.patientId,
                },
            },
            tx
        );

        return createdPrescription;
    });

    return result;
};

const getPrescriptionById = async (id: string, user: IRequestUser) => {
    const prescription = await prisma.prescription.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: defaultPrescriptionInclude,
    });

    if (!prescription) {
        throw new AppError(status.NOT_FOUND, "Prescription not found");
    }

    // Role-based authorization & ownership checks
    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!patient || prescription.patientId !== patient.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only view your own prescriptions");
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

        if (prescription.doctorId !== doctor.id) {
            const hasTreatedPatient = await prisma.appointment.findFirst({
                where: {
                    doctorId: doctor.id,
                    patientId: prescription.patientId,
                },
            });

            if (!hasTreatedPatient) {
                throw new AppError(
                    status.FORBIDDEN,
                    "Forbidden access! You can only view prescriptions of patients you have treated"
                );
            }
        }
    }

    return prescription;
};

const getMyPrescriptions = async (user: IRequestUser, query: IQueryParams) => {
    let whereFilter: Prisma.PrescriptionWhereInput = { isDeleted: false };

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

    const queryBuilder = new QueryBuilder<Prescription, Prisma.PrescriptionWhereInput, Prisma.PrescriptionInclude>(
        prisma.prescription,
        query,
        {
            searchableFields: prescriptionSearchableFields,
            filterableFields: prescriptionFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where(whereFilter)
        .paginate()
        .include(defaultPrescriptionInclude)
        .dynamicInclude(prescriptionIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getPatientPrescriptions = async (patientId: string, user: IRequestUser, query: IQueryParams) => {
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
                "Forbidden access! You can only view prescriptions of patients you have treated"
            );
        }
    }

    const queryBuilder = new QueryBuilder<Prescription, Prisma.PrescriptionWhereInput, Prisma.PrescriptionInclude>(
        prisma.prescription,
        query,
        {
            searchableFields: prescriptionSearchableFields,
            filterableFields: prescriptionFilterableFields,
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
        .include(defaultPrescriptionInclude)
        .dynamicInclude(prescriptionIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getAllPrescriptions = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Prescription, Prisma.PrescriptionWhereInput, Prisma.PrescriptionInclude>(
        prisma.prescription,
        query,
        {
            searchableFields: prescriptionSearchableFields,
            filterableFields: prescriptionFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
        })
        .paginate()
        .include(defaultPrescriptionInclude)
        .dynamicInclude(prescriptionIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const updatePrescription = async (id: string, payload: IUpdatePrescriptionPayload, user: IRequestUser) => {
    // 1. Verify prescription exists
    const prescription = await prisma.prescription.findFirst({
        where: {
            id,
            isDeleted: false,
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

    if (!prescription) {
        throw new AppError(status.NOT_FOUND, "Prescription not found");
    }

    // 2. Doctor ownership validation
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor || prescription.doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only update prescriptions created by yourself");
        }
    } else if (user.role === Role.PATIENT) {
        throw new AppError(status.FORBIDDEN, "Patients cannot modify prescriptions");
    }

    const updateData: Prisma.PrescriptionUpdateInput = {};

    if (payload.instructions !== undefined) updateData.instructions = payload.instructions;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    if (payload.advice !== undefined) updateData.advice = payload.advice;
    if (payload.followUpDate !== undefined) {
        updateData.followUpDate = payload.followUpDate ? new Date(payload.followUpDate) : null;
    }

    // 3. If medicines are updated, perform atomic replacement in transaction
    const result = await prisma.$transaction(async (tx) => {
        if (payload.medicines && payload.medicines.length > 0) {
            await tx.prescriptionMedicine.deleteMany({
                where: {
                    prescriptionId: id,
                },
            });

            await tx.prescriptionMedicine.createMany({
                data: payload.medicines.map((medicine) => ({
                    prescriptionId: id,
                    medicineName: medicine.medicineName,
                    dosage: medicine.dosage,
                    frequency: medicine.frequency,
                    duration: medicine.duration,
                    route: medicine.route,
                    instructions: medicine.instructions,
                })),
            });
        }

        const updated = await tx.prescription.update({
            where: {
                id,
            },
            data: updateData,
            include: defaultPrescriptionInclude,
        });

        // Notify patient
        await NotificationService.createNotification(
            {
                recipientId: prescription.patient.userId,
                type: NotificationType.PRESCRIPTION_UPDATED,
                title: "Prescription Updated",
                message: `Your prescription from Dr. ${prescription.doctor.name} has been updated.`,
                data: {
                    prescriptionId: id,
                    doctorId: prescription.doctorId,
                    patientId: prescription.patientId,
                    appointmentId: prescription.appointmentId,
                },
            },
            tx
        );

        return updated;
    });

    return result;
};

const deletePrescription = async (id: string, user: IRequestUser) => {
    // 1. Verify prescription exists
    const prescription = await prisma.prescription.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!prescription) {
        throw new AppError(status.NOT_FOUND, "Prescription not found");
    }

    // 2. Ownership & role validation
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor || prescription.doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You can only delete prescriptions created by yourself");
        }
    } else if (user.role === Role.PATIENT) {
        throw new AppError(status.FORBIDDEN, "Patients cannot delete prescriptions");
    }

    // 3. Perform soft delete to preserve clinical data integrity
    const result = await prisma.prescription.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
        include: defaultPrescriptionInclude,
    });

    return result;
};

export const PrescriptionService = {
    createPrescription,
    getPrescriptionById,
    getMyPrescriptions,
    getPatientPrescriptions,
    getAllPrescriptions,
    updatePrescription,
    deletePrescription,
};
