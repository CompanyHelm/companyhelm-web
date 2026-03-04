#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";

const VITE_COMMANDS = new Set(["dev", "build", "preview"]);

function parseCliArgs(argv) {
  const args = [...argv];
  const viteCommand = args[0] || "dev";
  if (!VITE_COMMANDS.has(viteCommand)) {
    throw new Error(
      `Unsupported Vite command "${viteCommand}". Expected one of: ${[...VITE_COMMANDS].join(", ")}.`,
    );
  }

  let environment = "local";
  const passthrough = [];

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index];
    if (current === "--environment") {
      const nextValue = String(args[index + 1] || "").trim();
      if (!nextValue) {
        throw new Error("Missing value for --environment.");
      }
      environment = nextValue;
      index += 1;
      continue;
    }

    if (current.startsWith("--environment=")) {
      const value = current.slice("--environment=".length).trim();
      if (!value) {
        throw new Error("Missing value for --environment.");
      }
      environment = value;
      continue;
    }

    passthrough.push(current);
  }

  return {
    viteCommand,
    environment,
    passthrough,
  };
}

function runConfigGeneration(environment) {
  const result = spawnSync(
    "npm",
    ["run", "config:generate", "--", "--environment", environment],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runVite(viteCommand, passthrough) {
  const child = spawn(
    "npm",
    ["exec", "--", "vite", viteCommand, ...passthrough],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}

try {
  const { viteCommand, environment, passthrough } = parseCliArgs(process.argv.slice(2));
  runConfigGeneration(environment);
  runVite(viteCommand, passthrough);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[vite-wrapper] ${message}`);
  process.exit(1);
}
