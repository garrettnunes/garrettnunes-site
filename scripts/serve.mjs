// Tiny zero-dependency static server for local preview.
// Usage: npm run preview   (then open http://localhost:4321)
// Serves the repo root. Not for production — Render handles hosting.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve, join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || 4321;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp"
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    // prevent path traversal
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = join(target, "index.html");
    } catch {
      // try 404 page, else plain 404
      try {
        const body = await readFile(join(root, "404.html"));
        res.writeHead(404, { "Content-Type": TYPES[".html"] }).end(body);
      } catch {
        res.writeHead(404).end("Not found");
      }
      return;
    }
    const body = await readFile(target);
    const type = TYPES[extname(target)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type }).end(body);
  } catch (err) {
    res.writeHead(500).end("Server error");
  }
});

server.listen(port, () => {
  console.log(`\n  garrettnunes-site preview running:`);
  console.log(`  ->  http://localhost:${port}\n`);
  console.log("  Press Ctrl+C to stop.\n");
});
