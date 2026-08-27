import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AppointmentController } from "./appointment.controller";
import { AppointmentValidation } from "./appointment.validation";

const router = Router();

// 1. Book appointment (Patient only)
router.post(
    "/",
    checkAuth(Role.PATIENT),
    validateRequest(AppointmentValidation.createAppointmentZodSchema),
    AppointmentController.createAppointment
);

router.post(
    "/book-appointment",
    checkAuth(Role.PATIENT),
    validateRequest(AppointmentValidation.createAppointmentZodSchema),
    AppointmentController.createAppointment
);

// 2. Patient / Doctor get own appointments
router.get(
    "/my-appointments",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    AppointmentController.getMyAppointments
);

// 3. Admin / Super Admin get all appointments
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AppointmentController.getAllAppointments
);

router.get(
    "/all-appointments",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AppointmentController.getAllAppointments
);

// 4. Get single appointment details by ID
router.get(
    "/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    AppointmentController.getAppointmentById
);

// 5. Update appointment status
router.patch(
    "/:id/status",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(AppointmentValidation.updateAppointmentStatusZodSchema),
    AppointmentController.changeAppointmentStatus
);

router.patch(
    "/change-appointment-status/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(AppointmentValidation.updateAppointmentStatusZodSchema),
    AppointmentController.changeAppointmentStatus
);

// 6. Cancel appointment
router.patch(
    "/:id/cancel",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    AppointmentController.cancelAppointment
);

router.delete(
    "/:id/cancel",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    AppointmentController.cancelAppointment
);

export const AppointmentRoutes = router;