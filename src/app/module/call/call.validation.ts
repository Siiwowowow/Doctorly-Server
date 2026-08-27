import z from "zod";
import { CallType } from "../../../generated/prisma/enums";

export const initiateCallZodSchema = z.object({
    receiverId: z.string().min(1, "Receiver ID must not be empty").optional(),
    appointmentId: z.string().min(1, "Appointment ID must not be empty").optional(),
    type: z.nativeEnum(CallType).optional().default(CallType.VIDEO),
}).refine((data) => data.receiverId || data.appointmentId, {
    message: "Either receiverId or appointmentId must be provided to initiate a call",
});

export const callActionZodSchema = z.object({
    reason: z.string().max(500, "Reason cannot exceed 500 characters").optional(),
});

export const sdpOfferZodSchema = z.object({
    callId: z.string().min(1, "Call ID is required"),
    offer: z.object({
        type: z.string().min(1, "SDP type is required"),
        sdp: z.string().min(1, "SDP payload is required"),
    }),
});

export const sdpAnswerZodSchema = z.object({
    callId: z.string().min(1, "Call ID is required"),
    answer: z.object({
        type: z.string().min(1, "SDP type is required"),
        sdp: z.string().min(1, "SDP payload is required"),
    }),
});

export const iceCandidateZodSchema = z.object({
    callId: z.string().min(1, "Call ID is required"),
    candidate: z.object({
        candidate: z.string().min(1, "Candidate string is required"),
        sdpMid: z.string().nullable().optional(),
        sdpMLineIndex: z.number().nullable().optional(),
    }),
});

export const CallValidation = {
    initiateCallZodSchema,
    callActionZodSchema,
    sdpOfferZodSchema,
    sdpAnswerZodSchema,
    iceCandidateZodSchema,
};
