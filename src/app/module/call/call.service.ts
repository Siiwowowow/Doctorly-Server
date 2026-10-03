import status from "http-status";
import { createHmac } from "node:crypto";
import { Prisma } from "../../../generated/prisma/client";
import {
    AppointmentStatus,
    CallStatus,
    CallType,
    NotificationType,
    Role,
    UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { SOCKET_EVENTS } from "../../socket/socket.events";
import { getCallRoom, getUserRoom } from "../../socket/socket.rooms";
import { emitToUser, getSocketIO } from "../../socket/socket.server";
import { logger } from "../../utils/logger";
import { NotificationService } from "../notification/notification.service";
import {
    defaultCallInclude,
    RINGING_TIMEOUT_MS,
} from "./call.constant";
import {
    ICallFilterQuery,
    IInitiateCallPayload,
} from "./call.interface";

// In-memory active call & timer trackers (pluggable with Redis)
const userActiveCallMap: Map<string, string> = new Map(); // userId -> callId
const callMissedTimers: Map<string, NodeJS.Timeout> = new Map(); // callId -> timeout

const setUserInCall = (userId: string, callId: string): void => {
    userActiveCallMap.set(userId, callId);
};

const clearUserFromCall = (userId: string): void => {
    userActiveCallMap.delete(userId);
};

const isUserInCall = (userId: string): boolean => {
    return userActiveCallMap.has(userId);
};

const clearMissedCallTimer = (callId: string): void => {
    const timer = callMissedTimers.get(callId);
    if (timer) {
        clearTimeout(timer);
        callMissedTimers.delete(callId);
    }
};

const initiateCall = async (user: IRequestUser, payload: IInitiateCallPayload) => {
    let receiverUserId: string;
    let appointmentId: string | null = null;
    let callerDisplayName = user.email;

    // 1. Resolve caller & receiver based on role and verify healthcare treatment relationship
    if (user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
            where: { userId: user.userId, isDeleted: false },
            include: { user: true },
        });

        if (!patient) {
            throw new AppError(status.NOT_FOUND, "Patient profile not found");
        }

        if (patient.user.status === UserStatus.BLOCKED || patient.user.isDeleted) {
            throw new AppError(status.FORBIDDEN, "Your patient account is inactive");
        }

        callerDisplayName = patient.name;

        if (payload.appointmentId) {
            const appointment = await prisma.appointment.findFirst({
                where: {
                    id: payload.appointmentId,
                    patientId: patient.id,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                    },
                },
                include: { doctor: { include: { user: true } } },
            });

            if (!appointment) {
                throw new AppError(status.FORBIDDEN, "Invalid appointment or not authorized to call for this appointment");
            }

            receiverUserId = appointment.doctor.userId;
            appointmentId = appointment.id;
        } else if (payload.receiverId) {
            const doctor = await prisma.doctor.findFirst({
                where: {
                    OR: [{ id: payload.receiverId }, { userId: payload.receiverId }],
                    isDeleted: false,
                },
                include: { user: true },
            });

            if (!doctor) {
                throw new AppError(status.NOT_FOUND, "Doctor not found or is inactive");
            }

            const validAppointment = await prisma.appointment.findFirst({
                where: {
                    patientId: patient.id,
                    doctorId: doctor.id,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                    },
                },
            });

            if (!validAppointment) {
                throw new AppError(status.FORBIDDEN, "You can only call a doctor with whom you have an appointment");
            }

            receiverUserId = doctor.userId;
            appointmentId = validAppointment.id;
        } else {
            throw new AppError(status.BAD_REQUEST, "Either receiverId or appointmentId is required");
        }
    } else if (user.role === Role.DOCTOR) {
        const doctor = await prisma.doctor.findFirst({
            where: { userId: user.userId, isDeleted: false },
            include: { user: true },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        if (doctor.user.status === UserStatus.BLOCKED || doctor.user.isDeleted) {
            throw new AppError(status.FORBIDDEN, "Your doctor account is inactive");
        }

        callerDisplayName = `Dr. ${doctor.name}`;

        if (payload.appointmentId) {
            const appointment = await prisma.appointment.findFirst({
                where: {
                    id: payload.appointmentId,
                    doctorId: doctor.id,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                    },
                },
                include: { patient: { include: { user: true } } },
            });

            if (!appointment) {
                throw new AppError(status.FORBIDDEN, "Invalid appointment or not authorized to call for this appointment");
            }

            receiverUserId = appointment.patient.userId;
            appointmentId = appointment.id;
        } else if (payload.receiverId) {
            const patient = await prisma.patient.findFirst({
                where: {
                    OR: [{ id: payload.receiverId }, { userId: payload.receiverId }],
                    isDeleted: false,
                },
                include: { user: true },
            });

            if (!patient) {
                throw new AppError(status.NOT_FOUND, "Patient not found or is inactive");
            }

            const validAppointment = await prisma.appointment.findFirst({
                where: {
                    patientId: patient.id,
                    doctorId: doctor.id,
                    status: {
                        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                    },
                },
            });

            if (!validAppointment) {
                throw new AppError(status.FORBIDDEN, "You can only call a patient with whom you have a treatment appointment");
            }

            receiverUserId = patient.userId;
            appointmentId = validAppointment.id;
        } else {
            throw new AppError(status.BAD_REQUEST, "Either receiverId or appointmentId is required");
        }
    } else {
        throw new AppError(status.FORBIDDEN, "Only patients and doctors can initiate calls");
    }

    // 2. Prevent calling oneself
    if (user.userId === receiverUserId) {
        throw new AppError(status.BAD_REQUEST, "You cannot call yourself");
    }

    // 3. Check if caller is already in a call
    if (isUserInCall(user.userId)) {
        throw new AppError(status.BAD_REQUEST, "You are already in an active call session");
    }

    const callType = payload.type || CallType.VIDEO;

    // 4. Check if receiver is busy
    if (isUserInCall(receiverUserId)) {
        const busyCall = await prisma.call.create({
            data: {
                callerId: user.userId,
                receiverId: receiverUserId,
                appointmentId,
                type: callType,
                status: CallStatus.BUSY,
                endedAt: new Date(),
                endReason: "Receiver is currently in another call",
            },
            include: defaultCallInclude,
        });

        // Emit call:busy to caller
        emitToUser(user.userId, SOCKET_EVENTS.CALL_BUSY, {
            callId: busyCall.id,
            receiverId: receiverUserId,
            reason: "Receiver is busy",
        });

        return busyCall;
    }

    // 5. Create call record with status RINGING
    const call = await prisma.call.create({
        data: {
            callerId: user.userId,
            receiverId: receiverUserId,
            appointmentId,
            type: callType,
            status: CallStatus.RINGING,
            startedAt: new Date(),
        },
        include: defaultCallInclude,
    });

    // 6. Record active call state
    setUserInCall(user.userId, call.id);
    setUserInCall(receiverUserId, call.id);

    // 7. Setup 45s ringing timeout for missed call
    const timer = setTimeout(async () => {
        try {
            await handleMissedCallTimeout(call.id);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            logger.error(`[CallService] Error handling missed call timeout for call ${call.id}: ${msg}`);
        }
    }, RINGING_TIMEOUT_MS);

    callMissedTimers.set(call.id, timer);

    // 8. Create incoming call notification for receiver
    try {
        await NotificationService.createNotification({
            recipientId: receiverUserId,
            type: NotificationType.CALL_INCOMING,
            title: `Incoming ${callType.toLowerCase()} call`,
            message: `${callerDisplayName} is calling you.`,
            data: {
                callId: call.id,
                appointmentId: call.appointmentId || undefined,
                callerId: user.userId,
                callType: call.type,
            },
        });
    } catch {
        // Notification delivery failure shouldn't break call creation
    }

    // 9. Emit real-time socket events
    const incomingCallPayload = {
        callId: call.id,
        callerId: user.userId,
        caller: call.caller,
        appointmentId: call.appointmentId,
        type: call.type,
        createdAt: call.createdAt.toISOString(),
    };

    emitToUser(receiverUserId, SOCKET_EVENTS.CALL_INCOMING, incomingCallPayload);
    emitToUser(user.userId, SOCKET_EVENTS.CALL_RINGING, {
        callId: call.id,
        receiverId: receiverUserId,
    });

    return call;
};

