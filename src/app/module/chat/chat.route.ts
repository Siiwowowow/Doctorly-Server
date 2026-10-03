import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { chatFileUpload } from "../../config/multer.config";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ChatController } from "./chat.controller";
import { ChatValidation } from "./chat.validation";

const router = Router();

// 1. Create or get existing conversation
router.post(
    "/conversations",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(ChatValidation.createConversationZodSchema),
    ChatController.getOrCreateConversation
);

// 2. Get my conversations
router.get(
    "/conversations",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.getMyConversations
);

// 3. Get total unread chat count
router.get(
    "/unread-count",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.getUnreadChatCount
);

// 4. Get specific conversation details
router.get(
    "/conversations/:conversationId",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.getConversationById
);

// 5. Get paginated messages of a conversation
router.get(
    "/conversations/:conversationId/messages",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.getConversationMessages
);

// 6. Send a message (supports text and optional file upload attachment)
router.post(
    "/conversations/:conversationId/messages",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    chatFileUpload.single("file"),
    validateRequest(ChatValidation.sendMessageZodSchema),
    ChatController.sendMessage
);

// 7. Share a medical record in chat
router.post(
    "/conversations/:conversationId/share-medical-record",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    validateRequest(ChatValidation.shareMedicalRecordZodSchema),
    ChatController.shareMedicalRecord
);

// 8. Get shared clinical documents & medical records in conversation
router.get(
    "/conversations/:conversationId/documents",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.getConversationSharedDocuments
);

// 9. Mark conversation as read
router.patch(
    "/conversations/:conversationId/read",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.markConversationAsRead
);

// 10. Delete message (soft delete by sender)
router.delete(
    "/messages/:messageId",
    checkAuth(Role.PATIENT, Role.DOCTOR),
    ChatController.deleteMessage
);

export const ChatRoutes = router;
