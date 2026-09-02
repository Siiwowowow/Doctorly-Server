/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import pg from 'pg';
import { PrismaClient } from "../../generated/prisma/client";
import { envVars } from '../config/env';
import { logger } from '../utils/logger';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: pg.Pool | undefined;
};

// Create a robust, serverless-friendly PostgreSQL connection pool for Neon PgBouncer
const createPool = (): pg.Pool => {
    const pool = new pg.Pool({
        connectionString: envVars.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 0, // Never abort TLS/SCRAM handshakes prematurely
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        ssl: { rejectUnauthorized: false },
    });

    // Catch errors on idle clients so they are purged silently without crashing queries
    pool.on('error', (err) => {
        logger.warn(`[Prisma/pg-pool] Idle client disconnected by host: ${err.message}. Purged from pool.`);
    });

    return pool;
};

const pool = globalForPrisma.pool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(pool, {
    onPoolError: (err) => {
        logger.warn(`[PrismaPg] Pool error: ${err.message}`);
    },
    onConnectionError: (err) => {
        logger.warn(`[PrismaPg] Connection error: ${err.message}`);
    },
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

/**
 * Pre-warms the database connection pool eagerly in the background.
 */
export const warmDatabaseConnection = async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.info("[Prisma] Database connection pool warmed and ready.");
    } catch (err: any) {
        logger.warn(`[Prisma] Connection pool warm-up warning: ${err.message}`);
    }
};



