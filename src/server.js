// src/server.js
import http from "node:http";
import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { handleOptions, sendJson } from "./utils/http.js";
import { handleNoticeCompute } from "./routes/notice.js";

const PORT = process.env.PORT || 5174;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// projectRoot/src/server.js -> projectRoot/public
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

/**
 * Serve files out of /public (single source of truth):
 *  - GET /        -> /pitch.html
 *  - GET /pitch   -> /pitch.html
 *  - GET /app     -> /index.html
 *  - GET /styles.css, /app.js, /crownfoundrysoftware.png, etc.
 */
function tryServeStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  let pathname = url.pathname;

  // Normalize routes (landing-first)
  if (pathname === "/") pathname = "/pitch.html";
  if (pathname === "/pitch") pathname = "/pitch.html";
  if (pathname === "/app") pathname = "/index.html";

  // Build absolute path inside PUBLIC_DIR
  const filePath = path.resolve(PUBLIC_DIR, "." + pathname);

  // Prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) return false;

  // Must exist and be a file
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return false;

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType(filePath));

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  fs.createReadStream(filePath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  // Handle preflight requests (CORS)
  if (handleOptions(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (req.method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      service: "timeline-app",
      time: new Date().toISOString(),
    });
  }

  // Static frontend (must come BEFORE API fallthrough)
  // This now serves /, /pitch, /app, and all /public assets.
  if (tryServeStatic(req, res, url)) return;

  // Notice compute API
  if (await handleNoticeCompute(req, res, url)) return;

  // Fallback
  return sendJson(res, 404, {
    ok: false,
    error: "Not found",
    path: url.pathname,
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});