/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { renderInvoiceHtml, renderInvoicePdf } from "./payment.invoice";
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
    const invoiceData = await PaymentService.getPaymentInvoice(paymentId, req.user);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const isPdfRequest = req.query.format === "pdf"
        || (!req.query.format && (req.headers.accept?.includes("application/pdf") || req.query.download === "true"));
    if (isPdfRequest) {
        const pdf = await renderInvoicePdf(invoiceData);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Doctorly-Invoice-${invoiceData.paymentId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`);
        return res.status(status.OK).send(pdf);
    }
    if (req.query.format === "html" || (req.query.format !== "json" && req.headers.accept?.includes("text/html"))) {
        return res.status(status.OK).type("html").send(renderInvoiceHtml(invoiceData));
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
