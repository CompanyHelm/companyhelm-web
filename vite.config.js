import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const serverHost = process.env.VITE_DEV_SERVER_HOST || "127.0.0.1";
const parsedServerPort = Number.parseInt(process.env.VITE_DEV_SERVER_PORT || "5173", 10);
const serverPort = Number.isInteger(parsedServerPort) && parsedServerPort > 0 ? parsedServerPort : 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    host: serverHost,
    port: serverPort,
  },
  preview: {
    host: serverHost,
    port: serverPort,
  },
});
