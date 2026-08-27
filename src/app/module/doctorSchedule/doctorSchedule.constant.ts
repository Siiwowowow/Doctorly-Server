import { Prisma } from "../../../generated/prisma/client";

export const doctorScheduleSearchableFields = [
    "doctorId",
    "scheduleId",
];

export const doctorScheduleFilterableFields = [
    "doctorId",
    "scheduleId",
    "isBooked",
    "createdAt",
    "updatedAt",
    "schedule.startDateTime",
    "schedule.endDateTime",
];

export const doctorScheduleIncludeConfig: Partial<Record<keyof Prisma.DoctorSchedulesInclude, Prisma.DoctorSchedulesInclude[keyof Prisma.DoctorSchedulesInclude]>> = {
    doctor: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            designation: true,
            qualification: true,
            appointmentFee: true,
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
        },
    },
    schedule: true,
};