import status from "http-status";
import { Patient, Prisma } from "../../../generated/prisma/client";
import { BloodGroup, Gender, Role, UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { patientFilterableFields, patientIncludeConfig, patientSearchableFields } from "./patient.constant";
import { IUpdatePatientPayload } from "./patient.interface";

const getMyProfile = async (user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            patientHealthData: true,
            appointments: {
                include: {
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePhoto: true,
                            designation: true,
                            qualification: true,
                        },
                    },
                    schedule: true,
                },
            },
            prescriptions: true,
            medicalReports: true,
            reviews: true,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    return patient;
};

const getPatientById = async (id: string, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
            patientHealthData: true,
            appointments: {
                include: {
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePhoto: true,
                            designation: true,
                            qualification: true,
                        },
                    },
                    schedule: true,
                },
            },
            prescriptions: true,
            medicalReports: true,
            reviews: true,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    // Role-based data access: A patient can only view their own profile
    if (user.role === Role.PATIENT && patient.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot view another patient's profile");
    }

    return patient;
};

const updatePatient = async (id: string, payload: IUpdatePatientPayload, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    // Role-based authorization: A patient can only update their own profile
    if (user.role === Role.PATIENT && patient.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot update another patient's profile");
    }

    const { patientHealthData, ...patientData } = payload;

    await prisma.$transaction(async (tx) => {
        // 1. Update basic patient profile
        if (Object.keys(patientData).length > 0) {
            await tx.patient.update({
                where: { id },
                data: patientData,
            });

            // If name or profile photo is updated, also synchronize the User model
            const userUpdateData: { name?: string; image?: string } = {};
            if (patientData.name) userUpdateData.name = patientData.name;
            if (patientData.profilePhoto) userUpdateData.image = patientData.profilePhoto;

            if (Object.keys(userUpdateData).length > 0) {
                await tx.user.update({
                    where: { id: patient.userId },
                    data: userUpdateData,
                });
            }
        }

        // 2. Upsert patient health data if provided
        if (patientHealthData && Object.keys(patientHealthData).length > 0) {
            const { dateOfBirth, ...restHealthData } = patientHealthData;

            await tx.patientHealthData.upsert({
                where: {
                    patientId: id,
                },
                create: {
                    patientId: id,
                    ...restHealthData,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
                    gender: restHealthData.gender || Gender.MALE,
                    bloodGroup: restHealthData.bloodGroup || BloodGroup.O_POSITIVE,
                    height: restHealthData.height || "",
                    weight: restHealthData.weight || "",
                },
                update: {
                    ...restHealthData,
                    ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
                },
            });
        }
    });

    const updatedPatient = await getPatientById(id, user);
    return updatedPatient;
};

const deletePatient = async (id: string, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    // Role-based authorization: A patient can only delete their own account
    if (user.role === Role.PATIENT && patient.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot delete another patient's account");
    }

    await prisma.$transaction(async (tx) => {
        // Soft delete patient record
        await tx.patient.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        // Soft delete user record and set status to DELETED
        await tx.user.update({
            where: { id: patient.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED,
            },
        });

        // Invalidate active sessions
        await tx.session.deleteMany({
            where: { userId: patient.userId },
        });
    });

    return { message: "Patient account deleted successfully" };
};

const getAllPatients = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Patient, Prisma.PatientWhereInput, Prisma.PatientInclude>(
        prisma.patient,
        query,
        {
            searchableFields: patientSearchableFields,
            filterableFields: patientFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
        })
        .include({
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    status: true,
                },
            },
            patientHealthData: true,
        })
        .dynamicInclude(patientIncludeConfig)
        .paginate()
        .sort()
        .fields()
        .execute();

    return result;
};

export const PatientService = {
    getMyProfile,
    getPatientById,
    updatePatient,
    deletePatient,
    getAllPatients,
};
