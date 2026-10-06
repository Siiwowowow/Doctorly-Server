import z from "zod";

const createServiceZodSchema = z.object({
    title: z.string().min(2).max(120),
    slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(10),
    icon: z.string().max(60).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
});

const updateServiceZodSchema = createServiceZodSchema.partial();

export const ServiceValidation = {
    createServiceZodSchema,
    updateServiceZodSchema,
};
