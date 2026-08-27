import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DoctorScheduleController } from "../doctorSchedule/doctorSchedule.controller";
import { DoctorController } from "./doctor.controller";
import { updateDoctorZodSchema } from "./doctor.validation";

const router = Router();

router.get("/", DoctorController.getAllDoctors);

router.get("/:doctorId/schedules", DoctorScheduleController.getDoctorSchedulesByDoctorId);

router.get("/:id", DoctorController.getDoctorById);

router.patch(
    "/update-my-profile",
    checkAuth(Role.DOCTOR),
    validateRequest(updateDoctorZodSchema),
    DoctorController.updateMyProfile
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateDoctorZodSchema),
    DoctorController.updateDoctor
);

router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), DoctorController.deleteDoctor);

export const DoctorRoutes = router;
