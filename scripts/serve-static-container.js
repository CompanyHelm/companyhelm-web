#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isMissingAssetPath(pathname) {
  return pathname.startsWith("/assets/") || extname(pathname) !== "";
}

async function fileExists(path) {
  try {
    const fileStats = await stat(path);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

function resolveRequestFile(rootDir, pathname) {
  const rootPath = resolve(rootDir);
  const relativePath = normalize(pathname.replace(/^\/+/, ""));
  const candidatePath = pathname.endsWith("/") || pathname === ""
    ? join(relativePath, "index.html")
    : relativePath;
  const resolvedPath = resolve(rootPath, candidatePath);

  if (resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}${sep}`)) {
    return null;
  }

  return resolvedPath;
}

async function sendFile(response, filePath, method) {
  const extension = extname(filePath);
  response.statusCode = 200;
  response.setHeader("content-type", MIME_TYPES[extension] || "application/octet-stream");

  if (method === "HEAD") {
    response.end();
    return;
  }

  await new Promise((resolvePromise, rejectPromise) => {
    const stream = createReadStream(filePath);
    stream.on("error", rejectPromise);
    response.on("close", resolvePromise);
    stream.pipe(response);
  });
}

export function createStaticRequestHandler(rootDir) {
  const rootPath = resolve(rootDir);
  const indexPath = join(rootPath, "index.html");

  return async (request, response) => {
    const method = request.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      response.statusCode = 405;
      response.end();
      return;
    }

    const url = new URL(request.url || "/", "http://localhost");
    const requestPath = resolveRequestFile(rootPath, decodeURIComponent(url.pathname));
    if (!requestPath) {
      response.statusCode = 400;
      response.end();
      return;
    }

    if (await fileExists(requestPath)) {
      await sendFile(response, requestPath, method);
      return;
    }

    if (isMissingAssetPath(url.pathname) || !(await fileExists(indexPath))) {
      response.statusCode = 404;
      response.end();
      return;
    }

    await sendFile(response, indexPath, method);
  };
}

export function parseServePortArgument(argv = process.argv.slice(2)) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--port") {
      return argv[index + 1] || null;
    }
    if (argument.startsWith("--port=")) {
      return argument.slice("--port=".length) || null;
    }
  }

  return process.env.PORT || "4173";
}

export async function startStaticServer({ rootDir, port, host = "0.0.0.0" }) {
  const server = createServer((request, response) => {
    void createStaticRequestHandler(rootDir)(request, response).catch((error) => {
      response.statusCode = 500;
      response.end();
      console.error(error instanceof Error ? error.message : String(error));
    });
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, host, () => {
      server.off("error", rejectPromise);
      resolvePromise();
    });
  });

  return server;
}

export async function main(argv = process.argv.slice(2)) {
  const rawPort = parseServePortArgument(argv);
  if (!/^\d+$/.test(String(rawPort))) {
    throw new Error(`Invalid --port value "${rawPort}". Expected a numeric TCP port.`);
  }

  const port = Number(rawPort);
  if (port < 0 || port > 65535) {
    throw new Error(`Invalid --port value "${rawPort}". Expected a value between 0 and 65535.`);
  }

  const rootDir = join(process.cwd(), "dist");
  await startStaticServer({ rootDir, port, host: "0.0.0.0" });
}

const isMainModule = process.argv[1]
  ? import.meta.url === new URL(`file://${process.argv[1]}`).href
  : false;

if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
