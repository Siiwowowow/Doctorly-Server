import { Socket } from "socket.io";
import { UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { logger } from "../utils/logger";
import {
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "./socket.types";

const parseCookies = (cookieHeader?: string): Record<string, string> => {
    if (!cookieHeader) return {};
    return cookieHeader.split(";").reduce((res, item) => {
        const [key, ...rest] = item.trim().split("=");
        if (key && rest.length > 0) {
            res[key] = decodeURIComponent(rest.join("="));
        }
        return res;
    }, {} as Record<string, string>);
};

export const socketAuthMiddleware = async (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    next: (err?: Error) => void
) => {
    try {
        const rawCookieHeader = socket.handshake.headers.cookie;
        const cookies = parseCookies(rawCookieHeader);

        // 1. Resolve session token from cookie or handshake auth
        const sessionToken = cookies["better-auth.session_token"] || (socket.handshake.auth?.sessionToken as string | undefined);

        if (!sessionToken) {
            logger.warn(`[SocketAuth] Connection rejected for socket ${socket.id}: No session token`);
            return next(new Error("Unauthorized: No session token provided"));
        }

        // 2. Validate Session in Database
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
            logger.warn(`[SocketAuth] Connection rejected for socket ${socket.id}: Invalid or expired session`);
            return next(new Error("Unauthorized: Invalid or expired session"));
        }

        const user = session.user;

        // 3. User status validation
        if (user.status === UserStatus.BLOCKED) {
            logger.warn(`[SocketAuth] Connection rejected: User ${user.id} is blocked`);
            return next(new Error("Forbidden: Your account is blocked"));
        }

        if (user.isDeleted || user.status === UserStatus.DELETED) {
            logger.warn(`[SocketAuth] Connection rejected: User ${user.id} is deleted`);
            return next(new Error("Unauthorized: Your account has been deleted"));
        }

        if (!user.emailVerified) {
            logger.warn(`[SocketAuth] Connection rejected: User ${user.id} is unverified`);
            return next(new Error("Forbidden: Please verify your email address first"));
        }

        // 4. Resolve and validate Access Token from cookie or handshake auth/headers
        let accessToken = cookies["accessToken"] || (socket.handshake.auth?.token as string | undefined);

        if (!accessToken && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7);
            }
        }

        if (!accessToken) {
            logger.warn(`[SocketAuth] Connection rejected for user ${user.id}: Missing access token`);
            return next(new Error("Unauthorized: No access token provided"));
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success || !verifiedToken.data) {
            logger.warn(`[SocketAuth] Connection rejected for user ${user.id}: Invalid access token`);
            return next(new Error("Unauthorized: Invalid or expired access token"));
        }

        const tokenData = verifiedToken.data;

        // Ensure session identity matches token identity
        if (tokenData.userId !== user.id) {
            logger.warn(`[SocketAuth] Connection rejected: Identity mismatch (Token: ${tokenData.userId}, Session: ${user.id})`);
            return next(new Error("Unauthorized: Session and token identity mismatch"));
        }

        // 5. Attach trusted user identity to socket data
        socket.data.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };

        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[SocketAuth] Unexpected error during socket authentication: ${errorMessage}`);
        next(new Error("Internal server error during socket authentication"));
    }
};
