import {
  DEFAULT_GITHUB_APP_INSTALL_URL,
  GITHUB_INSTALL_CALLBACK_PATH,
  PAGE_IDS,
  NAV_ITEMS,
} from "./constants.js";

export function normalizePathname(rawPathname) {
  const trimmed = String(rawPathname || "").trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const cleanPath = trimmed.replace(/^\/+|\/+$/g, "");
  return cleanPath ? `/${cleanPath}` : "/";
}

export function getPageFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).toLowerCase().split("/").filter(Boolean);
  const pageId = segments[0] || "";
  if (pageId && PAGE_IDS.has(pageId)) {
    return pageId;
  }
  if (pageId === "gitskillpackages") {
    return "gitskillpackages";
  }
  if (pageId === "agents") {
    return "agents";
  }
  return NAV_ITEMS[0].id;
}

export function parseGithubInstallCallbackFromLocation() {
  const normalizedPath = String(window.location.pathname || "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== GITHUB_INSTALL_CALLBACK_PATH) {
    return null;
  }

  const params = new URLSearchParams(window.location.search || "");
  const installationId = String(params.get("installation_id") || "").trim();
  const setupAction = String(params.get("setup_action") || "").trim();
  const state = String(params.get("state") || "").trim();
  return { installationId, setupAction, state };
}

export function clearGithubInstallCallbackFromLocation() {
  setBrowserPath("/settings", { replace: true });
}

export function buildGithubAppInstallUrl({ appLink, companyId }) {
  const resolvedAppLink = String(appLink || "").trim() || DEFAULT_GITHUB_APP_INSTALL_URL;
  const resolvedCompanyId = String(companyId || "").trim();

  try {
    const parsed = new URL(resolvedAppLink);
    if (!/\/installations\/new\/?$/.test(parsed.pathname)) {
      parsed.pathname = `${parsed.pathname.replace(/\/+$/, "")}/installations/new`;
    }
    if (resolvedCompanyId) {
      parsed.searchParams.set("state", resolvedCompanyId);
    }
    return parsed.toString();
  } catch {
    return resolvedAppLink;
  }
}

export function getAgentsRouteFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "agents") {
    return { view: "list", agentId: "", sessionId: "" };
  }

  const agentId = segments[1] || "";
  if (!agentId) {
    return { view: "list", agentId: "", sessionId: "" };
  }

  if (!segments[2]) {
    return { view: "agent", agentId, sessionId: "" };
  }

  if (segments[2] !== "chats") {
    return { view: "list", agentId: "", sessionId: "" };
  }

  const sessionId = segments[3] || "";
  if (sessionId) {
    return { view: "chat", agentId, sessionId };
  }
  return { view: "chats", agentId, sessionId: "" };
}

export function getSkillsRouteFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "skills") {
    return { view: "list", skillId: "" };
  }

  const skillId = String(segments[1] || "").trim();
  if (!skillId) {
    return { view: "list", skillId: "" };
  }
  return { view: "detail", skillId };
}

export function getRunnersRouteFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (String(segments[0] || "").toLowerCase() !== "agent-runner") {
    return { view: "list", runnerId: "" };
  }

  const runnerId = String(segments[1] || "").trim();
  if (!runnerId) {
    return { view: "list", runnerId: "" };
  }
  return { view: "detail", runnerId };
}

export function getGitSkillPackagesRouteFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (String(segments[0] || "").toLowerCase() !== "gitskillpackages") {
    return { view: "list", packageId: "" };
  }

  const packageId = String(segments[1] || "").trim();
  if (!packageId) {
    return { view: "list", packageId: "" };
  }
  return { view: "detail", packageId };
}

export function setBrowserPath(pathname, { replace = false } = {}) {
  const nextPath = normalizePathname(pathname);
  const currentPath = normalizePathname(window.location.pathname);
  if (nextPath === currentPath) {
    return;
  }
  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function getPathForPage(pageId) {
  const normalizedPageId = String(pageId || "").trim().toLowerCase();
  if (normalizedPageId === "chat") {
    return "/chats";
  }
  if (normalizedPageId === "gitskillpackages") {
    return "/gitSkillPackages";
  }
  if (!PAGE_IDS.has(normalizedPageId)) {
    return `/${NAV_ITEMS[0].id}`;
  }
  return `/${normalizedPageId}`;
}
