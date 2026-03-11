#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const DEFAULT_CONFIG_PATH = "config/local.yaml";
const VITE_COMMANDS = new Set(["dev", "build", "preview"]);

export function parseCliArgs(argv) {
  const args = [...argv];
  const viteCommand = args[0] || "dev";
  if (!VITE_COMMANDS.has(viteCommand)) {
    throw new Error(
      `Unsupported Vite command "${viteCommand}". Expected one of: ${[...VITE_COMMANDS].join(", ")}.`,
    );
  }

  let configPath = DEFAULT_CONFIG_PATH;
  const passthrough = [];

  for (let index = 1; index < args.length; index += 1) {
    const current = String(args[index] || "").trim();
    if (!current) {
      continue;
    }

    if (current === "--environment" || current.startsWith("--environment=")) {
      throw new Error("--environment is no longer supported. Use --config-path instead.");
    }

    if (current === "--config-path") {
      const nextValue = String(args[index + 1] || "").trim();
      if (!nextValue) {
        throw new Error("Missing value for --config-path.");
      }
      configPath = nextValue;
      index += 1;
      continue;
    }

    if (current.startsWith("--config-path=")) {
      const value = current.slice("--config-path=".length).trim();
      if (!value) {
        throw new Error("Missing value for --config-path.");
      }
      configPath = value;
      continue;
    }

    passthrough.push(current);
  }

  return {
    viteCommand,
    configPath,
    passthrough,
  };
}

export function buildConfigGenerateArgs(configPath) {
  return ["run", "config:generate", "--", "--config-path", configPath];
}

function runConfigGeneration(configPath) {
  const result = spawnSync("npm", buildConfigGenerateArgs(configPath), {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runVite(viteCommand, passthrough) {
  const child = spawn("npm", ["exec", "--", "vite", viteCommand, ...passthrough], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  try {
    const { viteCommand, configPath, passthrough } = parseCliArgs(process.argv.slice(2));
    runConfigGeneration(configPath);
    runVite(viteCommand, passthrough);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[vite-wrapper] ${message}`);
    process.exit(1);
  }
}
