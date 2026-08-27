import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.body && req.body.data && typeof req.body.data === "string") {
            try {
                req.body = JSON.parse(req.body.data);
            } catch {
                // If parsing fails, proceed with raw body
            }
        }

        const parsedResult = zodSchema.safeParse(req.body);

        if (!parsedResult.success) {
            return next(parsedResult.error);
        }

        // Sanitizing the data
        req.body = parsedResult.data;

        next();
    };
};

