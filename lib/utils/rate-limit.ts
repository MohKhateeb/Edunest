/**
 * In-memory rate limiter using a fixed-window counter.
 *
 * ⚠️  LIMITATION: This implementation stores counters in Node.js process
 *    memory. It works correctly ONLY when the application runs as a SINGLE
 *    instance (e.g., a single Node server or a single container). In a
 *    multi-instance deployment (serverless with multiple workers, horizontal
 *    scaling, etc.), each instance has its own independent counter map, so
 *    the effective limit becomes `limit × number_of_instances`.
 *
 *    To get accurate cross-instance rate limiting, migrate to a shared
 *    store such as Redis or Upstash Redis (with @upstash/ratelimit).
 *    Until then, this is still a meaningful improvement over no rate
 *    limiting at all.
 */

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

const buckets = new Map<string, { count: number; resetAt: number }>();
let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

function cleanupExpired(now: number): void {
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
}

export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): RateLimitResult {
	const now = Date.now();
	if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
		cleanupExpired(now);
		lastCleanup = now;
	}
	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}
	if (bucket.count >= limit) {
		return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
	}
	bucket.count++;
	return { allowed: true, retryAfterSeconds: 0 };
}
