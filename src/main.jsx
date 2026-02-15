import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LandingPage from "./LandingPage";
import "./index.css";

const APP_HASH_ROUTES = new Set([
  "#dashboard",
  "#tasks",
  "#skills",
  "#agent-runner",
  "#agents",
  "#chat",
  "#settings",
  "#profile",
]);

function shouldRenderConsoleApp() {
  const hash = window.location.hash.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  return (
    searchParams.get("app") === "1" ||
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    APP_HASH_ROUTES.has(hash)
  );
}

const RootComponent = shouldRenderConsoleApp() ? App : LandingPage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
);
