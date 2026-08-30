import { Server } from "socket.io";
import z from "zod";
import { prisma } from "../lib/prisma";
import { CallService } from "../module/call/call.service";
import {
    iceCandidateZodSchema,
    initiateCallZodSchema,
    sdpAnswerZodSchema,
    sdpOfferZodSchema,
} from "../module/call/call.validation";
import { ChatService } from "../module/chat/chat.service";
import { logger } from "../utils/logger";
import { SOCKET_EVENTS } from "./socket.events";
import { presenceManager } from "./socket.presence";
import { getCallRoom, getConversationRoom, getRoleRoom, getUserRoom } from "./socket.rooms";
import {
    AuthenticatedSocket,
    ClientToServerEvents,
    ICallAnswerPayload,
    ICallIceCandidatePayload,
    ICallInitiateSocketPayload,
    ICallOfferPayload,
    ICallSignalPayload,
    IChatMessagePayload,
    IChatTypingPayload,
    InterServerEvents,
    IPresenceStatusPayload,
    ServerToClientEvents,
    SocketData,
} from "./socket.types";

// Validation Schemas for Chat Client Payloads
const chatMessageSchema = z.object({
    recipientId: z.string().min(1, "Recipient ID is required"),
    content: z.string().min(1, "Message content cannot be empty").max(5000, "Message content exceeds limit"),
    conversationId: z.string().optional(),
    tempId: z.string().optional(),
});

const chatTypingSchema = z.object({
    recipientId: z.string().min(1, "Recipient ID is required"),
    conversationId: z.string().optional(),
});

