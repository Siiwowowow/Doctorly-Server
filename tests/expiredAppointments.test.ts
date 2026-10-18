import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "../src/generated/prisma/client";
import { deleteExpiredAppointments } from "../src/app/utils/expiredAppointments";

type Row = Record<string, any>;

// Small relational fixture evaluator: exercise the actual deletion predicates
// against paid, unpaid, ongoing, and future data without connecting to production.
const matches = (row: Row | null, where: Row): boolean => Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some((part: Row) => matches(row, part));
    const actual = row?.[key];
    if (value === null) return actual == null;
    if (typeof value !== "object") return actual === value;
    if ("lte" in value) return actual <= value.lte;
    if ("none" in value) return !actual.some((item: Row) => matches(item, value.none));
    return actual != null && matches(actual, value);
});

const setup = () => {
    const now = new Date("2026-10-18T10:00:00Z");
    const schedule = (id: string, end: string) => ({ id, endDateTime: new Date(end) });
    const expired = schedule("expired", "2026-10-18T09:59:59Z");
    const boundary = schedule("boundary", now.toISOString());
    const ongoing = schedule("ongoing", "2026-10-18T10:01:00Z");
    const future = schedule("future", "2026-10-19T10:00:00Z");
    const unused = schedule("unused", "2026-10-17T10:00:00Z");
    const appointments: Row[] = [
        { id: "expired-unpaid", schedule: expired, paymentStatus: "UNPAID" },
        { id: "boundary-unpaid", schedule: boundary, paymentStatus: "UNPAID" },
        { id: "paid", schedule: expired, paymentStatus: "PAID" },
        { id: "paid-payment", schedule: expired, paymentStatus: "UNPAID" },
        { id: "ongoing", schedule: ongoing, paymentStatus: "UNPAID" },
        { id: "future", schedule: future, paymentStatus: "UNPAID" },
    ];
    const payments = appointments.filter(a => a.id !== "boundary-unpaid").map(a => {
        const payment = { appointment: a, status: a.id.startsWith("paid") ? "PAID" : "UNPAID" };
        a.payment = payment;
        return payment;
    });
    const state: Record<string, Row[]> = {
        appointment: appointments,
        payment: payments,
        schedule: [expired, boundary, ongoing, future, unused],
        doctorSchedules: [expired, boundary, ongoing, future, unused].flatMap(s => [
            { doctorId: "doctor-1", schedule: s }, { doctorId: "doctor-2", schedule: s },
        ]),
    };
    const order: string[] = [];
    const tx = Object.fromEntries(Object.keys(state).map(model => [model, {
        deleteMany: async ({ where }: Row) => {
            order.push(model);
            if (model === "schedule") state.schedule.forEach(s => {
                s.appointments = state.appointment.filter(a => a.schedule === s);
            });
            const removed = state[model].filter(row => matches(row, where));
            state[model] = state[model].filter(row => !removed.includes(row));
            if (model === "payment") removed.forEach(p => { p.appointment.payment = null; });
            return { count: removed.length };
        },
    }]));
    const db = { $transaction: async (callback: (value: unknown) => unknown) => callback(tx) } as unknown as Pick<PrismaClient, "$transaction">;
    return { now, state, order, db };
};

test("deletes expired unpaid bookings, including the exact end boundary, and preserves paid history", async () => {
    const { now, state, order, db } = setup();
    const result = await deleteExpiredAppointments(db, now);
    assert.deepEqual(result, { appointments: 2, schedules: 2 });
    assert.deepEqual(state.appointment.map(a => a.id), ["paid", "paid-payment", "ongoing", "future"]);
    assert.equal(state.payment.filter(p => p.status === "PAID").length, 2);
    assert.deepEqual(order, ["payment", "appointment", "doctorSchedules", "schedule"]);
});

test("removes expired availability for all doctors and retains schedules needed by paid history", async () => {
    const { now, state, db } = setup();
    await deleteExpiredAppointments(db, now);
    assert.deepEqual(state.doctorSchedules.map(s => s.schedule.id), ["ongoing", "ongoing", "future", "future"]);
    assert.deepEqual(state.schedule.map(s => s.id), ["expired", "ongoing", "future"]);
    assert.deepEqual(await deleteExpiredAppointments(db, now), { appointments: 0, schedules: 0 });
});
