import React from "react";
import ReactDOM from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import App from "./App";
import { relayEnvironment } from "./relay/environment.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RelayEnvironmentProvider environment={relayEnvironment}>
      <App />
    </RelayEnvironmentProvider>
  </React.StrictMode>,
);
