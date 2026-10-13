import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const USER_SERVICE = process.env.USER_SERVICE;
const CHAT_SERVICE = process.env.CHAT_SERVICE;
const MAIL_SERVICE = process.env.MAIL_SERVICE;
const UTILI_SERVICE = process.env.UTILI_SERVICE;

// Render free services sleep after 15 min idle and can take ~60s to wake.
// Don't give up before that.
const COLD_START_TIMEOUT = 90_000;

// ================= CORS =================

app.use(
  cors({
    origin: "https://chat-app-wine-six-41.vercel.app",
    credentials: true,
  })
);

app.use(cookieParser());

// ================= HEALTH + WARMUP =================
// /health  -> use this in UptimeRobot / cron-job.org (keeps gateway awake)
// /warmup  -> wakes gateway AND all 4 services (frontend calls this on page load)

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/warmup", async (_req, res) => {
  const services = {
    user: USER_SERVICE,
    chat: CHAT_SERVICE,
    mail: MAIL_SERVICE,
    utilis: UTILI_SERVICE,
  };

  const results = {};

  await Promise.all(
    Object.entries(services).map(async ([name, url]) => {
      if (!url) {
        results[name] = "not configured";
        return;
      }
      try {
        const r = await fetch(`${url.replace(/\/+$/, "")}/health`, {
          signal: AbortSignal.timeout(COLD_START_TIMEOUT),
        });
        results[name] = r.status;
      } catch (err) {
        results[name] = `error: ${err.message}`;
      }
    })
  );

  res.json({ gateway: "ok", services: results });
});

// ================= REQUEST LOGGER =================

app.use((req, res, next) => {
  console.log("Gateway Request:", req.method, req.originalUrl);
  next();
});

// ================= SHARED PROXY OPTIONS =================
// NOTE: http-proxy-middleware v3/v4 ignores the old `onError` option.
// Errors must be handled via `on: { error }`, otherwise the default
// plain-text error is sent and the frontend can't parse it.

function proxyFor(name, target, extra = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: COLD_START_TIMEOUT,
    timeout: COLD_START_TIMEOUT,
    ...extra,
    on: {
      error: (err, _req, res) => {
        console.error(`${name} PROXY ERROR:`, err.message);

        // res can be a raw socket for websocket upgrades
        if (res && typeof res.writeHead === "function" && !res.headersSent) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "Service is waking up. Please try again in a few seconds.",
            })
          );
        } else if (res && typeof res.destroy === "function") {
          res.destroy();
        }
      },
    },
  });
}

// ================= USER SERVICE =================

app.use(
  "/api/user",
  proxyFor("USER SERVICE", USER_SERVICE, { cookieDomainRewrite: "" })
);

// ================= CHAT SERVICE =================

app.use("/api/chat", proxyFor("CHAT SERVICE", CHAT_SERVICE));

// ================= SOCKET.IO =================

const socketProxy = proxyFor("SOCKET", CHAT_SERVICE, { ws: true });

app.use("/socket.io", socketProxy);

// ================= MAIL SERVICE =================

app.use("/api/mail", proxyFor("MAIL SERVICE", MAIL_SERVICE));

// ================= UTILITY SERVICE =================

app.use("/api/upload", proxyFor("UTILITY SERVICE", UTILI_SERVICE));

export { socketProxy };
export default app;
