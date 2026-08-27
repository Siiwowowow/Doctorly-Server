import z from "zod";
import { NotificationType } from "../../../generated/prisma/enums";

export const createSystemNotificationZodSchema = z.object({
    recipientId: z.string({
        message: "Recipient ID is required",
    }).min(1, "Recipient ID cannot be empty"),
    type: z.nativeEnum(NotificationType, {
        message: "Invalid notification type",
    }),
    title: z.string({
        message: "Title is required",
    }).min(1, "Title cannot be empty").max(255, "Title must be at most 255 characters"),
    message: z.string({
        message: "Message is required",
    }).min(1, "Message cannot be empty"),
    data: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const NotificationValidation = {
    createSystemNotificationZodSchema,
};
