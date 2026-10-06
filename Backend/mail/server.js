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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start RabbitMQ consumers
startSendOtpConsumer();
startsendEmailLogin();