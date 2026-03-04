// NOTE: GRAPHQL_WS_URL depends on resolveGraphQLWebSocketUrl from media.js
import { getConfig } from "../config/config.js";
import { resolveGraphQLWebSocketUrl } from "./media.js";

const normalizedRuntimeConfig = getConfig();

export const GRAPHQL_URL = String(normalizedRuntimeConfig.api?.graphqlApiUrl || "").trim();
export const GRAPHQL_WS_URL = String(normalizedRuntimeConfig.api?.graphqlWebSocketUrl || "").trim()
  || resolveGraphQLWebSocketUrl(GRAPHQL_URL);
export const AUTH_PROVIDER = String(normalizedRuntimeConfig.auth?.provider || "companyhelm").trim() || "companyhelm";
export const COMPANYHELM_AUTH_TOKEN_STORAGE_KEY =
  String(normalizedRuntimeConfig.auth?.companyhelm?.tokenStorageKey || "").trim() || "companyhelm.auth.token";
export const SUPABASE_URL = String(normalizedRuntimeConfig.auth?.supabase?.url || "").trim();
export const SUPABASE_ANON_KEY = String(normalizedRuntimeConfig.auth?.supabase?.anonKey || "").trim();
export const SUPABASE_AUTH_TOKEN_STORAGE_KEY =
  String(normalizedRuntimeConfig.auth?.supabase?.tokenStorageKey || "").trim() || "supabase.auth.token";
export const SELECTED_COMPANY_STORAGE_KEY = "companyhelm.selectedCompanyId";
export const DEFAULT_RUNNER_GRPC_TARGET =
  String(normalizedRuntimeConfig.api?.runnerGrpcTarget || "").trim() || "localhost:50051";
export const DEFAULT_GITHUB_APP_INSTALL_URL = "https://github.com/apps/companyhelm";
export const GITHUB_INSTALL_CALLBACK_PATH = "/github/install";
export const AVAILABLE_AGENT_SDKS = ["codex"];
export const DEFAULT_AGENT_SDK = AVAILABLE_AGENT_SDKS[0];
export const SKILL_TYPE_TEXT = "text";
export const SKILL_TYPE_SKILLSMP = "skillsmp";
export const SKILL_TYPE_OPTIONS = [
  { value: SKILL_TYPE_TEXT, label: "Text" },
  { value: SKILL_TYPE_SKILLSMP, label: "SkillsMP" },
];
export const MCP_TRANSPORT_TYPE_STREAMABLE_HTTP = "streamable_http";
export const MCP_TRANSPORT_TYPE_STDIO = "stdio";
export const MCP_TRANSPORT_TYPE_OPTIONS = [
  { value: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP, label: "Streamable HTTP" },
  { value: MCP_TRANSPORT_TYPE_STDIO, label: "Stdio" },
];
export const MCP_AUTH_TYPE_NONE = "none";
export const MCP_AUTH_TYPE_BEARER_TOKEN = "bearer_token";
export const MCP_AUTH_TYPE_CUSTOM_HEADERS = "custom_headers";
export const MCP_AUTH_TYPE_OPTIONS = [
  { value: MCP_AUTH_TYPE_NONE, label: "No auth" },
  { value: MCP_AUTH_TYPE_BEARER_TOKEN, label: "Bearer token" },
  { value: MCP_AUTH_TYPE_CUSTOM_HEADERS, label: "Custom headers" },
];
export const CHAT_MESSAGE_BATCH_SIZE = 50;
export const THREAD_TITLE_MAX_LENGTH = 100;
export const TRANSCRIPT_TOP_LOAD_THRESHOLD_PX = 12;
export const TRANSCRIPT_BOTTOM_STICKY_THRESHOLD_PX = 12;
export const SIDEBAR_COLLAPSE_MEDIA_QUERY = "(max-width: 1080px)";
export const COMPACT_CHAT_MEDIA_QUERY = "(max-width: 1180px), (max-height: 900px)";

export const NAV_SECTIONS = [
  {
    label: "Work",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", requiresCompany: true },
      { id: "tasks", label: "Tasks", href: "/tasks", requiresCompany: true },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { id: "agents", label: "Agents", href: "/agents", requiresCompany: true },
      { id: "skills", label: "Skills", href: "/skills", requiresCompany: true },
      { id: "skill-groups", label: "Skill Groups", href: "/skill-groups", requiresCompany: true },
      { id: "roles", label: "Roles", href: "/roles", requiresCompany: true },
      {
        id: "gitskillpackages",
        label: "Git Skill Packages",
        href: "/gitSkillPackages",
        requiresCompany: true,
      },
      { id: "mcp-servers", label: "MCP Servers", href: "/mcp-servers", requiresCompany: true },
    ],
  },
  {
    label: "Operate",
    items: [
      { id: "agent-runner", label: "Agent Runner", href: "/agent-runner", requiresCompany: true },
      { id: "chats", label: "Chats", href: "/chats", requiresCompany: true },
      { id: "repos", label: "Repos", href: "/repos", requiresCompany: true },
    ],
  },
];

export const BOTTOM_NAV_ITEMS = [
  { id: "settings", label: "Settings", href: "/settings", requiresCompany: false },
  { id: "profile", label: "Profile", href: "/profile", requiresCompany: false },
];

export const PRIMARY_NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

export const PROFILE_NAV_ITEM = BOTTOM_NAV_ITEMS[1];

export const NAV_ITEMS = [...PRIMARY_NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
export const NAV_ITEM_LOOKUP = NAV_ITEMS.reduce((map, item) => {
  map.set(item.id, item);
  return map;
}, new Map());
export const PAGE_IDS = new Set(NAV_ITEMS.map((item) => item.id));
