import dotenv from 'dotenv';
import status from 'http-status';
import AppError from '../errorHelpers/AppError';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;
    EMAIL_SENDER:{
        PROVIDER: string;
        SMTP_USER: string;
        SMTP_PASS: string;
        SMTP_HOST: string;
        SMTP_PORT: string;
        SMTP_FROM: string;
        RESEND_API_KEY?: string;
        VERCEL_MAIL_API_URL?: string;
        MAIL_SERVICE_SECRET?: string;
    }
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_CALLBACK_URL?: string;
    FRONTEND_URL: string;
    CLOUDINARY:{
        CLOUDINARY_CLOUD_NAME: string;
        CLOUDINARY_API_KEY: string;
        CLOUDINARY_API_SECRET: string;
    },
    STRIPE:{
        STRIPE_SECRET_KEY: string;
        STRIPE_WEBHOOK_SECRET: string;
    },
    SUPER_ADMIN_EMAIL: string;
    SUPER_ADMIN_PASSWORD: string;
}


const loadEnvVariables = (): EnvConfig => {

    const missingEnvVariables: string[] = [];
    const requireEnvVariable = [
        'DATABASE_URL',
        'BETTER_AUTH_SECRET',
        'BETTER_AUTH_URL',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'ACCESS_TOKEN_EXPIRES_IN',
        'REFRESH_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN',
        'BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE',
        'EMAIL_SENDER_SMTP_FROM',
        'FRONTEND_URL',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'SUPER_ADMIN_EMAIL',
        'SUPER_ADMIN_PASSWORD',
    ];

    // This project runs its main API on Render and its SMTP relay on Vercel.
    // Render blocks SMTP on free instances, so always route mail through Vercel there.
    const emailProvider = (process.env.RENDER === 'true'
        ? 'vercel'
        : process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'smtp')).toLowerCase();

    if (emailProvider === 'smtp') {
        requireEnvVariable.push(
            'EMAIL_SENDER_SMTP_USER',
            'EMAIL_SENDER_SMTP_PASS',
            'EMAIL_SENDER_SMTP_HOST',
            'EMAIL_SENDER_SMTP_PORT',
        );
    } else if (emailProvider === 'resend') {
        requireEnvVariable.push('RESEND_API_KEY');
    } else if (emailProvider === 'vercel') {
        // VERCEL_MAIL_API_URL has a project-specific default; BETTER_AUTH_SECRET
        // is used when a dedicated MAIL_SERVICE_SECRET is not configured.
    } else {
        throw new AppError(status.INTERNAL_SERVER_ERROR, `Unsupported EMAIL_PROVIDER: ${emailProvider}`);
    }

    requireEnvVariable.forEach((variable) => {
        if (!process.env[variable]) {
            missingEnvVariables.push(variable);
        }
    });

    if (missingEnvVariables.length > 0) {
        const errorMsg = `Missing required environment variables: ${missingEnvVariables.join(', ')}. Please set them in your .env or Vercel Project Settings.`;
        console.error(errorMsg);
        throw new AppError(status.INTERNAL_SERVER_ERROR, errorMsg);
    }

    return {
        NODE_ENV: (process.env.NODE_ENV || 'production') as string,
        PORT: (process.env.PORT || '5000') as string,
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
        ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
        REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
        BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as string,
        BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE as string,
        EMAIL_SENDER: {
            PROVIDER: emailProvider,
            SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
            SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
            SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
            SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
            SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string,
            RESEND_API_KEY: process.env.RESEND_API_KEY,
            VERCEL_MAIL_API_URL: process.env.VERCEL_MAIL_API_URL || 'https://doctorly-server-zeta.vercel.app/api/internal/send-email',
            MAIL_SERVICE_SECRET: process.env.MAIL_SERVICE_SECRET || process.env.BETTER_AUTH_SECRET,
        },
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
        FRONTEND_URL: process.env.FRONTEND_URL as string,
        CLOUDINARY: {
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
        },
        STRIPE: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
        },
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    }
}

export const envVars = loadEnvVariables();
