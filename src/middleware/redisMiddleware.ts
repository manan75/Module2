import { Request, Response, NextFunction } from "express";
import redis from "../redis/redis";
import ApiKey from "../models/ApiKey";
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
    // 🚫 Cached invalid key
    if (await redis.get(invalidCacheKey)) {
      return res.status(401).json({ error: "Invalid API key 2" });
    }

    // ✅ Cached valid key
    const cachedValid = await redis.get(validCacheKey);
    if (cachedValid) {
      req.apiKey = JSON.parse(cachedValid);
      return next();
    }

    // 📦 Permanent store lookup
    const stored = await redis.get(storeKey);
    if (!stored) {
      // cache invalid
      await redis.setex(invalidCacheKey, 60, "1");
      return res.status(401).json({ error: "Invalid API key 3" });
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
