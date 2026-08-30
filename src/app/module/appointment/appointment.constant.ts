import { Prisma } from "../../../generated/prisma/client";

export const appointmentSearchableFields = [
    "id",
    "doctor.name",
    "doctor.email",
    "patient.name",
    "patient.email",
];

export const appointmentFilterableFields = [
    "status",
    "paymentStatus",
    "doctorId",
    "patientId",
    "scheduleId",
    "createdAt",
    "updatedAt",
    "schedule.startDateTime",
    "schedule.endDateTime",
];

export const appointmentIncludeConfig: Partial<Record<keyof Prisma.AppointmentInclude, Prisma.AppointmentInclude[keyof Prisma.AppointmentInclude]>> = {
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
    patient: {
        select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            contactNumber: true,
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
    prescription: true,
    medicalRecord: true,
    review: true,
    payment: true,
};
