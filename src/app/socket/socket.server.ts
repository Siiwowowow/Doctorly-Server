import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { NotificationService } from "../module/notification/notification.service";
import { logger } from "../utils/logger";
import { socketAuthMiddleware } from "./socket.auth";
import { SOCKET_EVENTS } from "./socket.events";
import { registerSocketHandlers } from "./socket.handler";
import { getRoleRoom, getUserRoom } from "./socket.rooms";
import {
    ClientToServerEvents,
    INotificationPayload,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from "./socket.types";

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export const initSocketIO = (
    httpServer: HttpServer
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
    if (io) {
        logger.warn("[Socket.IO] Server already initialized. Returning existing instance.");
        return io;
    }

    const allowedOrigins = [
        envVars.FRONTEND_URL,
        envVars.BETTER_AUTH_URL,
        "https://doctorly-fontend.vercel.app",
        "https://doctorly-frontend.vercel.app",
        "http://localhost:3000",
        "http://localhost:5000",
    ].filter(Boolean).map((origin) => origin.replace(/\/+$/, ""));

    io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                const normalizedOrigin = origin.replace(/\/+$/, "");
                const isAllowed = allowedOrigins.includes(normalizedOrigin)
                    || /^https:\/\/doctorly-fontend-[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin);
                callback(isAllowed ? null : new Error("Origin not allowed"), isAllowed);
            },
            credentials: true,
            methods: ["GET", "POST"],
        },
        pingInterval: 25000,
        pingTimeout: 20000,
        maxHttpBufferSize: 1e6, // 1 MB payload limit
    });

    // 1. Register authentication middleware
    io.use(socketAuthMiddleware);

    // 2. Register connection listener
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
        registerSocketHandlers(io!, socket);
    });

    // 3. Connect NotificationService realtime hook
    NotificationService.registerRealtimeNotificationHandler((notification) => {
        if (!io) return;

        const userRoom = getUserRoom(notification.recipientId);
        const safePayload: INotificationPayload = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: (notification.data as Record<string, unknown>) || null,
            createdAt: notification.createdAt,
        };

        io.to(userRoom).emit(SOCKET_EVENTS.NOTIFICATION_NEW, safePayload);
        logger.info(`[Socket] Dispatched real-time notification (${notification.type}) to user ${notification.recipientId}`);
    });

    logger.info("[Socket.IO] Realtime infrastructure initialized successfully");
    return io;
};

export const getSocketIO = (): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized. Call initSocketIO(httpServer) first.");
    }
    return io;
};

export const emitToUser = <T extends keyof ServerToClientEvents>(
    userId: string,
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
): boolean => {
    if (!io) return false;
    const userRoom = getUserRoom(userId);
    return io.to(userRoom).emit(event, ...args);
};

export const emitToRole = <T extends keyof ServerToClientEvents>(
    role: Role,
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
): boolean => {
    if (!io) return false;
    const roleRoom = getRoleRoom(role);
    return io.to(roleRoom).emit(event, ...args);
};
