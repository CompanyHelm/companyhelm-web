import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const serverHost = process.env.VITE_DEV_SERVER_HOST || "127.0.0.1";
const graphqlProxyTarget = process.env.VITE_GRAPHQL_PROXY_TARGET || "http://127.0.0.1:4000";
const parsedServerPort = Number.parseInt(process.env.VITE_DEV_SERVER_PORT || "5173", 10);
const serverPort = Number.isInteger(parsedServerPort) && parsedServerPort > 0 ? parsedServerPort : 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    host: serverHost,
    port: serverPort,
    proxy: {
      "/graphql": {
        target: graphqlProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: serverHost,
    port: serverPort,
  },
});
