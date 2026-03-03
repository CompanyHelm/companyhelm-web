import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getConfig } from "./scripts/config/config.js";

function resolveEnvironmentMode(mode) {
  const normalizedMode = String(mode || "").trim();
  if (!normalizedMode) {
    throw new Error("Missing Vite mode/environment. Start Vite via scripts/vite.js --environment <name>.");
  }
  return normalizedMode;
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
