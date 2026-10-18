import { prisma } from "../lib/prisma";
import { deleteExpiredAppointments } from "./expiredAppointments";

let pendingCleanup: ReturnType<typeof deleteExpiredAppointments> | undefined;

// Concurrent requests in this process share the same transaction. Reads also
// run cleanup, so deployments that sleep do not depend on a cron tick.
export const cleanupExpiredAppointments = async () => {
    pendingCleanup ??= deleteExpiredAppointments(prisma).finally(() => {
        pendingCleanup = undefined;
    });
    return pendingCleanup;
};
