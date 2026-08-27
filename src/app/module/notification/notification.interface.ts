import { NotificationType } from "../../../generated/prisma/enums";

export interface INotificationMetadata {
    appointmentId?: string;
    paymentId?: string;
    doctorId?: string;
    patientId?: string;
    prescriptionId?: string;
    medicalRecordId?: string;
    scheduleId?: string;
    callId?: string;
    chatId?: string;
    eventId?: string;
    source?: string;
    sourceId?: string;
    [key: string]: unknown;
}

export interface ICreateNotificationPayload {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: INotificationMetadata | null;
}

export interface ICreateManyNotificationsPayload {
    recipientIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    data?: INotificationMetadata | null;
}
