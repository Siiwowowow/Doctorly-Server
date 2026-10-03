import { logger } from "./logger";

/**
 * Periodically sends an HTTP GET request to the public server URL to prevent
 * free hosting platforms (like Render) from sleeping after 15 minutes of inactivity.
 */
export const startKeepAliveJob = () => {
    // Render sets RENDER_EXTERNAL_URL automatically (e.g. https://service-name.onrender.com)
    const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || process.env.BETTER_AUTH_URL;

    if (!targetUrl || targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
        return;
    }

    const cleanUrl = targetUrl.replace(/\/+$/, "");
    const pingEndpoint = `${cleanUrl}/health`;

    // Ping every 10 minutes (Render free tier spins down after 15 minutes of inactivity)
    const INTERVAL_MS = 10 * 60 * 1000;

    setInterval(async () => {
        try {
            const response = await fetch(pingEndpoint);
            if (response.ok) {
                logger.info(`[KeepAlive] Ping successful (${response.status}) -> ${pingEndpoint}`);
            } else {
                logger.warn(`[KeepAlive] Ping returned status ${response.status} -> ${pingEndpoint}`);
            }
        } catch (error: unknown) {
            const err = error as Error;
            logger.error(`[KeepAlive] Ping failed: ${err?.message || String(error)}`);
        }
    }, INTERVAL_MS);

    logger.info(`[KeepAlive] Service scheduled every 10 minutes for: ${pingEndpoint}`);
};
