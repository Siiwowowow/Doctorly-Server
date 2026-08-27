import status from "http-status";
import { DoctorSchedules, Prisma } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    doctorScheduleFilterableFields,
    doctorScheduleIncludeConfig,
    doctorScheduleSearchableFields,
} from "./doctorSchedule.constant";
import {
    ICreateDoctorSchedulePayload,
    IUpdateDoctorSchedulePayload,
} from "./doctorSchedule.interface";

// Helper to resolve doctor ID and enforce role ownership
const getTargetDoctorId = async (user: IRequestUser, payloadDoctorId?: string): Promise<string> => {
    if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found or is inactive");
        }

        return doctor.id;
    }

    // For ADMIN or SUPER_ADMIN
    if (!payloadDoctorId) {
        throw new AppError(status.BAD_REQUEST, "Doctor ID is required for administrator requests");
    }

    const doctor = await prisma.doctor.findFirst({
        where: {
            id: payloadDoctorId,
            isDeleted: false,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor not found or is inactive");
    }

    return doctor.id;
};

const createDoctorSchedule = async (user: IRequestUser, payload: ICreateDoctorSchedulePayload) => {
    const doctorId = await getTargetDoctorId(user, payload.doctorId);

    if (!payload.scheduleIds || payload.scheduleIds.length === 0) {
        throw new AppError(status.BAD_REQUEST, "At least one schedule ID is required");
    }

    // 1. Fetch all requested new schedules from DB
    const newSchedules = await prisma.schedule.findMany({
        where: {
            id: {
                in: payload.scheduleIds,
            },
        },
    });

    if (newSchedules.length !== payload.scheduleIds.length) {
        throw new AppError(status.NOT_FOUND, "One or more schedule IDs were not found");
    }

    // 2. Validate internal time consistency & overlap within incoming schedules
    for (let i = 0; i < newSchedules.length; i++) {
        const s1 = newSchedules[i];
        if (s1.startDateTime >= s1.endDateTime) {
            throw new AppError(status.BAD_REQUEST, "Schedule start time must be before end time");
        }

        for (let j = i + 1; j < newSchedules.length; j++) {
            const s2 = newSchedules[j];
            if (s1.startDateTime < s2.endDateTime && s1.endDateTime > s2.startDateTime) {
                throw new AppError(status.CONFLICT, "Incoming schedules contain overlapping time ranges");
            }
        }
    }

    // 3. Prevent duplicate assignments for this doctor
    const existingAssignments = await prisma.doctorSchedules.findMany({
        where: {
            doctorId,
            scheduleId: {
                in: payload.scheduleIds,
            },
        },
    });

    if (existingAssignments.length > 0) {
        throw new AppError(
            status.CONFLICT,
            "Doctor is already assigned to one or more of the selected schedules"
        );
    }

    // 4. Overlap checking against existing schedules assigned to this doctor
    const existingDoctorSchedules = await prisma.doctorSchedules.findMany({
        where: {
            doctorId,
        },
        include: {
            schedule: true,
        },
    });

    for (const newSched of newSchedules) {
        for (const existDoctorSched of existingDoctorSchedules) {
            if (
                existDoctorSched.schedule.startDateTime < newSched.endDateTime &&
                existDoctorSched.schedule.endDateTime > newSched.startDateTime
            ) {
                throw new AppError(
                    status.CONFLICT,
                    `Doctor already has a conflicting schedule between ${existDoctorSched.schedule.startDateTime.toISOString()} and ${existDoctorSched.schedule.endDateTime.toISOString()}`
                );
            }
        }
    }

    // 5. Create DoctorSchedules inside a transaction
    const result = await prisma.$transaction(async (tx) => {
        const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
            doctorId,
            scheduleId,
            isBooked: false,
        }));

        await tx.doctorSchedules.createMany({
            data: doctorScheduleData,
        });

        const createdDoctorSchedules = await tx.doctorSchedules.findMany({
            where: {
                doctorId,
                scheduleId: {
                    in: payload.scheduleIds,
                },
            },
            include: {
                schedule: true,
            },
        });

        return createdDoctorSchedules;
    });

    return result;
};

