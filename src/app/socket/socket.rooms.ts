import { Role } from "../../generated/prisma/enums";

export const SOCKET_ROOMS = {
    USER_PREFIX: "user:",
    ROLE_PREFIX: "role:",
    APPOINTMENT_PREFIX: "appointment:",
    CONVERSATION_PREFIX: "conversation:",
    CALL_PREFIX: "call:",
} as const;

export const getUserRoom = (userId: string): string => {
    return `${SOCKET_ROOMS.USER_PREFIX}${userId}`;
};

export const getRoleRoom = (role: Role): string => {
    return `${SOCKET_ROOMS.ROLE_PREFIX}${role}`;
};

export const getAppointmentRoom = (appointmentId: string): string => {
    return `${SOCKET_ROOMS.APPOINTMENT_PREFIX}${appointmentId}`;
};

export const getConversationRoom = (conversationId: string): string => {
    return `${SOCKET_ROOMS.CONVERSATION_PREFIX}${conversationId}`;
};

export const getCallRoom = (callId: string): string => {
    return `${SOCKET_ROOMS.CALL_PREFIX}${callId}`;
};
