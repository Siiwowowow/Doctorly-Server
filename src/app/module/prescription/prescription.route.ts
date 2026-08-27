import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PrescriptionController } from "./prescription.controller";
import { PrescriptionValidation } from "./prescription.validation";

const router = Router();

// 1. Create prescription (Doctor only)
router.post(
    "/",
    checkAuth(Role.DOCTOR),
    validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
    PrescriptionController.createPrescription
);

// 2. Patient / Doctor get own prescriptions (Must be before /:id)
router.get(
    "/my-prescriptions",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    PrescriptionController.getMyPrescriptions
);

// 3. Doctor / Admin get patient prescriptions (Must be before /:id)
router.get(
    "/patient/:patientId",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PrescriptionController.getPatientPrescriptions
);

// 4. Admin / Super Admin get all prescriptions
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    PrescriptionController.getAllPrescriptions
);

// 5. Get single prescription by ID
router.get(
    "/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PrescriptionController.getPrescriptionById
);

// 6. Update prescription
router.patch(
    "/:id",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(PrescriptionValidation.updatePrescriptionZodSchema),
    PrescriptionController.updatePrescription
);

// 7. Delete (soft delete) prescription
router.delete(
    "/:id",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PrescriptionController.deletePrescription
);

export const PrescriptionRoutes = router;