export const registerSocketHandlers = (
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    socket: AuthenticatedSocket
) => {
    const user = socket.data.user;

    // 1. Auto-join user-specific and role-specific rooms
    const userRoom = getUserRoom(user.userId);
    const roleRoom = getRoleRoom(user.role);

    socket.join(userRoom);
    socket.join(roleRoom);

    // 2. Track connection in presence manager
    const { isFirstConnection, activeConnections } = presenceManager.addConnection(user.userId, socket.id);
    logger.info(`[Socket] User ${user.userId} (${user.role}) connected on socket ${socket.id} (Active tabs: ${activeConnections})`);

    // Broadcast online status to subscribers if first connection
    if (isFirstConnection) {
        const presencePayload: IPresenceStatusPayload = {
            userId: user.userId,
            isOnline: true,
            lastSeen: new Date().toISOString(),
        };
        io.emit(SOCKET_EVENTS.PRESENCE_ONLINE, presencePayload);
    }

    // 3. Presence Query Handler
    socket.on(SOCKET_EVENTS.PRESENCE_GET, (payload, callback) => {
        try {
            if (!callback || typeof callback !== "function") return;

            if ("userId" in payload && typeof payload.userId === "string") {
                const presence = presenceManager.getUserPresence(payload.userId);
                callback({
                    userId: presence.userId,
                    isOnline: presence.isOnline,
                    lastSeen: presence.lastSeen.toISOString(),
                });
            } else if ("userIds" in payload && Array.isArray(payload.userIds)) {
                const presences = presenceManager.getUsersPresence(payload.userIds).map((p) => ({
                    userId: p.userId,
                    isOnline: p.isOnline,
                    lastSeen: p.lastSeen.toISOString(),
                }));
                callback(presences);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling presence:get: ${msg}`);
        }
    });

    // 4. Conversation Room Joining / Leaving
    socket.on(SOCKET_EVENTS.CHAT_JOIN_CONVERSATION, async (payload, callback) => {
        try {
            if (!payload || !payload.conversationId) {
                if (callback) callback({ success: false, error: "Conversation ID is required" });
                return;
            }

            const participant = await prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: payload.conversationId,
                    userId: user.userId,
                    conversation: {
                        isDeleted: false,
                    },
                },
            });

            if (!participant) {
                logger.warn(`[Socket] Unauthorized join attempt to conversation ${payload.conversationId} by user ${user.userId}`);
                if (callback) callback({ success: false, error: "Forbidden: You are not a participant of this conversation" });
                return;
            }

            const room = getConversationRoom(payload.conversationId);
            socket.join(room);
            logger.info(`[Socket] User ${user.userId} joined conversation room ${room}`);

            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error joining conversation room: ${msg}`);
            if (callback) callback({ success: false, error: "Internal server error" });
        }
    });

    socket.on(SOCKET_EVENTS.CHAT_LEAVE_CONVERSATION, (payload) => {
        try {
            if (payload && payload.conversationId) {
                const room = getConversationRoom(payload.conversationId);
                socket.leave(room);
                logger.info(`[Socket] User ${user.userId} left conversation room ${room}`);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error leaving conversation room: ${msg}`);
        }
    });

    // 5. Chat Messaging & Signaling Handlers
    socket.on(SOCKET_EVENTS.CHAT_SEND, async (payload: IChatMessagePayload, callback) => {
        try {
            const parseResult = chatMessageSchema.safeParse(payload);
            if (!parseResult.success) {
                if (callback && typeof callback === "function") {
                    callback({ success: false, error: parseResult.error.issues[0]?.message || "Invalid payload" });
                }
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid chat payload" });
                return;
            }

            const validPayload = parseResult.data;

            // 1. Instantly broadcast to recipient for real-time <50ms delivery
            const optimisticId = validPayload.tempId || "temp-" + Date.now();
            const messageData = {
                id: optimisticId,
                senderId: user.userId,
                content: validPayload.content,
                conversationId: validPayload.conversationId,
                tempId: validPayload.tempId,
                messageType: "TEXT",
                status: "SENT",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (validPayload.conversationId) {
                const convRoom = getConversationRoom(validPayload.conversationId);
                socket.to(convRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE, messageData);
            }

            const recipientRoom = getUserRoom(validPayload.recipientId);
            socket.to(recipientRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE, messageData);

            // 2. Persist in background (with skipSocketEmit to prevent double-emit)
            if (validPayload.conversationId) {
                try {
                    const persistedMessage = await ChatService.sendMessage(validPayload.conversationId, user, {
                        content: validPayload.content,
                        tempId: validPayload.tempId,
                        messageType: "TEXT",
                        skipSocketEmit: true, // We already emitted above!
                    });

                    // 3. ACK with the fully persisted message so sender can reconcile
                    if (callback && typeof callback === "function") {
                        callback({ success: true, data: { ...persistedMessage, tempId: validPayload.tempId } });
                    }
                } catch (persistError: unknown) {
                    const msg = persistError instanceof Error ? persistError.message : "Failed to persist";
                    logger.error(`[Socket] Persistence error in chat:send: ${msg}`);
                    if (callback && typeof callback === "function") {
                        callback({ success: false, error: msg });
                    }
                }
            } else {
                if (callback && typeof callback === "function") {
                    callback({ success: false, error: "Conversation ID missing" });
                }
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling chat:send: ${msg}`);
            if (callback && typeof callback === "function") {
                callback({ success: false, error: "Internal server error" });
            }
        }
    });

    socket.on(SOCKET_EVENTS.CHAT_TYPING, (payload: IChatTypingPayload) => {
        try {
            const parseResult = chatTypingSchema.safeParse(payload);
            if (!parseResult.success) return;

            const typingData = {
                senderId: user.userId,
                conversationId: parseResult.data.conversationId,
            };

            if (parseResult.data.conversationId) {
                const convRoom = getConversationRoom(parseResult.data.conversationId);
                socket.to(convRoom).emit(SOCKET_EVENTS.CHAT_TYPING, typingData);
            }

            const recipientRoom = getUserRoom(parseResult.data.recipientId);
            socket.to(recipientRoom).emit(SOCKET_EVENTS.CHAT_TYPING, typingData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling chat:typing: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CHAT_STOP_TYPING, (payload: IChatTypingPayload) => {
        try {
            const parseResult = chatTypingSchema.safeParse(payload);
            if (!parseResult.success) return;

            const stopTypingData = {
                senderId: user.userId,
                conversationId: parseResult.data.conversationId,
            };

            if (parseResult.data.conversationId) {
                const convRoom = getConversationRoom(parseResult.data.conversationId);
                socket.to(convRoom).emit(SOCKET_EVENTS.CHAT_STOP_TYPING, stopTypingData);
            }

            const recipientRoom = getUserRoom(parseResult.data.recipientId);
            socket.to(recipientRoom).emit(SOCKET_EVENTS.CHAT_STOP_TYPING, stopTypingData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling chat:stop-typing: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CHAT_READ, async (payload, callback) => {
        try {
            if (!payload || !payload.conversationId) {
                if (callback) callback({ success: false, error: "Conversation ID is required" });
                return;
            }

            await ChatService.markConversationAsRead(payload.conversationId, user);
            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling chat:read: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    // 6. WebRTC Call Session & Signaling Handlers
    socket.on(SOCKET_EVENTS.CALL_JOIN, async (payload, callback) => {
        try {
            if (!payload || !payload.callId) {
                if (callback) callback({ success: false, error: "Call ID is required" });
                return;
            }

            const call = await CallService.verifyCallParticipant(payload.callId, user.userId);
            if (!call) {
                logger.warn(`[Socket] Unauthorized join attempt to call ${payload.callId} by user ${user.userId}`);
                if (callback) callback({ success: false, error: "Forbidden: You are not a participant of this call" });
                return;
            }

            const callRoom = getCallRoom(payload.callId);
            socket.join(callRoom);
            logger.info(`[Socket] User ${user.userId} joined call room ${callRoom}`);

            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error joining call room: ${msg}`);
            if (callback) callback({ success: false, error: "Internal server error" });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_LEAVE, (payload) => {
        try {
            if (payload && payload.callId) {
                const callRoom = getCallRoom(payload.callId);
                socket.leave(callRoom);
                logger.info(`[Socket] User ${user.userId} left call room ${callRoom}`);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error leaving call room: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_INITIATE, async (payload: ICallInitiateSocketPayload, callback) => {
        try {
            const parseResult = initiateCallZodSchema.safeParse(payload);
            if (!parseResult.success) {
                if (callback) callback({ success: false, error: parseResult.error.issues[0]?.message || "Invalid payload" });
                return;
            }

            const call = await CallService.initiateCall(user, parseResult.data);
            const callRoom = getCallRoom(call.id);
            socket.join(callRoom);

            if (callback) callback({ success: true, data: call });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:initiate: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_ACCEPT, async (payload: { callId: string }, callback) => {
        try {
            if (!payload || !payload.callId) {
                if (callback) callback({ success: false, error: "Call ID is required" });
                return;
            }

            const call = await CallService.acceptCall(payload.callId, user);
            const callRoom = getCallRoom(call.id);
            socket.join(callRoom);

            if (callback) callback({ success: true, data: call });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:accept: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_REJECT, async (payload: ICallSignalPayload, callback) => {
        try {
            if (!payload || !payload.callId) {
                if (callback) callback({ success: false, error: "Call ID is required" });
                return;
            }

            await CallService.rejectCall(payload.callId, user, payload.reason);
            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:reject: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_CANCEL, async (payload: ICallSignalPayload, callback) => {
        try {
            if (!payload || !payload.callId) {
                if (callback) callback({ success: false, error: "Call ID is required" });
                return;
            }

            await CallService.cancelCall(payload.callId, user, payload.reason);
            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:cancel: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_END, async (payload: ICallSignalPayload, callback) => {
        try {
            if (!payload || !payload.callId) {
                if (callback) callback({ success: false, error: "Call ID is required" });
                return;
            }

            await CallService.endCall(payload.callId, user, payload.reason);
            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:end: ${msg}`);
            if (callback) callback({ success: false, error: msg });
        }
    });

    // 7. WebRTC SDP & ICE Candidate Signaling (Relay Only)
    socket.on(SOCKET_EVENTS.CALL_OFFER, async (payload: ICallOfferPayload) => {
        try {
            const parseResult = sdpOfferZodSchema.safeParse(payload);
            if (!parseResult.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid call offer payload" });
                return;
            }

            const { callId, offer } = parseResult.data;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "FORBIDDEN", message: "Not authorized for this call session" });
                return;
            }

            const callRoom = getCallRoom(callId);
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;

            const offerData = {
                callId,
                senderId: user.userId,
                offer,
            };

            socket.to(callRoom).emit(SOCKET_EVENTS.CALL_OFFER, offerData);
            socket.to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_OFFER, offerData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:offer: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_ANSWER, async (payload: ICallAnswerPayload) => {
        try {
            const parseResult = sdpAnswerZodSchema.safeParse(payload);
            if (!parseResult.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid call answer payload" });
                return;
            }

            const { callId, answer } = parseResult.data;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "FORBIDDEN", message: "Not authorized for this call session" });
                return;
            }

            const callRoom = getCallRoom(callId);
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;

            const answerData = {
                callId,
                senderId: user.userId,
                answer,
            };

            socket.to(callRoom).emit(SOCKET_EVENTS.CALL_ANSWER, answerData);
            socket.to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_ANSWER, answerData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:answer: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async (payload: ICallIceCandidatePayload) => {
        try {
            const parseResult = iceCandidateZodSchema.safeParse(payload);
            if (!parseResult.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid ICE candidate payload" });
                return;
            }

            const { callId, candidate } = parseResult.data;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: "FORBIDDEN", message: "Not authorized for this call session" });
                return;
            }

            const callRoom = getCallRoom(callId);
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;

            const candidateData = {
                callId,
                senderId: user.userId,
                candidate,
            };

            socket.to(callRoom).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, candidateData);
            socket.to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, candidateData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:ice-candidate: ${msg}`);
        }
    });

    // 8. Disconnection Handler
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        const { isLastConnection, remainingConnections, lastSeen } = presenceManager.removeConnection(user.userId, socket.id);
        logger.info(`[Socket] User ${user.userId} disconnected (Socket: ${socket.id}, Remaining tabs: ${remainingConnections}, Reason: ${reason})`);

        if (isLastConnection) {
            // Clean up user from active in-memory call map
            CallService.clearUserFromCall(user.userId);

            const offlinePayload: IPresenceStatusPayload = {
                userId: user.userId,
                isOnline: false,
                lastSeen: lastSeen.toISOString(),
            };
            io.emit(SOCKET_EVENTS.PRESENCE_OFFLINE, offlinePayload);
        }
    });
};
