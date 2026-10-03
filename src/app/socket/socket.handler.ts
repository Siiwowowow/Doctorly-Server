/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Recover an incoming call that was created while the browser socket was
    // reconnecting or while a Render instance was waking up.
    CallService.getPendingIncomingCall(user.userId)
        .then((pendingCall) => {
            if (!pendingCall || !socket.connected) return;
            socket.emit(SOCKET_EVENTS.CALL_INCOMING, {
                callId: pendingCall.id,
                callerId: pendingCall.callerId,
                caller: pendingCall.caller,
                appointmentId: pendingCall.appointmentId,
                type: pendingCall.type,
                createdAt: pendingCall.createdAt.toISOString(),
            });
        })
        .catch((error: unknown) => {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Failed to restore pending call for ${user.userId}: ${msg}`);
        });

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

            if (!validPayload.conversationId) {
                if (callback && typeof callback === "function") {
                    callback({ success: false, error: "Conversation ID is required" });
                }
                return;
            }

            // 1. Persist message to database first to obtain real stable UUID & full relations
            const persistedMessage = await ChatService.sendMessage(validPayload.conversationId, user, {
                content: validPayload.content,
                tempId: validPayload.tempId,
                messageType: "TEXT",
                skipSocketEmit: true, // We broadcast directly below
            });

            const isRecipientOnline = presenceManager.isUserOnline(validPayload.recipientId);
            const deliveryStatus = isRecipientOnline ? "DELIVERED" : "SENT";

            const messageBroadcastPayload = {
                ...persistedMessage,
                tempId: validPayload.tempId,
                status: deliveryStatus,
            };

            // 2. Broadcast to active conversation room (for users currently viewing the chat)
            const convRoom = getConversationRoom(validPayload.conversationId);
            socket.to(convRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE, messageBroadcastPayload as any);

            // 3. Also emit directly to recipient's private user room (for users on other pages / tabs)
            const recipientRoom = getUserRoom(validPayload.recipientId);
            socket.to(recipientRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE, messageBroadcastPayload as any);

            // 4. If recipient is online, notify sender of successful delivery
            if (isRecipientOnline) {
                socket.emit(SOCKET_EVENTS.CHAT_DELIVERED, {
                    conversationId: validPayload.conversationId,
                    messageId: persistedMessage.id,
                    recipientId: validPayload.recipientId,
                });
            }

            // 5. ACK sender with the real persisted database message and tempId reconciliation
            if (callback && typeof callback === "function") {
                callback({
                    success: true,
                    data: {
                        ...persistedMessage,
                        tempId: validPayload.tempId,
                        status: deliveryStatus,
                    },
                });
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Internal server error";
            logger.error(`[Socket] Error handling chat:send: ${msg}`);
            if (callback && typeof callback === "function") {
                callback({ success: false, error: msg });
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

            // Broadcast to other participants in call room and personal room that this user has joined
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;
            socket.to(callRoom).to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_USER_JOINED, {
                callId: payload.callId,
                userId: user.userId,
                user: {
                    id: user.userId,
                    role: user.role,
                    email: user.email,
                },
            });

            if (callback) callback({ success: true });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error joining call room: ${msg}`);
            if (callback) callback({ success: false, error: "Internal server error" });
        }
    });

    socket.on(SOCKET_EVENTS.CALL_MESSAGE, async (payload) => {
        try {
            if (!payload || !payload.callId || !payload.content) return;

            const call = await CallService.verifyCallParticipant(payload.callId, user.userId);
            if (!call) return;

            const callRoom = getCallRoom(payload.callId);
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;

            const messagePayload = {
                callId: payload.callId,
                senderId: user.userId,
                senderName: user.email?.split("@")[0] || "User",
                content: payload.content,
                timestamp: new Date().toISOString(),
                tempId: payload.tempId || Date.now().toString(),
            };

            // Broadcast to room and directly to recipient room
            socket.to(callRoom).emit(SOCKET_EVENTS.CALL_MESSAGE, messagePayload);
            socket.to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_MESSAGE, messagePayload);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[Socket] Error handling call:message: ${msg}`);
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

    // 7. WebRTC SDP, Readiness & ICE Candidate Signaling (Relay Only to Call Room)
    socket.on(SOCKET_EVENTS.CALL_READY, async (payload: { callId: string; role?: string }) => {
        try {
            if (!payload || !payload.callId) return;
            const { callId, role } = payload;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                logger.warn(`[CALL][SOCKET] User ${user.userId} forbidden from sending call:ready for call ${callId}`);
                socket.emit(SOCKET_EVENTS.ERROR, { code: "FORBIDDEN", message: "Not authorized for this call session" });
                return;
            }

            const callRoom = getCallRoom(callId);
            const otherUserId = call.callerId === user.userId ? call.receiverId : call.callerId;

            const readyData = {
                callId,
                userId: user.userId,
                role: role || user.role,
            };

            logger.info(`[CALL][SOCKET][RECV] event=call:ready callId=${callId} senderId=${user.userId} receiverId=${otherUserId} socketId=${socket.id}`);
            // Also target the participant's private room. Socket.IO de-duplicates
            // sockets that are in both rooms and this prevents join-order races.
            socket.to(callRoom).to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_READY, readyData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[CALL][SOCKET] Error handling call:ready: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_OFFER, async (payload: ICallOfferPayload) => {
        try {
            const parseResult = sdpOfferZodSchema.safeParse(payload);
            if (!parseResult.success) {
                logger.warn(`[CALL][SOCKET] Invalid call:offer payload from user ${user.userId}`);
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid call offer payload" });
                return;
            }

            const { callId, offer } = parseResult.data;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                logger.warn(`[CALL][SOCKET] User ${user.userId} forbidden from sending offer for call ${callId}`);
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

            logger.info(`[CALL][SOCKET][RECV] event=call:offer (type: ${offer.type}) callId=${callId} senderId=${user.userId} receiverId=${otherUserId} socketId=${socket.id}`);
            socket.to(callRoom).to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_OFFER, offerData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[CALL][SOCKET] Error handling call:offer: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_ANSWER, async (payload: ICallAnswerPayload) => {
        try {
            const parseResult = sdpAnswerZodSchema.safeParse(payload);
            if (!parseResult.success) {
                logger.warn(`[CALL][SOCKET] Invalid call:answer payload from user ${user.userId}`);
                socket.emit(SOCKET_EVENTS.ERROR, { code: "VALIDATION_ERROR", message: "Invalid call answer payload" });
                return;
            }

            const { callId, answer } = parseResult.data;
            const call = await CallService.verifyCallParticipant(callId, user.userId);
            if (!call) {
                logger.warn(`[CALL][SOCKET] User ${user.userId} forbidden from sending answer for call ${callId}`);
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

            logger.info(`[CALL][SOCKET][RECV] event=call:answer (type: ${answer.type}) callId=${callId} senderId=${user.userId} receiverId=${otherUserId} socketId=${socket.id}`);
            socket.to(callRoom).to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_ANSWER, answerData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[CALL][SOCKET] Error handling call:answer: ${msg}`);
        }
    });

    socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async (payload: ICallIceCandidatePayload) => {
        try {
            const parseResult = iceCandidateZodSchema.safeParse(payload);
            if (!parseResult.success) {
                logger.warn(`[CALL][SOCKET] Invalid call:ice-candidate payload from user ${user.userId}`);
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

            logger.info(`[CALL][SOCKET][RECV] event=call:ice-candidate callId=${callId} senderId=${user.userId} receiverId=${otherUserId} socketId=${socket.id}`);
            socket.to(callRoom).to(getUserRoom(otherUserId)).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, candidateData);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            logger.error(`[CALL][SOCKET] Error handling call:ice-candidate: ${msg}`);
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
