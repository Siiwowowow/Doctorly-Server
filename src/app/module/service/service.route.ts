import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ServiceController } from "./service.controller";
import { ServiceValidation } from "./service.validation";

const router = Router();

router.get("/", ServiceController.getAllServices);
router.post("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), validateRequest(ServiceValidation.createServiceZodSchema), ServiceController.createService);
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), validateRequest(ServiceValidation.updateServiceZodSchema), ServiceController.updateService);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), ServiceController.deleteService);

export const ServiceRoutes = router;
