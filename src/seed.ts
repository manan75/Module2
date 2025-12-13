import mongoose from "mongoose";
import dotenv from "dotenv";
import ApiKey from "./models/ApiKey";
import { hashApiKey } from "./utils/hash";i
//this file is used to seed initial API keys into the database for testing purposes
//make sure to run this only in development or test environments
dotenv.config();
async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  const keys = [
    {
      rawKey: "sk_test_payment_123456",
      owner: "payment-service",
      roles: ["PAYMENTS"]
    },
    {
      rawKey: "sk_test_analytics_abcdef",
      owner: "analytics-service",
      roles: ["READ"]
    }
  ];
  for (const key of keys) {
    const keyHash = hashApiKey(key.rawKey);
    await ApiKey.create({
      keyHash,
      owner: key.owner,
      roles: key.roles,
      isActive: true
    });
    console.log(`Inserted key for ${key.owner}`);
  }
  console.log("Seeding done");
  process.exit(0);
}
seed().catch(console.error);