const acceptCall = async (callId: string, user: IRequestUser) => {
    // 1. Fetch call
    const call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    if (!call) {
        throw new AppError(status.NOT_FOUND, "Call session not found");
    }

    // 2. Validate receiver identity
    if (call.receiverId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden: Only the call receiver can accept the call");
    }

    // 3. State transition check
    if (call.status !== CallStatus.RINGING) {
        throw new AppError(status.BAD_REQUEST, `Cannot accept call in ${call.status} status`);
    }

    // 4. Cancel missed call timer
    clearMissedCallTimer(callId);

    const now = new Date();

    // 5. Update call status to ACCEPTED
    const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
            status: CallStatus.ACCEPTED,
            answeredAt: now,
        },
        include: defaultCallInclude,
    });

    // 6. Emit call:accepted to caller and call room
    const callRoom = getCallRoom(callId);
    try {
        const io = getSocketIO();
        const acceptPayload = {
            callId: updatedCall.id,
            calleeId: user.userId,
            appointmentId: updatedCall.appointmentId,
            answeredAt: now.toISOString(),
        };

        io.to(callRoom).to(getUserRoom(call.callerId)).emit(SOCKET_EVENTS.CALL_ACCEPTED, acceptPayload);
    } catch {
        // Socket emission failure fallback
    }

    return updatedCall;
};

