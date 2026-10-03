import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const updatePatientHealthDataZodSchema = z.object({
    gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER], { message: "Gender must be MALE, FEMALE, or OTHER" }).optional(),
    dateOfBirth: z.string().datetime({ message: "Invalid date format" }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })).optional(),
    bloodGroup: z.string().optional(),
    hasAllergies: z.boolean().optional(),
    hasDiabetes: z.boolean().optional(),
    height: z.string().max(20, "Height must be at most 20 characters").optional(),
    weight: z.string().max(20, "Weight must be at most 20 characters").optional(),
    smokingStatus: z.boolean().optional(),
    dietaryPreferences: z.string().max(255, "Dietary preferences must be at most 255 characters").optional(),
    pregnancyStatus: z.boolean().optional(),
    mentalHealthHistory: z.string().max(500, "Mental health history must be at most 500 characters").optional(),
    immunizationStatus: z.string().max(255, "Immunization status must be at most 255 characters").optional(),
    hasPastSurgeries: z.boolean().optional(),
    recentAnxiety: z.boolean().optional(),
    recentDepression: z.boolean().optional(),
    maritalStatus: z.string().max(50, "Marital status must be at most 50 characters").optional(),
});

export const updatePatientZodSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters").optional(),
    profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
    contactNumber: z.string().min(11, "Contact number must be at least 11 characters").max(15, "Contact number must be at most 15 characters").optional(),
    address: z.string().min(5, "Address must be at least 5 characters").max(100, "Address must be at most 100 characters").optional(),
    emergencyContactName: z.string().min(2).max(80).optional(),
    emergencyContactNumber: z.string().min(10).max(20).optional(),
    emergencyContactRelationship: z.string().min(2).max(50).optional(),
    bloodGroup: z.string().optional(),
    patientHealthData: updatePatientHealthDataZodSchema.optional(),
});

export const PatientValidation = {
    updatePatientZodSchema,
};
