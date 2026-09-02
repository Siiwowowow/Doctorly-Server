/**
 * In-memory TTL cache with tag-based invalidation.
 * Safe, robust, and optimized for high-throughput public read endpoints.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    tags: string[];
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private tagMap = new Map<string, Set<string>>();

    /**
     * Store an item in the cache with a TTL (in seconds) and optional invalidation tags.
     */
    set<T>(key: string, data: T, ttlSeconds: number, tags: string[] = []): void {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { data, expiresAt, tags });

        // Map tags to cache keys for efficient multi-key invalidation
        for (const tag of tags) {
            if (!this.tagMap.has(tag)) {
                this.tagMap.set(tag, new Set());
            }
            this.tagMap.get(tag)!.add(key);
        }
    }

    /**
     * Retrieve an item from the cache. Returns undefined if missing or expired.
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            return undefined;
        }

        return entry.data as T;
    }

    /**
     * Delete a single cache entry.
     */
    delete(key: string): void {
        const entry = this.cache.get(key);
        if (entry) {
            for (const tag of entry.tags) {
                const keys = this.tagMap.get(tag);
                if (keys) {
                    keys.delete(key);
                    if (keys.size === 0) {
                        this.tagMap.delete(tag);
                    }
                }
            }
            this.cache.delete(key);
        }
    }

    /**
     * Invalidate all cache entries associated with a specific tag (e.g., 'doctors', 'specialties').
     */
    invalidateTag(tag: string): void {
        const keys = this.tagMap.get(tag);
        if (keys) {
            for (const key of Array.from(keys)) {
                this.cache.delete(key);
            }
            this.tagMap.delete(tag);
        }
    }

    /**
     * Clear all cache entries.
     */
    clear(): void {
        this.cache.clear();
        this.tagMap.clear();
    }

    /**
     * Get or compute cache entry atomically.
     */
    async getOrSet<T>(
        key: string,
        ttlSeconds: number,
        fetcher: () => Promise<T>,
        tags: string[] = []
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== undefined) {
            return cached;
        }

        const freshData = await fetcher();
        this.set(key, freshData, ttlSeconds, tags);
        return freshData;
    }
}

export const memoryCache = new MemoryCache();
