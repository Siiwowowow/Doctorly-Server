import { CallStatus, CallType } from "../../../generated/prisma/enums";

export interface IInitiateCallPayload {
    receiverId?: string;
    appointmentId?: string;
    type?: CallType;
}

export interface ICallActionPayload {
    reason?: string;
}

export interface ICallFilterQuery {
    page?: string;
    limit?: string;
    type?: CallType;
    status?: CallStatus;
    appointmentId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ISdpOfferPayload {
    callId: string;
    offer: RTCSessionDescriptionInit | Record<string, unknown>;
}

export interface ISdpAnswerPayload {
    callId: string;
    answer: RTCSessionDescriptionInit | Record<string, unknown>;
}

export interface IIceCandidatePayload {
    callId: string;
    candidate: RTCIceCandidateInit | Record<string, unknown>;
}
