import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import type { NextFunction, Request, Response } from "express";

import { PaymentService } from "../src/app/module/payment/payment.service";
import { PaymentController } from "../src/app/module/payment/payment.controller";
import { renderInvoiceHtml, renderInvoicePdf } from "../src/app/module/payment/payment.invoice";

const makeDb = () => ({ payment: { findFirst: async () => null }, patient: { findFirst: async () => null }, doctor: { findFirst: async () => null } });
const owner = { userId: "owner", role: "PATIENT" as const, email: "owner@example.test" };
const fixture = () => ({
    id: "01a15210-65ef-711b-939f-49beb38e9e29",
    transactionId: "transaction-reference",
    status: "PAID",
    amount: 1250.50,
    updatedAt: new Date("2026-10-18T23:30:00Z"),
    createdAt: new Date("2026-10-18T22:00:00Z"),
    paymentGatewayData: { currency: "bdt" },
    appointment: {
        id: "appointment-1", patientId: "patient-1", doctorId: "doctor-1", paymentStatus: "PAID",
        patient: { id: "patient-1", userId: "owner", name: "Example Patient", email: "owner@example.test" },
        doctor: { id: "doctor-1", userId: "doctor-user", name: "Dr. Example", designation: "Consultant", currentWorkingPlace: "Example Hospital" },
        schedule: { startDateTime: new Date("2026-10-19T04:30:00Z") },
    },
});

test("patient can get their paid invoice using either payment or appointment ID", async t => {
    const db = makeDb();
    const payment = fixture();
    const findPayment = t.mock.method(db.payment, "findFirst", async () => payment as never);
    t.mock.method(db.patient, "findFirst", async () => ({ id: "patient-1" }) as never);
    const invoice = await PaymentService.getPaymentInvoice(payment.id, owner, db as never);
    assert.equal(invoice.currency, "BDT");
    assert.equal(invoice.amount, 1250.50);
    assert.match(invoice.paymentDate, /October 19, 2026/);
    assert.match(invoice.schedule.appointmentTime, /10:30 AM.*Bangladesh time/);
    assert.equal(invoice.invoiceNumber, `DOC-INV-${payment.id.toUpperCase()}`);
    await PaymentService.getPaymentInvoice("appointment-1", owner, db as never);
    const args = findPayment.mock.calls[1].arguments as unknown as [{ where: { OR: unknown[] } }];
    assert.deepEqual(args[0].where.OR, [{ id: "appointment-1" }, { appointmentId: "appointment-1" }]);
});

test("another patient's invoice and an unrelated doctor's invoice are forbidden", async t => {
    const db = makeDb();
    t.mock.method(db.payment, "findFirst", async () => fixture() as never);
    t.mock.method(db.patient, "findFirst", async () => ({ id: "other-patient" }) as never);
    t.mock.method(db.doctor, "findFirst", async () => ({ id: "other-doctor" }) as never);
    await assert.rejects(PaymentService.getPaymentInvoice("appointment-1", owner, db as never), { statusCode: 403 });
    await assert.rejects(PaymentService.getPaymentInvoice("appointment-1", { ...owner, role: "DOCTOR" }, db as never), { statusCode: 403 });
});

test("unpaid payments cannot produce a paid receipt, including mismatched appointment flags", async t => {
    const db = makeDb();
    const payment = fixture();
    payment.status = "UNPAID";
    t.mock.method(db.payment, "findFirst", async () => payment as never);
    t.mock.method(db.patient, "findFirst", async () => ({ id: "patient-1" }) as never);
    await assert.rejects(PaymentService.getPaymentInvoice(payment.id, owner, db as never), { statusCode: 400 });
});

test("missing payments return 404 and invoices with shared UUID prefixes stay unique", async t => {
    const db = makeDb();
    let payment: ReturnType<typeof fixture> | null = null;
    t.mock.method(db.payment, "findFirst", async () => payment as never);
    await assert.rejects(PaymentService.getPaymentInvoice("missing", owner, db as never), { statusCode: 404 });
    t.mock.method(db.patient, "findFirst", async () => ({ id: "patient-1" }) as never);
    payment = fixture();
    const first = await PaymentService.getPaymentInvoice(payment.id, owner, db as never);
    payment.id = "01a15210-65ef-711b-939f-49beb38e9e30";
    payment.paymentGatewayData.currency = "usd";
    const second = await PaymentService.getPaymentInvoice(payment.id, owner, db as never);
    assert.notEqual(first.invoiceNumber, second.invoiceNumber);
    assert.equal(second.currency, "USD");
});

test("HTML escapes user content and PDF generation finishes with a valid receipt", async t => {
    const db = makeDb();
    t.mock.method(db.payment, "findFirst", async () => fixture() as never);
    t.mock.method(db.patient, "findFirst", async () => ({ id: "patient-1" }) as never);
    const invoice = await PaymentService.getPaymentInvoice("appointment-1", owner, db as never);
    invoice.patient.name = '<script>alert("x")</script>';
    const html = renderInvoiceHtml(invoice);
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("BDT 1250.50"));
    assert.ok(!html.includes("USD"));
    assert.ok(!html.includes("Dr. Dr."));
    const pdf = await renderInvoicePdf(invoice);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.match(pdf.toString(), /%%EOF/);
    assert.match(pdf.toString(), /\/Count 1/);
});

test("invoice endpoint returns JSON, printable HTML, and an actual downloadable private PDF", async t => {
    const db = makeDb();
    t.mock.method(db.payment, "findFirst", async () => fixture() as never);
    t.mock.method(db.patient, "findFirst", async () => ({ id: "patient-1" }) as never);
    const getInvoice = PaymentService.getPaymentInvoice;
    t.mock.method(PaymentService, "getPaymentInvoice", (id, user) => getInvoice(id, user, db as never));
    const app = express();
    app.get("/invoice/:paymentId", (req, _res, next) => { req.user = owner; next(); }, PaymentController.getPaymentInvoice);
    app.use((error: { statusCode?: number; message: string }, _req: Request, res: Response, _next: NextFunction) => {
        res.status(error.statusCode || 500).json({ message: error.message });
    });
    const server = app.listen(0);
    await new Promise<void>(resolve => server.once("listening", resolve));
    t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/invoice/appointment-1`;
    const json = await fetch(url, { headers: { Accept: "application/json" } });
    assert.equal(json.status, 200);
    assert.equal((await json.json()).data.currency, "BDT");
    const explicitJson = await fetch(`${url}?format=json`, { headers: { Accept: "application/pdf" } });
    assert.match(explicitJson.headers.get("content-type")!, /application\/json/);
    const html = await fetch(`${url}?format=html`);
    assert.match(html.headers.get("content-type")!, /text\/html/);
    assert.match(await html.text(), /BDT 1250.50/);
    const pdf = await fetch(`${url}?format=pdf&download=true`, { headers: { Accept: "application/pdf" } });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get("cache-control"), "private, no-store");
    assert.match(pdf.headers.get("content-disposition")!, /attachment;.*\.pdf/);
    assert.match(pdf.headers.get("content-type")!, /application\/pdf/);
    assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
});
