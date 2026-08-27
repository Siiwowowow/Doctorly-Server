import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// 1. Create Stripe checkout session (Patient only)
router.post(
    "/create-checkout-session",
    checkAuth(Role.PATIENT),
    validateRequest(PaymentValidation.createCheckoutSessionZodSchema),
    PaymentController.createCheckoutSession
);

// 2. Patient / Doctor / Admin get payments
router.get(
    "/my-payments",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PaymentController.getMyPayments
);

export const PaymentRoutes = router;
