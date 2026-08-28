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

// 2. Verify payment session (Active sync for success page)
router.get(
    "/verify-session/:sessionId",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PaymentController.verifyPaymentSession
);

// 3. Download/view official invoice
router.get(
    "/invoice/:paymentId",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PaymentController.getPaymentInvoice
);

// 4. Patient / Doctor / Admin get payments
router.get(
    "/my-payments",
    checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),
    PaymentController.getMyPayments
);

export const PaymentRoutes = router;
