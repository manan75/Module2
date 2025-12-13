import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
 
});

async function listKeys() {
  const keys = await redis.keys("apikey:*");
  console.log("Keys in Redis:", keys);

  for (const key of keys) {
    const value = await redis.get(key);
    console.log(key, "=>", value);
  }

  process.exit(0);
}

listKeys();
