/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Session Token Extraction & Verification (User/Session Identity)
        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

        if (!sessionToken) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! No session token provided.");
        }

        const session = await prisma.session.findFirst({
            where: {
                token: sessionToken,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });

        if (!session || !session.user) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Session is invalid or expired.");
        }

        const user = session.user;

        // Check user status and deletion
        if (user.status === UserStatus.BLOCKED) {
            throw new AppError(status.FORBIDDEN, "Unauthorized access! Your account is blocked.");
        }

        if (user.isDeleted || user.status === UserStatus.DELETED) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Your account has been deleted.");
        }

        // Check email verification
        if (!user.emailVerified) {
            throw new AppError(status.FORBIDDEN, "Unauthorized access! Please verify your email address first.");
        }

        // Check session expiration window for refresh notification header
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const createdAt = new Date(session.createdAt);
        const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
        const timeRemaining = expiresAt.getTime() - now.getTime();
        const percentRemaining = sessionLifeTime > 0 ? (timeRemaining / sessionLifeTime) * 100 : 0;

        if (percentRemaining < 20) {
            res.setHeader("X-Session-Refresh", "true");
            res.setHeader("X-Session-Expires-At", expiresAt.toISOString());
            res.setHeader("X-Time-Remaining", timeRemaining.toString());
        }

        // 2. Access Token Verification (API Authorization)
        const accessToken = CookieUtils.getCookie(req, "accessToken");

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! No access token provided.");
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success || !verifiedToken.data) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Invalid or expired access token.");
        }

        const tokenData = verifiedToken.data;

        // Ensure session identity matches token identity
        if (tokenData.userId !== user.id) {
            throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Session and token identity mismatch.");
        }

        // 3. Role Authorization
        if (authRoles.length > 0 && !authRoles.includes(user.role)) {
            throw new AppError(
                status.FORBIDDEN,
                `Forbidden access! Required roles: [${authRoles.join(", ")}], but your role is: ${user.role}`
            );
        }

        // 4. Attach request user
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };

        next();
    } catch (error: any) {
        next(error);
    }
};