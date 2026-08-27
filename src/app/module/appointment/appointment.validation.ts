import z from "zod";
import { AppointmentStatus } from "../../../generated/prisma/enums";

export const createAppointmentZodSchema = z.object({
    doctorId: z.string().uuid("Doctor ID must be a valid UUID"),
    scheduleId: z.string().uuid("Schedule ID must be a valid UUID"),
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