const rejectCall = async (callId: string, user: IRequestUser, reason?: string) => {
    const call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    if (!call) {
        throw new AppError(status.NOT_FOUND, "Call session not found");
    }

    if (call.receiverId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden: Only the call receiver can reject the call");
    }

    if (call.status !== CallStatus.RINGING) {
        throw new AppError(status.BAD_REQUEST, `Cannot reject call in ${call.status} status`);
    }

    clearMissedCallTimer(callId);
    clearUserFromCall(call.callerId);
    clearUserFromCall(call.receiverId);

    const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
            status: CallStatus.REJECTED,
            endedAt: new Date(),
            endReason: reason || "Call rejected by receiver",
        },
        include: defaultCallInclude,
    });

    const rejectPayload = {
        callId: updatedCall.id,
        calleeId: user.userId,
        appointmentId: updatedCall.appointmentId,
        reason: updatedCall.endReason,
    };

    try {
        const io = getSocketIO();
        const callRoom = getCallRoom(callId);
        io.to(callRoom).to(getUserRoom(call.callerId)).emit(SOCKET_EVENTS.CALL_REJECTED, rejectPayload);
    } catch {
        // Safe fallback
    }

    return updatedCall;
};

const cancelCall = async (callId: string, user: IRequestUser, reason?: string) => {
    const call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    if (!call) {
        throw new AppError(status.NOT_FOUND, "Call session not found");
    }

    if (call.callerId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden: Only the caller can cancel a ringing call");
    }

    if (call.status !== CallStatus.RINGING) {
        throw new AppError(status.BAD_REQUEST, `Cannot cancel call in ${call.status} status`);
    }

    clearMissedCallTimer(callId);
    clearUserFromCall(call.callerId);
    clearUserFromCall(call.receiverId);

    const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
            status: CallStatus.CANCELED,
            endedAt: new Date(),
            endReason: reason || "Call canceled by caller",
        },
        include: defaultCallInclude,
    });

    const cancelPayload = {
        callId: updatedCall.id,
        callerId: user.userId,
        appointmentId: updatedCall.appointmentId,
        reason: updatedCall.endReason,
    };

    try {
        const io = getSocketIO();
        const callRoom = getCallRoom(callId);
        io.to(callRoom).to(getUserRoom(call.receiverId)).emit(SOCKET_EVENTS.CALL_CANCELED, cancelPayload);
    } catch {
        // Safe fallback
    }

    return updatedCall;
};

const endCall = async (callId: string, user: IRequestUser, reason?: string) => {
    const call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    if (!call) {
        throw new AppError(status.NOT_FOUND, "Call session not found");
    }

    if (call.callerId !== user.userId && call.receiverId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden: You are not a participant of this call");
    }

    // If already ended, return as-is
    if (([CallStatus.ENDED, CallStatus.REJECTED, CallStatus.MISSED, CallStatus.CANCELED, CallStatus.FAILED] as CallStatus[]).includes(call.status)) {
        return call;
    }

    clearMissedCallTimer(callId);
    clearUserFromCall(call.callerId);
    clearUserFromCall(call.receiverId);

    const now = new Date();
    let duration = 0;

    if (call.answeredAt) {
        duration = Math.max(0, Math.round((now.getTime() - call.answeredAt.getTime()) / 1000));
    }

    const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
            status: CallStatus.ENDED,
            endedAt: now,
            duration,
            endReason: reason || "Call ended normally",
        },
        include: defaultCallInclude,
    });

    const endPayload = {
        callId: updatedCall.id,
        senderId: user.userId,
        appointmentId: updatedCall.appointmentId,
        duration,
        reason: updatedCall.endReason,
    };

    try {
        const io = getSocketIO();
        const callRoom = getCallRoom(callId);
        io.to(callRoom).to(getUserRoom(call.callerId)).to(getUserRoom(call.receiverId)).emit(SOCKET_EVENTS.CALL_ENDED, endPayload);
    } catch {
        // Safe fallback
    }

    return updatedCall;
};

