/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import fs from "fs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { logger } from "./logger";

const smtpPort = Number(envVars.EMAIL_SENDER.SMTP_PORT) || 465;
const smtpUser = envVars.EMAIL_SENDER.SMTP_USER?.trim();
// Google displays app passwords in groups; SMTP expects the value without spaces.
const smtpPass = envVars.EMAIL_SENDER.SMTP_PASS?.replace(/['"\s]/g, "");

const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for 587
    auth: {
        user: smtpUser,
        pass: smtpPass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
        rejectUnauthorized: false
    }
});

const DEFAULT_TEMPLATES: Record<string, string> = {
    otp: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Doctorly Healthcare - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%); padding: 36px 30px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 10px 18px; border-radius: 50px; margin-bottom: 12px; backdrop-filter: blur(4px);">
                                            <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; vertical-align: middle;">
                                                🩺 Doctorly
                                            </span>
                                        </div>
                                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px; line-height: 1.3;">
                                            <%= typeof type !== 'undefined' && type === 'forget-password' ? 'Password Reset Code' : 'Email Verification Code' %>
                                        </h1>
                                        <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0;">
                                            Your secure telehealth & healthcare platform
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 36px 32px 28px 32px;">
                            <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0; line-height: 1.6;">
                                Hello <strong style="color: #0f172a;"><%= typeof name !== 'undefined' && name ? name : 'there' %></strong> 👋,
                            </p>
                            <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                                <%= typeof type !== 'undefined' && type === 'forget-password' 
                                    ? 'We received a request to reset the password for your Doctorly account. Please use the One-Time Password (OTP) below to proceed:' 
                                    : 'Thank you for choosing Doctorly. To complete your account verification and secure your patient portal, please use the One-Time Password (OTP) below:' %>
                            </p>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 14px; padding: 22px 20px; text-align: center;">
                                            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 8px;">
                                                Verification Code
                                            </div>
                                            <div style="font-family: 'Courier New', Courier, monospace, -apple-system; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; padding-left: 10px;">
                                                <%= otp %>
                                            </div>
                                            <div style="display: inline-block; margin-top: 10px; background-color: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">
                                                ⏱ Valid for <%= typeof expiryMinutes !== 'undefined' ? expiryMinutes : 2 %> minutes
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5;">
                                            <strong style="color: #0f172a;">🔒 Security Reminder:</strong> Never share this code with anyone. Doctorly staff will never ask for your verification code or password.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;">
                                If you did not request this code or create an account, you can safely ignore this email. No changes will be made to your account.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px;">
                            <div style="border-top: 1px solid #e2e8f0;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px 32px 32px; text-align: center;">
                            <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0;">
                                &copy; <%= new Date().getFullYear() %> Doctorly Healthcare Management System. All rights reserved.
                            </p>
                            <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                                This is an automated notification. Please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
};

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[];
}

interface SendHtmlEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: SendEmailOptions["attachments"];
}

const renderEmailHtml = async (templateName: string, templateData: Record<string, any>): Promise<string> => {
    // Try multiple possible paths for EJS templates (local development vs production bundle)
    const possiblePaths = [
        path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`),
        path.resolve(process.cwd(), `templates/${templateName}.ejs`),
        path.resolve(process.cwd(), `api/templates/${templateName}.ejs`),
        path.join(path.dirname(new URL(import.meta.url).pathname), `../templates/${templateName}.ejs`),
    ];

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                return await ejs.renderFile(p, templateData);
            }
        } catch {
            // continue checking
        }
    }

    // Fallback to built-in template
    if (DEFAULT_TEMPLATES[templateName]) {
        return ejs.render(DEFAULT_TEMPLATES[templateName], templateData);
    }

    throw new Error(`Email template '${templateName}' not found`);
};

const getFromAddress = () => {
    const rawFrom = (envVars.EMAIL_SENDER.SMTP_FROM || envVars.EMAIL_SENDER.SMTP_USER || "").trim();
    if (rawFrom.includes("<") && rawFrom.includes(">")) {
        return rawFrom;
    }
    return `"Doctorly Healthcare" <${rawFrom}>`;
};

export const sendEmail = async ({ subject, templateData, templateName, to, attachments }: SendEmailOptions) => {
    try {
        const html = await renderEmailHtml(templateName, templateData);

        if (envVars.EMAIL_SENDER.PROVIDER === "vercel") {
            const response = await fetch(envVars.EMAIL_SENDER.VERCEL_MAIL_API_URL as string, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-mail-service-secret": envVars.EMAIL_SENDER.MAIL_SERVICE_SECRET as string,
                },
                body: JSON.stringify({
                    to,
                    subject,
                    html,
                    attachments: attachments?.map((attachment) => ({
                        filename: attachment.filename,
                        content: Buffer.isBuffer(attachment.content)
                            ? attachment.content.toString("base64")
                            : Buffer.from(attachment.content).toString("base64"),
                        contentType: attachment.contentType,
                    })),
                }),
                signal: AbortSignal.timeout(25000),
            });

            const responseBody = await response.json().catch(() => ({})) as { message?: string; messageId?: string };
            if (!response.ok) {
                throw new Error(responseBody.message || `Vercel mail service returned HTTP ${response.status}`);
            }

            logger.info(`Email sent successfully to ${to} via Vercel mail service (MessageId: ${responseBody.messageId || "unknown"})`);
            return responseBody;
        }

        if (envVars.EMAIL_SENDER.PROVIDER === "resend") {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${envVars.EMAIL_SENDER.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: getFromAddress(),
                    to: [to],
                    subject,
                    html,
                    attachments: attachments?.map((attachment) => ({
                        filename: attachment.filename,
                        content: Buffer.isBuffer(attachment.content)
                            ? attachment.content.toString("base64")
                            : Buffer.from(attachment.content).toString("base64"),
                    })),
                }),
                signal: AbortSignal.timeout(20000),
            });

            const responseBody = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
            if (!response.ok) {
                throw new Error(responseBody.message || responseBody.name || `Resend returned HTTP ${response.status}`);
            }

            logger.info(`Email sent successfully to ${to} via Resend (MessageId: ${responseBody.id || "unknown"})`);
            return responseBody;
        }

        const info = await sendHtmlEmailViaSmtp({ to, subject, html, attachments });

        logger.info(`Email sent successfully to ${to} (MessageId: ${info.messageId})`);
        return info;
    } catch (error: any) {
        logger.error(`Email Sending Error for recipient ${to}:`, error?.message || error);
        throw new AppError(status.INTERNAL_SERVER_ERROR, `Failed to send email: ${error?.message || "Unknown error"}`);
    }
};

export const sendHtmlEmailViaSmtp = async ({ to, subject, html, attachments }: SendHtmlEmailOptions) => {
    return transporter.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
        attachments: attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType,
        })),
    });
};
