import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { apiKeyAuth } from "./middleware/apiKeyAuth";

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

// Protected test route (Module 2 output)
app.get("/test", apiKeyAuth, (req, res) => {
  res.json({
    message: "API key authenticated",
    apiKeyData: req.apiKey
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
