import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getConfig } from "./config/config.js";
import { parseCliEnvironmentArgument, stripEnvironmentArguments } from "./config/cli.js";

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

function startVite(argv) {
  const environment = parseCliEnvironmentArgument(argv);
  const viteArgs = stripEnvironmentArguments(argv);
  const config = getConfig(environment);

  process.env.VITE_DEV_SERVER_PORT = String(config.server.listeningPort);
  process.env.VITE_GRAPHQL_PROXY_TARGET = toGraphQLProxyTarget(config.api.graphqlApiUrl);
  process.env.VITE_GRAPHQL_URL = toGraphQLPath(config.api.graphqlApiUrl);
  process.env.VITE_GRAPHQL_WS_URL = toWebSocketUrl(config.api.graphqlApiUrl);

  const viteBinPath = resolve(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  const child = spawn(process.execPath, [viteBinPath, ...viteArgs], {
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
