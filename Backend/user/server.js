import "dotenv/config";
import app from "./app.js";

import { connectDb } from "./config/db.js";
import { createClient } from "redis";
import { connectRabbitMQ } from "./config/rabbitmq.js";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.log("Redis error:", error.message);
});

async function startServer() {
  try {
    // Connect MongoDB
    await connectDb();
    console.log("MongoDB connected");

    // Connect RabbitMQ
    await connectRabbitMQ();

    // Connect Redis
    await redisClient.connect();
    console.log("Connected to redis");

    // Start Express server only after
    // DB + RabbitMQ + Redis are ready
    app.listen(process.env.PORT, () => {
      console.log(
        `Server is running on port ${process.env.PORT}`
      );
    });

  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();