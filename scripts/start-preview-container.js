#!/usr/bin/env node

import { spawn } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PORT = "4173";

export function resolveContainerConfigPath(env = process.env) {
  const resolvedPath = String(env.COMPANYHELM_CONFIG_PATH || "").trim();
  if (!resolvedPath) {
    throw new Error(
      "Missing COMPANYHELM_CONFIG_PATH. Container startup requires an explicit runtime config path.",
    );
  }

  return resolvedPath;
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

export function buildPreviewBuildCommandArgs(configPath) {
  return ["scripts/vite.js", "build", "--config-path", configPath];
}

export function buildPreviewServeCommandArgs(port) {
  return ["run", "--config", join(process.cwd(), "Caddyfile"), "--adapter", "caddyfile"];
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
  const configPath = resolveContainerConfigPath(env);
  const port = resolvePreviewPort(env);

  await runCommand(process.execPath, buildPreviewBuildCommandArgs(configPath));
  await runCommand("caddy", buildPreviewServeCommandArgs(port));
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
