import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Configure the same way your app does
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
 
});

async function checkRedis() {
  try {
    console.log("Redis connection options:", redis.options);

    const pong = await redis.ping();
    console.log("Ping response:", pong); // Should be 'PONG'

    const keys = await redis.keys("*");
    console.log("All keys in Redis:", keys);

    if (keys.length > 0) {
      for (const key of keys) {
        const value = await redis.get(key);
        console.log(key, "=>", value);
      }
    } else {
      console.log("No keys found in this Redis instance.");
    }

    await redis.quit();
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
}

checkRedis();
