/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
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

export const PaymentController = {
    createCheckoutSession,
    getMyPayments,
    handleStripeWebhookEvent,
};