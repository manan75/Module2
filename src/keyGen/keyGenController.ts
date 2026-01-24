/*
    @description: Controller for generating and managing API keys
    the code handles the generation of secure API keys, validation of permissions,
    and storage of hashed keys in Redis.
    
    Format of api keys: sk_live_<random_string>

    Module: API Key Authentication (Module 2)
    
*/

import { Request, Response } from "express";
import redis from "../redis/redis";
import crypto from "crypto";
import { hashApiKey } from "../utils/hash";

type Permission =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "view"
  | "manage"
  | "export";

const ALLOWED_PERMISSIONS: Permission[] = [
  "create",
  "read",
  "update",
  "delete",
  "view",
  "manage",
  "export"
];

// Generate raw API key
function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString("hex");
  return `sk_live_${random}`;
}

export async function generateApiKeyHandler(
  req: Request,
  res: Response
) {
  try {
    const { permissions } = req.body;

    //  Validate input
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        error: "permissions must be a non-empty array"
      });
    }

    //  Validate permissions
    for (const perm of permissions) {
      if (!ALLOWED_PERMISSIONS.includes(perm)) {
        return res.status(400).json({
          error: `Invalid permission: ${perm}`
        });
      }
    }

    // 3 Generate key
    const rawKey = generateApiKey();
    const hashedKey = hashApiKey(rawKey);

    // 4️ Store in Redis
    await redis.set(
      `apikey:store:${hashedKey}`,
      JSON.stringify({
        permissions,
        isActive: true,
        createdAt: new Date().toISOString()
      })
    );

    // 5️ Return raw key (ONLY ONCE)
    return res.status(201).json({
      apiKey: rawKey,
      permissions
    });

  } catch (err) {
    console.error("API key generation failed:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
