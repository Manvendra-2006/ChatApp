import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const USER_SERVICE = process.env.USER_SERVICE;
const CHAT_SERVICE = process.env.CHAT_SERVICE;
const MAIL_SERVICE = process.env.MAIL_SERVICE;
const UTILI_SERVICE = process.env.UTILI_SERVICE;

// ================= CORS =================

app.use(
  cors({
    origin: "https://chat-app-wine-six-41.vercel.app",
    credentials: true,
  })
);

app.use(cookieParser());

// ================= REQUEST LOGGER =================

app.use((req, res, next) => {
  console.log("Gateway Request:", req.method, req.originalUrl);
  next();
});

// ================= USER SERVICE =================

app.use(
  "/api/user",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    cookieDomainRewrite: "",

    onError: (err, req, res) => {
      console.error("USER SERVICE PROXY ERROR:", err.message);
    },
  })
);

// ================= CHAT SERVICE =================

app.use(
  "/api/chat",
  createProxyMiddleware({
    target: CHAT_SERVICE,
    changeOrigin: true,

    onError: (err, req, res) => {
      console.error("CHAT SERVICE PROXY ERROR:", err.message);
    },
  })
);

// ================= SOCKET.IO =================

const socketProxy = createProxyMiddleware({
  target: CHAT_SERVICE,
  changeOrigin: true,
  ws: true,

  onError: (err, req, res) => {
    console.error("SOCKET PROXY ERROR:", err.message);
  },
});

app.use("/socket.io", socketProxy);

// ================= MAIL SERVICE =================

app.use(
  "/api/mail",
  createProxyMiddleware({
    target: MAIL_SERVICE,
    changeOrigin: true,

    onError: (err, req, res) => {
      console.error("MAIL SERVICE PROXY ERROR:", err.message);
    },
  })
);

// ================= UTILITY SERVICE =================

app.use(
  "/api/upload",
  createProxyMiddleware({
    target: UTILI_SERVICE,
    changeOrigin: true,

    onError: (err, req, res) => {
      console.error("UTILITY SERVICE PROXY ERROR:", err.message);
    },
  })
);

export { socketProxy };
export default app;
