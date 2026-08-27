import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ChatService } from "./chat.service";

const getOrCreateConversation = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await ChatService.getOrCreateConversation(user, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Conversation retrieved or created successfully",
        data: result,
    });
});

const getMyConversations = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await ChatService.getMyConversations(user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Conversations retrieved successfully",
        data: result,
    });
});

const getConversationById = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const conversationId = String(req.params.conversationId);
    const result = await ChatService.getConversationById(conversationId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Conversation details retrieved successfully",
        data: result,
    });
});

const getConversationMessages = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const conversationId = String(req.params.conversationId);
    const result = await ChatService.getConversationMessages(conversationId, user, req.query);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Messages retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const conversationId = String(req.params.conversationId);

    // Support payload from body or form-data body
    const bodyData = typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;

    const result = await ChatService.sendMessage(conversationId, user, bodyData, req.file);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        success: true,
        message: "Message sent successfully",
        data: result,
    });
});

const markConversationAsRead = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const conversationId = String(req.params.conversationId);
    const result = await ChatService.markConversationAsRead(conversationId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Conversation marked as read successfully",
        data: result,
    });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const messageId = String(req.params.messageId);
    const result = await ChatService.deleteMessage(messageId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Message deleted successfully",
        data: result,
    });
});

const getUnreadChatCount = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await ChatService.getUnreadChatCount(user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Unread message count retrieved successfully",
        data: result,
    });
});

export const ChatController = {
    getOrCreateConversation,
    getMyConversations,
    getConversationById,
    getConversationMessages,
    sendMessage,
    markConversationAsRead,
    deleteMessage,
    getUnreadChatCount,
};
