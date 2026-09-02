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

        // 1. Resolve access token & session token from cookies, handshake auth, or headers
        let accessToken = cookies["accessToken"] || (socket.handshake.auth?.token as string | undefined) || (socket.handshake.auth?.accessToken as string | undefined);
        const sessionToken = cookies["better-auth.session_token"] || (socket.handshake.auth?.sessionToken as string | undefined);

        if (!accessToken && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                accessToken = authHeader.substring(7);
            }
        }

        let resolvedUserId: string | null = null;

        // 2. Try validating JWT access token first
        if (accessToken) {
            const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
            if (verifiedToken.success && verifiedToken.data) {
                resolvedUserId = verifiedToken.data.userId;
            }
        }

        // 3. If access token verification did not resolve a user, fallback to session token in DB
        let user = null;
        if (resolvedUserId) {
            user = await prisma.user.findUnique({
                where: { id: resolvedUserId },
            });
        } else if (sessionToken) {
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
            if (session && session.user) {
                user = session.user;
                resolvedUserId = session.user.id;
            }
        }

        if (!user || !resolvedUserId) {
            logger.warn(`[SocketAuth] Connection rejected for socket ${socket.id}: No valid access token or session`);
            return next(new Error("Unauthorized: Invalid or expired authentication credentials"));
        }

        // 4. User status validation
        if (user.status === UserStatus.BLOCKED) {
            logger.warn(`[SocketAuth] Connection rejected: User ${user.id} is blocked`);
            return next(new Error("Forbidden: Your account is blocked"));
        }

        if (user.isDeleted || user.status === UserStatus.DELETED) {
            logger.warn(`[SocketAuth] Connection rejected: User ${user.id} is deleted`);
            return next(new Error("Unauthorized: Your account has been deleted"));
        }

        // 5. Attach trusted user identity to socket data
        socket.data.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
        };

        logger.info(`[SocketAuth] User ${user.id} (${user.role}) authenticated successfully`);
        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[SocketAuth] Unexpected error during socket authentication: ${errorMessage}`);
        next(new Error("Internal server error during socket authentication"));
    }
};

