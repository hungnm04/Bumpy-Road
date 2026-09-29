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

// ponytail: in-memory fallback — global lock, per-IP bucket map
// Upgrade path: REDIS_URL in production for multi-instance safety
const memoryBuckets = new Map();

const AUTH_WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
const AUTH_MAX_ATTEMPTS = 25;
const REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_ATTEMPTS = 50;
const GENERAL_WINDOW_MS = 15 * 60 * 1000;
const GENERAL_MAX_ATTEMPTS = 500;

function getMemoryKey(identifier, windowMs, maxAttempts) {
  const now = Date.now();
  const windowStart = now - windowMs;
  // Clean old entries periodically
  for (const [key, data] of memoryBuckets) {
    if (data.windowStart < windowStart) memoryBuckets.delete(key);
  }
  return `${identifier}:${windowStart}`;
}

function checkMemoryBucket(key, maxAttempts) {
  const entry = memoryBuckets.get(key);
  if (!entry) return { allowed: true, remaining: maxAttempts - 1, resetAt: Date.now() + (entry?.windowMs || 0) };
  const now = Date.now();
  if (now > entry.expiresAt) {
    memoryBuckets.delete(key);
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + entry.windowMs };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.expiresAt };
  }
  return { allowed: true, remaining: maxAttempts - entry.count - 1, resetAt: entry.expiresAt };
}

function incrementMemoryBucket(key, windowMs) {
  const now = Date.now();
  const expiresAt = now + windowMs;
  const entry = memoryBuckets.get(key);
  if (!entry || now > entry.expiresAt) {
    memoryBuckets.set(key, { count: 1, expiresAt, windowMs });
  } else {
    entry.count += 1;
  }
}

/**
 * Check rate limit — returns { allowed, remaining, resetAt }
 * identifier can be an IP address or user ID
 * bucket: 'auth' | 'refresh' | 'general'
 */
async function checkRateLimit(identifier, bucket = "general") {
  const configs = {
    auth:    { windowMs: AUTH_WINDOW_MS,    maxAttempts: AUTH_MAX_ATTEMPTS },
    refresh: { windowMs: REFRESH_WINDOW_MS, maxAttempts: REFRESH_MAX_ATTEMPTS },
    general: { windowMs: GENERAL_WINDOW_MS, maxAttempts: GENERAL_MAX_ATTEMPTS },
  };
  const { windowMs, maxAttempts } = configs[bucket] || configs.general;
  const client = await getRedis();

  if (client) {
    return checkRedisLimit(client, identifier, bucket, windowMs, maxAttempts);
  }
  const key = getMemoryKey(`${bucket}:${identifier}`, windowMs, maxAttempts);
  return checkMemoryBucket(key, maxAttempts);
}

/**
 * Record a request attempt — call this for both allowed and rejected attempts
 */
async function recordAttempt(identifier, bucket = "general") {
  const configs = {
    auth:    { windowMs: AUTH_WINDOW_MS,    maxAttempts: AUTH_MAX_ATTEMPTS },
    refresh: { windowMs: REFRESH_WINDOW_MS, maxAttempts: REFRESH_MAX_ATTEMPTS },
    general: { windowMs: GENERAL_WINDOW_MS, maxAttempts: GENERAL_MAX_ATTEMPTS },
  };
  const { windowMs } = configs[bucket] || configs.general;
  const client = await getRedis();

  if (client) {
    return recordRedisAttempt(client, identifier, bucket, windowMs);
  }
  const key = getMemoryKey(`${bucket}:${identifier}`, windowMs, 0);
  incrementMemoryBucket(key, windowMs);
}

// ---- Redis implementations ----

async function checkRedisLimit(client, identifier, bucket, windowMs, maxAttempts) {
  const key = `ratelimit:${bucket}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const pipeline = client.pipeline();
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count current entries
    pipeline.zcard(key);
    // Add current timestamp for this request
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    // Set expiry
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const count = results[1][1];

    if (count >= maxAttempts) {
      // Roll back the zadd
      await client.zremrangebyscore(key, now, now);
      const ttl = await client.pttl(key);
      return { allowed: false, remaining: 0, resetAt: now + ttl };
    }

    return { allowed: true, remaining: maxAttempts - count - 1, resetAt: now + windowMs };
  } catch (err) {
    logger.error({ err }, "Redis rate limit check failed");
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs };
  }
}

async function recordRedisAttempt(client, identifier, bucket, windowMs) {
  const key = `ratelimit:${bucket}:${identifier}`;
  const now = Date.now();
  try {
    const pipeline = client.pipeline();
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    pipeline.pexpire(key, windowMs);
    await pipeline.exec();
  } catch (err) {
    logger.error({ err }, "Redis rate limit record failed");
  }
}

// ponytail: no-op close for in-memory mode
async function close() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

module.exports = { checkRateLimit, recordAttempt, close };
