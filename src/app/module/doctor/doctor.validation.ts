import z from "zod";
import { Gender } from "../../../generated/prisma/enums";

export const updateDoctorZodSchema = z.object({
    doctor: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters").optional(),
        profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
        contactNumber: z.string().min(11, "Contact number must be at least 11 characters").max(15, "Contact number must be at most 15 characters").optional(),
        address: z.string().min(5, "Address must be at least 5 characters").max(100, "Address must be at most 100 characters").optional(),
        registrationNumber: z.string().min(1, "Registration number cannot be empty").optional(),
        experience: z.number().int("Experience must be an integer").nonnegative("Experience cannot be negative").optional(),
        gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER], { message: "Gender must be MALE, FEMALE, or OTHER" }).optional(),
        appointmentFee: z.number().nonnegative("Appointment fee cannot be negative").optional(),
        qualification: z.string().min(2, "Qualification must be at least 2 characters").max(100, "Qualification must be at most 100 characters").optional(),
        currentWorkingPlace: z.string().min(2, "Current working place must be at least 2 characters").max(100, "Current working place must be at most 100 characters").optional(),
        designation: z.string().min(2, "Designation must be at least 2 characters").max(100, "Designation must be at most 100 characters").optional(),
    }).optional(),
    specialties: z.array(z.object({
        specialtyId: z.string().min(1, "Specialty ID is required"),
        shouldDelete: z.boolean().optional(),
    })).optional(),
});

