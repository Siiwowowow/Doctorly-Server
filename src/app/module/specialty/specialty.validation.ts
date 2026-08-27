import z from "zod";

const createSpecialtyZodSchema = z.object({
    title: z.string({ message: "Title is required" }).min(2, "Title must be at least 2 characters").max(100, "Title must be at most 100 characters"),
    description: z.string().max(500, "Description must be at most 500 characters").optional(),
});

export const SpecialtyValidation = {
    createSpecialtyZodSchema,
};