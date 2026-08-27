import z from "zod";

export const prescriptionMedicineZodSchema = z.object({
    medicineName: z.string().min(1, "Medicine name is required").max(150, "Medicine name must be at most 150 characters"),
    dosage: z.string().min(1, "Dosage is required").max(100, "Dosage must be at most 100 characters"),
    frequency: z.string().min(1, "Frequency is required").max(100, "Frequency must be at most 100 characters"),
    duration: z.string().min(1, "Duration is required").max(100, "Duration must be at most 100 characters"),
    route: z.string().max(100, "Route must be at most 100 characters").optional(),
    instructions: z.string().max(1000, "Instructions must be at most 1000 characters").optional(),
});

export const createPrescriptionZodSchema = z.object({
    appointmentId: z.string().uuid("Appointment ID must be a valid UUID"),
    medicalRecordId: z.string().uuid("Medical Record ID must be a valid UUID").optional(),
    instructions: z.string().max(5000, "Instructions must be at most 5000 characters").optional(),
    notes: z.string().max(5000, "Notes must be at most 5000 characters").optional(),
    advice: z.string().max(2000, "Advice must be at most 2000 characters").optional(),
    followUpDate: z.string().datetime({ message: "Invalid datetime format" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Follow up date must be in YYYY-MM-DD format" })).optional(),
    medicines: z.array(prescriptionMedicineZodSchema, { message: "Medicines must be an array of medicine details" }).min(1, "At least one medicine is required"),
});

export const updatePrescriptionZodSchema = z.object({
    instructions: z.string().max(5000, "Instructions must be at most 5000 characters").optional(),
    notes: z.string().max(5000, "Notes must be at most 5000 characters").optional(),
    advice: z.string().max(2000, "Advice must be at most 2000 characters").optional(),
    followUpDate: z.string().datetime({ message: "Invalid datetime format" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Follow up date must be in YYYY-MM-DD format" })).optional(),
    medicines: z.array(prescriptionMedicineZodSchema).min(1, "At least one medicine is required if medicines are provided").optional(),
});

export const PrescriptionValidation = {
    prescriptionMedicineZodSchema,
    createPrescriptionZodSchema,
    updatePrescriptionZodSchema,
};
