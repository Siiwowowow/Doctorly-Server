import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { createAdminZodSchema, createDoctorZodSchema } from "./user.validation";

const router = Router();

router.post(
    "/create-doctor",
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
    validateRequest(createDoctorZodSchema),
    UserController.createDoctor
);

router.post(
    "/create-admin",
    checkAuth(Role.SUPER_ADMIN),
    validateRequest(createAdminZodSchema),
    UserController.createAdmin
);

export const UserRoutes = router;