const handleMissedCallTimeout = async (callId: string) => {
    const call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    if (!call || call.status !== CallStatus.RINGING) {
        return;
    }

    clearMissedCallTimer(callId);
    clearUserFromCall(call.callerId);
    clearUserFromCall(call.receiverId);

    const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
            status: CallStatus.MISSED,
            endedAt: new Date(),
            endReason: "No answer (ringing timeout)",
        },
        include: defaultCallInclude,
    });

    // Create missed call notification for receiver
    const callerName = call.caller.role === Role.DOCTOR && call.caller.doctor
        ? `Dr. ${call.caller.doctor.name}`
        : (call.caller.patient?.name || call.caller.name);

    try {
        await NotificationService.createNotification({
            recipientId: call.receiverId,
            type: NotificationType.CALL_MISSED,
            title: `Missed ${call.type.toLowerCase()} call`,
            message: `You missed a ${call.type.toLowerCase()} call from ${callerName}.`,
            data: {
                callId: call.id,
                appointmentId: call.appointmentId || undefined,
                callerId: call.callerId,
                callType: call.type,
            },
        });
    } catch {
        // Fallback
    }

    const missedPayload = {
        callId: updatedCall.id,
        callerId: call.callerId,
        receiverId: call.receiverId,
        appointmentId: call.appointmentId,
        reason: "Missed call timeout",
    };

    try {
        emitToUser(call.callerId, SOCKET_EVENTS.CALL_MISSED, missedPayload);
        emitToUser(call.receiverId, SOCKET_EVENTS.CALL_MISSED, missedPayload);
    } catch {
        // Fallback
    }
};

const getPendingIncomingCall = async (receiverId: string) => {
    const call = await prisma.call.findFirst({
        where: {
            receiverId,
            status: CallStatus.RINGING,
            isDeleted: false,
        },
        orderBy: { createdAt: "desc" },
        include: defaultCallInclude,
    });

    if (!call) return null;

    const ageMs = Date.now() - call.createdAt.getTime();
    const remainingMs = RINGING_TIMEOUT_MS - ageMs;
    if (remainingMs <= 0) {
        await handleMissedCallTimeout(call.id);
        return null;
    }

    setUserInCall(call.callerId, call.id);
    setUserInCall(call.receiverId, call.id);

    // Recreate the timeout after a server restart, but never duplicate it.
    if (!callMissedTimers.has(call.id)) {
        const timer = setTimeout(() => {
            handleMissedCallTimeout(call.id).catch((error: unknown) => {
                const msg = error instanceof Error ? error.message : "Unknown error";
                logger.error(`[CallService] Failed to expire resumed call ${call.id}: ${msg}`);
            });
        }, remainingMs);
        callMissedTimers.set(call.id, timer);
    }

    return call;
};

