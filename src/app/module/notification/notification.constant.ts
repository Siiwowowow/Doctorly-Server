import { Prisma } from "../../../generated/prisma/client";

export const notificationSearchableFields = [
    "title",
    "message",
];

export const notificationFilterableFields = [
    "type",
    "isRead",
    "createdAt",
    "updatedAt",
];

export const notificationIncludeConfig: Partial<Record<keyof Prisma.NotificationInclude, Prisma.NotificationInclude[keyof Prisma.NotificationInclude]>> = {
    recipient: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
        },
    },
};
