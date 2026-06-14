import { Redis } from '@upstash/redis';

// Only initialize Redis if tokens are present to avoid build errors
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  // Fallback if Redis is not configured
  if (!redis) {
    console.warn("Upstash Redis is not configured. Rate limiting is bypassed.");
    return { allowed: true, remaining: maxRequests, resetIn: windowMs };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  
  try {
    const multi = redis.multi();
    multi.get(key);
    const results = await multi.exec();
    
    let currentData = results[0] as { count: number; resetAt: number } | null;

    if (!currentData || now > currentData.resetAt) {
      currentData = { count: 1, resetAt: now + windowMs };
      await redis.set(key, currentData, { px: windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (currentData.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: currentData.resetAt - now,
      };
    }

    currentData.count++;
    // Use PEXPIREAT conceptually, or just overwrite with new TTL
    const ttl = Math.max(0, currentData.resetAt - now);
    await redis.set(key, currentData, { px: ttl });
    
    return {
      allowed: true,
      remaining: maxRequests - currentData.count,
      resetIn: ttl,
    };
  } catch (error) {
    console.error("Redis rate limit error:", error);
    // Allow request if Redis fails to avoid blocking legitimate users
    return { allowed: true, remaining: 1, resetIn: 1000 };
  }
}
