/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import PDFDocument from "pdfkit";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { IQueryParams } from "../../interfaces/query.interface";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;

    const result = await PaymentService.createCheckoutSession(payload, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Stripe checkout session created successfully",
        data: result,
    });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const query = req.query;

    const result = await PaymentService.getMyPayments(user, query as IQueryParams);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Payments retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: "Missing Stripe signature or webhook secret",
        });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: `Webhook signature verification failed: ${error.message}`,
        });
    }

    const result = await PaymentService.handlerStripeWebhookEvent(event);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Stripe webhook event processed successfully",
        data: result,
    });
});

const verifyPaymentSession = catchAsync(async (req: Request, res: Response) => {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : (req.params.sessionId as string);
    const user = req.user;

    const result = await PaymentService.verifyPaymentSession(sessionId, user);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Payment session verified successfully",
        data: result,
    });
});

const getPaymentInvoice = catchAsync(async (req: Request, res: Response) => {
    const paymentId = Array.isArray(req.params.paymentId) ? req.params.paymentId[0] : (req.params.paymentId as string);
    const user = req.user;

    const invoiceData = await PaymentService.getPaymentInvoice(paymentId, user);

    const isPdfRequest =
        req.query.format === "pdf" ||
        req.headers.accept?.includes("application/pdf") ||
        (req.query.download === "true" && req.query.format !== "html" && req.query.format !== "json");

    if (isPdfRequest) {
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Doctorly-Invoice-${invoiceData.invoiceNumber}.pdf"`
        );

        doc.pipe(res);

        // Header Background Banner
        doc.rect(0, 0, 612, 110).fill("#0284c7");

        // Header Texts
        doc.fillColor("#ffffff")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("Doctorly Healthcare", 50, 35);

        doc.fontSize(11)
            .font("Helvetica")
            .text("Official Consultation Receipt & Invoice", 50, 65);

        doc.fontSize(16)
            .font("Helvetica-Bold")
            .text("INVOICE", 400, 35, { align: "right", width: 162 });

        doc.fontSize(10)
            .font("Helvetica")
            .text(`# ${invoiceData.invoiceNumber}`, 400, 58, { align: "right", width: 162 })
            .text(`Date: ${invoiceData.paymentDate}`, 400, 74, { align: "right", width: 162 });

        // Move cursor below header
        doc.moveDown(4);

        const yPos = 140;

        // Billed To & Service Provider Boxes
        doc.fillColor("#0f172a")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("BILLED TO (PATIENT)", 50, yPos);

        doc.fillColor("#334155")
            .fontSize(12)
            .font("Helvetica-Bold")
            .text(invoiceData.patient.name, 50, yPos + 18);

        doc.fontSize(10)
            .font("Helvetica")
            .text(invoiceData.patient.email, 50, yPos + 34);

        doc.fillColor("#0f172a")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("SERVICE PROVIDER (DOCTOR)", 320, yPos);

        doc.fillColor("#334155")
            .fontSize(12)
            .font("Helvetica-Bold")
            .text(`Dr. ${invoiceData.doctor.name}`, 320, yPos + 18);

        doc.fontSize(10)
            .font("Helvetica")
            .text(invoiceData.doctor.designation, 320, yPos + 34)
            .text(invoiceData.doctor.hospital, 320, yPos + 48);

        // Divider
        doc.rect(50, yPos + 75, 512, 1).fill("#e2e8f0");

        // Table Header
        const tableY = yPos + 95;
        doc.rect(50, tableY, 512, 28).fill("#f1f5f9");

        doc.fillColor("#475569")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("DESCRIPTION", 60, tableY + 8)
            .text("SCHEDULE", 240, tableY + 8)
            .text("STATUS", 400, tableY + 8)
            .text("AMOUNT", 480, tableY + 8, { align: "right", width: 72 });

        // Table Row
        const rowY = tableY + 38;
        doc.fillColor("#0f172a")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("Online Medical Consultation", 60, rowY);

        doc.fontSize(8)
            .font("Helvetica")
            .fillColor("#64748b")
            .text(`Ref: ${invoiceData.appointmentId}`, 60, rowY + 14);

        doc.fillColor("#334155")
            .fontSize(9)
            .font("Helvetica")
            .text(invoiceData.schedule.appointmentTime, 240, rowY, { width: 150 });

        doc.fillColor("#15803d")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(invoiceData.paymentStatus, 400, rowY);

        doc.fillColor("#0f172a")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(`$${invoiceData.amount.toFixed(2)}`, 480, rowY, { align: "right", width: 72 });

        // Table Bottom Border
        doc.rect(50, rowY + 35, 512, 1).fill("#e2e8f0");

        // Total Section
        const totalY = rowY + 50;
        doc.fillColor("#64748b")
            .fontSize(10)
            .font("Helvetica")
            .text("Subtotal:", 380, totalY)
            .text(`$${invoiceData.amount.toFixed(2)}`, 480, totalY, { align: "right", width: 72 });

        doc.text("Taxes & Processing Fees:", 380, totalY + 18)
            .text("$0.00", 480, totalY + 18, { align: "right", width: 72 });

        doc.rect(380, totalY + 36, 182, 1).fill("#0284c7");

        doc.fillColor("#0f172a")
            .fontSize(13)
            .font("Helvetica-Bold")
            .text("Total Paid:", 380, totalY + 44)
            .text(`$${invoiceData.amount.toFixed(2)} USD`, 470, totalY + 44, { align: "right", width: 82 });

        // Transaction Box
        const metaY = totalY + 90;
        doc.rect(50, metaY, 512, 45).fill("#f8fafc");
        doc.rect(50, metaY, 512, 45).stroke("#e2e8f0");

        doc.fillColor("#475569")
            .fontSize(9)
            .font("Helvetica")
            .text(`Transaction Reference: ${invoiceData.transactionId}`, 65, metaY + 12)
            .text(`Payment Gateway: Stripe Payments (Secure Online Checkout)`, 65, metaY + 26);

        // Footer
        doc.fillColor("#94a3b8")
            .fontSize(8)
            .font("Helvetica")
            .text(
                "This is a computer-generated official receipt. Thank you for choosing Doctorly Healthcare Telemedicine.",
                50,
                720,
                { align: "center", width: 512 }
            );

        doc.end();
        return;
    }

    if (req.query.format === "html" || req.headers.accept?.includes("text/html")) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoiceData.invoiceNumber}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background: #f8fafc; color: #1e293b; padding: 40px 20px; }
        .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 32px; display: flex; justify-content: space-between; align-items: center; }
        .brand h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .brand p { font-size: 14px; opacity: 0.9; margin-top: 4px; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-meta p { font-size: 13px; opacity: 0.9; margin-top: 4px; }
        .body { padding: 32px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .info-box h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
        .info-box p { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .info-box span { font-size: 13px; color: #64748b; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
        .table th { background: #f1f5f9; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; }
        .table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
        .table td.text-right { text-align: right; }
        .total-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .total-box { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b; }
        .total-row.final { border-top: 2px solid #0284c7; font-size: 18px; font-weight: 800; color: #0f172a; padding-top: 12px; margin-top: 8px; }
        .status-badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
        @media print {
            body { background: #ffffff; padding: 0; }
            .invoice-card { box-shadow: none; border: none; max-width: 100%; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-card">
        <div class="header">
            <div class="brand">
                <h1>Doctorly Healthcare</h1>
                <p>Official Consultation Receipt & Invoice</p>
            </div>
            <div class="invoice-meta">
                <h2>INVOICE</h2>
                <p># ${invoiceData.invoiceNumber}</p>
                <p>Date: ${invoiceData.paymentDate}</p>
            </div>
        </div>
        <div class="body">
            <div class="grid">
                <div class="info-box">
                    <h3>Billed To (Patient)</h3>
                    <p>${invoiceData.patient.name}</p>
                    <span>${invoiceData.patient.email}</span>
                </div>
                <div class="info-box">
                    <h3>Service Provider (Doctor)</h3>
                    <p>Dr. ${invoiceData.doctor.name}</p>
                    <span>${invoiceData.doctor.designation}</span><br>
                    <span>${invoiceData.doctor.hospital}</span>
                </div>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>Online Medical Consultation</strong><br>
                            <span style="font-size: 12px; color: #64748b;">Appointment Ref: ${invoiceData.appointmentId}</span>
                        </td>
                        <td>${invoiceData.schedule.appointmentTime}</td>
                        <td><span class="status-badge">${invoiceData.paymentStatus}</span></td>
                        <td class="text-right"><strong>$${invoiceData.amount.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-box">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>$${invoiceData.amount.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Taxes & Fees</span>
                        <span>$0.00</span>
                    </div>
                    <div class="total-row final">
                        <span>Total Paid</span>
                        <span>$${invoiceData.amount.toFixed(2)} USD</span>
                    </div>
                </div>
            </div>

            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                <p><strong>Transaction Reference:</strong> ${invoiceData.transactionId}</p>
                <p><strong>Payment Gateway:</strong> Stripe Payments (Secure Checkout)</p>
            </div>
        </div>
        <div class="footer">
            <p>Thank you for choosing Doctorly Healthcare. This is a computer-generated receipt.</p>
        </div>
    </div>
    <script>
        if (window.location.search.includes('download=true') || window.location.search.includes('print=true')) {
            window.print();
        }
    </script>
</body>
</html>`;
        res.setHeader("Content-Type", "text/html");
        return res.status(status.OK).send(html);
    }

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Invoice fetched successfully",
        data: invoiceData,
    });
});

export const PaymentController = {
    createCheckoutSession,
    getMyPayments,
    handleStripeWebhookEvent,
    verifyPaymentSession,
    getPaymentInvoice,
};