const getMyCallHistory = async (user: IRequestUser, query: ICallFilterQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.CallWhereInput = {
        isDeleted: false,
        OR: [
            { callerId: user.userId },
            { receiverId: user.userId },
        ],
    };

    if (query.type) {
        whereCondition.type = query.type;
    }

    if (query.status) {
        whereCondition.status = query.status;
    }

    if (query.appointmentId) {
        whereCondition.appointmentId = query.appointmentId;
    }

    if (query.startDate || query.endDate) {
        whereCondition.createdAt = {};
        if (query.startDate) {
            whereCondition.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
            whereCondition.createdAt.lte = new Date(query.endDate);
        }
    }

    const [total, calls] = await Promise.all([
        prisma.call.count({ where: whereCondition }),
        prisma.call.findMany({
            where: whereCondition,
            orderBy: { createdAt: query.sortOrder === "asc" ? "asc" : "desc" },
            skip,
            take: limit,
            include: defaultCallInclude,
        }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: calls,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};

const getCallById = async (callId: string, user: IRequestUser) => {
    let call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
        include: defaultCallInclude,
    });

    // Resilient fallback: If not found directly by call.id, check if callId is an appointment videoCallingId or appointment.id
    if (!call) {
        const appointment = await prisma.appointment.findFirst({
            where: {
                OR: [
                    { videoCallingId: callId },
                    { id: callId },
                ],
            },
        });

        if (appointment) {
            call = await prisma.call.findFirst({
                where: {
                    appointmentId: appointment.id,
                    isDeleted: false,
                },
                orderBy: { createdAt: "desc" },
                include: defaultCallInclude,
            });
        }
    }

    if (!call) {
        throw new AppError(status.NOT_FOUND, "Call record not found");
    }

    // IDOR verification: must be caller, receiver, or admin
    if (call.callerId !== user.userId && call.receiverId !== user.userId && user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Forbidden: You are not authorized to view this call");
    }

    return call;
};

const verifyCallParticipant = async (callId: string, userId: string) => {
    let call = await prisma.call.findFirst({
        where: { id: callId, isDeleted: false },
    });

    if (!call) {
        const appointment = await prisma.appointment.findFirst({
            where: {
                OR: [
                    { videoCallingId: callId },
                    { id: callId },
                ],
            },
        });

        if (appointment) {
            call = await prisma.call.findFirst({
                where: {
                    appointmentId: appointment.id,
                    isDeleted: false,
                },
                orderBy: { createdAt: "desc" },
            });
        }
    }

    if (!call) return null;
    if (call.callerId !== userId && call.receiverId !== userId) return null;

    return call;
};

const getIceServers = async (user: IRequestUser) => {
    const envTurnHost = process.env.WEBRTC_TURN_HOST;
    const envTurnUser = process.env.WEBRTC_TURN_USERNAME;
    const envTurnCred = process.env.WEBRTC_TURN_CREDENTIAL;
    const envSharedSecret = process.env.WEBRTC_TURN_SHARED_SECRET;
    const meteredApiKey = process.env.METERED_API_KEY || "7e63da8fb027b43de4d0815825254a80dde1";
    const meteredDomain = process.env.METERED_DOMAIN || "doctorly.metered.live";

    // 1. Dynamic Metered API TURN credentials
    if (meteredApiKey && meteredDomain) {
        try {
            const domainHost = meteredDomain.includes(".") ? meteredDomain : `${meteredDomain}.metered.live`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`https://${domainHost}/api/v1/turn/credentials?apiKey=${meteredApiKey}`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
                const meteredIceServers = await res.json();
                if (Array.isArray(meteredIceServers) && meteredIceServers.length > 0) {
                    return {
                        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
                        iceServers: meteredIceServers,
                    };
                }
            }
        } catch (meteredErr: unknown) {
            const msg = meteredErr instanceof Error ? meteredErr.message : String(meteredErr);
            console.warn("[WEBRTC][TURN] Dynamic Metered fetch failed, using fallback:", msg);
        }
    }

    // 2. Custom TURN Host if provided and not the deprecated staticauth host
    if (envTurnHost && envTurnHost !== "staticauth.openrelay.metered.ca") {
        if (envTurnUser && envTurnCred) {
            return {
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            `stun:${envTurnHost}:80`,
                        ],
                    },
                    {
                        urls: [
                            `turn:${envTurnHost}:80?transport=udp`,
                            `turn:${envTurnHost}:80?transport=tcp`,
                            `turn:${envTurnHost}:443?transport=udp`,
                            `turn:${envTurnHost}:443?transport=tcp`,
                            `turns:${envTurnHost}:443?transport=tcp`,
                        ],
                        username: envTurnUser,
                        credential: envTurnCred,
                    },
                ],
            };
        } else if (envSharedSecret) {
            const expiresAt = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
            const username = `${expiresAt}:doctorly-${user.userId.slice(0, 12)}`;
            const credential = createHmac("sha1", envSharedSecret).update(username).digest("base64");
            return {
                expiresAt: new Date(expiresAt * 1000).toISOString(),
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            `stun:${envTurnHost}:80`,
                        ],
                    },
                    {
                        urls: [
                            `turn:${envTurnHost}:80?transport=udp`,
                            `turn:${envTurnHost}:80?transport=tcp`,
                            `turn:${envTurnHost}:443?transport=udp`,
                            `turn:${envTurnHost}:443?transport=tcp`,
                            `turns:${envTurnHost}:443?transport=tcp`,
                        ],
                        username,
                        credential,
                    },
                ],
            };
        }
    }

    // 3. High-Availability Metered Global TURN Relay fallback (doctorly account)
    return {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun.relay.metered.ca:80",
                ],
            },
            {
                urls: [
                    "turn:global.relay.metered.ca:80",
                    "turn:global.relay.metered.ca:80?transport=tcp",
                    "turn:global.relay.metered.ca:443",
                    "turns:global.relay.metered.ca:443?transport=tcp",
                ],
                username: "acb1a39f68319df913415b35",
                credential: "fau3ppTnse3ATxoh",
            },
        ],
    };
};

export const CallService = {
    initiateCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    handleMissedCallTimeout,
    getMyCallHistory,
    getCallById,
    verifyCallParticipant,
    getPendingIncomingCall,
    clearUserFromCall,
    getIceServers,
};
