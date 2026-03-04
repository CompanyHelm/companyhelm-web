import React from "react";
import ReactDOM from "react-dom/client";
import { clearConfigCache } from "./config/config.ts";
import "./index.css";

async function loadRuntimeConfig() {
  const response = await fetch("/config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to load runtime config from /config.json (HTTP ${response.status}).`
    );
  }
  const runtimeConfig = await response.json();
  window.__COMPANYHELM_CONFIG__ = runtimeConfig;
  clearConfigCache();
}

function renderFatalBootstrapError(error: any) {
  const message = error instanceof Error ? error.message : String(error);
  const rootNode = document.getElementById("root");
  if (!rootNode) {
    throw new Error("Missing #root element.");
  }

  ReactDOM.createRoot(rootNode).render(
    <React.StrictMode>
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <h1>Failed to start CompanyHelm frontend</h1>
        <p>Runtime configuration could not be loaded.</p>
        <pre style={{ whiteSpace: "pre-wrap", background: "#f6f8fa", padding: "12px" }}>
          {message}
        </pre>
      </div>
    </React.StrictMode>,
  );
}

async function bootstrap() {
  await loadRuntimeConfig();

  const [{ RelayEnvironmentProvider }, { default: App }, { default: AuthGate }, { relayEnvironment }] =
    await Promise.all([
      import("react-relay"),
      import("./App.tsx"),
      import("./auth/AuthGate.tsx"),
      import("./relay/environment.ts"),
    ]);

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <RelayEnvironmentProvider environment={relayEnvironment}>
        <AuthGate>
          <App />
        </AuthGate>
      </RelayEnvironmentProvider>
    </React.StrictMode>,
  );
}

bootstrap().catch((error: any) => {
  console.error(error);
  renderFatalBootstrapError(error);
});
