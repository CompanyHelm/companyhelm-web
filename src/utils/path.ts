import { GITHUB_INSTALL_CALLBACK_PATH, PAGE_IDS, NAV_ITEMS } from "./constants.ts";

interface ChatsRouteLocationInput {
  pathname?: string;
  search?: string;
}

interface AgentsRouteLocationInput {
  pathname?: string;
  search?: string;
}

interface TasksRouteLocationInput {
  pathname?: string;
  search?: string;
}

interface ActorsRouteLocationInput {
  pathname?: string;
  search?: string;
}

interface ChatsPathInput {
  agentId?: string;
  threadId?: string;
}

interface ActorPathInput {
  actorId?: string;
  tab?: string;
}

interface OrgPathInput {
  tab?: string;
}

interface AgentPathInput {
  agentId?: string;
  tab?: string;
}

interface TaskPathInput {
  pageId?: string;
  taskId?: string;
  tab?: string;
}

interface SettingsPathInput {
  tab?: string;
}

interface SetBrowserPathOptions {
  replace?: boolean;
}

interface GithubInstallUrlInput {
  appLink?: string;
  companyId?: string;
}

type AgentRoute = {
  view: "list" | "agent";
  agentId: string;
  sessionId: string;
  tab: "overview" | "chats" | "heartbeats";
};

type DetailRoute = {
  view: "list" | "detail";
};

type ActorRoute = {
  view: "list" | "detail";
  actorId: string;
  tab: "table" | "graph" | "overview" | "reportees";
};

type TaskRoute = {
  view: "list" | "detail";
  taskId: string;
  tab: "overview" | "runs" | "graph" | "table";
};

type AdminRoute = {
  view: "home" | "table";
  tableName: string;
};

export const DEFAULT_ADMIN_TABLE_NAME = "runner_requests";

export function normalizeAgentDetailTab(value: string = ""): "overview" | "chats" | "heartbeats" {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (normalizedValue === "chats") {
    return "chats";
  }
  if (normalizedValue === "heartbeats") {
    return "heartbeats";
  }
  return "overview";
}

export function normalizeTaskDetailTab(value: string = ""): "overview" | "runs" | "graph" | "table" {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (normalizedValue === "runs") {
    return "runs";
  }
  if (normalizedValue === "graph") {
    return "graph";
  }
  if (normalizedValue === "table") {
    return "table";
  }
  return "overview";
}

export function normalizeSettingsTab(value: string = ""): "general" | "tasks" | "companies" {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (normalizedValue === "tasks") {
    return "tasks";
  }
  if (normalizedValue === "companies") {
    return "companies";
  }
  return "general";
}

export function normalizeOrgTab(value: string = ""): "table" | "graph" {
  return String(value || "").trim().toLowerCase() === "graph" ? "graph" : "table";
}

export function normalizeActorDetailTab(value: string = ""): "overview" | "reportees" {
  return String(value || "").trim().toLowerCase() === "reportees" ? "reportees" : "overview";
}

export function normalizePathname(rawPathname: string): string {
  const trimmed = String(rawPathname || "").trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const cleanPath = trimmed.replace(/^\/+|\/+$/g, "");
  return cleanPath ? `/${cleanPath}` : "/";
}

