import http from "node:http";
import path from "node:path";
import { createReadStream, promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

import { createRequestListener } from "@react-router/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "build", "client");
const parsedPort = Number.parseInt(process.env.PORT ?? "5173", 10);
const port = Number.isNaN(parsedPort) ? 5173 : parsedPort;
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_MAX_BODY_CHUNKS = 1024;
const parsedMaxBodyBytes = Number.parseInt(
  process.env.MAX_BODY_BYTES ?? "",
  10
);
const parsedMaxBodyChunks = Number.parseInt(
  process.env.MAX_BODY_CHUNKS ?? "",
  10
);
const maxBodyBytes =
  Number.isFinite(parsedMaxBodyBytes) && parsedMaxBodyBytes > 0
    ? parsedMaxBodyBytes
    : DEFAULT_MAX_BODY_BYTES;
const maxBodyChunks =
  Number.isFinite(parsedMaxBodyChunks) && parsedMaxBodyChunks > 0
    ? parsedMaxBodyChunks
    : DEFAULT_MAX_BODY_CHUNKS;

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

class RequestBodyTooLargeError extends Error {
  statusCode = 413;
  constructor(message) {
    super(message);
    this.name = "RequestBodyTooLargeError";
  }
}

const readRequestBody = async (req, limits) => {
  const chunks = [];
  let totalBytes = 0;
  let chunkCount = 0;
  for await (const chunk of req) {
    chunkCount += 1;
    if (chunkCount > limits.maxChunks) {
      throw new RequestBodyTooLargeError("Request body too large");
    }
    if (typeof chunk === "string") {
      const buffer = Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > limits.maxBytes) {
        throw new RequestBodyTooLargeError("Request body too large");
      }
      chunks.push(buffer);
    } else {
      totalBytes += chunk.length;
      if (totalBytes > limits.maxBytes) {
        throw new RequestBodyTooLargeError("Request body too large");
      }
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks);
};

const proxyDialogue = async (req, res) => {
  const pathname = getPathname(req);
  if (!pathname) {
    return false;
  }
  if (pathname !== "/dialogue" && !pathname.startsWith("/dialogue/")) {
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
  targetUrl.pathname = `${basePath}${pathname}`;

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
  // Body is reassembled, so the original content-length may be incorrect.
  headers.delete("content-length");

  let body;
  if (method !== "GET" && method !== "HEAD") {
    const contentLength = req.headers["content-length"];
    if (contentLength) {
      const parsedLength = Number.parseInt(contentLength, 10);
      if (Number.isFinite(parsedLength) && parsedLength > maxBodyBytes) {
        res.statusCode = 413;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Request body too large" }));
        return true;
      }
    }

    try {
      body = await readRequestBody(req, {
        maxBytes: maxBodyBytes,
        maxChunks: maxBodyChunks
      });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        res.statusCode = error.statusCode;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: error.message }));
        req.destroy();
        return true;
      }
      throw error;
    }
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
