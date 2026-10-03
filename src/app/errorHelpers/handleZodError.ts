import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const handleZodError = (err: z.ZodError): TErrorResponse => {
    const statusCode = status.BAD_REQUEST;
    const errorSources: TErrorSources[] = [];

    err.issues.forEach(issue => {
        errorSources.push({
            path: issue.path.join(" => "),
            message: issue.message
        });
    });

    const detailedMessage = errorSources.map(e => e.message).filter(Boolean).join(". ");
    const message = detailedMessage || "Zod Validation Error";

    return {
        success: false,
        message,
        errorSources,
        statusCode,
    };
};