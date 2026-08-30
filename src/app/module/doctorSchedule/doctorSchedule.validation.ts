import z from "zod";

export const createDoctorScheduleZodSchema = z.object({
    doctorId: z.string().min(1, "Doctor ID must be a valid ID").optional(),
    scheduleIds: z.array(z.string().min(1, "Schedule ID must be a valid ID"), { message: "Schedule IDs must be an array of IDs" }).min(1, "At least one schedule ID is required"),
});

export const updateDoctorScheduleZodSchema = z.object({
    doctorId: z.string().min(1, "Doctor ID must be a valid ID").optional(),
    scheduleIds: z.array(z.object({
        id: z.string().min(1, "Schedule ID must be a valid ID"),
        shouldDelete: z.boolean().optional(),
    })).min(1, "At least one schedule item is required"),
});

export const DoctorScheduleValidation = {
    createDoctorScheduleZodSchema,
    updateDoctorScheduleZodSchema,
};
