import { Socket } from "socket.io";
import { CallType, NotificationType } from "../../generated/prisma/enums";
import { IRequestUser } from "../interfaces/requestUser.interface";

export interface SocketData {
    user: IRequestUser;
}

export type AuthenticatedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface IUserPresence {
    userId: string;
    isOnline: boolean;
    lastSeen: Date;
    activeConnections: number;
}

export interface IPresenceStatusPayload {
    userId: string;
    isOnline: boolean;
    lastSeen: string;
}

export interface INotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown> | null;
    createdAt: Date | string;
}

export interface IChatMessagePayload {
    recipientId: string;
    content: string;
    conversationId?: string;
    tempId?: string;
}

export interface IChatTypingPayload {
    recipientId: string;
    conversationId?: string;
}

export interface ICallInitiateSocketPayload {
    receiverId?: string;
    appointmentId?: string;
    type?: CallType;
}

export interface ICallOfferPayload {
    callId: string;
    recipientId?: string;
    appointmentId?: string;
    offer: {
        type: string;
        sdp: string;
    };
}

export interface ICallAnswerPayload {
    callId: string;
    recipientId?: string;
    appointmentId?: string;
    answer: {
        type: string;
        sdp: string;
    };
}

export interface ICallIceCandidatePayload {
    callId: string;
    recipientId?: string;
    appointmentId?: string;
    candidate: {
        candidate: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
    };
}

export interface ICallSignalPayload {
    callId: string;
    recipientId?: string;
    appointmentId?: string;
    reason?: string;
}

// Client to Server Events
export interface ClientToServerEvents {
    "presence:get": (payload: { userId: string } | { userIds: string[] }, callback?: (presence: IPresenceStatusPayload | IPresenceStatusPayload[]) => void) => void;
    "chat:join-conversation": (payload: { conversationId: string }, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "chat:leave-conversation": (payload: { conversationId: string }) => void;
    "chat:send": (payload: IChatMessagePayload, callback?: (status: { success: boolean; data?: unknown; error?: string }) => void) => void;
    "chat:typing": (payload: IChatTypingPayload) => void;
    "chat:stop-typing": (payload: IChatTypingPayload) => void;
    "chat:read": (payload: { conversationId: string }, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "call:join": (payload: { callId: string }, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "call:leave": (payload: { callId: string }) => void;
    "call:initiate": (payload: ICallInitiateSocketPayload, callback?: (status: { success: boolean; data?: unknown; error?: string }) => void) => void;
    "call:accept": (payload: { callId: string }, callback?: (status: { success: boolean; data?: unknown; error?: string }) => void) => void;
    "call:reject": (payload: ICallSignalPayload, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "call:cancel": (payload: ICallSignalPayload, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "call:end": (payload: ICallSignalPayload, callback?: (status: { success: boolean; error?: string }) => void) => void;
    "call:offer": (payload: ICallOfferPayload) => void;
    "call:answer": (payload: ICallAnswerPayload) => void;
    "call:ice-candidate": (payload: ICallIceCandidatePayload) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
    "notification:new": (notification: INotificationPayload) => void;
    "presence:online": (payload: IPresenceStatusPayload) => void;
    "presence:offline": (payload: IPresenceStatusPayload) => void;
    "chat:message": (payload: { id?: string; senderId: string; content: string; conversationId?: string; tempId?: string; messageType?: string; status?: string; createdAt?: string; updatedAt?: string; timestamp?: string }) => void;
    "chat:typing": (payload: { senderId: string; conversationId?: string }) => void;
    "chat:stop-typing": (payload: { senderId: string; conversationId?: string }) => void;
    "chat:read": (payload: { conversationId: string; readerId: string; readAt: string }) => void;
    "chat:delivered": (payload: { conversationId: string; messageId: string; recipientId: string }) => void;
    "call:incoming": (payload: { callId: string; callerId: string; caller?: unknown; appointmentId?: string | null; type: CallType; createdAt: string }) => void;
    "call:ringing": (payload: { callId: string; receiverId: string }) => void;
    "call:accepted": (payload: { callId: string; calleeId: string; appointmentId?: string | null; answeredAt: string }) => void;
    "call:rejected": (payload: { callId: string; calleeId: string; appointmentId?: string | null; reason?: string | null }) => void;
    "call:busy": (payload: { callId?: string; receiverId: string; reason?: string }) => void;
    "call:offer": (payload: { callId: string; senderId: string; offer: { type: string; sdp: string } }) => void;
    "call:answer": (payload: { callId: string; senderId: string; answer: { type: string; sdp: string } }) => void;
    "call:ice-candidate": (payload: { callId: string; senderId: string; candidate: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null } }) => void;
    "call:ended": (payload: { callId: string; senderId?: string; appointmentId?: string | null; duration?: number | null; reason?: string | null }) => void;
    "call:canceled": (payload: { callId: string; callerId: string; appointmentId?: string | null; reason?: string | null }) => void;
    "call:missed": (payload: { callId: string; callerId: string; receiverId: string; appointmentId?: string | null; reason?: string }) => void;
    "call:failed": (payload: { callId?: string; reason: string }) => void;
    "error": (error: { code: string; message: string }) => void;
}

export type InterServerEvents = Record<string, never>;
