/**
 * redisMiddleware.ts
 * docker exec -it redis-module redis-cli
 * 
 * Express middleware for API key authentication using Redis as a caching layer.
 *
 *  Authentication Flow:
 * 1. Reads the raw API key from the `x-api-key` request header.
 * 2. Hashes the raw API key before any lookup (never stores or compares raw keys).
 * 3. Checks Redis for a cached **invalid key** 
 * 4. Checks Redis for a cached **valid key** 
 * 5. If not cached, performs a lookup in Redis permanent storage.
 * 6. Verifies the API key is active.
 * 7. Attaches the API key payload (roles, owner) to `req.apiKey`.
 *  
 *  Caching Strategy:
 * - Invalid keys are cached briefly (e.g., 60s) to reduce abuse impact.
 * - Valid keys are cached longer (e.g., 15 min) for performance.
 * - Permanent API key records live in Redis with no expiration.
 *
 *  Security Notes:
 * - Raw API keys are never stored or logged.
 * - Only hashed keys are used as Redis keys.
 * - Designed for server-to-server authentication (JWT not required).
 *
 *  Expected Redis Keys:
 * - apikey:store:{hash}          → Permanent API key data
 * - apikey:cache:valid:{hash}    → Cached valid payload
 * - apikey:cache:invalid:{hash}  → Cached invalid marker
 *
 * On success:
 * - `req.apiKey` is populated with `{ roles, owner }`
 *
 * On failure:
 * - Responds with HTTP 401 (Unauthorized)
 */


import { Request, Response, NextFunction } from "express";
import redis from "../redis/redis";
// import ApiKey from "../models/ApiKey";
import { hashApiKey } from "../utils/hash";

export async function redisMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rawKey = req.header("x-api-key");
    if (!rawKey) {
      return res.status(401).json({ error: "API key missing" });
    }

    const keyHash =  hashApiKey(rawKey);

    const invalidCacheKey = `apikey:cache:invalid:${keyHash}`;
    const validCacheKey = `apikey:cache:valid:${keyHash}`;
    const storeKey = `apikey:store:${keyHash}`;
    console.log(storeKey);

    // Cached invalid key
    if (await redis.get(invalidCacheKey)) {
      return res.status(401).json({ error: "Invalid API key " });
    }

    //Cached valid key
    const cachedValid = await redis.get(validCacheKey);
    if (cachedValid) {
      req.apiKey = JSON.parse(cachedValid);
      return next();
    }

    //Permanent store lookup
    const stored = await redis.get(storeKey);
    if (!stored) {
      // cache invalid
      await redis.setex(invalidCacheKey, 60, "1");
      return res.status(401).json({ error: "Invalid API key " });
    }

    const data = JSON.parse(stored);

    if (!data.isActive) {
      await redis.setex(invalidCacheKey, 60, "1");
      return res.status(401).json({ error: "API key disabled" });
    }

    const payload = {
      roles: data.roles,
      owner: data.owner
    };

    // cache valid
    await redis.setex(validCacheKey, 900, JSON.stringify(payload));

    req.apiKey = payload;
    next();
  } catch (err) {
    console.error("API key auth error:", err);
    res.status(500).json({ error: "Internal auth error" });
  }
}
