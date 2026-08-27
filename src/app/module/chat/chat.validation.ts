import z from "zod";
import { MessageType } from "../../../generated/prisma/enums";

export const createConversationZodSchema = z.object({
    doctorId: z.string().uuid("Doctor ID must be a valid UUID").optional(),
    patientId: z.string().uuid("Patient ID must be a valid UUID").optional(),
}).refine((data) => data.doctorId || data.patientId, {
    message: "Either doctorId or patientId must be provided",
});

export const sendMessageZodSchema = z.object({
    content: z.string().min(1, "Message content cannot be empty").max(5000, "Message content cannot exceed 5000 characters"),
    messageType: z.nativeEnum(MessageType).optional(),
    tempId: z.string().optional(),
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

export const ChatValidation = {
    createConversationZodSchema,
    sendMessageZodSchema,
};