const getMyDoctorSchedules = async (user: IRequestUser, query: IQueryParams) => {
    const doctor = await prisma.doctor.findFirst({
        where: {
            userId: user.userId,
            isDeleted: false,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }

    const queryBuilder = new QueryBuilder<DoctorSchedules, Prisma.DoctorSchedulesWhereInput, Prisma.DoctorSchedulesInclude>(
        prisma.doctorSchedules,
        {
            ...query,
            doctorId: doctor.id,
        },
        {
            filterableFields: doctorScheduleFilterableFields,
            searchableFields: doctorScheduleSearchableFields,
        }
    );

    const doctorSchedules = await queryBuilder
        .search()
        .filter()
        .paginate()
        .include({
            schedule: true,
        })
        .sort()
        .fields()
        .execute();

    return doctorSchedules;
};

const getDoctorSchedulesByDoctorId = async (doctorId: string, query: IQueryParams) => {
    const doctor = await prisma.doctor.findFirst({
        where: {
            id: doctorId,
            isDeleted: false,
        },
    });

    if (!doctor) {
        throw new AppError(status.NOT_FOUND, "Doctor not found or is inactive");
    }

    const queryBuilder = new QueryBuilder<DoctorSchedules, Prisma.DoctorSchedulesWhereInput, Prisma.DoctorSchedulesInclude>(
        prisma.doctorSchedules,
        {
            ...query,
            doctorId,
        },
        {
            filterableFields: doctorScheduleFilterableFields,
            searchableFields: doctorScheduleSearchableFields,
        }
    );

    const doctorSchedules = await queryBuilder
        .search()
        .filter()
        .paginate()
        .include({
            schedule: true,
        })
        .sort()
        .fields()
        .execute();

    return doctorSchedules;
};

const getAllDoctorSchedules = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<DoctorSchedules, Prisma.DoctorSchedulesWhereInput, Prisma.DoctorSchedulesInclude>(
        prisma.doctorSchedules,
        query,
        {
            filterableFields: doctorScheduleFilterableFields,
            searchableFields: doctorScheduleSearchableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .paginate()
        .dynamicInclude(doctorScheduleIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getDoctorScheduleById = async (doctorId: string, scheduleId: string, user?: IRequestUser) => {
    if (user && user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
        });

        if (!doctor || doctor.id !== doctorId) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot view another doctor's schedule");
        }
    }

    const doctorSchedule = await prisma.doctorSchedules.findUnique({
        where: {
            doctorId_scheduleId: {
                doctorId,
                scheduleId,
            },
        },
        include: {
            schedule: true,
            doctor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    designation: true,
                    qualification: true,
                    appointmentFee: true,
                },
            },
        },
    });

    if (!doctorSchedule) {
        throw new AppError(status.NOT_FOUND, "Doctor schedule not found");
    }

    return doctorSchedule;
};

