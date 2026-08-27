import { envVars } from "../config/env";

export const logger = {
    info: (message: string, ...args: unknown[]) => {
        if (envVars.NODE_ENV !== "test") {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: unknown[]) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
        if (envVars.NODE_ENV === "development") {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
};
