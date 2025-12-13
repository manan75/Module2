/*
@file ApiKey.ts
@description
Mongoose model for storing API keys.
Includes fields for key hash, roles, owner, active status, and timestamps.
Module: API Key Authentication (Module 2)

*/
import mongoose, { Schema, Document } from "mongoose";

export interface IApiKey extends Document {
  keyHash: string;
  roles: string[];
  owner: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  keyHash: { type: String, required: true, unique: true },
  roles: { type: [String], required: true },
  owner: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
