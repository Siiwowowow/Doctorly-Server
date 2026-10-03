import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.post("/register", multerUpload.single("file"), validateRequest(AuthValidation.registerPatientZodSchema), AuthController.registerPatient);
router.post("/login", validateRequest(AuthValidation.loginUserZodSchema), AuthController.loginUser);
router.get("/me", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), AuthController.getMe);
router.post("/refresh-token", AuthController.getNewToken);
router.post("/change-password", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), validateRequest(AuthValidation.changePasswordZodSchema), AuthController.changePassword);
router.post("/logout", checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN), AuthController.logoutUser);
router.post("/verify-email", validateRequest(AuthValidation.verifyEmailZodSchema), AuthController.verifyEmail);
router.post("/resend-verification-otp", validateRequest(AuthValidation.forgetPasswordZodSchema), AuthController.resendVerificationOtp);
router.post("/forget-password", validateRequest(AuthValidation.forgetPasswordZodSchema), AuthController.forgetPassword);
router.post("/reset-password", validateRequest(AuthValidation.resetPasswordZodSchema), AuthController.resetPassword);

export const AuthRoutes = router;