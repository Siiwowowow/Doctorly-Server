import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { sendEmail } from "../utils/email";
import { logger } from "../utils/logger";
import { prisma } from "./prisma";
// If your Prisma file is located elsewhere, you can change the path

const isProduction = envVars.NODE_ENV === "production";

export const auth = betterAuth({
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    emailVerification:{
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: Role.PATIENT
            },

            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE
            },

            needPasswordChange: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },

    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                try {
                    const user = await prisma.user.findUnique({
                        where: { email }
                    }).catch(() => null);

                    if (user && user.role === Role.SUPER_ADMIN) {
                        logger.info(`User with email ${email} is a super admin. Skipping sending verification OTP.`);
                        return;
                    }

                    if (type === "email-verification") {
                        if (user && user.emailVerified) {
                            logger.info(`User with email ${email} is already verified. Skipping OTP.`);
                            return;
                        }

                        await sendEmail({
                            to: email,
                            subject: "Verify Your Email Address - Doctorly Healthcare",
                            templateName: "otp",
                            templateData: {
                                name: user?.name || "Valued User",
                                otp,
                                type: "email-verification",
                                actionText: "Verify Your Email",
                                expiryMinutes: 10,
                            }
                        });
                    } else if (type === "forget-password") {
                        await sendEmail({
                            to: email,
                            subject: "Password Reset OTP - Doctorly Healthcare",
                            templateName: "otp",
                            templateData: {
                                name: user?.name || "Valued User",
                                otp,
                                type: "forget-password",
                                actionText: "Reset Your Password",
                                expiryMinutes: 10,
                            }
                        });
                    }
                } catch (error: unknown) {
                    const err = error as Error;
                    logger.error(`Failed to send ${type} OTP to ${email}:`, err?.message || String(error));
                    throw error;
                }
            },
            expiresIn: 10 * 60, // 10 minutes in seconds
            otpLength: 6,
        })
    ],

    session: {
        expiresIn: 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24, // 1 day in seconds
        }
    },

    trustedOrigins: [
        envVars.FRONTEND_URL ? envVars.FRONTEND_URL.replace(/\/+$/, "") : "",
        envVars.BETTER_AUTH_URL ? envVars.BETTER_AUTH_URL.replace(/\/+$/, "") : "",
        process.env.BETTER_AUTH_URL ? process.env.BETTER_AUTH_URL.replace(/\/+$/, "") : "",
        "https://doctorly-fontend.vercel.app",
        "https://doctorly-frontend.vercel.app",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://localhost:5173",
    ].filter(Boolean),

    advanced: {
        useSecureCookies : isProduction,
        cookies:{
            state:{
                attributes:{
                    sameSite: isProduction ? "none" : "lax",
                    secure: isProduction,
                    httpOnly: true,
                    path: "/",
                }
            },
            sessionToken:{
                attributes:{
                    sameSite: isProduction ? "none" : "lax",
                    secure: isProduction,
                    httpOnly: true,
                    path: "/",
                }
            }
        }
    }

});