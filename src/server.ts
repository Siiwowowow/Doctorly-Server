import http from "http";
import app from "./serverApp";
import { envVars } from "./app/config/env";
import { warmDatabaseConnection } from "./app/lib/prisma";
import { initSocketIO } from "./app/socket";
import { startKeepAliveJob } from "./app/utils/keepAlive";
import { logger } from "./app/utils/logger";
import { seedSuperAdmin } from "./app/utils/seed";

const bootstrap = async () => {
    try {
        const httpServer = http.createServer(app);

        // Initialize Socket.IO realtime server
        initSocketIO(httpServer);

        const port = Number(envVars.PORT) || 5000;
        httpServer.listen(port, "0.0.0.0", () => {
            logger.info(`Server & Socket.IO are running on http://0.0.0.0:${port}`);
            console.log(`Local: http://localhost:${port}`);

            // Start automated keep-alive job to prevent sleep on Render free tier
            startKeepAliveJob();
        });

        // Run seedSuperAdmin and warm connection pool non-blockingly so server start is instant
        seedSuperAdmin().catch((err) => {
            logger.error("Error during initial super admin seeding:", err);
        });
        warmDatabaseConnection().catch(() => {});
    } catch (error) {
        logger.error("Failed to start server:", error);
    }
};

bootstrap();