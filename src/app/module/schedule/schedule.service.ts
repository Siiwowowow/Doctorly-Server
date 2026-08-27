import { addHours, addMinutes, format } from "date-fns";
import status from "http-status";
import { Prisma, Schedule } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { scheduleFilterableFields, scheduleIncludeConfig, scheduleSearchableFields } from "./schedule.constant";
import { ICreateSchedulePayload, IUpdateSchedulePayload } from "./schedule.interface";
import { convertDateTime } from "./schedule.utils";

const createSchedule = async (payload: ICreateSchedulePayload) => {
    const { startDate, endDate, startTime, endTime } = payload;

    const interval = 30;

    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    const schedules = [];

    while (currentDate <= lastDate) {
        const startDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(startTime.split(":")[0])
                ),
                Number(startTime.split(":")[1])
            )
        );

        const endDateTime = new Date(
            addMinutes(
                addHours(
                    `${format(currentDate, "yyyy-MM-dd")}`,
                    Number(endTime.split(":")[0])
                ),
                Number(endTime.split(":")[1])
            )
        );

        while (startDateTime < endDateTime) {
            const s = await convertDateTime(startDateTime);
            const e = await convertDateTime(addMinutes(startDateTime, interval));

            const scheduleData = {
                startDateTime: s,
                endDateTime: e,
            };

            const existingSchedule = await prisma.schedule.findFirst({
                where: {
                    startDateTime: scheduleData.startDateTime,
                    endDateTime: scheduleData.endDateTime,
                    isDeleted: false,
                },
            });

            if (!existingSchedule) {
                const result = await prisma.schedule.create({
                    data: scheduleData,
                });
                schedules.push(result);
            }

            startDateTime.setMinutes(startDateTime.getMinutes() + interval);
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
};

const getAllSchedules = async (query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Schedule, Prisma.ScheduleWhereInput, Prisma.ScheduleInclude>(
        prisma.schedule,
        query,
        {
            searchableFields: scheduleSearchableFields,
            filterableFields: scheduleFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            isDeleted: false,
        })
        .paginate()
        .dynamicInclude(scheduleIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getScheduleById = async (id: string) => {
    const schedule = await prisma.schedule.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!schedule) {
        throw new AppError(status.NOT_FOUND, "Schedule not found");
    }

    return schedule;
};

const updateSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
    const existingSchedule = await prisma.schedule.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingSchedule) {
        throw new AppError(status.NOT_FOUND, "Schedule not found");
    }

    // Guard: Do not allow modifying times if schedule is assigned or booked
    const linkedAppointmentsCount = await prisma.appointment.count({
        where: {
            scheduleId: id,
        },
    });

    if (linkedAppointmentsCount > 0) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot modify schedule time because it is already associated with existing appointments"
        );
    }

    const assignedDoctorsCount = await prisma.doctorSchedules.count({
        where: {
            scheduleId: id,
        },
    });

    if (assignedDoctorsCount > 0) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot modify schedule time because it is currently assigned to one or more doctors"
        );
    }

    const { startDate, endDate, startTime, endTime } = payload;
    const startDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(startDate), "yyyy-MM-dd")}`,
                Number(startTime.split(":")[0])
            ),
            Number(startTime.split(":")[1])
        )
    );

    const endDateTime = new Date(
        addMinutes(
            addHours(
                `${format(new Date(endDate), "yyyy-MM-dd")}`,
                Number(endTime.split(":")[0])
            ),
            Number(endTime.split(":")[1])
        )
    );

    const updatedSchedule = await prisma.schedule.update({
        where: {
            id,
        },
        data: {
            startDateTime,
            endDateTime,
        },
    });

    return updatedSchedule;
};

const deleteSchedule = async (id: string) => {
    const existingSchedule = await prisma.schedule.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });

    if (!existingSchedule) {
        throw new AppError(status.NOT_FOUND, "Schedule not found");
    }

    // Guard: Prevent deletion if historical or active appointments reference this schedule
    const linkedAppointmentsCount = await prisma.appointment.count({
        where: {
            scheduleId: id,
        },
    });

    if (linkedAppointmentsCount > 0) {
        throw new AppError(
            status.BAD_REQUEST,
            "Cannot delete schedule because it is linked to existing appointment records"
        );
    }

    // Perform soft deletion and clean unbooked doctor schedules in transaction
    await prisma.$transaction(async (tx) => {
        await tx.doctorSchedules.deleteMany({
            where: {
                scheduleId: id,
                isBooked: false,
            },
        });

        await tx.schedule.update({
            where: {
                id,
            },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
    });

    return { message: "Schedule deleted successfully" };
};

export const ScheduleService = {
    createSchedule,
    getAllSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
};