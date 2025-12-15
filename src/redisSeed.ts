import redis from "./redis/redis";
import { hashApiKey } from "./utils/hash";
import dotenv from "dotenv";
dotenv.config();
async function seed() {
  const studentKey = "sk_student_123";
  const adminKey = "sk_admin_456";
  const studentHash =  hashApiKey(studentKey);
  const adminHash =  hashApiKey(adminKey);
    console.log(studentHash)
  await redis.set(`apikey:store:${studentHash}`, JSON.stringify({
    owner: "student-service",
    roles: ["read"],
    isActive: true
  }));
  await redis.set(`apikey:store:${adminHash}`, JSON.stringify({
    owner: "admin-service",
    roles: ["read", "write"],
    isActive: true
  }));
  // Optional invalid key cache
  const invalidKey = "sk_invalid_999";
  const invalidHash =  hashApiKey(invalidKey);
  await redis.set(`apikey:cache:invalid:${invalidHash}`, "1");

  console.log("Keys inserted");
  process.exit(0);
}

seed();
