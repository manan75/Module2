/*
 * @file apiKeyAuth.ts
 * @description
 * Middleware responsible for validating API keys.
 * It checks Redis cache first and falls back to MongoDB if needed.
 * Invalid keys are also cached to prevent abuse.
 *
 * Module: API Key Authentication (Module 2)
 */

import { Request, Response, NextFunction } from "express";
import redis from "../redis/redis";
import ApiKey from "../models/ApiKey";
import { hashApiKey } from "../utils/hash";
import { log } from "node:console";
// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        roles: string[];
        owner: string;
      };
    }
  }
}
export async function apiKeyAuth(
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
    // Check cached invalid key
    const invalid = await redis.get(`apikey:invalid:${keyHash}`);
    if (invalid) {
      console.log("Cached invalid key hit:", keyHash);
      return res.status(401).json({ error: "Invalid API key" });
    }
    //  Check cached valid key
    const cached = await redis.get(`apikey:valid:${keyHash}`);
    if (cached) {
      console.log("Cached valid key hit:", keyHash);
      req.apiKey = JSON.parse(cached);
      return next();
    }
    //  MongoDB lookup
    const apiKeyDoc = await ApiKey.findOne({
      keyHash,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    }).lean();
    if (!apiKeyDoc) {
      // Cache invalid key
      console.log("Caching invalid key:", keyHash);
      await redis.setex(`apikey:invalid:${keyHash}`, 300, "1");
      return res.status(401).json({ error: "Invalid API key" });
    }
    const payload = {
      roles: apiKeyDoc.roles,
      owner: apiKeyDoc.owner
    };
    // Cache valid key
    await redis.setex(
      `apikey:valid:${keyHash}`,
      900,
      JSON.stringify(payload)
    )
    req.apiKey = payload;
    next();
  } catch (err) {
    console.error("API key auth error:", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
}
