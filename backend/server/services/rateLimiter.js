// Redis-backed rate limiter using a sliding window algorithm
// Falls back to in-memory if Redis is unavailable (dev/low-traffic mode)

const logger = require("../utils/logger");

const isProduction = process.env.NODE_ENV === "production";
const useRedis = isProduction && process.env.REDIS_URL;

// Lazy Redis client — only connects in production with REDIS_URL
let redis = null;

async function getRedis() {
  if (!useRedis) return null;
  if (redis) return redis;

  try {
    const { default: Redis } = await import("ioredis");
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redis.on("error", (err) => {
      logger.warn({ err }, "Redis rate limiter connection error");
    });
    await redis.connect();
    logger.info("Redis rate limiter connected");
    return redis;
  } catch (err) {
    logger.warn({ err }, "Redis unavailable, falling back to in-memory rate limiter");
    return null;
  }
}

// ponytail: in-memory fallback — per-IP bucket map with fixed window key
// Upgrade path: REDIS_URL in production for multi-instance safety
const memoryBuckets = new Map();

const BUCKETS = {
  auth:    { windowMs: 15 * 60 * 1000, maxAttempts: 25 },
  refresh: { windowMs: 15 * 60 * 1000, maxAttempts: 50 },
  general: { windowMs: 15 * 60 * 1000, maxAttempts: 500 },
};

// Returns current count for a bucket, or null if no active window
function memoryCount(bucket, identifier) {
  const { windowMs } = BUCKETS[bucket] || BUCKETS.general;
  const now = Date.now();
  const key = `${bucket}:${identifier}`;
  const entry = memoryBuckets.get(key);

  if (!entry || now > entry.expiresAt) return 0;
  return entry.count;
}

// Clean up all stale memory buckets (called on startup and periodically)
function memoryCleanup() {
  const now = Date.now();
  for (const [key, entry] of memoryBuckets) {
    if (now > entry.expiresAt) memoryBuckets.delete(key);
  }
}

// Check-and-increment atomically: returns {allowed, remaining, resetAt} AFTER incrementing
// Every request increments the counter; exceeding the limit means blocked.
async function checkRateLimit(identifier, bucket = "general") {
  const config = BUCKETS[bucket] || BUCKETS.general;
  const { windowMs, maxAttempts } = config;
  const now = Date.now();
  const key = `${bucket}:${identifier}`;

  // In-memory: atomic check-and-increment per bucket
  if (!useRedis) {
    memoryCleanup();
    const entry = memoryBuckets.get(key);
    if (!entry || now > entry.expiresAt) {
      // New window
      memoryBuckets.set(key, { count: 1, expiresAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
    }
    const newCount = entry.count + 1;
    if (newCount > maxAttempts) {
      return { allowed: false, remaining: 0, resetAt: entry.expiresAt };
    }
    entry.count = newCount;
    return { allowed: true, remaining: maxAttempts - newCount, resetAt: entry.expiresAt };
  }

  // Redis: ZSET sliding window — check and record atomically
  try {
    const client = await getRedis();
    return await redisCheckAndRecord(client, key, now, windowMs, maxAttempts);
  } catch (err) {
    logger.error({ err }, "Redis rate limit failed, allowing request");
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs };
  }
}

async function redisCheckAndRecord(client, key, now, windowMs, maxAttempts) {
  const windowStart = now - windowMs;

  // Atomic: ZREMRANGEBYSCORE + ZCARD + ZADD + PEXPIRE in one pipeline
  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // trim old entries
  pipeline.zcard(key);                              // current count
  pipeline.zadd(key, now, `${now}:${Math.random()}`); // record this request
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  const count = results[1][1]; // result of zcard

  if (count >= maxAttempts) {
    // Over limit — remove the entry we just added (roll back)
    await client.zremrangebyscore(key, now, now);
    const ttl = await client.pttl(key);
    return { allowed: false, remaining: 0, resetAt: now + (ttl > 0 ? ttl : windowMs) };
  }

  return { allowed: true, remaining: maxAttempts - count - 1, resetAt: now + windowMs };
}

async function close() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

module.exports = { checkRateLimit, close };
