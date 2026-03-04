import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = [...argv];
  const command = args[0] || "dev";
  let environment = command === "dev" ? "local" : "prod";
  const forwarded = [command];

  for (let index = 1; index < args.length; index += 1) {
    const argument = String(args[index] || "");
    if (argument === "--environment") {
      environment = String(args[index + 1] || "").trim() || environment;
      index += 1;
      continue;
    }
    if (argument.startsWith("--environment=")) {
      const value = argument.slice("--environment=".length).trim();
      if (value) {
        environment = value;
      }
      continue;
    }
    forwarded.push(argument);
  }

  return {
    command,
    environment,
    forwarded,
  };
}

function runRuntimeConfigGeneration(environment) {
  const tsxCliPath = resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const configScriptPath = resolve(process.cwd(), "scripts", "config", "generate-runtime-config.js");
  const result = spawnSync(
    process.execPath,
    [tsxCliPath, configScriptPath, "--environment", environment],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runVite(commandArgs) {
  const viteCliPath = resolve(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteCliPath, ...commandArgs], {
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (typeof code === "number") {
      process.exit(code);
    }
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(1);
  });
}

const { environment, forwarded } = parseArgs(process.argv.slice(2));
runRuntimeConfigGeneration(environment);
runVite(forwarded);