export function getPageFromPathname(pathname: string = window.location.pathname): string {
  const segments = normalizePathname(pathname).toLowerCase().split("/").filter(Boolean);
  const pageId = segments[0] || "";
  if (pageId === "actors" || pageId === "org") {
    return "org";
  }
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

export function parseGithubInstallCallbackFromLocation(): { installationId: string; setupAction: string; state: string } | null {
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

export function clearGithubInstallCallbackFromLocation(): void {
  setBrowserPath("/repos", { replace: true });
}

export function buildGithubAppInstallUrl({ appLink, companyId }: GithubInstallUrlInput): string {
  const resolvedAppLink = String(appLink || "").trim();
  const resolvedCompanyId = String(companyId || "").trim();
  if (!resolvedAppLink) {
    return "";
  }

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

export function getAgentsRouteFromPathname(
  pathnameOrLocation: string | AgentsRouteLocationInput = typeof window !== "undefined" ? window.location.pathname : "/",
  search?: string,
): AgentRoute {
  const fallbackPathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const fallbackSearch = typeof window !== "undefined" ? window.location.search : "";
  const pathname = typeof pathnameOrLocation === "string"
    ? pathnameOrLocation
    : pathnameOrLocation.pathname || fallbackPathname;
  const resolvedSearch = typeof pathnameOrLocation === "string"
    ? (typeof search === "string" ? search : fallbackSearch)
    : pathnameOrLocation.search || fallbackSearch;
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "agents") {
    return { view: "list", agentId: "", sessionId: "", tab: "overview" };
  }

  const agentId = segments[1] || "";
  if (!agentId) {
    return { view: "list", agentId: "", sessionId: "", tab: "overview" };
  }
  const params = new URLSearchParams(String(resolvedSearch || ""));
  return {
    view: "agent",
    agentId,
    sessionId: "",
    tab: normalizeAgentDetailTab(params.get("tab") || ""),
  };
}

export function getAgentPath({ agentId = "", tab = "overview" }: AgentPathInput = {}): string {
  const resolvedAgentId = String(agentId || "").trim();
  if (!resolvedAgentId) {
    return "/agents";
  }
  const params = new URLSearchParams();
  params.set("tab", normalizeAgentDetailTab(tab));
  return `/agents/${resolvedAgentId}?${params.toString()}`;
}

export function getSkillsRouteFromPathname(pathname: string = window.location.pathname): DetailRoute & { skillId: string } {
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

export function getRolesRouteFromPathname(pathname: string = window.location.pathname): DetailRoute & { roleId: string } {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "roles") {
    return { view: "list", roleId: "" };
  }

  const roleId = String(segments[1] || "").trim();
  if (!roleId) {
    return { view: "list", roleId: "" };
  }
  return { view: "detail", roleId };
}

export function getRunnersRouteFromPathname(pathname: string = window.location.pathname): { view: "list" | "detail" | "new"; runnerId: string } {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (String(segments[0] || "").toLowerCase() !== "agent-runner") {
    return { view: "list", runnerId: "" };
  }

  const secondSegment = String(segments[1] || "").trim();
  if (!secondSegment) {
    return { view: "list", runnerId: "" };
  }
  if (secondSegment.toLowerCase() === "new") {
    return { view: "new", runnerId: "" };
  }
  return { view: "detail", runnerId: secondSegment };
}

export function getExternalAgentsRouteFromPathname(
  pathname: string = window.location.pathname,
): { view: "list" | "detail"; externalAgentId: string } {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (String(segments[0] || "").toLowerCase() !== "external_agents") {
    return { view: "list", externalAgentId: "" };
  }

  const externalAgentId = String(segments[1] || "").trim();
  if (!externalAgentId) {
    return { view: "list", externalAgentId: "" };
  }

  return { view: "detail", externalAgentId };
}

export function getExternalAgentPath(externalAgentId: string = ""): string {
  const normalizedExternalAgentId = String(externalAgentId || "").trim();
  return normalizedExternalAgentId ? `/external_agents/${normalizedExternalAgentId}` : "/external_agents";
}

export function getActorsRouteFromPathname(
  pathnameOrLocation: string | ActorsRouteLocationInput = typeof window !== "undefined" ? window.location.pathname : "/",
  search?: string,
): ActorRoute {
  const fallbackPathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const fallbackSearch = typeof window !== "undefined" ? window.location.search : "";
  const pathname = typeof pathnameOrLocation === "string"
    ? pathnameOrLocation
    : pathnameOrLocation.pathname || fallbackPathname;
  const resolvedSearch = typeof pathnameOrLocation === "string"
    ? (typeof search === "string" ? search : fallbackSearch)
    : pathnameOrLocation.search || fallbackSearch;
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  const topLevelSegment = String(segments[0] || "").toLowerCase();
  if (topLevelSegment !== "actors" && topLevelSegment !== "org") {
    return { view: "list", actorId: "", tab: "table" };
  }

  const params = new URLSearchParams(String(resolvedSearch || ""));
  const actorId = String(segments[1] || "").trim();
  if (!actorId) {
    return { view: "list", actorId: "", tab: normalizeOrgTab(params.get("tab") || "") };
  }
  return { view: "detail", actorId, tab: normalizeActorDetailTab(params.get("tab") || "") };
}

export function getActorPath({ actorId = "", tab = "overview" }: ActorPathInput = {}): string {
  const resolvedActorId = String(actorId || "").trim();
  if (!resolvedActorId) {
    return getOrgPath();
  }
  const params = new URLSearchParams();
  params.set("tab", normalizeActorDetailTab(tab));
  return `/actors/${resolvedActorId}?${params.toString()}`;
}

export function getOrgPath({ tab = "table" }: OrgPathInput = {}): string {
  const params = new URLSearchParams();
  params.set("tab", normalizeOrgTab(tab));
  return `/actors?${params.toString()}`;
}

export function getTasksRouteFromPathname(
  pathnameOrLocation: string | TasksRouteLocationInput = typeof window !== "undefined" ? window.location.pathname : "/",
  search?: string,
): TaskRoute {
  const fallbackPathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const fallbackSearch = typeof window !== "undefined" ? window.location.search : "";
  const pathname = typeof pathnameOrLocation === "string"
    ? pathnameOrLocation
    : pathnameOrLocation.pathname || fallbackPathname;
  const resolvedSearch = typeof pathnameOrLocation === "string"
    ? (typeof search === "string" ? search : fallbackSearch)
    : pathnameOrLocation.search || fallbackSearch;
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  const taskPageId = String(segments[0] || "").toLowerCase();
  if (taskPageId !== "tasks" && taskPageId !== "my-tasks") {
    return { view: "list", taskId: "", tab: "overview" };
  }

  const taskId = String(segments[1] || "").trim();
  if (!taskId) {
    return { view: "list", taskId: "", tab: "overview" };
  }
  const params = new URLSearchParams(String(resolvedSearch || ""));
  return { view: "detail", taskId, tab: normalizeTaskDetailTab(params.get("tab") || "") };
}

export function getTaskPath({ pageId = "tasks", taskId = "", tab = "overview" }: TaskPathInput = {}): string {
  const normalizedPageId = String(pageId || "").trim().toLowerCase() === "my-tasks" ? "my-tasks" : "tasks";
  const resolvedTaskId = String(taskId || "").trim();
  if (!resolvedTaskId) {
    return `/${normalizedPageId}`;
  }
  const params = new URLSearchParams();
  params.set("tab", normalizeTaskDetailTab(tab));
  return `/${normalizedPageId}/${resolvedTaskId}?${params.toString()}`;
}

export function getSettingsTabFromPathname(
  pathnameOrLocation: string | TasksRouteLocationInput = typeof window !== "undefined" ? window.location.pathname : "/",
  search?: string,
): "general" | "tasks" | "companies" {
  const fallbackPathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const fallbackSearch = typeof window !== "undefined" ? window.location.search : "";
  const pathname = typeof pathnameOrLocation === "string"
    ? pathnameOrLocation
    : pathnameOrLocation.pathname || fallbackPathname;
  const resolvedSearch = typeof pathnameOrLocation === "string"
    ? (typeof search === "string" ? search : fallbackSearch)
    : pathnameOrLocation.search || fallbackSearch;
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "settings") {
    return "general";
  }

  const params = new URLSearchParams(String(resolvedSearch || ""));
  return normalizeSettingsTab(params.get("tab") || "");
}

export function getSettingsPath({ tab = "general" }: SettingsPathInput = {}): string {
  const params = new URLSearchParams();
  params.set("tab", normalizeSettingsTab(tab));
  return `/settings?${params.toString()}`;
}

export function getGitSkillPackagesRouteFromPathname(pathname: string = window.location.pathname): DetailRoute & { packageId: string } {
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

export function getChatsRouteFromLocation({
  pathname = window.location.pathname,
  search = window.location.search,
}: ChatsRouteLocationInput = {}): { agentId: string; threadId: string } {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath !== "/chats") {
    return { agentId: "", threadId: "" };
  }

  const params = new URLSearchParams(String(search || ""));
  const agentId = String(params.get("agentId") || "").trim();
  const threadId = String(params.get("threadId") || "").trim();
  return { agentId, threadId };
}

export function getChatsPath({ agentId = "", threadId = "" }: ChatsPathInput = {}): string {
  const params = new URLSearchParams();
  const resolvedAgentId = String(agentId || "").trim();
  const resolvedThreadId = String(threadId || "").trim();
  if (resolvedAgentId) {
    params.set("agentId", resolvedAgentId);
  }
  if (resolvedThreadId) {
    params.set("threadId", resolvedThreadId);
  }
  const query = params.toString();
  return query ? `/chats?${query}` : "/chats";
}

export function getAdminRouteFromPathname(pathname: string = window.location.pathname): AdminRoute {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (String(segments[0] || "").toLowerCase() !== "admin") {
    return { view: "home", tableName: "" };
  }

  if (String(segments[1] || "").toLowerCase() === "tables") {
    const tableName = String(segments[2] || "").trim().toLowerCase();
    if (tableName) {
      return { view: "table", tableName };
    }
  }

  return { view: "home", tableName: "" };
}

export function resolveAdminTableNameForRoute(adminRoute: AdminRoute): string {
  const routeTableName = String(adminRoute?.tableName || "").trim().toLowerCase();
  if (adminRoute?.view === "table" && routeTableName) {
    return routeTableName;
  }
  return DEFAULT_ADMIN_TABLE_NAME;
}

export function setBrowserPath(pathname: string, { replace = false }: SetBrowserPathOptions = {}): void {
  const currentUrl = new URL(window.location.href);
  const nextUrl = new URL(String(pathname || "/"), currentUrl.origin);
  const nextPathname = normalizePathname(nextUrl.pathname);
  const currentPathname = normalizePathname(currentUrl.pathname);
  const nextSearch = String(nextUrl.search || "");
  const currentSearch = String(currentUrl.search || "");

  if (nextPathname === currentPathname && nextSearch === currentSearch) {
    return;
  }

  const nextPath = `${nextPathname}${nextSearch}`;
  if (replace) {
    window.history.replaceState({}, "", nextPath);
  } else {
    window.history.pushState({}, "", nextPath);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function getPathForPage(pageId: string): string {
  const normalizedPageId = String(pageId || "").trim().toLowerCase();
  if (normalizedPageId === "chat") {
    return "/chats";
  }
  if (normalizedPageId === "org") {
    return "/actors";
  }
  if (normalizedPageId === "gitskillpackages") {
    return "/gitSkillPackages";
  }
  if (!PAGE_IDS.has(normalizedPageId)) {
    return `/${NAV_ITEMS[0].id}`;
  }
  return `/${normalizedPageId}`;
}
