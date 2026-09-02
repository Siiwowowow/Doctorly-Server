/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

const normalizeBloodGroup = (bg?: string | BloodGroup | null): BloodGroup | undefined => {
    if (!bg) return undefined;
    const map: Record<string, BloodGroup> = {
        "A+": BloodGroup.A_POSITIVE,
        "A-": BloodGroup.A_NEGATIVE,
        "B+": BloodGroup.B_POSITIVE,
        "B-": BloodGroup.B_NEGATIVE,
        "AB+": BloodGroup.AB_POSITIVE,
        "AB-": BloodGroup.AB_NEGATIVE,
        "O+": BloodGroup.O_POSITIVE,
        "O-": BloodGroup.O_NEGATIVE,
        A_POSITIVE: BloodGroup.A_POSITIVE,
        A_NEGATIVE: BloodGroup.A_NEGATIVE,
        B_POSITIVE: BloodGroup.B_POSITIVE,
        B_NEGATIVE: BloodGroup.B_NEGATIVE,
        AB_POSITIVE: BloodGroup.AB_POSITIVE,
        AB_NEGATIVE: BloodGroup.AB_NEGATIVE,
        O_POSITIVE: BloodGroup.O_POSITIVE,
        O_NEGATIVE: BloodGroup.O_NEGATIVE,
    };
    return map[bg] || undefined;
};

const formatPatientResponse = (patient: any) => {
    if (!patient) return patient;
    return {
        ...patient,
        bloodGroup: patient.patientHealthData?.bloodGroup || patient.bloodGroup || null,
        gender: patient.patientHealthData?.gender || null,
    };
};

const getMyProfile = async (user: IRequestUser) => {
    let patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { userId: user.userId },
                { email: user.email },
            ],
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
        },
    });

    if (!patient) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
        });

        if (dbUser && dbUser.role === Role.PATIENT) {
            patient = await prisma.patient.create({
                data: {
                    userId: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                    profilePhoto: dbUser.image,
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
                },
            });
        }
    }

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    return formatPatientResponse(patient);
};

const getPatientById = async (id: string, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { id },
                { userId: id },
            ],
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
        },
    });

    if (!patient) {
        throw new AppError(status.NOT_FOUND, "Patient not found");
    }

    // Role-based data access: A patient can only view their own profile
    if (user.role === Role.PATIENT && patient.userId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot view another patient's profile");
    }

    return formatPatientResponse(patient);
};

const updatePatient = async (id: string, payload: IUpdatePatientPayload, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { id },
                { userId: id },
            ],
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

    let { patientHealthData, ...patientData } = payload;
    const directBloodGroup = (payload as any).bloodGroup;
    if (directBloodGroup || patientHealthData?.bloodGroup) {
        const bg = normalizeBloodGroup(directBloodGroup || patientHealthData?.bloodGroup);
        if (bg) {
            patientHealthData = {
                ...(patientHealthData || {}),
                bloodGroup: bg,
            };
        }
        delete (patientData as any).bloodGroup;
    }

    await prisma.$transaction(async (tx) => {
        // 1. Update basic patient profile
        if (Object.keys(patientData).length > 0) {
            await tx.patient.update({
                where: { id: patient.id },
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
            const { dateOfBirth, bloodGroup, ...restHealthData } = patientHealthData;
            const normalizedBg = bloodGroup ? normalizeBloodGroup(bloodGroup) : undefined;

            await tx.patientHealthData.upsert({
                where: {
                    patientId: patient.id,
                },
                create: {
                    patientId: patient.id,
                    ...restHealthData,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
                    gender: (restHealthData.gender as Gender) || Gender.MALE,
                    bloodGroup: normalizedBg || BloodGroup.O_POSITIVE,
                    height: restHealthData.height || "",
                    weight: restHealthData.weight || "",
                },
                update: {
                    ...restHealthData,
                    ...(normalizedBg ? { bloodGroup: normalizedBg } : {}),
                    ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
                },
            });
        }
    });

    const updatedPatient = await getPatientById(patient.id, user);
    return formatPatientResponse(updatedPatient);
};

const deletePatient = async (id: string, user: IRequestUser) => {
    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { id },
                { userId: id },
            ],
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
            where: { id: patient.id },
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

    if (result && Array.isArray(result.data)) {
        result.data = result.data.map(formatPatientResponse);
    }

    return result;
};

export const PatientService = {
    getMyProfile,
    getPatientById,
    updatePatient,
    deletePatient,
    getAllPatients,
};
