import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DoctorScheduleController } from "./doctorSchedule.controller";
import { DoctorScheduleValidation } from "./doctorSchedule.validation";

const router = Router();

// 1. Create doctor schedule (Doctor for self, Admin/Super Admin for any doctor)
router.post(
    "/",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorScheduleValidation.createDoctorScheduleZodSchema),
    DoctorScheduleController.createDoctorSchedule
);

router.post(
    "/create-my-doctor-schedule",
    checkAuth(Role.DOCTOR),
    validateRequest(DoctorScheduleValidation.createDoctorScheduleZodSchema),
    DoctorScheduleController.createDoctorSchedule
);

// 2. Doctor gets own schedules
router.get(
    "/my-doctor-schedules",
    checkAuth(Role.DOCTOR),
    DoctorScheduleController.getMyDoctorSchedules
);

// 3. Publicly viewable doctor schedules (for patients / public to check availability)
router.get(
    "/doctor/:doctorId",
    DoctorScheduleController.getDoctorSchedulesByDoctorId
);

// 4. Admin / Super Admin get all doctor schedules
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorScheduleController.getAllDoctorSchedules
);

// 5. Get single doctor schedule by doctorId and scheduleId
router.get(
    "/:doctorId/schedule/:scheduleId",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    DoctorScheduleController.getDoctorScheduleById
);

// 6. Update doctor schedules
router.patch(
    "/",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorScheduleValidation.updateDoctorScheduleZodSchema),
    DoctorScheduleController.updateDoctorSchedule
);

router.patch(
    "/update-my-doctor-schedule",
    checkAuth(Role.DOCTOR),
    validateRequest(DoctorScheduleValidation.updateDoctorScheduleZodSchema),
    DoctorScheduleController.updateDoctorSchedule
);

// 7. Delete doctor schedule
router.delete(
    "/delete-my-doctor-schedule/:scheduleId",
    checkAuth(Role.DOCTOR),
    DoctorScheduleController.deleteDoctorSchedule
);

router.delete(
    "/:doctorId/:scheduleId",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    DoctorScheduleController.deleteDoctorSchedule
);

export const DoctorScheduleRoutes = router;