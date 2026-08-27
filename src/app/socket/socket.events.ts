export const SOCKET_EVENTS = {
    // Lifecycle
    CONNECTION: "connection",
    DISCONNECT: "disconnect",
    DISCONNECTING: "disconnecting",

    // Notifications
    NOTIFICATION_NEW: "notification:new",

    // Presence
    PRESENCE_ONLINE: "presence:online",
    PRESENCE_OFFLINE: "presence:offline",
    PRESENCE_GET: "presence:get",
    PRESENCE_STATUS: "presence:status",

    // Chat Signaling & Messaging
    CHAT_JOIN_CONVERSATION: "chat:join-conversation",
    CHAT_LEAVE_CONVERSATION: "chat:leave-conversation",
    CHAT_SEND: "chat:send",
    CHAT_MESSAGE: "chat:message",
    CHAT_TYPING: "chat:typing",
    CHAT_STOP_TYPING: "chat:stop-typing",
    CHAT_READ: "chat:read",
    CHAT_DELIVERED: "chat:delivered",

    // Call Signaling & WebRTC
    CALL_INITIATE: "call:initiate",
    CALL_INCOMING: "call:incoming",
    CALL_RINGING: "call:ringing",
    CALL_ACCEPT: "call:accept",
    CALL_ACCEPTED: "call:accepted",
    CALL_REJECT: "call:reject",
    CALL_REJECTED: "call:rejected",
    CALL_BUSY: "call:busy",
    CALL_OFFER: "call:offer",
    CALL_ANSWER: "call:answer",
    CALL_ICE_CANDIDATE: "call:ice-candidate",
    CALL_END: "call:end",
    CALL_ENDED: "call:ended",
    CALL_CANCEL: "call:cancel",
    CALL_CANCELED: "call:canceled",
    CALL_MISSED: "call:missed",
    CALL_FAILED: "call:failed",
    CALL_JOIN: "call:join",
    CALL_LEAVE: "call:leave",

    // Error
    ERROR: "error",
} as const;

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
