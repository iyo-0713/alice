import http from "node:http";
import path from "node:path";
import { createReadStream, promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

import { createRequestListener } from "@react-router/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "build", "client");
const parsedPort = Number.parseInt(process.env.PORT ?? "5173", 10);
const port = Number.isNaN(parsedPort) ? 5173 : parsedPort;

const rawApiBaseUrl = process.env.API_BASE_URL?.trim();
let apiBaseUrl;
if (rawApiBaseUrl) {
  try {
    apiBaseUrl = new URL(rawApiBaseUrl);
  } catch {
    console.error(`Invalid API_BASE_URL: ${rawApiBaseUrl}`);
  }
}

const build = await import("./build/server/index.js");
const requestListener = createRequestListener({
  build,
  mode: process.env.NODE_ENV ?? "production"
});

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const getPathname = (req) => {
  if (!req.url) {
    return null;
  }

  try {
    return new URL(req.url, "http://localhost").pathname;
  } catch {
    return null;
  }
};

const resolveClientPath = (pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const resolved = path.resolve(clientDir, `.${decoded}`);
  if (resolved === clientDir || !resolved.startsWith(`${clientDir}${path.sep}`)) {
    return null;
  }

  return resolved;
};

const serveStatic = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }

  const pathname = getPathname(req);
  if (!pathname || pathname === "/" || pathname.endsWith("/")) {
    return false;
  }

  const filePath = resolveClientPath(pathname);
  if (!filePath) {
    return false;
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return false;
  }

  if (!stat.isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext];
  if (contentType) {
    res.setHeader("Content-Type", contentType);
  }

  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }

  res.statusCode = 200;

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
};

const readRequestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks);
};

const proxyDialogue = async (req, res) => {
  const pathname = getPathname(req);
  if (pathname !== "/dialogue") {
    return false;
  }

  if (!apiBaseUrl) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "API_BASE_URL is not set" }));
    return true;
  }

  const method = req.method ?? "GET";
  const targetUrl = new URL(apiBaseUrl);
  const basePath = targetUrl.pathname.replace(/\/$/, "");
  targetUrl.pathname = `${basePath}/dialogue`;

  const incomingUrl = new URL(req.url ?? "", "http://localhost");
  targetUrl.search = incomingUrl.search;

  const hopByHop = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade"
  ]);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) {
      continue;
    }
    const lowerKey = key.toLowerCase();
    if (hopByHop.has(lowerKey) || lowerKey === "host") {
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }
  headers.delete("content-length");

  let body;
  if (method !== "GET" && method !== "HEAD") {
    body = await readRequestBody(req);
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (hopByHop.has(key.toLowerCase())) {
        return;
      }
      res.setHeader(key, value);
    });

    if (method === "HEAD") {
      res.end();
      return true;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
    return true;
  } catch (error) {
    console.error(error);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "API request failed" }));
    return true;
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (await proxyDialogue(req, res)) {
      return;
    }
    if (await serveStatic(req, res)) {
      return;
    }
    requestListener(req, res);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`server listening on ${port}`);
});
