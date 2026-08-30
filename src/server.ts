import express from "express";
import http from "http";
import app from "./serverApp";
import { envVars } from "./app/config/env";
import { initSocketIO } from "./app/socket";
import { logger } from "./app/utils/logger";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async () => {
    try {
        const httpServer = http.createServer(app);

        // Initialize Socket.IO realtime server
        initSocketIO(httpServer);

        httpServer.listen(envVars.PORT, () => {
            logger.info(`Server & Socket.IO are running on http://localhost:${envVars.PORT}`);
        });

        // Run seedSuperAdmin non-blockingly so server start is instant
        seedSuperAdmin().catch((err) => {
            logger.error("Error during initial super admin seeding:", err);
        });
    } catch (error) {
        logger.error("Failed to start server:", error);
    }
};

bootstrap();