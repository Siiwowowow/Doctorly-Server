import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CallController } from "./call.controller";
import { CallValidation } from "./call.validation";

const router = Router();

// 1. Initiate a call session
router.post(
    "/",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(CallValidation.initiateCallZodSchema),
    CallController.initiateCall
);

// 2. Get call history
router.get(
    "/",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    CallController.getMyCallHistory
);

// 3. Get single call details
router.get(
    "/:callId",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    CallController.getCallById
);

// 4. Accept a ringing call
router.patch(
    "/:callId/accept",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    CallController.acceptCall
);

// 5. Reject a ringing call
router.patch(
    "/:callId/reject",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(CallValidation.callActionZodSchema),
    CallController.rejectCall
);

// 6. Cancel a ringing call
router.patch(
    "/:callId/cancel",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(CallValidation.callActionZodSchema),
    CallController.cancelCall
);

// 7. End an active call
router.patch(
    "/:callId/end",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(CallValidation.callActionZodSchema),
    CallController.endCall
);

export const CallRoutes = router;
