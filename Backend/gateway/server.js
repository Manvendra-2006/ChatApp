import "dotenv/config";
import http from "http";
import app, { socketProxy } from "./app.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.on("upgrade", socketProxy.upgrade);

server.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});