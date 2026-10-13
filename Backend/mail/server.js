// dotenv MUST be first: consumer.js reads GMAIL_* env at import time
import "dotenv/config";
import express from "express";
import {
  startSendOtpConsumer,
  startsendEmailLogin,
} from "./consumer.js";

const app = express();

const PORT = process.env.PORT || 2000;

app.get("/", (req, res) => {
  res.send("Mail Service is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start RabbitMQ consumers (they reconnect on their own)
startSendOtpConsumer();
startsendEmailLogin();
