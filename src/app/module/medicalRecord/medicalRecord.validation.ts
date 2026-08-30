import z from "zod";

export const createMedicalRecordZodSchema = z.object({
    appointmentId: z.string().min(1, "Appointment ID is required"),
    diagnosis: z.string().min(1, "Diagnosis is required").max(1000, "Diagnosis must be at most 1000 characters"),
    symptoms: z.string().min(1, "Symptoms are required").max(1000, "Symptoms must be at most 1000 characters"),
    clinicalNotes: z.string().max(5000, "Clinical notes must be at most 5000 characters").optional(),
    treatment: z.string().max(2000, "Treatment must be at most 2000 characters").optional(),
    advice: z.string().max(2000, "Advice must be at most 2000 characters").optional(),
    followUpDate: z.string().datetime({ message: "Invalid datetime format" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Follow up date must be in YYYY-MM-DD format" })).optional(),
    followUpNotes: z.string().max(1000, "Follow up notes must be at most 1000 characters").optional(),
});

export const updateMedicalRecordZodSchema = z.object({
    diagnosis: z.string().min(1, "Diagnosis cannot be empty").max(1000, "Diagnosis must be at most 1000 characters").optional(),
    symptoms: z.string().min(1, "Symptoms cannot be empty").max(1000, "Symptoms must be at most 1000 characters").optional(),
    clinicalNotes: z.string().max(5000, "Clinical notes must be at most 5000 characters").optional(),
    treatment: z.string().max(2000, "Treatment must be at most 2000 characters").optional(),
    advice: z.string().max(2000, "Advice must be at most 2000 characters").optional(),
    followUpDate: z.string().datetime({ message: "Invalid datetime format" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Follow up date must be in YYYY-MM-DD format" })).optional(),
    followUpNotes: z.string().max(1000, "Follow up notes must be at most 1000 characters").optional(),
});

export const MedicalRecordValidation = {
    createMedicalRecordZodSchema,
    updateMedicalRecordZodSchema,
};
