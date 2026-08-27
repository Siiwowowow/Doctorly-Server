import { Prisma } from "../../../generated/prisma/client";

export const paymentSearchableFields = [
    "transactionId",
    "stripeEventId",
    "appointment.doctor.name",
    "appointment.patient.name",
];

export const paymentFilterableFields = [
    "status",
    "appointmentId",
    "createdAt",
    "updatedAt",
];

export const paymentIncludeConfig: Partial<Record<keyof Prisma.PaymentInclude, Prisma.PaymentInclude[keyof Prisma.PaymentInclude]>> = {
    appointment: {
        select: {
            id: true,
            videoCallingId: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true,
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
            patient: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                    contactNumber: true,
                },
            },
            schedule: true,
        },
    },
};
