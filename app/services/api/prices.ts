import axios from "axios";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

interface CacheEntry {
    data: Record<string, { usd: number }>;
    timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 60 seconds
const BATCH_WINDOW_MS = 100; // Wait 100ms to collect requests

// Global state for caching and batching
const cache: Record<string, CacheEntry> = {};

interface PendingRequest {
    ids: string[];
    resolve: (data: Record<string, { usd: number }>) => void;
    reject: (err: any) => void;
}

let pendingRequests: PendingRequest[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

const processBatch = async () => {
    const queue = [...pendingRequests];
    pendingRequests = []; // Clear queue immediately
    batchTimeout = null;

    if (queue.length === 0) return;

    // 1. Gather all unique IDs needed
    const uniqueIds = new Set<string>();
    queue.forEach(req => req.ids.forEach(id => uniqueIds.add(id)));
    const allIds = Array.from(uniqueIds);

    // 2. Filter which actually need new data
    const now = Date.now();
    const idsToFetch = allIds.filter(id => {
        const entry = cache[id];
        return !entry || (now - entry.timestamp > CACHE_TTL);
    });

    // 3. Fetch missing data
    let fetchedData: Record<string, { usd: number }> = {};
    if (idsToFetch.length > 0) {
        try {
            // console.log("Batching API call for:", idsToFetch);
            // Use local proxy to avoid CORS
            const response = await axios.get("/api/prices", {
                params: {
                    ids: idsToFetch.join(","),
                    vs_currencies: "usd"
                }
            });
            fetchedData = response.data;

            // Update Cache per-item
            Object.entries(fetchedData).forEach(([id, val]) => {
                cache[id] = {
                    data: { [id]: val },
                    timestamp: now
                };
            });
        } catch (e) {
            console.error("Batch fetch error:", e);
            // On error we might still be able to serve from stale cache, 
            // but for now we just proceed with what we have (or empty).
        }
    }

    // 4. Resolve each request from the cache (fresh + existing)
    queue.forEach(({ ids, resolve }) => {
        const result: Record<string, { usd: number }> = {};
        ids.forEach(id => {
            if (cache[id]) {
                result[id] = cache[id].data[id];
            }
        });
        resolve(result);
    });
};

export const pricesApi = {
    getPrices: (ids: string[]): Promise<Record<string, { usd: number }>> => {
        return new Promise((resolve, reject) => {
            if (!ids.length) {
                resolve({});
                return;
            }

            // Push to queue
            pendingRequests.push({ ids, resolve, reject });

            // Schedule flush
            if (!batchTimeout) {
                batchTimeout = setTimeout(processBatch, BATCH_WINDOW_MS);
            }
        });
    }
};

