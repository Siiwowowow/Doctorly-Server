import { Request, Response } from "express";
import status from "http-status";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.getMyNotifications(req.user, req.query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Notifications retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getUnreadNotificationCount = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.getUnreadNotificationCount(req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Unread notification count retrieved successfully",
        data: result,
    });
});

const getNotificationById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await NotificationService.getNotificationById(id as string, req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Notification retrieved successfully",
        data: result,
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await NotificationService.markAsRead(id as string, req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Notification marked as read successfully",
        data: result,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.markAllAsRead(req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All unread notifications marked as read successfully",
        data: result,
    });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await NotificationService.deleteNotification(id as string, req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Notification deleted successfully",
        data: result,
    });
});

const deleteAllReadNotifications = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.deleteAllReadNotifications(req.user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "All read notifications deleted successfully",
        data: result,
    });
});

export const NotificationController = {
    getMyNotifications,
    getUnreadNotificationCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllReadNotifications,
};
