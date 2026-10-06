import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const USER_SERVICE = process.env.USER_SERVICE;
const CHAT_SERVICE = process.env.CHAT_SERVICE;
const MAIL_SERVICE = process.env.MAIL_SERVICE;
const UTILI_SERVICE = process.env.UTILI_SERVICE;

app.use(
  cors({
    origin: "https://chat-app-wine-six-41.vercel.app",
    credentials: true,
  })
);

app.use(cookieParser());

// User Service
app.use(
  "/api/user",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    cookieDomainRewrite: "",
  })
);

// Chat Service
app.use(
  "/api/chat",
  createProxyMiddleware({
    target: CHAT_SERVICE,
    changeOrigin: true,
  })
);

// Mail Service
app.use(
  "/api/mail",
  createProxyMiddleware({
    target: MAIL_SERVICE,
    changeOrigin: true,
  })
);

// Utility Service
app.use(
  "/api/upload",
  createProxyMiddleware({
    target: UTILI_SERVICE,
    changeOrigin: true,
  })
);

export default app;