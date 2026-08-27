import status from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
    AppointmentStatus,
    MessageStatus,
    MessageType,
    NotificationType,
    Role,
    UserStatus,
} from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { emitToUser, getSocketIO } from "../../socket/socket.server";
import { SOCKET_EVENTS } from "../../socket/socket.events";
import { getConversationRoom } from "../../socket/socket.rooms";
import { NotificationService } from "../notification/notification.service";
import {
    defaultConversationInclude,
    defaultMessageInclude,
} from "./chat.constant";
import {
    IChatPaginationQuery,
    ICreateConversationPayload,
    IMessageAttachmentInput,
    ISendMessagePayload,
} from "./chat.interface";

// Rate limiting map for chat messages: userId -> timestamps[]
const rateLimitMap: Map<string, number[]> = new Map();
const MAX_MESSAGES_PER_WINDOW = 30; // 30 messages
const WINDOW_DURATION_MS = 60 * 1000; // per 1 minute

const checkRateLimit = (userId: string): void => {
    const now = Date.now();
    const timestamps = rateLimitMap.get(userId) || [];
    const recentTimestamps = timestamps.filter((t) => now - t < WINDOW_DURATION_MS);

    if (recentTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
        throw new AppError(status.TOO_MANY_REQUESTS, "Rate limit exceeded. You are sending messages too quickly.");
    }

    recentTimestamps.push(now);
    rateLimitMap.set(userId, recentTimestamps);
};

const getOrCreateConversation = async (user: IRequestUser, payload: ICreateConversationPayload) => {
    let patientId: string;
    let doctorId: string;
    let patientUserId: string;
    let doctorUserId: string;

    if (user.role === Role.PATIENT) {
        // 1. Resolve Patient
        const patient = await prisma.patient.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
            include: { user: true },
        });

        if (!patient) {
            throw new AppError(status.NOT_FOUND, "Patient profile not found");
        }

        if (patient.user.status === UserStatus.BLOCKED || patient.user.isDeleted) {
            throw new AppError(status.FORBIDDEN, "Your patient account is inactive");
        }

        if (!payload.doctorId) {
            throw new AppError(status.BAD_REQUEST, "Doctor ID is required to start a conversation");
        }

        // 2. Resolve Doctor
        const doctor = await prisma.doctor.findFirst({
            where: {
                id: payload.doctorId,
                isDeleted: false,
            },
            include: { user: true },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor not found or is inactive");
        }

        patientId = patient.id;
        doctorId = doctor.id;
        patientUserId = patient.userId;
        doctorUserId = doctor.userId;

        // 3. Verify healthcare treatment relationship
        const hasTreatmentRelationship = await prisma.appointment.findFirst({
            where: {
                patientId: patient.id,
                doctorId: doctor.id,
                status: {
                    in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                },
            },
        });

        if (!hasTreatmentRelationship) {
            throw new AppError(
                status.FORBIDDEN,
                "Forbidden: You can only start a conversation with a doctor you have an appointment with"
            );
        }
    } else if (user.role === Role.DOCTOR) {
        // 1. Resolve Doctor
        const doctor = await prisma.doctor.findFirst({
            where: {
                userId: user.userId,
                isDeleted: false,
            },
            include: { user: true },
        });

        if (!doctor) {
            throw new AppError(status.NOT_FOUND, "Doctor profile not found");
        }

        if (doctor.user.status === UserStatus.BLOCKED || doctor.user.isDeleted) {
            throw new AppError(status.FORBIDDEN, "Your doctor account is inactive");
        }

        if (!payload.patientId) {
            throw new AppError(status.BAD_REQUEST, "Patient ID is required to start a conversation");
        }

        // 2. Resolve Patient
        const patient = await prisma.patient.findFirst({
            where: {
                id: payload.patientId,
                isDeleted: false,
            },
            include: { user: true },
        });

        if (!patient) {
            throw new AppError(status.NOT_FOUND, "Patient not found or is inactive");
        }

        patientId = patient.id;
        doctorId = doctor.id;
        patientUserId = patient.userId;
        doctorUserId = doctor.userId;

        // 3. Verify healthcare treatment relationship
        const hasTreatmentRelationship = await prisma.appointment.findFirst({
            where: {
                patientId: patient.id,
                doctorId: doctor.id,
                status: {
                    in: [AppointmentStatus.SCHEDULED, AppointmentStatus.INPROGRESS, AppointmentStatus.COMPLETED],
                },
            },
        });

        if (!hasTreatmentRelationship) {
            throw new AppError(
                status.FORBIDDEN,
                "Forbidden: You can only start a conversation with a patient you have a treatment relationship with"
            );
        }
    } else {
        throw new AppError(status.FORBIDDEN, "Only patients and doctors can participate in conversations");
    }

    // 4. Check if conversation already exists (DB unique on [patientId, doctorId])
    const existingConversation = await prisma.conversation.findUnique({
        where: {
            patientId_doctorId: {
                patientId,
                doctorId,
            },
        },
        include: defaultConversationInclude,
    });

    if (existingConversation) {
        if (existingConversation.isDeleted) {
            const restored = await prisma.conversation.update({
                where: { id: existingConversation.id },
                data: { isDeleted: false, deletedAt: null },
                include: defaultConversationInclude,
            });
            return restored;
        }
        return existingConversation;
    }

    // 5. Atomically create conversation + participants
    const conversation = await prisma.$transaction(async (tx) => {
        const newConv = await tx.conversation.create({
            data: {
                patientId,
                doctorId,
                participants: {
                    create: [
                        { userId: patientUserId },
                        { userId: doctorUserId },
                    ],
                },
            },
            include: defaultConversationInclude,
        });

        return newConv;
    });

    return conversation;
};

