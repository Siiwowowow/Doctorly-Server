import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientController } from "./patient.controller";
import { PatientValidation } from "./patient.validation";

const router = Router();

router.get("/me", checkAuth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN), PatientController.getMyProfile);

router.get("/profile", checkAuth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN), PatientController.getMyProfile);

router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), PatientController.getAllPatients);

router.get("/:id", checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN), PatientController.getPatientById);

router.patch(
    "/:id",
    checkAuth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(PatientValidation.updatePatientZodSchema),
    PatientController.updatePatient
);

router.delete("/:id", checkAuth(Role.PATIENT, Role.ADMIN, Role.SUPER_ADMIN), PatientController.deletePatient);

export const PatientRoutes = router;
