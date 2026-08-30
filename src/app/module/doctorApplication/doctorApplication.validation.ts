import { z } from "zod";
import { DoctorApplicationStatus, DocumentVerificationStatus } from "../../../generated/prisma/client";

const createApplicationZodSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bmdcRegistrationNumber: z.string().optional(),
  registrationType: z.string().optional(),
  qualifications: z.string().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  currentWorkplace: z.string().optional(),
  designation: z.string().optional(),
  consultationFee: z.number().nonnegative().optional(),
  about: z.string().optional(),
  specialtyId: z.string().optional(),
});

const updateApplicationZodSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bmdcRegistrationNumber: z.string().optional(),
  registrationType: z.string().optional(),
  qualifications: z.string().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  currentWorkplace: z.string().optional(),
  designation: z.string().optional(),
  consultationFee: z.number().nonnegative().optional(),
  about: z.string().optional(),
  specialtyId: z.string().optional(),
});

const updateStatusZodSchema = z.object({
  status: z.enum([
    DoctorApplicationStatus.DRAFT,
    DoctorApplicationStatus.SUBMITTED,
    DoctorApplicationStatus.UNDER_REVIEW,
    DoctorApplicationStatus.APPROVED,
    DoctorApplicationStatus.REJECTED,
    DoctorApplicationStatus.RESUBMISSION_REQUIRED,
  ]),
});

const verifyDocumentZodSchema = z.object({
  verificationStatus: z.enum([
    DocumentVerificationStatus.PENDING,
    DocumentVerificationStatus.VERIFIED,
    DocumentVerificationStatus.REJECTED,
  ]),
  adminNote: z.string().optional(),
});

const rejectApplicationZodSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

const requestResubmissionZodSchema = z.object({
  rejectionReason: z.string().min(1, "Resubmission instructions/reason is required"),
});

export const DoctorApplicationValidation = {
  createApplicationZodSchema,
  updateApplicationZodSchema,
  updateStatusZodSchema,
  verifyDocumentZodSchema,
  rejectApplicationZodSchema,
  requestResubmissionZodSchema,
};
