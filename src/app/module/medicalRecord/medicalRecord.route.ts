import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { MedicalRecordController } from "./medicalRecord.controller";
import { MedicalRecordValidation } from "./medicalRecord.validation";

const router = Router();

// 1. Create medical record (Doctor only)
router.post(
    "/",
    checkAuth(Role.DOCTOR),
    validateRequest(MedicalRecordValidation.createMedicalRecordZodSchema),
    MedicalRecordController.createMedicalRecord
);

// 2. Patient / Doctor get own medical records
router.get(
    "/my-records",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    MedicalRecordController.getMyMedicalRecords
);

// 3. Doctor / Admin get patient medical records
router.get(
    "/patient/:patientId",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    MedicalRecordController.getPatientMedicalRecords
);

// 4. Admin / Super Admin get all medical records
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    MedicalRecordController.getAllMedicalRecords
);

// 5. Get single medical record by ID
router.get(
    "/:id",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    MedicalRecordController.getMedicalRecordById
);

// 6. Update medical record
router.patch(
    "/:id",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(MedicalRecordValidation.updateMedicalRecordZodSchema),
    MedicalRecordController.updateMedicalRecord
);

// 7. Delete (soft delete) medical record
router.delete(
    "/:id",
    checkAuth(Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    MedicalRecordController.deleteMedicalRecord
);

export const MedicalRecordRoutes = router;
