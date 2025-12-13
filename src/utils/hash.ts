/*
@file hash.ts
@description
Utility function to hash API keys using SHA-256 with a secret.
Module: API Key Authentication (Module 2)
*/

import crypto from "crypto";


export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey + process.env.KEY_SECRET!)
    .digest("hex");
}
