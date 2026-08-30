import z from "zod";
import { MessageType } from "../../../generated/prisma/enums";

export const createConversationZodSchema = z.object({
    doctorId: z.string().min(1, "Doctor ID is required").optional(),
    patientId: z.string().min(1, "Patient ID is required").optional(),
}).refine((data) => data.doctorId || data.patientId, {
    message: "Either doctorId or patientId must be provided",
});

export const sendMessageZodSchema = z.object({
    content: z.string().max(5000, "Message content cannot exceed 5000 characters").optional().default(""),
    messageType: z.nativeEnum(MessageType).optional(),
    tempId: z.string().optional(),
    medicalRecordId: z.string().optional(),
    attachments: z.array(
        z.object({
            fileName: z.string().min(1),
            fileUrl: z.string().url("Invalid attachment URL"),
            fileType: z.string().min(1),
            fileSize: z.number().positive(),
            publicId: z.string().optional(),
        })
    ).optional(),
});

export const shareMedicalRecordZodSchema = z.object({
    medicalRecordId: z.string().min(1, "Medical Record ID is required"),
    note: z.string().max(1000).optional(),
});

export const ChatValidation = {
    createConversationZodSchema,
    sendMessageZodSchema,
    shareMedicalRecordZodSchema,
};