const getMyConversations = async (user: IRequestUser) => {
    // Find all conversations where authenticated user is a participant
    const conversations = await prisma.conversation.findMany({
        where: {
            isDeleted: false,
            participants: {
                some: {
                    userId: user.userId,
                },
            },
        },
        include: {
            ...defaultConversationInclude,
            messages: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                take: 1,
                include: defaultMessageInclude,
            },
        },
        orderBy: [
            { lastMessageAt: "desc" },
            { updatedAt: "desc" },
        ],
    });

    // Compute dynamic unread count for each conversation
    const result = await Promise.all(
        conversations.map(async (conv) => {
            const participant = conv.participants.find((p) => p.userId === user.userId);
            const lastReadAt = participant?.lastReadAt || new Date(0);

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: user.userId },
                    createdAt: { gt: lastReadAt },
                    isDeleted: false,
                },
            });

            const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;

            return {
                id: conv.id,
                patient: conv.patient,
                doctor: conv.doctor,
                lastMessage,
                unreadCount,
                lastReadAt: participant?.lastReadAt || null,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
                lastMessageAt: conv.lastMessageAt,
            };
        })
    );

    return result;
};

const getConversationById = async (conversationId: string, user: IRequestUser) => {
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            isDeleted: false,
            participants: {
                some: {
                    userId: user.userId,
                },
            },
        },
        include: defaultConversationInclude,
    });

    if (!conversation) {
        throw new AppError(status.NOT_FOUND, "Conversation not found or access denied");
    }

    return conversation;
};

const getConversationMessages = async (
    conversationId: string,
    user: IRequestUser,
    query: IChatPaginationQuery
) => {
    // 1. Verify participant access
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            isDeleted: false,
            participants: {
                some: {
                    userId: user.userId,
                },
            },
        },
    });

    if (!conversation) {
        throw new AppError(status.NOT_FOUND, "Conversation not found or access denied");
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.MessageWhereInput = {
        conversationId,
        isDeleted: false,
    };

    if (query.messageType) {
        whereCondition.messageType = query.messageType;
    }

    if (query.searchTerm) {
        whereCondition.content = {
            contains: query.searchTerm,
            mode: "insensitive",
        };
    }

    const [total, messages] = await Promise.all([
        prisma.message.count({ where: whereCondition }),
        prisma.message.findMany({
            where: whereCondition,
            orderBy: { createdAt: query.sortOrder === "asc" ? "asc" : "desc" },
            skip,
            take: limit,
            include: defaultMessageInclude,
        }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: messages,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};

const sendMessage = async (
    conversationId: string,
    user: IRequestUser,
    payload: ISendMessagePayload,
    uploadedFile?: Express.Multer.File
) => {
    // 1. Rate limiting check
    checkRateLimit(user.userId);

    // 2. Verify conversation existence & participant authorization
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            isDeleted: false,
            participants: {
                some: {
                    userId: user.userId,
                },
            },
        },
        include: {
            participants: {
                include: {
                    user: true,
                },
            },
            doctor: true,
            patient: true,
        },
    });

    if (!conversation) {
        throw new AppError(status.NOT_FOUND, "Conversation not found or access denied");
    }

    // 3. Find other participant
    const otherParticipant = conversation.participants.find((p) => p.userId !== user.userId);
    if (!otherParticipant) {
        throw new AppError(status.BAD_REQUEST, "Conversation has no active recipient");
    }

    // 4. Construct attachments if provided via upload or payload
    const attachmentsToCreate: IMessageAttachmentInput[] = [];

    if (uploadedFile) {
        const isPdf = uploadedFile.mimetype === "application/pdf";
        const isImage = uploadedFile.mimetype.startsWith("image/");

        attachmentsToCreate.push({
            fileName: uploadedFile.originalname,
            fileUrl: uploadedFile.path, // Cloudinary secure URL
            fileType: uploadedFile.mimetype,
            fileSize: uploadedFile.size,
            publicId: uploadedFile.filename,
        });

        if (!payload.messageType) {
            payload.messageType = isImage ? MessageType.IMAGE : isPdf ? MessageType.DOCUMENT : MessageType.DOCUMENT;
        }
    }

    if (payload.attachments && payload.attachments.length > 0) {
        attachmentsToCreate.push(...payload.attachments);
    }

    const messageType = payload.messageType || MessageType.TEXT;

    // 5. Execute creation within atomic transaction
    const message = await prisma.$transaction(async (tx) => {
        const newMessage = await tx.message.create({
            data: {
                conversationId,
                senderId: user.userId,
                content: payload.content,
                messageType,
                status: MessageStatus.SENT,
                attachments: {
                    create: attachmentsToCreate.map((att) => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileType: att.fileType,
                        fileSize: att.fileSize,
                        publicId: att.publicId,
                    })),
                },
            },
            include: defaultMessageInclude,
        });

        // Update conversation lastMessageAt timestamp
        await tx.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });

        // Create Chat Notification for the recipient inside transaction
        const senderName = user.role === Role.DOCTOR ? `Dr. ${conversation.doctor.name}` : conversation.patient.name;

        await NotificationService.createNotification(
            {
                recipientId: otherParticipant.userId,
                type: NotificationType.CHAT_MESSAGE,
                title: `New message from ${senderName}`,
                message: messageType === MessageType.TEXT
                    ? (payload.content.length > 80 ? `${payload.content.substring(0, 80)}...` : payload.content)
                    : `Sent you an attachment (${messageType.toLowerCase()})`,
                data: {
                    conversationId,
                    messageId: newMessage.id,
                    senderId: user.userId,
                },
            },
            tx
        );

        return newMessage;
    });

    // 6. Broadcast Real-Time Events via Socket.IO
    try {
        const io = getSocketIO();
        const convRoom = getConversationRoom(conversationId);

        // Emit to conversation room (for users currently viewing the chat)
        io.to(convRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
            senderId: user.userId,
            content: message.content,
            conversationId,
            tempId: payload.tempId,
            timestamp: message.createdAt.toISOString(),
        });

        // Also emit directly to recipient's private user room
        emitToUser(otherParticipant.userId, SOCKET_EVENTS.CHAT_MESSAGE, {
            senderId: user.userId,
            content: message.content,
            conversationId,
            tempId: payload.tempId,
            timestamp: message.createdAt.toISOString(),
        });
    } catch {
        // Socket.IO emission failures should not break the HTTP response
    }

    return message;
};

