import React from "react";
import ReactDOM from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import App from "./App";
import AuthGate from "./auth/AuthGate.jsx";
import { relayEnvironment } from "./relay/environment.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <AuthGate>
        <App />
      </AuthGate>
    </RelayEnvironmentProvider>
  </React.StrictMode>,
);
