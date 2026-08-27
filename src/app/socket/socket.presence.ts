import { IUserPresence } from "./socket.types";

class PresenceManager {
    // userId -> Set of active socket IDs
    private userSockets: Map<string, Set<string>> = new Map();
    // userId -> Last seen timestamp
    private lastSeenMap: Map<string, Date> = new Map();

    /**
     * Records a new active socket connection for a user.
     * Returns whether this is the user's first connection (online transition).
     */
    addConnection(userId: string, socketId: string): { isFirstConnection: boolean; activeConnections: number } {
        let sockets = this.userSockets.get(userId);
        let isFirstConnection = false;

        if (!sockets) {
            sockets = new Set<string>();
            this.userSockets.set(userId, sockets);
            isFirstConnection = true;
        }

        sockets.add(socketId);
        this.lastSeenMap.set(userId, new Date());

        return {
            isFirstConnection,
            activeConnections: sockets.size,
        };
    }

    /**
     * Removes a disconnected socket for a user.
     * Returns whether this was the user's last active socket (offline transition).
     */
    removeConnection(userId: string, socketId: string): { isLastConnection: boolean; remainingConnections: number; lastSeen: Date } {
        const sockets = this.userSockets.get(userId);
        const lastSeen = new Date();
        this.lastSeenMap.set(userId, lastSeen);

        if (!sockets) {
            return {
                isLastConnection: true,
                remainingConnections: 0,
                lastSeen,
            };
        }

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.userSockets.delete(userId);
            return {
                isLastConnection: true,
                remainingConnections: 0,
                lastSeen,
            };
        }

        return {
            isLastConnection: false,
            remainingConnections: sockets.size,
            lastSeen,
        };
    }

    /**
     * Returns whether the given user has at least one active socket connection.
     */
    isUserOnline(userId: string): boolean {
        const sockets = this.userSockets.get(userId);
        return Boolean(sockets && sockets.size > 0);
    }

    /**
     * Returns presence info for a single user.
     */
    getUserPresence(userId: string): IUserPresence {
        const sockets = this.userSockets.get(userId);
        const activeConnections = sockets ? sockets.size : 0;
        const isOnline = activeConnections > 0;
        const lastSeen = this.lastSeenMap.get(userId) || new Date();

        return {
            userId,
            isOnline,
            lastSeen,
            activeConnections,
        };
    }

    /**
     * Returns presence info for multiple users.
     */
    getUsersPresence(userIds: string[]): IUserPresence[] {
        return userIds.map((userId) => this.getUserPresence(userId));
    }

    /**
     * Returns all user IDs currently online.
     */
    getAllOnlineUserIds(): string[] {
        return Array.from(this.userSockets.keys());
    }

    /**
     * Resets presence state (useful for tests).
     */
    reset(): void {
        this.userSockets.clear();
        this.lastSeenMap.clear();
    }
}

export const presenceManager = new PresenceManager();
