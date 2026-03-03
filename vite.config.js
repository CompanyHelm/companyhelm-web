import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getConfig } from "./scripts/config/config.js";

const VITE_MODE_PREFIX = "companyhelm-";

function resolveEnvironmentMode(mode) {
  const normalizedMode = String(mode || "").trim();
  if (!normalizedMode) {
    throw new Error("Missing Vite mode/environment. Start Vite via scripts/vite.js --environment <name>.");
  }
  if (!normalizedMode.startsWith(VITE_MODE_PREFIX)) {
    throw new Error(
      `Invalid Vite mode "${normalizedMode}". Start Vite via scripts/vite.js --environment <name>.`
    );
  }
  const environment = normalizedMode.slice(VITE_MODE_PREFIX.length).trim();
  if (!environment) {
    throw new Error("Resolved empty environment from Vite mode.");
  }
  return environment;
}

export default defineConfig(({ mode }) => {
  const environment = resolveEnvironmentMode(mode);
  const config = getConfig(environment);

  return {
    plugins: [react()],
    server: {
      host: config.server.host,
      port: config.server.listeningPort,
    },
    preview: {
      host: config.server.host,
      port: config.server.listeningPort,
    },
  };
});
