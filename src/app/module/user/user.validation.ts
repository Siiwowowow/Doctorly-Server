import z from "zod";
import { Gender, Role } from "../../../generated/prisma/enums";

export const createDoctorZodSchema = z.object({
    password: z.string({ message: "Password is required" }).min(6, "Password must be at least 6 characters").max(30, "Password must be at most 30 characters"),
    doctor: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
        email: z.string({ message: "Email is required" }).email("Invalid email address"),
        contactNumber: z.string({ message: "Contact number is required" }).min(11, "Contact number must be at least 11 characters").max(15, "Contact number must be at most 15 characters"),
        address: z.string().min(5, "Address must be at least 5 characters").max(100, "Address must be at most 100 characters").optional(),
        registrationNumber: z.string({ message: "Registration number is required" }).min(1, "Registration number is required"),
        experience: z.number({ message: "Experience must be a number" }).int("Experience must be an integer").nonnegative("Experience cannot be negative").optional(),
        gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER], { message: "Gender must be MALE, FEMALE, or OTHER" }),
        appointmentFee: z.number({ message: "Appointment fee must be a number" }).nonnegative("Appointment fee cannot be negative"),
        qualification: z.string({ message: "Qualification is required" }).min(2, "Qualification must be at least 2 characters").max(100, "Qualification must be at most 100 characters"),
        currentWorkingPlace: z.string({ message: "Current working place is required" }).min(2, "Current working place must be at least 2 characters").max(100, "Current working place must be at most 100 characters"),
        designation: z.string({ message: "Designation is required" }).min(2, "Designation must be at least 2 characters").max(100, "Designation must be at most 100 characters"),
        profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
    }),
    specialties: z.array(z.string().min(1, "Specialty ID is required"), { message: "Specialties must be an array of specialty IDs" }).min(1, "At least one specialty is required"),
});

export const createAdminZodSchema = z.object({
    password: z.string({ message: "Password is required" }).min(6, "Password must be at least 6 characters").max(30, "Password must be at most 30 characters"),
    admin: z.object({
        name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
        email: z.string({ message: "Email is required" }).email("Invalid email address"),
        contactNumber: z.string().min(11, "Contact number must be at least 11 characters").max(15, "Contact number must be at most 15 characters").optional(),
        profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
    }),
    role: z.enum([Role.ADMIN, Role.SUPER_ADMIN], { message: "Role must be either ADMIN or SUPER_ADMIN" }),
});

