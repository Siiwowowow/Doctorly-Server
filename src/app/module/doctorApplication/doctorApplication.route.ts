import express from "express";
import { Role } from "../../../generated/prisma/client";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DoctorApplicationController } from "./doctorApplication.controller";
import { DoctorApplicationValidation } from "./doctorApplication.validation";

const router = express.Router();

// Initialize application (No auth required, it registers the user and uploads initial documents)
router.post(
    "/",
    multerUpload.fields([
        { name: "bmdc", maxCount: 1 },
        { name: "degree", maxCount: 1 },
        { name: "photo", maxCount: 1 },
        { name: "file", maxCount: 1 },
    ]),
    validateRequest(DoctorApplicationValidation.createApplicationZodSchema),
    DoctorApplicationController.initializeApplication
);

// Track application by ID or Email (No auth required for applicants)
router.get(
    "/track/:identifier",
    DoctorApplicationController.trackApplication
);

// Get my application
router.get(
    "/my-application",
    checkAuth(Role.DOCTOR, Role.PATIENT),
    DoctorApplicationController.getMyApplication
);

// Update my application (Draft)
router.patch(
    "/my-application",
    checkAuth(Role.DOCTOR, Role.PATIENT),
    validateRequest(DoctorApplicationValidation.updateApplicationZodSchema),
    DoctorApplicationController.updateMyApplication
);

// Submit application
router.post(
    "/my-application/submit",
    checkAuth(Role.DOCTOR, Role.PATIENT),
    DoctorApplicationController.submitMyApplication
);

// Upload document
router.post(
    "/my-application/documents",
    checkAuth(Role.DOCTOR, Role.PATIENT),
    multerUpload.single("file"),
    DoctorApplicationController.uploadDocument
);

// Delete document
router.delete(
    "/my-application/documents/:documentId",
    checkAuth(Role.DOCTOR, Role.PATIENT),
    DoctorApplicationController.deleteDocument
);

// ==========================================
// ADMIN / SUPER_ADMIN ROUTES
// ==========================================

// Get all applications with search & filter
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorApplicationController.getAllApplications
);

// Get single application details
router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorApplicationController.getApplicationById
);

// Update application status
router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorApplicationValidation.updateStatusZodSchema),
    DoctorApplicationController.updateApplicationStatus
);

// Verify or reject an individual document
router.patch(
    "/:id/documents/:documentId",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorApplicationValidation.verifyDocumentZodSchema),
    DoctorApplicationController.verifyDocument
);

// Approve application
router.post(
    "/:id/approve",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    DoctorApplicationController.approveApplication
);

// Reject application
router.post(
    "/:id/reject",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorApplicationValidation.rejectApplicationZodSchema),
    DoctorApplicationController.rejectApplication
);

// Request resubmission
router.post(
    "/:id/request-resubmission",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(DoctorApplicationValidation.requestResubmissionZodSchema),
    DoctorApplicationController.requestResubmission
);

export const DoctorApplicationRoutes = router;
