#!/usr/bin/env node

import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { normalizeEnvironment } from "./config/generate-runtime-config.js";

const DEFAULT_PORT = "4173";

export function resolveContainerEnvironment(env = process.env) {
  return normalizeEnvironment(env.COMPANYHELM_ENVIRONMENT || "prod");
}

export function resolvePreviewPort(env = process.env) {
  const rawValue = String(env.PORT || DEFAULT_PORT).trim();
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`Invalid PORT "${rawValue}". Expected a numeric TCP port.`);
  }

  const port = Number(rawValue);
  if (port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${rawValue}". Expected a value between 1 and 65535.`);
  }

  return rawValue;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} exited with status ${code ?? 1}.`));
        return;
      }
      resolve();
    });
  });
}

export async function main(env = process.env) {
  const environment = resolveContainerEnvironment(env);
  const port = resolvePreviewPort(env);

  await runCommand(process.execPath, ["scripts/vite.js", "build", "--environment", environment]);
  await runCommand("npm", ["exec", "--", "vite", "preview", "--host", "0.0.0.0", "--port", port]);
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
