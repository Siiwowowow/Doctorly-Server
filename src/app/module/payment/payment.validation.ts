import z from "zod";

export const createCheckoutSessionZodSchema = z.object({
    appointmentId: z.string().min(1, "Appointment ID is required"),
});

export const PaymentValidation = {
    createCheckoutSessionZodSchema,
};
