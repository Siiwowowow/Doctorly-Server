import z from "zod";

export const createDoctorScheduleZodSchema = z.object({
    doctorId: z.string().uuid("Doctor ID must be a valid UUID").optional(),
    scheduleIds: z.array(z.string().uuid("Schedule ID must be a valid UUID"), { message: "Schedule IDs must be an array of valid UUIDs" }).min(1, "At least one schedule ID is required"),
});

export const updateDoctorScheduleZodSchema = z.object({
    doctorId: z.string().uuid("Doctor ID must be a valid UUID").optional(),
    scheduleIds: z.array(z.object({
        id: z.string().uuid("Schedule ID must be a valid UUID"),
        shouldDelete: z.boolean().optional(),
    })).min(1, "At least one schedule item is required"),
});

export const DoctorScheduleValidation = {
    createDoctorScheduleZodSchema,
    updateDoctorScheduleZodSchema,
};