const markConversationAsRead = async (conversationId: string, user: IRequestUser) => {
    // 1. Verify participant access
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            isDeleted: false,
            participants: {
                some: {
                    userId: user.userId,
                },
            },
        },
        include: {
            participants: true,
        },
    });

    if (!conversation) {
        throw new AppError(status.NOT_FOUND, "Conversation not found or access denied");
    }

    const now = new Date();

    // 2. Update participant lastReadAt timestamp
    await prisma.conversationParticipant.update({
        where: {
            conversationId_userId: {
                conversationId,
                userId: user.userId,
            },
        },
        data: {
            lastReadAt: now,
        },
    });

    // 3. Mark unread messages sent by others in this conversation as READ
    const updateResult = await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: user.userId },
            status: { not: MessageStatus.READ },
            isDeleted: false,
        },
        data: {
            status: MessageStatus.READ,
        },
    });

    // 4. Emit read receipt via Socket.IO
    try {
        const convRoom = getConversationRoom(conversationId);
        const io = getSocketIO();
        io.to(convRoom).emit(SOCKET_EVENTS.CHAT_READ, {
            conversationId,
            readerId: user.userId,
            readAt: now.toISOString(),
        });
    } catch {
        // Safe fallback if Socket.IO is not initialized
    }

    return {
        markedCount: updateResult.count,
        readAt: now,
    };
};

const deleteMessage = async (messageId: string, user: IRequestUser) => {
    // 1. Verify message exists and was sent by authenticated user
    const message = await prisma.message.findFirst({
        where: {
            id: messageId,
            isDeleted: false,
        },
    });

    if (!message) {
        throw new AppError(status.NOT_FOUND, "Message not found");
    }

    if (message.senderId !== user.userId) {
        throw new AppError(status.FORBIDDEN, "Forbidden: You can only delete messages sent by yourself");
    }

    // 2. Soft-delete
    const deleted = await prisma.message.update({
        where: { id: messageId },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
        },
        include: defaultMessageInclude,
    });

    return deleted;
};

const getUnreadChatCount = async (user: IRequestUser): Promise<{ unreadCount: number }> => {
    // Find all active conversations the user is in
    const participants = await prisma.conversationParticipant.findMany({
        where: {
            userId: user.userId,
            conversation: {
                isDeleted: false,
            },
        },
    });

    if (participants.length === 0) {
        return { unreadCount: 0 };
    }

    // Count unread messages across all conversations
    const unreadCounts = await Promise.all(
        participants.map((p) =>
            prisma.message.count({
                where: {
                    conversationId: p.conversationId,
                    senderId: { not: user.userId },
                    createdAt: { gt: p.lastReadAt || new Date(0) },
                    isDeleted: false,
                },
            })
        )
    );

    const totalUnread = unreadCounts.reduce((sum, count) => sum + count, 0);

    return { unreadCount: totalUnread };
};

export const ChatService = {
    getOrCreateConversation,
    getMyConversations,
    getConversationById,
    getConversationMessages,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    getUnreadChatCount,
};
