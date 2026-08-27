import { MessageStatus, MessageType } from "../../../generated/prisma/enums";

export interface ICreateConversationPayload {
    doctorId?: string;
    patientId?: string;
}

export interface IMessageAttachmentInput {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    publicId?: string;
}

export interface ISendMessagePayload {
    content: string;
    messageType?: MessageType;
    tempId?: string;
    attachments?: IMessageAttachmentInput[];
}

export interface IChatPaginationQuery {
    page?: string;
    limit?: string;
    searchTerm?: string;
    messageType?: MessageType;
    status?: MessageStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
