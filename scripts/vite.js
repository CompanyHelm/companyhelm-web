import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getConfig } from "./config/config.js";
import { parseCliEnvironmentArgument, stripEnvironmentArguments } from "./config/cli.js";

const allowedViteCommands = new Set(["dev", "build", "preview"]);

function toWebSocketUrl(graphqlApiUrl) {
  const parsed = new URL(graphqlApiUrl);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString();
}

function toGraphQLProxyTarget(graphqlApiUrl) {
  const parsed = new URL(graphqlApiUrl);
  return `${parsed.protocol}//${parsed.host}`;
}

function toGraphQLPath(graphqlApiUrl) {
  const parsed = new URL(graphqlApiUrl);
  return parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/graphql";
}

export function resolveViteCommand(argv) {
  const command = String(argv[0] || "").trim();
  const extraArgs = argv.slice(1).filter(Boolean);
  const unsupportedArgs = stripEnvironmentArguments(extraArgs);

  if (!command) {
    throw new Error("Missing Vite command. Expected one of: dev, build, preview.");
  }
  if (!allowedViteCommands.has(command)) {
    throw new Error(`Unsupported Vite command "${command}". Expected one of: dev, build, preview.`);
  }
  if (unsupportedArgs.length > 0) {
    throw new Error(
      "Vite CLI options are disabled. Configure host/port/API values in config/<environment>.yaml."
    );
  }

  return command;
}

function startVite(argv) {
  const viteCommand = resolveViteCommand(argv);
  const environment = parseCliEnvironmentArgument(argv.slice(1));
  const config = getConfig(environment);

  process.env.VITE_DEV_SERVER_HOST = config.server.host;
  process.env.VITE_DEV_SERVER_PORT = String(config.server.listeningPort);
  process.env.VITE_GRAPHQL_PROXY_TARGET = toGraphQLProxyTarget(config.api.graphqlApiUrl);
  process.env.VITE_GRAPHQL_URL = toGraphQLPath(config.api.graphqlApiUrl);
  process.env.VITE_GRAPHQL_WS_URL = toWebSocketUrl(config.api.graphqlApiUrl);
  process.env.VITE_AUTH_PROVIDER = config.authProvider;
  process.env.VITE_COMPANYHELM_TOKEN_STORAGE_KEY = config.auth.companyhelm.tokenStorageKey;
  process.env.VITE_SUPABASE_TOKEN_STORAGE_KEY = config.auth.supabase.tokenStorageKey;
  process.env.VITE_SUPABASE_URL = config.auth.supabase.url;
  process.env.VITE_SUPABASE_ANON_KEY = config.auth.supabase.anonKey;

  const viteBinPath = resolve(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteBinPath, viteCommand], {
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exitCode = code ?? 0;
  });
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  startVite(process.argv.slice(2));
}
