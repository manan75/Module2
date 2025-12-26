/*
@file app.ts
@description
Main application entry point.
Sets up Express server, connects to MongoDB, and defines routes.
Module: API Key Authentication (Module 2)

*/
import express from "express";
//import mongoose from "mongoose";
import dotenv from "dotenv";
//import { apiKeyAuth } from "./middleware/apiKeyAuth";
import { redisMiddleware } from "./middleware/redisMiddleware";

dotenv.config();
const app = express();
app.use(express.json());

// MongoDB connection
/*
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });
*/
// Protected test route (Module 2 output)
app.get("/test", redisMiddleware, (req, res) => {
  res.json({
    message: "API key authenticated",
    apiKeyData: req.apiKey
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
