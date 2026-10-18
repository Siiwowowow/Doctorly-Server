import type { Prisma, PrismaClient } from "../../generated/prisma/client";

// Use the slot's end (including equality), so an ongoing appointment is retained.
// Paid appointments and their schedule/payment history must remain intact.
export const deleteExpiredAppointments = async (
    db: Pick<PrismaClient, "$transaction">,
    now = new Date(),
) => db.$transaction(async (tx) => {
    const expiredSchedule = { endDateTime: { lte: now } };
    const expiredUnpaid: Prisma.AppointmentWhereInput = {
        schedule: expiredSchedule,
        paymentStatus: "UNPAID",
        // Protect payment history even if the appointment status is inconsistent.
        OR: [{ payment: null }, { payment: { status: "UNPAID" } }],
    };
    await tx.payment.deleteMany({
        where: { status: "UNPAID", appointment: expiredUnpaid },
    });
    const appointments = await tx.appointment.deleteMany({
        where: expiredUnpaid,
    });
    await tx.doctorSchedules.deleteMany({
        where: { schedule: expiredSchedule },
    });
    // Expired availability is removed for every doctor. Keep the backing
    // schedule when a paid appointment still references it for history.
    const schedules = await tx.schedule.deleteMany({
        where: { ...expiredSchedule, appointments: { none: {} } },
    });
    return { appointments: appointments.count, schedules: schedules.count };
}, { maxWait: 10_000, timeout: 30_000 });
