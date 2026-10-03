/* eslint-disable @typescript-eslint/no-explicit-any */
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import cron from "node-cron";
import path from "path";
import qs from "qs";
import { envVars } from "./app/config/env";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AppointmentService } from "./app/module/appointment/appointment.service";
import { PaymentController } from "./app/module/payment/payment.controller";
import { IndexRoutes } from "./app/routes";

import { logger } from "./app/utils/logger";

const app: Application = express();
app.set("query parser", (str : string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views",path.resolve(process.cwd(), `src/app/templates`) )

app.post("/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent);
app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), PaymentController.handleStripeWebhookEvent);

const normalizeUrl = (url?: string) => url ? url.replace(/\/+$/, "") : "";

const configuredOrigins = [
    normalizeUrl(envVars.FRONTEND_URL),
    normalizeUrl(envVars.BETTER_AUTH_URL),
    "https://doctorly-fontend.vercel.app",
    "https://doctorly-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5173",
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const isAllowed = configuredOrigins.some(allowed => 
            origin === allowed || origin.startsWith(allowed)
        ) || origin.endsWith(".vercel.app") || origin.includes("localhost");

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24h to avoid redundant roundtrips
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cookie",
        "x-better-auth-client",
        "better-auth-csrf-token",
        "X-Requested-With",
        "Accept",
        "Origin"
    ],
    exposedHeaders: ["Set-Cookie"]
}));

app.use("/api/auth", toNodeHandler(auth))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser())

// Periodically auto-remove unpaid appointments older than 12 hours
cron.schedule("*/30 * * * *", async () => {
    try {
        await AppointmentService.cancelUnpaidAppointments();
    } catch (error: any) {
        logger.error("Error occurred while canceling unpaid appointments:", error.message);    
    }
});

app.use("/api/v1", IndexRoutes);

app.get("/favicon.ico", (req: Request, res: Response) => {
    res.status(204).end();
});

// Basic route & Health check for keep-alive / UptimeRobot
app.get(['/', '/api', '/health'], async (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Doctorly Healthcare API is live and working',
        timestamp: new Date().toISOString()
    });
});

app.use(globalErrorHandler)
app.use(notFound)


export default app;
