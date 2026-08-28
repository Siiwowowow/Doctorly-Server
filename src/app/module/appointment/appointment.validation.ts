import z from "zod";
import { AppointmentStatus } from "../../../generated/prisma/enums";

export const createAppointmentZodSchema = z.object({
    doctorId: z.string(),
    scheduleId: z.string(),
});

export const updateAppointmentStatusZodSchema = z.object({
    status: z.enum([
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.INPROGRESS,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELED,
    ], { message: "Invalid appointment status" }),
});

export const AppointmentValidation = {
    createAppointmentZodSchema,
    updateAppointmentStatusZodSchema,
};

