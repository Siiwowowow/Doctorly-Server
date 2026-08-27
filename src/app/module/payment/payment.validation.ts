import z from "zod";

export const createCheckoutSessionZodSchema = z.object({
    appointmentId: z.string().uuid("Appointment ID must be a valid UUID"),
});

export const PaymentValidation = {
    createCheckoutSessionZodSchema,
};
