import status from "http-status";
import { Doctor, Prisma } from "../../../generated/prisma/client";
import { UserStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { doctorFilterableFields, doctorIncludeConfig, doctorSearchableFields } from "./doctor.constant";
import { IUpdateDoctorPayload } from "./doctor.interface";

const getAllDoctors = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Doctor, Prisma.DoctorWhereInput, Prisma.DoctorInclude>(
        prisma.doctor,
        query,
        {
            searchableFields: doctorSearchableFields,
            filterableFields: doctorFilterableFields,
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
            specialties: {
                where: {
                    specialty: {
                        isDeleted: false,
                    },
                },
                include: {
                    specialty: true,
                },
            },
        })
        .dynamicInclude(doctorIncludeConfig)
        .paginate()
        .sort()
        .fields()
        .execute();

    return result;
};

const getDoctorById = async (id: string) => {
    const doctor = await prisma.doctor.findFirst({
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
                },
            },
            specialties: {
                where: {
                    specialty: {
                        isDeleted: false,
                    },
                },
                include: {
                    specialty: true,
                },
            },
            doctorSchedules: {
                include: {
                    schedule: true,
                },
            },
            reviews: true,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor not found");
    }

    return doctor;
};

const updateDoctor = async (id: string, payload: IUpdateDoctorPayload) => {
    const isDoctorExist = await prisma.doctor.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!isDoctorExist) {
        throw new AppError(status.NOT_FOUND, "Doctor not found");
    }

    const { doctor: doctorData, specialties } = payload;

    await prisma.$transaction(async (tx) => {
        if (doctorData) {
            await tx.doctor.update({
                where: {
                    id,
                },
                data: {
                    ...doctorData,
                },
            });
        }

        if (specialties && specialties.length > 0) {
            for (const specialty of specialties) {
                const { specialtyId, shouldDelete } = specialty;

                if (shouldDelete) {
                    const existingRelation = await tx.doctorSpecialty.findUnique({
                        where: {
                            doctorId_specialtyId: {
                                doctorId: id,
                                specialtyId,
                            },
                        },
                    });

                    if (existingRelation) {
                        await tx.doctorSpecialty.delete({
                            where: {
                                doctorId_specialtyId: {
                                    doctorId: id,
                                    specialtyId,
                                },
                            },
                        });
                    }
                } else {
                    // Check if specialty exists and is active
                    const specialtyExists = await tx.specialty.findFirst({
                        where: {
                            id: specialtyId,
                            isDeleted: false,
                        },
                    });

                    if (!specialtyExists) {
                        throw new AppError(status.NOT_FOUND, `Specialty with id ${specialtyId} not found or is inactive`);
                    }

                    await tx.doctorSpecialty.upsert({
                        where: {
                            doctorId_specialtyId: {
                                doctorId: id,
                                specialtyId,
                            },
                        },
                        create: {
                            doctorId: id,
                            specialtyId,
                        },
                        update: {},
                    });
                }
            }
        }
    });

    const doctor = await getDoctorById(id);
    return doctor;
};

// Soft delete doctor, soft delete user, and invalidate active sessions
const deleteDoctor = async (id: string) => {
    const isDoctorExist = await prisma.doctor.findFirst({
        where: {
            id,
            isDeleted: false,
        },
        include: { user: true },
    });

    if (!isDoctorExist) {
        throw new AppError(status.NOT_FOUND, "Doctor not found");
    }

    await prisma.$transaction(async (tx) => {
        await tx.doctor.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        await tx.user.update({
            where: { id: isDoctorExist.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: UserStatus.DELETED,
            },
        });

        await tx.session.deleteMany({
            where: { userId: isDoctorExist.userId },
        });
    });

    return { message: "Doctor deleted successfully" };
};

const updateMyProfile = async (payload: IUpdateDoctorPayload, user: IRequestUser) => {
    const doctor = await prisma.doctor.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }

    return await updateDoctor(doctor.id, payload);
};

export const DoctorService = {
    getAllDoctors,
    getDoctorById,
    updateDoctor,
    updateMyProfile,
    deleteDoctor,
};