const updateDoctorSchedule = async (user: IRequestUser, payload: IUpdateDoctorSchedulePayload) => {
    const doctorId = await getTargetDoctorId(user, payload.doctorId);

    const deleteIds = payload.scheduleIds
        .filter((schedule) => schedule.shouldDelete)
        .map((schedule) => schedule.id);

    const createIds = payload.scheduleIds
        .filter((schedule) => !schedule.shouldDelete)
        .map((schedule) => schedule.id);

    // 1. Safety check for deletions: do not delete booked schedules or schedules with appointments
    if (deleteIds.length > 0) {
        const bookedSchedules = await prisma.doctorSchedules.findMany({
            where: {
                doctorId,
                scheduleId: {
                    in: deleteIds,
                },
                isBooked: true,
            },
        });

        if (bookedSchedules.length > 0) {
            throw new AppError(
                status.BAD_REQUEST,
                "Cannot remove doctor schedules that are already booked for appointments"
            );
        }

        const linkedAppointments = await prisma.appointment.findMany({
            where: {
                doctorId,
                scheduleId: {
                    in: deleteIds,
                },
            },
        });

        if (linkedAppointments.length > 0) {
            throw new AppError(
                status.BAD_REQUEST,
                "Cannot remove doctor schedules associated with existing appointments"
            );
        }
    }

    // 2. Overlap and validity check for newly added schedules
    if (createIds.length > 0) {
        const newSchedules = await prisma.schedule.findMany({
            where: {
                id: {
                    in: createIds,
                },
            },
        });

        if (newSchedules.length !== createIds.length) {
            throw new AppError(status.NOT_FOUND, "One or more schedule IDs were not found");
        }

        // Check against existing schedules that are not being deleted
        const remainingExistingSchedules = await prisma.doctorSchedules.findMany({
            where: {
                doctorId,
                scheduleId: {
                    notIn: deleteIds,
                },
            },
            include: {
                schedule: true,
            },
        });

        for (const newSched of newSchedules) {
            for (const existSched of remainingExistingSchedules) {
                if (
                    existSched.schedule.startDateTime < newSched.endDateTime &&
                    existSched.schedule.endDateTime > newSched.startDateTime
                ) {
                    throw new AppError(
                        status.CONFLICT,
                        `Doctor already has a conflicting schedule between ${existSched.schedule.startDateTime.toISOString()} and ${existSched.schedule.endDateTime.toISOString()}`
                    );
                }
            }
        }
    }

    // 3. Execute updates inside a transaction
    const result = await prisma.$transaction(async (tx) => {
        if (deleteIds.length > 0) {
            await tx.doctorSchedules.deleteMany({
                where: {
                    doctorId,
                    scheduleId: {
                        in: deleteIds,
                    },
                    isBooked: false,
                },
            });
        }

        if (createIds.length > 0) {
            const doctorScheduleData = createIds.map((scheduleId) => ({
                doctorId,
                scheduleId,
                isBooked: false,
            }));

            await tx.doctorSchedules.createMany({
                data: doctorScheduleData,
            });
        }

        const activeDoctorSchedules = await tx.doctorSchedules.findMany({
            where: {
                doctorId,
            },
            include: {
                schedule: true,
            },
        });

        return activeDoctorSchedules;
    });

    return result;
};

const deleteDoctorSchedule = async (doctorId: string, scheduleId: string, user: IRequestUser) => {
    let targetDoctorId = doctorId;

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

        if (doctorId && doctorId !== doctor.id) {
            throw new AppError(status.FORBIDDEN, "Forbidden access! You cannot delete another doctor's schedule");
        }

        targetDoctorId = doctor.id;
    }

    const existingDoctorSchedule = await prisma.doctorSchedules.findUnique({
        where: {
            doctorId_scheduleId: {
                doctorId: targetDoctorId,
                scheduleId,
            },
        },
    });

    if (!existingDoctorSchedule) {
        throw new AppError(status.NOT_FOUND, "Doctor schedule not found");
    }

    if (existingDoctorSchedule.isBooked) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot delete doctor schedule because an appointment is booked for this slot"
        );
    }

    const linkedAppointment = await prisma.appointment.findFirst({
        where: {
            doctorId: targetDoctorId,
            scheduleId,
        },
    });

    if (linkedAppointment) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot delete doctor schedule because historical or scheduled appointment data is associated with it"
        );
    }

    await prisma.doctorSchedules.delete({
        where: {
            doctorId_scheduleId: {
                doctorId: targetDoctorId,
                scheduleId,
            },
        },
    });

    return { message: "Doctor schedule deleted successfully" };
};

export const DoctorScheduleService = {
    createDoctorSchedule,
    getMyDoctorSchedules,
    getDoctorSchedulesByDoctorId,
    getAllDoctorSchedules,
    getDoctorScheduleById,
    updateDoctorSchedule,
    deleteDoctorSchedule,
};