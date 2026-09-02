/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { Role, Specialty } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { memoryCache } from "../../utils/cache";
import { ICreateAdminPayload, ICreateDoctorPayload } from "./user.interface";

const createDoctor = async (payload: ICreateDoctorPayload) => {
    // 1. Verify specialties exist and are not deleted
    const specialties: Specialty[] = [];

    for (const specialtyId of payload.specialties) {
        const specialty = await prisma.specialty.findFirst({
            where: {
                id: specialtyId,
                isDeleted: false,
            },
        });
        if (!specialty) {
            throw new AppError(status.NOT_FOUND, `Specialty with id ${specialtyId} not found or is inactive`);
        }
        specialties.push(specialty);
    }

    // 2. Check if user with this email already exists
    const userExists = await prisma.user.findUnique({
        where: {
            email: payload.doctor.email,
        },
    });

    if (userExists) {
        throw new AppError(status.CONFLICT, "User with this email already exists");
    }

    // 3. Register user in Better Auth
    const userData = await auth.api.signUpEmail({
        body: {
            email: payload.doctor.email,
            password: payload.password,
            role: Role.DOCTOR,
            name: payload.doctor.name,
            needPasswordChange: true,
        },
    });

    if (!userData || !userData.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to create doctor user account");
    }

    // 4. Create Doctor and DoctorSpecialty records in transaction
    try {
        const result = await prisma.$transaction(async (tx) => {
            const doctorData = await tx.doctor.create({
                data: {
                    userId: userData.user.id,
                    ...payload.doctor,
                },
            });

            const doctorSpecialtyData = specialties.map((specialty) => ({
                doctorId: doctorData.id,
                specialtyId: specialty.id,
            }));

            await tx.doctorSpecialty.createMany({
                data: doctorSpecialtyData,
            });

            const doctor = await tx.doctor.findUnique({
                where: {
                    id: doctorData.id,
                },
                select: {
                    id: true,
                    userId: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                    address: true,
                    registrationNumber: true,
                    experience: true,
                    gender: true,
                    appointmentFee: true,
                    qualification: true,
                    currentWorkingPlace: true,
                    designation: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            status: true,
                            emailVerified: true,
                            image: true,
                            isDeleted: true,
                            deletedAt: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                    specialties: {
                        select: {
                            specialty: {
                                select: {
                                    id: true,
                                    title: true,
                                    description: true,
                                    icon: true,
                                },
                            },
                        },
                    },
                },
            });

            return doctor;
        });

        memoryCache.invalidateTag("doctors");
        return result;
    } catch (error) {
        // Rollback user creation on failure
        await prisma.user.delete({
            where: {
                id: userData.user.id,
            },
        }).catch(() => {});
        throw error;
    }
};

const createAdmin = async (payload: ICreateAdminPayload, requestingUser?: IRequestUser) => {
    // 1. Role verification: Only SUPER_ADMIN can create an ADMIN or SUPER_ADMIN
    if (!requestingUser || requestingUser.role !== Role.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only SUPER_ADMIN can create administrator accounts");
    }

    const { admin, role, password } = payload;

    // Check if user already exists
    const userExists = await prisma.user.findUnique({
        where: {
            email: admin.email,
        },
    });

    if (userExists) {
        throw new AppError(status.CONFLICT, "User with this email already exists");
    }

    // Register user with Better Auth
    const userData = await auth.api.signUpEmail({
        body: {
            name: admin.name,
            email: admin.email,
            password,
            role,
            needPasswordChange: true,
        },
    });

    if (!userData || !userData.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to create admin user account");
    }

    try {
        const adminData = await prisma.admin.create({
            data: {
                userId: userData.user.id,
                ...admin,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        status: true,
                        emailVerified: true,
                        image: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return adminData;
    } catch (error: any) {
        await prisma.user.delete({
            where: {
                id: userData.user.id,
            },
        }).catch(() => {});
        throw error;
    }
};

export const UserService = {
    createDoctor,
    createAdmin,
};
