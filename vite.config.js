import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const graphqlProxyTarget = process.env.VITE_GRAPHQL_PROXY_TARGET || "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/graphql": {
        target: graphqlProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
