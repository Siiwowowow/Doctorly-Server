import status from "http-status";
import { Notification, Prisma } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { IQueryParams } from "../../interfaces/query.interface";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
    notificationFilterableFields,
    notificationIncludeConfig,
    notificationSearchableFields,
} from "./notification.constant";
import {
    ICreateManyNotificationsPayload,
    ICreateNotificationPayload,
} from "./notification.interface";

// Future real-time delivery handler/hook
type RealtimeNotificationHandler = (notification: Notification) => void | Promise<void>;
const realtimeHandlers: RealtimeNotificationHandler[] = [];

export const registerRealtimeNotificationHandler = (handler: RealtimeNotificationHandler) => {
    realtimeHandlers.push(handler);
};

const dispatchRealtimeNotification = async (notification: Notification) => {
    for (const handler of realtimeHandlers) {
        try {
            await handler(notification);
        } catch {
            // Realtime delivery failure should not crash business operations
        }
    }
};

const createNotification = async (
    payload: ICreateNotificationPayload,
    tx?: Prisma.TransactionClient
): Promise<Notification> => {
    const client = tx || prisma;

    const notification = await client.notification.create({
        data: {
            recipientId: payload.recipientId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            data: (payload.data as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
    });

    // Asynchronously dispatch real-time event if handlers are registered
    if (!tx) {
        dispatchRealtimeNotification(notification);
    }

    return notification;
};

const createManyNotifications = async (
    payload: ICreateManyNotificationsPayload,
    tx?: Prisma.TransactionClient
): Promise<{ count: number }> => {
    const client = tx || prisma;

    const notificationsData = payload.recipientIds.map((recipientId) => ({
        recipientId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: (payload.data as Prisma.InputJsonValue) || Prisma.JsonNull,
    }));

    const result = await client.notification.createMany({
        data: notificationsData,
    });

    return result;
};

const getMyNotifications = async (user: IRequestUser, query: IQueryParams) => {
    const queryBuilder = new QueryBuilder<Notification, Prisma.NotificationWhereInput, Prisma.NotificationInclude>(
        prisma.notification,
        query,
        {
            searchableFields: notificationSearchableFields,
            filterableFields: notificationFilterableFields,
        }
    );

    const result = await queryBuilder
        .search()
        .filter()
        .where({
            recipientId: user.userId,
            isDeleted: false,
        })
        .paginate()
        .dynamicInclude(notificationIncludeConfig)
        .sort()
        .fields()
        .execute();

    return result;
};

const getNotificationById = async (id: string, user: IRequestUser): Promise<Notification> => {
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            recipientId: user.userId,
            isDeleted: false,
        },
    });

    if (!notification) {
        throw new AppError(status.NOT_FOUND, "Notification not found");
    }

    return notification;
};

const getUnreadNotificationCount = async (user: IRequestUser): Promise<{ unreadCount: number }> => {
    const count = await prisma.notification.count({
        where: {
            recipientId: user.userId,
            isRead: false,
            isDeleted: false,
        },
    });

    return {
        unreadCount: count,
    };
};

const markAsRead = async (id: string, user: IRequestUser): Promise<Notification> => {
    // 1. Verify existence and ownership
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            recipientId: user.userId,
            isDeleted: false,
        },
    });

    if (!notification) {
        throw new AppError(status.NOT_FOUND, "Notification not found");
    }

    // 2. Idempotent update: if already read, return as is
    if (notification.isRead) {
        return notification;
    }

    const updatedNotification = await prisma.notification.update({
        where: {
            id,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return updatedNotification;
};

const markAllAsRead = async (user: IRequestUser): Promise<{ updatedCount: number }> => {
    const result = await prisma.notification.updateMany({
        where: {
            recipientId: user.userId,
            isRead: false,
            isDeleted: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return {
        updatedCount: result.count,
    };
};

const deleteNotification = async (id: string, user: IRequestUser): Promise<Notification> => {
    // 1. Verify existence and ownership
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            recipientId: user.userId,
            isDeleted: false,
        },
    });

    if (!notification) {
        throw new AppError(status.NOT_FOUND, "Notification not found");
    }

    // 2. Safe soft-delete
    const deletedNotification = await prisma.notification.update({
        where: {
            id,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return deletedNotification;
};

const deleteAllReadNotifications = async (user: IRequestUser): Promise<{ deletedCount: number }> => {
    const result = await prisma.notification.updateMany({
        where: {
            recipientId: user.userId,
            isRead: true,
            isDeleted: false,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
    });

    return {
        deletedCount: result.count,
    };
};

export const NotificationService = {
    createNotification,
    createManyNotifications,
    getMyNotifications,
    getNotificationById,
    getUnreadNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllReadNotifications,
    registerRealtimeNotificationHandler,
    dispatchRealtimeNotification,
};
