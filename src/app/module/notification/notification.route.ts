import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { NotificationController } from "./notification.controller";

const router = Router();

// 1. Get authenticated user's notifications (with pagination, filters, search)
router.get(
    "/",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.getMyNotifications
);

// 2. Get unread notification count for authenticated user
router.get(
    "/unread-count",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.getUnreadNotificationCount
);

// 3. Mark all unread notifications as read
router.patch(
    "/read-all",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.markAllAsRead
);

// 4. Delete all read notifications (bulk soft-delete)
router.delete(
    "/read",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.deleteAllReadNotifications
);

// 5. Get single notification by ID (with ownership protection)
router.get(
    "/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.getNotificationById
);

// 6. Mark single notification as read (idempotent)
router.patch(
    "/:id/read",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.markAsRead
);

// 7. Delete single notification (soft-delete)
router.delete(
    "/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    NotificationController.deleteNotification
);

export const NotificationRoutes = router;
