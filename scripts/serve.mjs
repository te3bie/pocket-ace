import { networkInterfaces } from "node:os";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const root = resolve("dist"),
  port = Number(process.env.PORT || 8081);
const lan = process.argv.includes("--lan");
const host = lan ? "0.0.0.0" : "127.0.0.1";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = resolve(root, "." + pathname);
    if (!file.startsWith(root + "/") && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (pathname.endsWith("/")) file = resolve(file, "index.html");
    try {
      if (!(await stat(file)).isFile()) throw new Error();
    } catch {
      file = extname(file) ? file : file + ".html";
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page not found.");
  }
}).listen(port, host, () => {
  console.log(`Pocket Ace preview: http://localhost:${port}`);
  if (lan) {
    console.log(
      "Connect your phone to the same Wi-Fi, then open one of these addresses:",
    );
    for (const addresses of Object.values(networkInterfaces()))
      for (const address of addresses || [])
        if (address.family === "IPv4" && !address.internal)
          console.log(`  http://${address.address}:${port}`);
  }
});
