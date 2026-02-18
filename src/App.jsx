import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";
const GRAPHQL_WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || resolveGraphQLWebSocketUrl(GRAPHQL_URL);
const SELECTED_COMPANY_STORAGE_KEY = "companyhelm.selectedCompanyId";
const DEFAULT_RUNNER_GRPC_TARGET =
  import.meta.env.VITE_AGENT_RUNNER_GRPC_TARGET || "localhost:50051";
const CODEX_DEVICE_AUTH_URL = "https://auth.openai.com/codex/device";
const GITHUB_APP_INSTALL_URL = "https://github.com/apps/companyhelm";
const GITHUB_INSTALL_CALLBACK_PATH = "/github/install";
const AVAILABLE_AGENT_SDKS = ["codex"];
const DEFAULT_AGENT_SDK = AVAILABLE_AGENT_SDKS[0];
const SKILL_TYPE_TEXT = "text";
const SKILL_TYPE_SKILLSMP = "skillsmp";
const SKILL_TYPE_OPTIONS = [
  { value: SKILL_TYPE_TEXT, label: "Text" },
  { value: SKILL_TYPE_SKILLSMP, label: "SkillsMP" },
];
const MCP_TRANSPORT_TYPE_STREAMABLE_HTTP = "streamable_http";
const MCP_TRANSPORT_TYPE_STDIO = "stdio";
const MCP_TRANSPORT_TYPE_OPTIONS = [
  { value: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP, label: "Streamable HTTP" },
  { value: MCP_TRANSPORT_TYPE_STDIO, label: "Stdio" },
];
const MCP_AUTH_TYPE_NONE = "none";
const MCP_AUTH_TYPE_BEARER_TOKEN = "bearer_token";
const MCP_AUTH_TYPE_CUSTOM_HEADERS = "custom_headers";
const MCP_AUTH_TYPE_OPTIONS = [
  { value: MCP_AUTH_TYPE_NONE, label: "No auth" },
  { value: MCP_AUTH_TYPE_BEARER_TOKEN, label: "Bearer token" },
  { value: MCP_AUTH_TYPE_CUSTOM_HEADERS, label: "Custom headers" },
];
const CHAT_MESSAGE_BATCH_SIZE = 20;

function resolveGraphQLWebSocketUrl(rawUrl) {
  const cleanUrl = String(rawUrl || "").trim();
  if (!cleanUrl) {
    return "";
  }

  if (cleanUrl.startsWith("ws://") || cleanUrl.startsWith("wss://")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    const parsed = new URL(cleanUrl);
    parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return parsed.toString();
  }

  if (typeof window === "undefined") {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("/") && String(window.location.port || "") === "5173") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:8000${cleanUrl}`;
  }

  const base = new URL(window.location.href);
  const parsed = new URL(cleanUrl, base);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString();
}

const LIST_COMPANIES_QUERY = `
  query ListCompanies {
    companies {
      id
      name
    }
  }
`;

const CREATE_COMPANY_MUTATION = `
  mutation CreateCompany($name: String!, $id: String) {
    createCompany(name: $name, id: $id) {
      ok
      error
      company {
        id
        name
      }
    }
  }
`;

const DELETE_COMPANY_MUTATION = `
  mutation DeleteCompany($id: String!) {
    deleteCompany(id: $id) {
      ok
      error
      companyId
    }
  }
`;

const LIST_GITHUB_INSTALLATIONS_QUERY = `
  query ListGithubInstallations($companyId: String!) {
    githubInstallations(companyId: $companyId) {
      installationId
      companyId
      createdAt
    }
  }
`;

const ADD_GITHUB_INSTALLATION_MUTATION = `
  mutation AddGithubInstallation(
    $companyId: String!
    $installationId: String!
    $setupAction: String
  ) {
    addGithubInstallation(
      companyId: $companyId
      installationId: $installationId
      setupAction: $setupAction
    ) {
      ok
      error
      githubInstallation {
        installationId
        companyId
        createdAt
      }
    }
  }
`;

const DELETE_GITHUB_INSTALLATION_MUTATION = `
  mutation DeleteGithubInstallation($companyId: String!, $installationId: String!) {
    deleteGithubInstallation(companyId: $companyId, installationId: $installationId) {
      ok
      error
      deletedInstallationId
    }
  }
`;

const LIST_REPOSITORIES_QUERY = `
  query ListRepositories($companyId: String!, $provider: String) {
    repositories(companyId: $companyId, provider: $provider) {
      id
      companyId
      provider
      externalId
      githubInstallationId
      name
      fullName
      htmlUrl
      isPrivate
      defaultBranch
      archived
      createdAt
      updatedAt
    }
  }
`;

const REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION = `
  mutation RefreshGithubInstallationRepositories($companyId: String!, $installationId: String!) {
    refreshGithubInstallationRepositories(companyId: $companyId, installationId: $installationId) {
      ok
      error
      repositories {
        id
        companyId
        provider
        externalId
        githubInstallationId
        name
        fullName
        htmlUrl
        isPrivate
        defaultBranch
        archived
        createdAt
        updatedAt
      }
    }
  }
`;

const LIST_TASKS_QUERY = `
  query ListTasks($companyId: String!) {
    tasks(companyId: $companyId) {
      id
      companyId
      name
      description
      parentTaskId
      dependsOnTaskId
    }
  }
`;

const LIST_AGENT_RUNNERS_QUERY = `
  query ListAgentRunners($companyId: String!) {
    agentRunners(companyId: $companyId) {
      id
      companyId
      hasAuthSecret
      codexAuthenticated
      codexAvailableModels {
        name
        reasoning
      }
      status
      lastHealthCheckAt
      lastSeenAt
    }
  }
`;

const CREATE_AGENT_RUNNER_MUTATION = `
  mutation CreateAgentRunner(
    $companyId: String!
    $id: String
    $authSecret: String
  ) {
    createAgentRunner(
      companyId: $companyId
      id: $id
      authSecret: $authSecret
    ) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
        id
        companyId
        hasAuthSecret
        codexAuthenticated
        codexAvailableModels {
          name
          reasoning
        }
        status
        lastHealthCheckAt
        lastSeenAt
      }
    }
  }
`;

const REGENERATE_AGENT_RUNNER_SECRET_MUTATION = `
  mutation RegenerateAgentRunnerSecret($companyId: String!, $id: String!) {
    regenerateAgentRunnerSecret(companyId: $companyId, id: $id) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
      id
      companyId
      hasAuthSecret
      codexAuthenticated
      codexAvailableModels {
        name
          reasoning
        }
        status
        lastHealthCheckAt
        lastSeenAt
      }
    }
  }
`;

const LIST_AGENTS_QUERY = `
  query ListAgents($companyId: String!) {
    agents(companyId: $companyId) {
      id
      companyId
      agentRunnerId
      skillIds
      mcpServerIds
      installedSkills {
        companyId
        agentId
        skillId
        skillName
        skillType
        skillsMpPackageName
        requestId
        status
        message
        installLogs
        installedAt
        createdAt
        updatedAt
      }
      name
      agentSdk
      model
      modelReasoningLevel
    }
  }
`;

const LIST_SKILLS_QUERY = `
  query ListSkills($companyId: String!) {
    skills(companyId: $companyId) {
      id
      companyId
      name
      skillType
      skillsMpPackageName
      description
      instructions
    }
  }
`;

const LIST_MCP_SERVERS_QUERY = `
  query ListMcpServers($companyId: String!) {
    mcpServers(companyId: $companyId) {
      id
      companyId
      name
      transportType
      url
      command
      args
      envVars {
        key
        value
      }
      authType
      bearerToken
      customHeaders {
        key
        value
      }
      enabled
    }
  }
`;

const CREATE_TASK_MUTATION = `
  mutation CreateTask(
    $companyId: String!
    $name: String!
    $description: String
    $parentTaskId: Int
    $dependsOnTaskId: Int
  ) {
    createTask(
      companyId: $companyId
      name: $name
      description: $description
      parentTaskId: $parentTaskId
      dependsOnTaskId: $dependsOnTaskId
    ) {
      ok
      error
      task {
        id
        companyId
        name
        description
        parentTaskId
        dependsOnTaskId
      }
    }
  }
`;

const UPDATE_TASK_MUTATION = `
  mutation UpdateTask(
    $companyId: String!
    $id: Int!
    $parentTaskId: Int
    $dependsOnTaskId: Int
  ) {
    updateTask(
      companyId: $companyId
      id: $id
      parentTaskId: $parentTaskId
      dependsOnTaskId: $dependsOnTaskId
    ) {
      ok
      error
      task {
        id
        companyId
        name
        description
        parentTaskId
        dependsOnTaskId
      }
    }
  }
`;

const DELETE_TASK_MUTATION = `
  mutation DeleteTask($companyId: String!, $id: Int!) {
    deleteTask(companyId: $companyId, id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

const DELETE_AGENT_RUNNER_MUTATION = `
  mutation DeleteAgentRunner($companyId: String!, $id: String!) {
    deleteAgentRunner(companyId: $companyId, id: $id) {
      ok
      error
      deletedAgentRunnerId
    }
  }
`;

const CREATE_AGENT_MUTATION = `
  mutation CreateAgent(
    $companyId: String!
    $agentRunnerId: String
    $skillIds: [String!]
    $mcpServerIds: [String!]
    $name: String!
    $agentSdk: String!
    $model: String!
    $modelReasoningLevel: String!
  ) {
    createAgent(
      companyId: $companyId
      agentRunnerId: $agentRunnerId
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      name: $name
      agentSdk: $agentSdk
      model: $model
      modelReasoningLevel: $modelReasoningLevel
    ) {
      ok
      error
      agent {
        id
        companyId
        agentRunnerId
        skillIds
        mcpServerIds
        name
        agentSdk
        model
        modelReasoningLevel
      }
    }
  }
`;

const UPDATE_AGENT_MUTATION = `
  mutation UpdateAgent(
    $companyId: String!
    $id: String!
    $agentRunnerId: String
    $skillIds: [String!]
    $mcpServerIds: [String!]
    $name: String!
    $agentSdk: String!
    $model: String!
    $modelReasoningLevel: String!
  ) {
    updateAgent(
      companyId: $companyId
      id: $id
      agentRunnerId: $agentRunnerId
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      name: $name
      agentSdk: $agentSdk
      model: $model
      modelReasoningLevel: $modelReasoningLevel
    ) {
      ok
      error
      agent {
        id
        companyId
        agentRunnerId
        skillIds
        mcpServerIds
        name
        agentSdk
        model
        modelReasoningLevel
      }
    }
  }
`;

const DELETE_AGENT_MUTATION = `
  mutation DeleteAgent($companyId: String!, $id: String!) {
    deleteAgent(companyId: $companyId, id: $id) {
      ok
      error
      deletedAgentId
    }
  }
`;

const CREATE_SKILL_MUTATION = `
  mutation CreateSkill(
    $companyId: String!
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    createSkill(
      companyId: $companyId
      name: $name
      skillType: $skillType
      skillsMpPackageName: $skillsMpPackageName
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        companyId
        name
        skillType
        skillsMpPackageName
        description
        instructions
      }
    }
  }
`;

const UPDATE_SKILL_MUTATION = `
  mutation UpdateSkill(
    $companyId: String!
    $id: String!
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    updateSkill(
      companyId: $companyId
      id: $id
      name: $name
      skillType: $skillType
      skillsMpPackageName: $skillsMpPackageName
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        companyId
        name
        skillType
        skillsMpPackageName
        description
        instructions
      }
    }
  }
`;

const DELETE_SKILL_MUTATION = `
  mutation DeleteSkill($companyId: String!, $id: String!) {
    deleteSkill(companyId: $companyId, id: $id) {
      ok
      error
      deletedSkillId
    }
  }
`;

const CREATE_MCP_SERVER_MUTATION = `
  mutation CreateMcpServer(
    $companyId: String!
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerToken: String
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    createMcpServer(
      companyId: $companyId
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerToken: $bearerToken
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        companyId
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerToken
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

const UPDATE_MCP_SERVER_MUTATION = `
  mutation UpdateMcpServer(
    $companyId: String!
    $id: String!
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerToken: String
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    updateMcpServer(
      companyId: $companyId
      id: $id
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerToken: $bearerToken
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        companyId
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerToken
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

const DELETE_MCP_SERVER_MUTATION = `
  mutation DeleteMcpServer($companyId: String!, $id: String!) {
    deleteMcpServer(companyId: $companyId, id: $id) {
      ok
      error
      deletedMcpServerId
    }
  }
`;

const INITIALIZE_AGENT_MUTATION = `
  mutation InitializeAgentRunner($companyId: String!, $runnerId: String!, $agentId: String!) {
    initializeAgentRunner(companyId: $companyId, runnerId: $runnerId, agentId: $agentId) {
      ok
      error
      commandId
      runnerId
      agentId
      queuedSkillInstallCount
    }
  }
`;

const RETRY_AGENT_SKILL_INSTALL_MUTATION = `
  mutation RetryAgentSkillInstall(
    $companyId: String!
    $agentId: String!
    $skillId: String!
    $runnerId: String
  ) {
    retryAgentSkillInstall(
      companyId: $companyId
      agentId: $agentId
      skillId: $skillId
      runnerId: $runnerId
    ) {
      ok
      error
      requestId
      runnerId
      agentId
      skillId
      installedSkill {
        companyId
        agentId
        skillId
        skillName
        skillType
        skillsMpPackageName
        requestId
        status
        message
        installLogs
        installedAt
        createdAt
        updatedAt
      }
    }
  }
`;

const LIST_AGENT_CHAT_TURNS_QUERY = `
  query ListAgentChatTurns(
    $companyId: String!
    $agentId: String!
    $sessionId: String
    $limit: Int
  ) {
    agentChatTurns(
      companyId: $companyId
      agentId: $agentId
      sessionId: $sessionId
      limit: $limit
    ) {
      id
      sessionId
      companyId
      agentId
      runnerId
      commandId
      providerTurnId
      status
      reasoningText
      startedAt
      endedAt
      createdAt
      updatedAt
      items {
        id
        turnId
        sessionId
        companyId
        agentId
        runnerId
        commandId
        providerItemId
        role
        itemType
        content
        command
        output
        unknownType
        status
        startedAt
        endedAt
        error
        createdAt
        updatedAt
      }
    }
  }
`;

const LIST_AGENT_CHAT_SESSIONS_QUERY = `
  query ListAgentChatSessions($companyId: String!, $agentId: String!, $limit: Int) {
    agentChatSessions(companyId: $companyId, agentId: $agentId, limit: $limit) {
      id
      companyId
      agentId
      runnerId
      title
      remoteSessionId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_AGENT_CHAT_SESSION_MUTATION = `
  mutation CreateAgentChatSession(
    $companyId: String!
    $agentId: String!
    $title: String
    $runnerId: String
    $remoteSessionId: String
  ) {
    createAgentChatSession(
      companyId: $companyId
      agentId: $agentId
      title: $title
      runnerId: $runnerId
      remoteSessionId: $remoteSessionId
    ) {
      ok
      error
      session {
        id
        companyId
        agentId
        runnerId
        title
        remoteSessionId
        createdAt
        updatedAt
      }
    }
  }
`;

const SEND_AGENT_SESSION_MESSAGE_MUTATION = `
  mutation SendAgentSessionMessage(
    $companyId: String!
    $agentId: String!
    $sessionId: String!
    $message: String!
    $runnerId: String
  ) {
    sendAgentSessionMessage(
      companyId: $companyId
      agentId: $agentId
      sessionId: $sessionId
      message: $message
      runnerId: $runnerId
    ) {
      ok
      error
      commandId
      messageId
      turnId
      sessionId
      runnerId
      agentId
    }
  }
`;

const GET_AGENT_CODEX_AUTH_STATE_QUERY = `
  query GetAgentCodexAuthState($companyId: String!, $agentId: String!) {
    agentCodexAuthState(companyId: $companyId, agentId: $agentId) {
      requestId
      companyId
      agentId
      runnerId
      status
      verificationUri
      userCode
      message
      rawOutput
      createdAt
      updatedAt
    }
  }
`;

const AGENT_RUNNERS_SUBSCRIPTION = `
  subscription AgentRunnersUpdated($companyId: String!) {
    agentRunnersUpdated(companyId: $companyId) {
      id
      companyId
      hasAuthSecret
      codexAuthenticated
      codexAvailableModels {
        name
        reasoning
      }
      status
      lastHealthCheckAt
      lastSeenAt
    }
  }
`;

const AGENT_CHAT_SESSIONS_SUBSCRIPTION = `
  subscription AgentChatSessionsUpdated($companyId: String!, $agentId: String!) {
    agentChatSessionsUpdated(companyId: $companyId, agentId: $agentId) {
      id
      companyId
      agentId
      runnerId
      title
      remoteSessionId
      createdAt
      updatedAt
    }
  }
`;

const AGENT_CHAT_TURNS_SUBSCRIPTION = `
  subscription AgentChatTurnsUpdated(
    $companyId: String!
    $agentId: String!
    $sessionId: String!
  ) {
    agentChatTurnsUpdated(companyId: $companyId, agentId: $agentId, sessionId: $sessionId) {
      id
      sessionId
      companyId
      agentId
      runnerId
      commandId
      providerTurnId
      status
      reasoningText
      startedAt
      endedAt
      createdAt
      updatedAt
      items {
        id
        turnId
        sessionId
        companyId
        agentId
        runnerId
        commandId
        providerItemId
        role
        itemType
        content
        command
        output
        unknownType
        status
        startedAt
        endedAt
        error
        createdAt
        updatedAt
      }
    }
  }
`;

const AGENT_CODEX_AUTH_STATE_SUBSCRIPTION = `
  subscription AgentCodexAuthStateUpdated($companyId: String!, $agentId: String!) {
    agentCodexAuthStateUpdated(companyId: $companyId, agentId: $agentId) {
      requestId
      companyId
      agentId
      runnerId
      status
      verificationUri
      userCode
      message
      rawOutput
      createdAt
      updatedAt
    }
  }
`;

const START_AGENT_CODEX_DEVICE_AUTH_MUTATION = `
  mutation StartAgentCodexDeviceAuth($companyId: String!, $agentId: String!, $runnerId: String) {
    startAgentCodexDeviceAuth(companyId: $companyId, agentId: $agentId, runnerId: $runnerId) {
      ok
      error
      requestId
      runnerId
      agentId
      status
    }
  }
`;

const PRIMARY_NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    tone: "mint",
    requiresCompany: true,
  },
  { id: "tasks", label: "Tasks", href: "/tasks", tone: "sand", requiresCompany: true },
  { id: "skills", label: "Skills", href: "/skills", tone: "sand", requiresCompany: true },
  { id: "mcp-servers", label: "MCP", href: "/mcp-servers", tone: "mint", requiresCompany: true },
  {
    id: "agent-runner",
    label: "Agent Runner",
    href: "/agent-runner",
    tone: "sky",
    requiresCompany: true,
  },
  { id: "chats", label: "Chats", href: "/chats", tone: "coral", requiresCompany: true },
  { id: "agents", label: "Agents", href: "/agents", tone: "coral", requiresCompany: true },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    tone: "slate",
    requiresCompany: false,
  },
];

const PROFILE_NAV_ITEM = {
  id: "profile",
  label: "Profile",
  href: "/profile",
  tone: "stone",
  requiresCompany: false,
};

const NAV_ITEMS = [...PRIMARY_NAV_ITEMS, PROFILE_NAV_ITEM];
const NAV_ITEM_LOOKUP = NAV_ITEMS.reduce((map, item) => {
  map.set(item.id, item);
  return map;
}, new Map());
const PAGE_IDS = new Set(NAV_ITEMS.map((item) => item.id));

function toGraphQLTaskId(value) {
  if (value == null || value === "") {
    return null;
  }
  return Number(value);
}

function toSelectValue(value) {
  if (value == null) {
    return "";
  }
  return String(value);
}

function normalizeUniqueStringList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalizedValues = [];
  const seenValues = new Set();
  for (const rawValue of values) {
    const cleanValue = String(rawValue || "").trim();
    if (!cleanValue || seenValues.has(cleanValue)) {
      continue;
    }
    seenValues.add(cleanValue);
    normalizedValues.push(cleanValue);
  }
  return normalizedValues;
}

function normalizeSkillType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (normalized === SKILL_TYPE_SKILLSMP) {
    return SKILL_TYPE_SKILLSMP;
  }
  return SKILL_TYPE_TEXT;
}

function formatSkillLabel(skill) {
  if (!skill || typeof skill !== "object") {
    return "";
  }
  const skillTypeLabel =
    normalizeSkillType(skill.skillType) === SKILL_TYPE_SKILLSMP ? " (SkillsMP)" : "";
  return `${skill.name}${skillTypeLabel}`;
}

function normalizeMcpTransportType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (
    normalized === MCP_TRANSPORT_TYPE_STREAMABLE_HTTP ||
    normalized === MCP_TRANSPORT_TYPE_STDIO
  ) {
    return normalized;
  }
  return MCP_TRANSPORT_TYPE_STREAMABLE_HTTP;
}

function normalizeMcpAuthType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    normalized === MCP_AUTH_TYPE_NONE ||
    normalized === MCP_AUTH_TYPE_BEARER_TOKEN ||
    normalized === MCP_AUTH_TYPE_CUSTOM_HEADERS
  ) {
    return normalized;
  }
  return MCP_AUTH_TYPE_NONE;
}

function mcpHeadersToText(headers) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return "";
  }
  return headers
    .map((header) => `${String(header?.key || "").trim()}: ${String(header?.value || "").trim()}`)
    .filter((line) => line !== ":")
    .join("\n");
}

function mcpArgsToText(args) {
  if (!Array.isArray(args) || args.length === 0) {
    return "";
  }
  return args
    .map((arg) => String(arg || "").trim())
    .filter(Boolean)
    .join("\n");
}

function parseMcpArgsText(rawText) {
  const args = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    args,
    error: "",
  };
}

function mcpEnvVarsToText(envVars) {
  if (!Array.isArray(envVars) || envVars.length === 0) {
    return "";
  }
  return envVars
    .map((envVar) => `${String(envVar?.key || "").trim()}=${String(envVar?.value || "").trim()}`)
    .filter((line) => line !== "=")
    .join("\n");
}

function parseMcpEnvVarsText(rawText) {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const envVars = [];
  const seenKeys = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex <= 0) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} must be in "KEY=VALUE" format.`,
      };
    }
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim();
    if (!key) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} is missing a key.`,
      };
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return {
        envVars: [],
        error: `Env var line ${index + 1} has invalid key "${key}".`,
      };
    }
    if (seenKeys.has(key)) {
      return {
        envVars: [],
        error: `Duplicate env var key "${key}" is not allowed.`,
      };
    }
    seenKeys.add(key);
    envVars.push({ key, value });
  }

  return { envVars, error: "" };
}

function parseMcpHeadersText(rawText) {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const headers = [];
  const seenKeys = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const delimiterIndex = line.indexOf(":");
    if (delimiterIndex <= 0) {
      return {
        headers: [],
        error: `Header line ${index + 1} must be in "Key: Value" format.`,
      };
    }
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim();
    if (!key) {
      return {
        headers: [],
        error: `Header line ${index + 1} is missing a key.`,
      };
    }
    if (!value) {
      return {
        headers: [],
        error: `Header line ${index + 1} is missing a value.`,
      };
    }
    const normalizedKey = key.toLowerCase();
    if (seenKeys.has(normalizedKey)) {
      return {
        headers: [],
        error: `Duplicate header key "${key}" is not allowed.`,
      };
    }
    seenKeys.add(normalizedKey);
    headers.push({ key, value });
  }

  return { headers, error: "" };
}

function normalizePathname(rawPathname) {
  const trimmed = String(rawPathname || "").trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const cleanPath = trimmed.replace(/^\/+|\/+$/g, "");
  return cleanPath ? `/${cleanPath}` : "/";
}

function getPageFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).toLowerCase().split("/").filter(Boolean);
  const pageId = segments[0] || "";
  if (pageId && PAGE_IDS.has(pageId)) {
    return pageId;
  }
  if (pageId === "agents") {
    return "agents";
  }
  return NAV_ITEMS[0].id;
}

function parseGithubInstallCallbackFromLocation() {
  const normalizedPath = String(window.location.pathname || "").replace(/\/+$/, "") || "/";
  if (normalizedPath !== GITHUB_INSTALL_CALLBACK_PATH) {
    return null;
  }

  const params = new URLSearchParams(window.location.search || "");
  const installationId = String(params.get("installation_id") || "").trim();
  const setupAction = String(params.get("setup_action") || "").trim();
  return { installationId, setupAction };
}

function clearGithubInstallCallbackFromLocation() {
  setBrowserPath("/settings", { replace: true });
}

function getAgentsRouteFromPathname(pathname = window.location.pathname) {
  const segments = normalizePathname(pathname).split("/").filter(Boolean);
  if (segments[0] !== "agents") {
    return { view: "list", agentId: "", sessionId: "" };
  }

  const agentId = segments[1] || "";
  if (!agentId) {
    return { view: "list", agentId: "", sessionId: "" };
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

function setBrowserPath(pathname, { replace = false } = {}) {
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

function getPathForPage(pageId) {
  const normalizedPageId = String(pageId || "").trim().toLowerCase();
  if (normalizedPageId === "chat") {
    return "/chats";
  }
  if (!PAGE_IDS.has(normalizedPageId)) {
    return `/${NAV_ITEMS[0].id}`;
  }
  return `/${normalizedPageId}`;
}

function getPersistedCompanyId() {
  try {
    return window.localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function persistCompanyId(companyId) {
  try {
    if (!companyId) {
      window.localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyId);
  } catch {
    // Ignore local storage write failures.
  }
}

function isCodexAgent(agent) {
  return String(agent?.agentSdk || "")
    .trim()
    .toLowerCase() === "codex";
}

function normalizeAgentSdkValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isAvailableAgentSdk(value) {
  return AVAILABLE_AGENT_SDKS.includes(normalizeAgentSdkValue(value));
}

function normalizeRunnerCodexAvailableModels(runner) {
  if (!Array.isArray(runner?.codexAvailableModels)) {
    return [];
  }

  return runner.codexAvailableModels
    .map((entry) => ({
      name: String(entry?.name || "").trim(),
      reasoning: [
        ...new Set(
          (Array.isArray(entry?.reasoning) ? entry.reasoning : [entry?.reasoning])
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    }))
    .filter((entry) => Boolean(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function mergeAgentRunnerPayloadEntry(currentRunner, incomingRunner) {
  const fallbackModels = Array.isArray(currentRunner?.codexAvailableModels)
    ? currentRunner.codexAvailableModels
    : [];
  const incomingHasModelsField = Object.prototype.hasOwnProperty.call(
    incomingRunner || {},
    "codexAvailableModels",
  );
  const incomingModels = incomingHasModelsField ? incomingRunner?.codexAvailableModels : fallbackModels;
  const resolvedModels = Array.isArray(incomingModels) ? incomingModels : fallbackModels;

  return {
    ...(currentRunner || {}),
    ...(incomingRunner || {}),
    codexAvailableModels: resolvedModels,
  };
}

function mergeAgentRunnerPayloadList(currentRunners, incomingRunners) {
  if (!Array.isArray(incomingRunners)) {
    return Array.isArray(currentRunners) ? currentRunners : [];
  }

  const currentById = new Map(
    (Array.isArray(currentRunners) ? currentRunners : []).map((runner) => [String(runner?.id || ""), runner]),
  );

  return incomingRunners.map((incomingRunner) => {
    const incomingId = String(incomingRunner?.id || "");
    const currentRunner = incomingId ? currentById.get(incomingId) : null;
    return mergeAgentRunnerPayloadEntry(currentRunner, incomingRunner);
  });
}

function getRunnerModelNames(codexModelEntries) {
  return codexModelEntries.map((entry) => entry.name);
}

function getRunnerReasoningLevels(codexModelEntries, modelName) {
  const normalizedModel = String(modelName || "").trim();
  if (!normalizedModel) {
    return [];
  }
  const matchedEntry = codexModelEntries.find((entry) => entry.name === normalizedModel);
  return matchedEntry ? matchedEntry.reasoning : [];
}

function getRunnerCodexModelEntriesForRunner(codexModelEntriesByRunnerId, runnerId) {
  if (!runnerId) {
    return [];
  }
  return codexModelEntriesByRunnerId.get(runnerId) || [];
}

function resolveRunnerBackedModelSelection({
  codexModelEntries,
  requestedModel,
  requestedReasoning,
}) {
  const modelNames = getRunnerModelNames(codexModelEntries);
  const normalizedRequestedModel = String(requestedModel || "").trim();
  const nextModel = modelNames.includes(normalizedRequestedModel)
    ? normalizedRequestedModel
    : modelNames[0] || "";

  const reasoningLevels = getRunnerReasoningLevels(codexModelEntries, nextModel);
  const normalizedRequestedReasoning = String(requestedReasoning || "").trim();
  const nextReasoning = reasoningLevels.includes(normalizedRequestedReasoning)
    ? normalizedRequestedReasoning
    : reasoningLevels[0] || "";

  return { model: nextModel, modelReasoningLevel: nextReasoning };
}

function getCodexAuthVerificationUrl(codexAuthState) {
  const authUrl = String(codexAuthState?.verificationUri || "").trim();
  return authUrl || CODEX_DEVICE_AUTH_URL;
}

function createRelationshipDrafts(tasks) {
  return tasks.reduce((drafts, task) => {
    drafts[task.id] = {
      parentTaskId: toSelectValue(task.parentTaskId),
      dependsOnTaskId: toSelectValue(task.dependsOnTaskId),
    };
    return drafts;
  }, {});
}

function createAgentDrafts(agents) {
  return agents.reduce((drafts, agent) => {
    drafts[agent.id] = {
      agentRunnerId: agent.agentRunnerId || "",
      skillIds: [...(agent.skillIds || [])],
      mcpServerIds: [...(agent.mcpServerIds || [])],
      name: agent.name || "",
      agentSdk: agent.agentSdk || DEFAULT_AGENT_SDK,
      model: agent.model || "",
      modelReasoningLevel: agent.modelReasoningLevel || "",
    };
    return drafts;
  }, {});
}

function createSkillDrafts(skills) {
  return skills.reduce((drafts, skill) => {
    const normalizedSkillType = normalizeSkillType(skill.skillType);
    drafts[skill.id] = {
      name: skill.name || "",
      skillType: normalizedSkillType,
      skillsMpPackageName:
        normalizedSkillType === SKILL_TYPE_SKILLSMP
          ? String(skill.skillsMpPackageName || "").trim()
          : "",
      description: skill.description || "",
      instructions: skill.instructions || "",
    };
    return drafts;
  }, {});
}

function createMcpServerDrafts(mcpServers) {
  return mcpServers.reduce((drafts, mcpServer) => {
    drafts[mcpServer.id] = {
      name: mcpServer.name || "",
      transportType: normalizeMcpTransportType(mcpServer.transportType),
      url: mcpServer.url || "",
      command: mcpServer.command || "",
      argsText: mcpArgsToText(mcpServer.args || []),
      envVarsText: mcpEnvVarsToText(mcpServer.envVars || []),
      authType: normalizeMcpAuthType(mcpServer.authType),
      bearerToken: mcpServer.bearerToken || "",
      customHeadersText: mcpHeadersToText(mcpServer.customHeaders || []),
      enabled: mcpServer.enabled !== false,
    };
    return drafts;
  }, {});
}

function normalizeRunnerStatus(value) {
  return value === "ready" ? "ready" : "disconnected";
}

function formatRunnerLabel(runner) {
  if (!runner) {
    return "Unassigned";
  }
  return `${runner.id.slice(0, 8)} (${normalizeRunnerStatus(runner.status)})`;
}

function toSortableTimestamp(value) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

function formatTimestamp(value) {
  if (!value) {
    return "never";
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleString();
}

const CODEX_STREAM_DEFAULT_TURN_KEY = "__default_turn__";
const CODEX_TURN_COMPLETION_TYPES = new Set([
  "turn.completed",
  "turn.failed",
  "turn.cancelled",
  "turn.error",
]);

function parseCodexStreamPayload(message) {
  if (String(message?.role || "").trim().toLowerCase() !== "llm") {
    return null;
  }
  const rawContent = String(message?.content || "").trim();
  if (!rawContent.startsWith("{") || !rawContent.endsWith("}")) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getCodexStreamEventType(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const topLevelType = String(payload.type || "").trim().toLowerCase();
  if (topLevelType === "item" && payload.item && typeof payload.item === "object") {
    return String(payload.item.type || "").trim().toLowerCase() || topLevelType;
  }
  return topLevelType;
}

function getCodexStreamTurnKey(payload) {
  if (!payload || typeof payload !== "object") {
    return CODEX_STREAM_DEFAULT_TURN_KEY;
  }
  const candidates = [
    payload.turn_id,
    payload.turnId,
    payload.id,
    payload.turn?.id,
    payload.item?.turn_id,
    payload.item?.turnId,
  ];
  for (const candidate of candidates) {
    const cleaned = String(candidate || "").trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return CODEX_STREAM_DEFAULT_TURN_KEY;
}

function flattenCodexStreamText(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => flattenCodexStreamText(entry)).filter(Boolean).join("\n").trim();
  }
  if (!value || typeof value !== "object") {
    return "";
  }

  const directFields = [
    "text",
    "message",
    "output_text",
    "content",
    "delta",
    "summary",
    "reasoning",
  ];
  for (const fieldName of directFields) {
    if (!(fieldName in value)) {
      continue;
    }
    const text = flattenCodexStreamText(value[fieldName]);
    if (text) {
      return text;
    }
  }
  return "";
}

function getCodexStreamDisplayText(payload) {
  const text = flattenCodexStreamText(payload);
  if (text) {
    return text;
  }
  return JSON.stringify(payload, null, 2);
}

function getActiveCodexTurnKeys(chatMessages) {
  const activeTurnKeys = new Set();
  for (const message of Array.isArray(chatMessages) ? chatMessages : []) {
    const payload = parseCodexStreamPayload(message);
    if (!payload) {
      continue;
    }
    const eventType = getCodexStreamEventType(payload);
    if (!eventType) {
      continue;
    }
    const turnKey = getCodexStreamTurnKey(payload);
    if (eventType === "turn.started") {
      activeTurnKeys.add(turnKey);
      continue;
    }
    if (CODEX_TURN_COMPLETION_TYPES.has(eventType)) {
      activeTurnKeys.delete(turnKey);
    }
  }
  return activeTurnKeys;
}

function compareTurnsByTimestamp(a, b) {
  const leftTime = toSortableTimestamp(a?.createdAt || a?.startedAt);
  const rightTime = toSortableTimestamp(b?.createdAt || b?.startedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

function selectVisibleTurnsByMessageCount(chatTurns, visibleMessageCount) {
  const normalizedTurns = Array.isArray(chatTurns) ? chatTurns : [];
  const totalMessageCount = normalizedTurns.reduce((count, turn) => {
    return count + (Array.isArray(turn?.items) ? turn.items.length : 0);
  }, 0);
  const startMessageIndex = Math.max(0, totalMessageCount - Math.max(0, visibleMessageCount));

  let itemCursor = 0;
  const visibleTurns = [];
  for (const turn of normalizedTurns) {
    const turnItems = Array.isArray(turn?.items) ? turn.items : [];
    const visibleItems = [];
    for (const item of turnItems) {
      if (itemCursor >= startMessageIndex) {
        visibleItems.push(item);
      }
      itemCursor += 1;
    }

    if (visibleItems.length > 0 || (turnItems.length === 0 && itemCursor >= startMessageIndex)) {
      visibleTurns.push({ ...turn, items: visibleItems });
    }
  }

  return {
    visibleTurns,
    totalMessageCount,
  };
}

function quoteShellArg(value) {
  const normalizedValue = String(value ?? "");
  if (/^[A-Za-z0-9_./:-]+$/.test(normalizedValue)) {
    return normalizedValue;
  }
  return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
}

function buildRunnerStartCommand({
  backendGrpcTarget,
  runnerSecret,
}) {
  return [
    "agent-runner",
    "--backend-grpc-target",
    quoteShellArg(backendGrpcTarget),
    "--runner-secret",
    quoteShellArg(runnerSecret),
  ].join(" ");
}

async function executeGraphQL(query, variables) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message = payload?.errors?.[0]?.message || `GraphQL request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.data;
}

function subscribeGraphQL({
  query,
  variables,
  onData,
  onError,
}) {
  if (!GRAPHQL_WS_URL) {
    onError(new Error("GraphQL subscription URL is not configured."));
    return () => {};
  }

  const operationId = `sub_${Math.random().toString(36).slice(2)}`;
  const websocket = new WebSocket(GRAPHQL_WS_URL, "graphql-transport-ws");
  let active = true;
  let acknowledged = false;

  function shutdown() {
    if (!active) {
      return;
    }
    active = false;
    try {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(
          JSON.stringify({
            id: operationId,
            type: "complete",
          }),
        );
      }
    } catch {
      // Ignore close race errors.
    }
    try {
      websocket.close(1000, "client unsubscribe");
    } catch {
      // Ignore close race errors.
    }
  }

  websocket.onopen = () => {
    if (!active) {
      return;
    }
    websocket.send(JSON.stringify({ type: "connection_init" }));
  };

  websocket.onmessage = (event) => {
    if (!active) {
      return;
    }

    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      onError(new Error("Subscription message was not valid JSON."));
      shutdown();
      return;
    }

    const messageType = String(message?.type || "").toLowerCase();
    if (messageType === "connection_ack") {
      acknowledged = true;
      websocket.send(
        JSON.stringify({
          id: operationId,
          type: "subscribe",
          payload: { query, variables },
        }),
      );
      return;
    }

    if (messageType === "ping") {
      websocket.send(JSON.stringify({ type: "pong" }));
      return;
    }

    if (messageType === "next") {
      if (!acknowledged || String(message?.id || "") !== operationId) {
        return;
      }
      const payloadData = message?.payload?.data;
      if (payloadData) {
        onData(payloadData);
      }
      if (message?.payload?.errors?.length) {
        const details = String(message.payload.errors[0]?.message || "Subscription update failed.");
        onError(new Error(details));
      }
      return;
    }

    if (messageType === "error") {
      const details = String(
        message?.payload?.[0]?.message || message?.payload?.message || "Subscription failed.",
      );
      onError(new Error(details));
      shutdown();
      return;
    }

    if (messageType === "complete") {
      shutdown();
    }
  };

  websocket.onerror = () => {
    if (!active) {
      return;
    }
    onError(new Error("Subscription transport error."));
  };

  websocket.onclose = (event) => {
    if (!active) {
      return;
    }
    if (event.code !== 1000) {
      onError(new Error(event.reason || "Subscription connection closed unexpectedly."));
    }
    active = false;
  };

  return shutdown;
}

function useGraphQLSubscription({
  enabled,
  query,
  variables,
  onData,
  onError,
}) {
  const serializedVariables = useMemo(() => JSON.stringify(variables || {}), [variables]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const unsubscribe = subscribeGraphQL({
      query,
      variables: JSON.parse(serializedVariables),
      onData,
      onError,
    });
    return () => {
      unsubscribe();
    };
  }, [enabled, onData, onError, query, serializedVariables]);
}

function CompanyRequiredPanel({ hasCompanies }) {
  return (
    <section className="panel hero-panel">
      <p className="eyebrow">Company Scope</p>
      {hasCompanies ? (
        <>
          <h1>Select a company</h1>
          <p className="subcopy">
            Choose an existing company from the header dropdown to scope all queries.
          </p>
        </>
      ) : (
        <>
          <h1>Create your first company</h1>
          <p className="subcopy">
            No companies found yet. Open Settings to create your first company.
          </p>
        </>
      )}
    </section>
  );
}

function CreationModal({ modalId, title, description, isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="panel modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        aria-describedby={description ? `${modalId}-description` : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="panel-header panel-header-row modal-header">
          <div>
            <h2 id={`${modalId}-title`}>{title}</h2>
            {description ? (
              <p id={`${modalId}-description`} className="subcopy modal-description">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" className="secondary-btn modal-close-btn" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function AppHeader({
  hasCompanies,
  companies,
  selectedCompanyId,
  selectedCompany,
  isLoadingCompanies,
  companyError,
  onCompanyChange,
  onOpenSettings,
}) {
  return (
    <header className="panel app-header">
      <div className="app-header-title">
        <p className="eyebrow">Workspace</p>
        <h2>Company scope</h2>
      </div>

      <div className="app-header-controls">
        <label className="header-select-label" htmlFor="header-company-select">
          Active company
        </label>
        <div className="header-select-row">
          <select
            id="header-company-select"
            className="header-select"
            value={selectedCompanyId}
            onChange={(event) => onCompanyChange(event.target.value)}
            disabled={isLoadingCompanies}
          >
            <option value="">
              {isLoadingCompanies ? "Loading companies..." : "Select a company"}
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.id.slice(0, 8)})
              </option>
            ))}
          </select>
          <button type="button" className="secondary-btn" onClick={onOpenSettings}>
            Open settings
          </button>
        </div>
      </div>

      <p className="header-company-meta">
        {selectedCompany
          ? `${selectedCompany.name} (${selectedCompany.id.slice(0, 8)})`
          : hasCompanies
            ? "No company selected"
            : "No companies yet. Use Settings to create one."}
      </p>
      {companyError ? <p className="header-error">Company error: {companyError}</p> : null}
    </header>
  );
}

function Breadcrumbs({ items, onNavigate }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <nav className="panel breadcrumb-panel" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = String(item?.label || "").trim();
          const href = String(item?.href || "").trim();
          const key = `${label || "crumb"}-${index}`;

          return (
            <li key={key} className="breadcrumb-item">
              {isLast || !href ? (
                <span
                  className={isLast ? "breadcrumb-current" : "breadcrumb-text"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {label || "Untitled"}
                </span>
              ) : (
                <a
                  className="breadcrumb-link"
                  href={href}
                  onClick={(event) => {
                    if (!onNavigate) {
                      return;
                    }
                    event.preventDefault();
                    onNavigate(href);
                  }}
                >
                  {label}
                </a>
              )}
              {!isLast ? <span className="breadcrumb-separator">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function DashboardPage({
  selectedCompanyId,
  tasks,
  agentRunners,
  agents,
  chatAgentId,
  codexAuthState,
  isLoadingCodexAuthState,
  isStartingCodexAuth,
  codexVerificationUrl,
  codexAuthCopyFeedback,
  isLoadingTasks,
  isLoadingRunners,
  taskError,
  runnerError,
  onStartCodexDeviceAuth,
  onCopyDeviceCode,
  onNavigate,
}) {
  const readyRunnerCount = useMemo(() => {
    return agentRunners.filter((runner) => normalizeRunnerStatus(runner.status) === "ready")
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - readyRunnerCount;
  }, [agentRunners.length, readyRunnerCount]);

  const recentTasks = useMemo(() => {
    return [...tasks].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [tasks]);

  const recentRunners = useMemo(() => {
    return [...agentRunners]
      .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
      .slice(0, 5);
  }, [agentRunners]);

  const authAgent = useMemo(() => {
    if (chatAgentId) {
      const selectedAgent = agents.find((agent) => agent.id === chatAgentId);
      if (selectedAgent) {
        return selectedAgent;
      }
    }
    return agents.find((agent) => isCodexAgent(agent)) || null;
  }, [agents, chatAgentId]);

  const authAgentIsCodex = isCodexAgent(authAgent);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">CompanyHelm</p>
        <h1>Operations dashboard</h1>
        <p className="subcopy">
          Monitor task volume, runner connectivity, and jump into details from a single page.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={() => onNavigate("tasks")}>
            Open tasks
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Tasks</p>
          <p className="stat-value">{tasks.length}</p>
          <button type="button" className="inline-link" onClick={() => onNavigate("tasks")}>
            Open task page
          </button>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Runners</p>
          <p className="stat-value">{agentRunners.length}</p>
          <button
            type="button"
            className="inline-link"
            onClick={() => onNavigate("agent-runner")}
          >
            Open runner page
          </button>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Ready</p>
          <p className="stat-value">{readyRunnerCount}</p>
          <p className="stat-footnote">healthy connections</p>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Disconnected</p>
          <p className="stat-value">{disconnectedRunnerCount}</p>
          <p className="stat-footnote">needs attention</p>
        </article>
      </section>

      {taskError ? <p className="error-banner">Task error: {taskError}</p> : null}
      {runnerError ? <p className="error-banner">Runner error: {runnerError}</p> : null}

      <section className="dashboard-panels">
        <article className="panel">
          <header className="panel-header panel-header-row">
            <h2>Latest tasks</h2>
            <button type="button" className="secondary-btn" onClick={() => onNavigate("tasks")}>
              Manage
            </button>
          </header>

          {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}
          {!isLoadingTasks && recentTasks.length === 0 ? (
            <p className="empty-hint">No tasks yet.</p>
          ) : null}

          {recentTasks.length > 0 ? (
            <ul className="compact-list">
              {recentTasks.map((task) => (
                <li key={`dashboard-task-${task.id}`} className="compact-item">
                  <div>
                    <strong>{task.name}</strong>
                    <p>{task.description || "No description provided."}</p>
                  </div>
                  <span className="task-id">#{task.id}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel">
          <header className="panel-header panel-header-row">
            <h2>Runner heartbeat</h2>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onNavigate("agent-runner")}
            >
              Inspect
            </button>
          </header>

          {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
          {!isLoadingRunners && recentRunners.length === 0 ? (
            <p className="empty-hint">No runners registered yet.</p>
          ) : null}

          {recentRunners.length > 0 ? (
            <ul className="compact-list">
              {recentRunners.map((runner) => {
                const status = normalizeRunnerStatus(runner.status);
                return (
                  <li key={`dashboard-runner-${runner.id}`} className="compact-item">
                    <div>
                      <code className="runner-id">{runner.id}</code>
                      <p>Seen {formatTimestamp(runner.lastSeenAt)}</p>
                    </div>
                    <span className={`runner-status runner-status-${status}`}>{status}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </article>

        <article className="panel codex-home-auth-panel">
          <header className="panel-header panel-header-row">
            <h2>Codex device auth</h2>
            <div className="hero-actions codex-home-auth-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={onStartCodexDeviceAuth}
                disabled={!authAgentIsCodex || isStartingCodexAuth}
              >
                {isStartingCodexAuth ? "Starting..." : "Start device auth"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onNavigate("chats")}
              >
                Open chats
              </button>
            </div>
          </header>

          {!authAgent ? (
            <p className="empty-hint">Create a Codex agent, then start device authentication.</p>
          ) : null}

          {authAgent && !authAgentIsCodex ? (
            <p className="empty-hint">
              No Codex agent is selected for chat. Choose a Codex agent in the chats page.
            </p>
          ) : null}

          {authAgent && authAgentIsCodex ? (
            <div className="codex-auth-state">
              <p className="codex-auth-row">
                <strong>Agent:</strong> {authAgent.name} ({authAgent.id.slice(0, 8)})
              </p>
              <p className="codex-auth-row">
                <strong>Codex URL:</strong>{" "}
                <a
                  className="codex-auth-link"
                  href={codexVerificationUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {codexVerificationUrl}
                </a>
              </p>
              {isLoadingCodexAuthState ? (
                <p className="codex-auth-row">Loading auth state...</p>
              ) : null}
              {!isLoadingCodexAuthState && !codexAuthState ? (
                <p className="codex-auth-row">
                  No auth request yet. Click &quot;Start device auth&quot; to request a code.
                </p>
              ) : null}
              {codexAuthState ? (
                <>
                  <p className="codex-auth-row">
                    <strong>Status:</strong>{" "}
                    <span className={`codex-auth-status codex-auth-status-${codexAuthState.status}`}>
                      {codexAuthState.status}
                    </span>
                  </p>
                  <p className="codex-auth-row">
                    <strong>Updated:</strong> {formatTimestamp(codexAuthState.updatedAt)}
                  </p>
                  {codexAuthState.userCode ? (
                    <p className="codex-auth-row codex-auth-row-with-action">
                      <strong>Device code:</strong>{" "}
                      <code className="codex-auth-code">{codexAuthState.userCode}</code>
                      <button
                        type="button"
                        className="secondary-btn codex-auth-copy-btn"
                        onClick={() => onCopyDeviceCode(codexAuthState.userCode)}
                      >
                        Copy code
                      </button>
                    </p>
                  ) : (
                    <p className="codex-auth-row">
                      Device code will appear here after the runner starts the auth flow.
                    </p>
                  )}
                  {codexAuthState.message ? (
                    <p className="codex-auth-row">{codexAuthState.message}</p>
                  ) : null}
                </>
              ) : null}
              {codexAuthCopyFeedback ? (
                <p className="codex-auth-row codex-auth-copy-feedback">{codexAuthCopyFeedback}</p>
              ) : null}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

function TasksPage({
  selectedCompanyId,
  tasks,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  deletingTaskId,
  name,
  description,
  parentTaskId,
  dependsOnTaskId,
  relationshipDrafts,
  taskCountLabel,
  onNameChange,
  onDescriptionChange,
  onParentTaskChange,
  onDependsOnTaskChange,
  onCreateTask,
  onDraftChange,
  onSaveRelationships,
  onDeleteTask,
  renderTaskLink,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateTaskSubmit(event) {
    const didCreate = await onCreateTask(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Task Management</p>
        <h1>Task page</h1>
        <p className="subcopy">
          Create tasks, update dependency links, and keep planning relationships in sync.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Tasks</h2>
          <div className="task-meta">
            <span>{taskCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create task"
              title="Create task"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {taskError ? <p className="error-banner">{taskError}</p> : null}
        {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}
        {!isLoadingTasks && tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">Create your first task to populate this board.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create task
            </button>
          </div>
        ) : null}

        {tasks.length > 0 ? (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-card">
                <div className="task-card-top">
                  <strong>{task.name}</strong>
                  <span className="task-id">#{task.id}</span>
                </div>
                <p>{task.description || "No description provided."}</p>
                <div className="task-links">
                  <span>
                    parent: <em>{renderTaskLink(task.parentTaskId)}</em>
                  </span>
                  <span>
                    depends on: <em>{renderTaskLink(task.dependsOnTaskId)}</em>
                  </span>
                </div>

                <div className="relationship-editor">
                  <div className="relationship-grid">
                    <label className="relationship-field" htmlFor={`parent-${task.id}`}>
                      Parent
                    </label>
                    <select
                      id={`parent-${task.id}`}
                      value={relationshipDrafts[task.id]?.parentTaskId ?? ""}
                      onChange={(event) =>
                        onDraftChange(task.id, "parentTaskId", event.target.value)
                      }
                      disabled={savingTaskId === task.id || deletingTaskId === task.id}
                    >
                      <option value="">None</option>
                      {tasks
                        .filter((candidateTask) => candidateTask.id !== task.id)
                        .map((candidateTask) => (
                          <option
                            key={`parent-option-${task.id}-${candidateTask.id}`}
                            value={String(candidateTask.id)}
                          >
                            #{candidateTask.id} {candidateTask.name}
                          </option>
                        ))}
                    </select>

                    <label className="relationship-field" htmlFor={`depends-on-${task.id}`}>
                      Depends on
                    </label>
                    <select
                      id={`depends-on-${task.id}`}
                      value={relationshipDrafts[task.id]?.dependsOnTaskId ?? ""}
                      onChange={(event) =>
                        onDraftChange(task.id, "dependsOnTaskId", event.target.value)
                      }
                      disabled={savingTaskId === task.id || deletingTaskId === task.id}
                    >
                      <option value="">None</option>
                      {tasks
                        .filter((candidateTask) => candidateTask.id !== task.id)
                        .map((candidateTask) => (
                          <option
                            key={`dependency-option-${task.id}-${candidateTask.id}`}
                            value={String(candidateTask.id)}
                          >
                            #{candidateTask.id} {candidateTask.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn relationship-save-btn"
                      onClick={() => onSaveRelationships(task.id)}
                      disabled={savingTaskId === task.id || deletingTaskId === task.id}
                    >
                      {savingTaskId === task.id ? "Saving links..." : "Save links"}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDeleteTask(task.id, task.name)}
                      disabled={savingTaskId === task.id || deletingTaskId === task.id}
                    >
                      {deletingTaskId === task.id ? "Deleting..." : "Delete task"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-task-modal"
        title="Create task"
        description="Add a new task for the current company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateTaskSubmit}>
          <label htmlFor="task-name">Name</label>
          <input
            id="task-name"
            name="name"
            placeholder="e.g. Build API docs"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            placeholder="Optional details..."
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />

          <label htmlFor="task-parent">Parent task</label>
          <select
            id="task-parent"
            name="parentTaskId"
            value={parentTaskId}
            onChange={(event) => onParentTaskChange(event.target.value)}
          >
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={`create-parent-${task.id}`} value={String(task.id)}>
                #{task.id} {task.name}
              </option>
            ))}
          </select>

          <label htmlFor="task-dependency">Depends on</label>
          <select
            id="task-dependency"
            name="dependsOnTaskId"
            value={dependsOnTaskId}
            onChange={(event) => onDependsOnTaskChange(event.target.value)}
          >
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={`create-dependency-${task.id}`} value={String(task.id)}>
                #{task.id} {task.name}
              </option>
            ))}
          </select>

          <button type="submit" disabled={isSubmittingTask}>
            {isSubmittingTask ? "Creating..." : "Create task"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function AgentRunnerPage({
  selectedCompanyId,
  agentRunners,
  agents,
  isLoadingRunners,
  runnerError,
  codexAuthError,
  isStartingCodexAuth,
  isCreatingRunner,
  runnerIdDraft,
  runnerSecretDraft,
  runnerGrpcTarget,
  runnerSecretsById,
  regeneratingRunnerId,
  deletingRunnerId,
  runnerCountLabel,
  onRunnerIdChange,
  onRunnerSecretChange,
  onRunnerCommandSecretChange,
  onCreateRunner,
  onStartRunnerCodexDeviceAuth,
  onNavigate,
  onRegenerateRunnerSecret,
  onDeleteRunner,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const readyRunnerCount = useMemo(() => {
    return agentRunners.filter((runner) => normalizeRunnerStatus(runner.status) === "ready")
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - readyRunnerCount;
  }, [agentRunners.length, readyRunnerCount]);

  async function handleCreateRunnerSubmit(event) {
    const didCreate = await onCreateRunner(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Infrastructure</p>
        <h1>Agent runner page</h1>
        <p className="subcopy">
          Track runner status signals and heartbeat timestamps.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Registered</p>
          <p className="stat-value">{agentRunners.length}</p>
          <p className="stat-footnote">{runnerCountLabel}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Ready</p>
          <p className="stat-value">{readyRunnerCount}</p>
          <p className="stat-footnote">connected</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Disconnected</p>
          <p className="stat-value">{disconnectedRunnerCount}</p>
          <p className="stat-footnote">attention needed</p>
        </article>
      </section>

      <section className="panel runner-panel">
        <header className="panel-header panel-header-row">
          <h2>Agent runners</h2>
          <div className="task-meta">
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create agent runner"
              title="Create agent runner"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {runnerError ? <p className="error-banner">{runnerError}</p> : null}
        {codexAuthError ? <p className="error-banner">Auth error: {codexAuthError}</p> : null}
        {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
        {!isLoadingRunners && agentRunners.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agent runners registered yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create runner
            </button>
          </div>
        ) : null}

        {agentRunners.length > 0 ? (
          <ul className="runner-list">
            {[...agentRunners]
              .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
              .map((runner) => {
                const runnerStatus = normalizeRunnerStatus(runner.status);
                const runnerSecret = runnerSecretsById[runner.id] || "";
                const codexAvailableModels = normalizeRunnerCodexAvailableModels(runner);
                const codexAvailableModelsPreview = codexAvailableModels.slice(0, 4);
                const codexAvailableModelsOverflow = Math.max(
                  0,
                  codexAvailableModels.length - codexAvailableModelsPreview.length,
                );
                const codexAgentsForRunner = (agents || [])
                  .filter((agent) => agent?.agentRunnerId === runner.id && isCodexAgent(agent))
                  .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
                const codexAgentForAuth = codexAgentsForRunner[0] || null;
                const canStartAuth = runnerStatus === "ready" && codexAgentForAuth;
                const runnerCommand = buildRunnerStartCommand({
                  backendGrpcTarget: runnerGrpcTarget,
                  runnerSecret: runnerSecret || "<RUNNER_SECRET>",
                });
                const renderModelPill = (entry, index) => {
                  const reasoningLabel = entry.reasoning.join(", ");
                  return (
                    <span
                      key={`${entry.name}-${index}`}
                      className="runner-model-pill"
                      title={reasoningLabel ? `${entry.name} (${reasoningLabel})` : entry.name}
                    >
                      <span className="runner-model-name">{entry.name}</span>
                      {entry.reasoning.length > 0 ? (
                        <span className="runner-model-reasons">
                          {entry.reasoning.map((level, reasonIndex) => (
                            <span
                              key={`${entry.name}-${index}-reason-${reasonIndex}`}
                              className="runner-model-reason"
                            >
                              {level}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  );
                };
                return (
                  <li key={runner.id} className="runner-card">
                    <div className="runner-card-top">
                      <code className="runner-id">{runner.id}</code>
                      <span className={`runner-status runner-status-${runnerStatus}`}>
                        {runnerStatus}
                      </span>
                    </div>
                    <p className="runner-last-seen">
                      Last seen: <em>{formatTimestamp(runner.lastSeenAt)}</em>
                    </p>
                    <p className="runner-last-seen">
                      Last health check: <em>{formatTimestamp(runner.lastHealthCheckAt)}</em>
                    </p>
                    <section className="runner-codex-section">
                      <h3 className="runner-section-title">Codex</h3>
                      <p className="runner-last-seen">
                        Authentication status:{" "}
                        <span
                          className={`runner-codex-auth runner-codex-auth-${
                            runner.codexAuthenticated ? "authenticated" : "not-authenticated"
                          }`}
                        >
                          {runner.codexAuthenticated ? "authenticated" : "not authenticated"}
                        </span>
                      </p>
                      <div className="runner-last-seen runner-models-row">
                        <span className="runner-models-label">Reported models:</span>
                        {codexAvailableModels.length === 0 ? (
                          <em className="runner-models-empty">none reported yet</em>
                        ) : codexAvailableModelsOverflow === 0 ? (
                          <span className="runner-models-list">
                            {codexAvailableModelsPreview.map((entry, index) =>
                              renderModelPill(entry, index),
                            )}
                          </span>
                        ) : (
                          <details className="runner-models-details">
                            <summary className="runner-models-summary">
                              <span className="runner-models-list">
                                {codexAvailableModelsPreview.map((entry, index) =>
                                  renderModelPill(entry, index),
                                )}
                                <span className="runner-model-pill runner-model-pill-more">
                                  +{codexAvailableModelsOverflow} more
                                </span>
                              </span>
                            </summary>
                            <div className="runner-models-expanded">
                              <span className="runner-models-list">
                                {codexAvailableModels.map((entry, index) =>
                                  renderModelPill(entry, index),
                                )}
                              </span>
                            </div>
                          </details>
                        )}
                      </div>
                    </section>
                    {!runner.codexAuthenticated ? (
                      <div className="runner-auth-block">
                        {codexAgentForAuth ? (
                          <>
                            <p className="runner-command-hint">
                              Uses Codex agent:{" "}
                              <strong>
                                {codexAgentForAuth.name} ({codexAgentForAuth.id.slice(0, 8)})
                              </strong>
                            </p>
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() =>
                                onStartRunnerCodexDeviceAuth(runner.id, codexAgentForAuth.id)
                              }
                              disabled={!canStartAuth || isStartingCodexAuth}
                            >
                              {isStartingCodexAuth ? "Starting..." : "Start auth process"}
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="runner-command-hint">
                              No Codex agent is assigned to this runner yet.
                            </p>
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => onNavigate("agents")}
                            >
                              Open agents
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}
                    <div className="runner-cli-block">
                      <label
                        className="relationship-field"
                        htmlFor={`runner-secret-command-${runner.id}`}
                      >
                        Runner secret for CLI
                      </label>
                      <input
                        id={`runner-secret-command-${runner.id}`}
                        className="runner-secret-input"
                        type="text"
                        value={runnerSecret}
                        onChange={(event) =>
                          onRunnerCommandSecretChange(runner.id, event.target.value)
                        }
                        placeholder="Paste runner secret to complete command"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <pre className="runner-command runner-command-inline">
                        <code>{runnerCommand}</code>
                      </pre>
                      {!runnerSecret ? (
                        <p className="runner-command-hint">
                          Secret is only shown at provisioning time. Paste it here to run this
                          command.
                        </p>
                      ) : null}
                    </div>
                    <div className="runner-card-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onRegenerateRunnerSecret(runner.id)}
                        disabled={
                          deletingRunnerId === runner.id || regeneratingRunnerId === runner.id
                        }
                      >
                        {regeneratingRunnerId === runner.id ? "Regenerating..." : "Regenerate key"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteRunner(runner.id)}
                        disabled={
                          deletingRunnerId === runner.id || regeneratingRunnerId === runner.id
                        }
                      >
                        {deletingRunnerId === runner.id ? "Deleting..." : "Delete runner"}
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-runner-modal"
        title="Create agent runner"
        description="Register a new runner endpoint for this company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateRunnerSubmit}>
          <label htmlFor="runner-id">Runner UUID (optional)</label>
          <input
            id="runner-id"
            name="runnerId"
            placeholder="Leave blank to auto-generate"
            value={runnerIdDraft}
            onChange={(event) => onRunnerIdChange(event.target.value)}
            autoFocus
          />

          <label htmlFor="runner-secret">Runner secret (optional)</label>
          <input
            id="runner-secret"
            name="runnerSecret"
            placeholder="Leave blank to auto-generate"
            value={runnerSecretDraft}
            onChange={(event) => onRunnerSecretChange(event.target.value)}
          />

          <button type="submit" disabled={isCreatingRunner}>
            {isCreatingRunner ? "Creating..." : "Create runner"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function AgentsPage({
  selectedCompanyId,
  agents,
  skills,
  mcpServers,
  agentRunners,
  agentRunnerLookup,
  runnerCodexModelEntriesById,
  isLoadingAgents,
  agentError,
  isCreatingAgent,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  retryingAgentSkillInstallKey,
  canInitializeAgents,
  agentRunnerId,
  agentSkillIds,
  agentMcpServerIds,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDrafts,
  agentCountLabel,
  onAgentRunnerChange,
  onAgentSkillIdsChange,
  onAgentMcpServerIdsChange,
  onAgentNameChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onCreateAgent,
  onAgentDraftChange,
  onSaveAgent,
  onInitializeAgent,
  onRetryAgentSkillInstall,
  onOpenAgentSessions,
  onDeleteAgent,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const skillLookup = useMemo(() => {
    return skills.reduce((map, skill) => {
      map.set(skill.id, skill);
      return map;
    }, new Map());
  }, [skills]);
  const mcpServerLookup = useMemo(() => {
    return mcpServers.reduce((map, mcpServer) => {
      map.set(mcpServer.id, mcpServer);
      return map;
    }, new Map());
  }, [mcpServers]);
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);
  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);
  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);
  const createAssignedMcpServerIds = useMemo(
    () => normalizeUniqueStringList(agentMcpServerIds),
    [agentMcpServerIds],
  );
  const createAssignedSkillIds = useMemo(() => normalizeUniqueStringList(agentSkillIds), [agentSkillIds]);
  const createAvailableSkills = useMemo(
    () => skills.filter((skill) => !createAssignedSkillIds.includes(skill.id)),
    [createAssignedSkillIds, skills],
  );
  const createAvailableMcpServers = useMemo(
    () => mcpServers.filter((mcpServer) => !createAssignedMcpServerIds.includes(mcpServer.id)),
    [createAssignedMcpServerIds, mcpServers],
  );

  async function handleCreateAgentSubmit(event) {
    const didCreate = await onCreateAgent(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Registry</p>
        <h1>Agents page</h1>
        <p className="subcopy">
          Register AI agents by SDK, model, and reasoning profile for the active company.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Agents</h2>
          <div className="task-meta">
            <span>{agentCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create agent"
              title="Create agent"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {agentError ? <p className="error-banner">{agentError}</p> : null}
        {isLoadingAgents ? <p className="empty-hint">Loading agents...</p> : null}
        {!isLoadingAgents && agents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No agents created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create agent
            </button>
          </div>
        ) : null}

        {agents.length > 0 ? (
          <ul className="task-list">
            {agents.map((agent) => {
              const assignedRunner = agent.agentRunnerId
                ? agentRunnerLookup.get(agent.agentRunnerId) || {
                    id: agent.agentRunnerId,
                    status: "disconnected",
                  }
                : null;
              const assignedRunnerLabel = assignedRunner
                ? formatRunnerLabel(assignedRunner)
                : "Unassigned";
              const assignedSkillLabels = (agent.skillIds || []).map((skillId) => {
                const skill = skillLookup.get(skillId);
                if (!skill) {
                  return skillId;
                }
                return formatSkillLabel(skill);
              });
              const assignedSkillSummary =
                assignedSkillLabels.length > 0 ? assignedSkillLabels.join(", ") : "none";
              const assignedMcpServerLabels = (agent.mcpServerIds || []).map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                return mcpServer ? mcpServer.name : mcpServerId;
              });
              const assignedMcpServerSummary =
                assignedMcpServerLabels.length > 0 ? assignedMcpServerLabels.join(", ") : "none";
              const installedSkillRows = Array.isArray(agent.installedSkills)
                ? agent.installedSkills.filter(
                    (installedSkill) =>
                      normalizeSkillType(installedSkill?.skillType) === SKILL_TYPE_SKILLSMP,
                  )
                : [];
              const draft = agentDrafts[agent.id] || {
                agentRunnerId: "",
                skillIds: [],
                mcpServerIds: [],
                name: "",
                agentSdk: DEFAULT_AGENT_SDK,
                model: "",
                modelReasoningLevel: "",
              };
              const draftSkillIds = normalizeUniqueStringList(draft.skillIds);
              const draftAvailableSkills = skills.filter(
                (skill) => !draftSkillIds.includes(skill.id),
              );
              const draftMcpServerIds = normalizeUniqueStringList(draft.mcpServerIds);
              const draftAvailableMcpServers = mcpServers.filter(
                (mcpServer) => !draftMcpServerIds.includes(mcpServer.id),
              );
              const draftRunnerCodexModelEntries = getRunnerCodexModelEntriesForRunner(
                runnerCodexModelEntriesById,
                draft.agentRunnerId,
              );
              const draftRunnerModelNames = getRunnerModelNames(draftRunnerCodexModelEntries);
              const draftRunnerReasoningLevels = getRunnerReasoningLevels(
                draftRunnerCodexModelEntries,
                draft.model,
              );
              const isSavingOrDeleting =
                savingAgentId === agent.id || deletingAgentId === agent.id;

              return (
                <li key={agent.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{agent.name}</strong>
                    <code className="runner-id">{agent.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    SDK: <strong>{agent.agentSdk}</strong> • model: <strong>{agent.model}</strong>{" "}
                    • reasoning: <strong>{agent.modelReasoningLevel}</strong>
                  </p>
                  <p className="agent-subcopy">
                    Runner: <strong>{assignedRunnerLabel}</strong>
                  </p>
                  <p className="agent-subcopy">
                    Skills: <strong>{assignedSkillSummary}</strong>
                  </p>
                  <p className="agent-subcopy">
                    MCP servers: <strong>{assignedMcpServerSummary}</strong>
                  </p>
                  {installedSkillRows.length > 0 ? (
                    <div className="agent-installed-skills">
                      <p className="agent-subcopy">
                        SkillsMP install status:
                      </p>
                      {installedSkillRows.map((installedSkill) => {
                        const installKey = `${agent.id}:${installedSkill.skillId}`;
                        const retryingThisInstall = retryingAgentSkillInstallKey === installKey;
                        const installStatus = String(installedSkill.status || "").trim() || "unknown";
                        const installMessage = String(installedSkill.message || "").trim();
                        const installLogs = String(installedSkill.installLogs || "").trim();
                        return (
                          <div key={`installed-skill-${installKey}`} className="agent-installed-skill-row">
                            <p className="agent-subcopy">
                              <strong>{installedSkill.skillName || installedSkill.skillId}</strong>:{" "}
                              <span className={`agent-install-status agent-install-status-${installStatus}`}>
                                {installStatus}
                              </span>
                              {installMessage ? ` (${installMessage})` : ""}
                            </p>
                            <div className="task-card-actions">
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                  onRetryAgentSkillInstall(agent.id, installedSkill.skillId)
                                }
                                disabled={retryingThisInstall || isSavingOrDeleting}
                              >
                                {retryingThisInstall ? "Retrying..." : "Retry install"}
                              </button>
                            </div>
                            {installLogs ? (
                              <details className="agent-install-logs">
                                <summary>View install logs</summary>
                                <pre>{installLogs}</pre>
                              </details>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="relationship-editor">
                    <div className="agent-edit-grid">
                      <label className="relationship-field" htmlFor={`agent-runner-${agent.id}`}>
                        Runner
                      </label>
                      <select
                        id={`agent-runner-${agent.id}`}
                        value={draft.agentRunnerId}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentRunnerId", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        <option value="">Unassigned</option>
                        {agentRunners.map((runner) => (
                          <option key={runner.id} value={runner.id}>
                            {formatRunnerLabel(runner)}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-name-${agent.id}`}>
                        Name
                      </label>
                      <input
                        id={`agent-name-${agent.id}`}
                        value={draft.name}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`agent-sdk-${agent.id}`}>
                        SDK
                      </label>
                      <select
                        id={`agent-sdk-${agent.id}`}
                        value={draft.agentSdk}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentSdk", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {AVAILABLE_AGENT_SDKS.map((sdkName) => (
                          <option key={`${agent.id}-sdk-${sdkName}`} value={sdkName}>
                            {sdkName}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-model-${agent.id}`}>
                        Model
                      </label>
                      <select
                        id={`agent-model-${agent.id}`}
                        value={draft.model}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "model", event.target.value)
                        }
                        disabled={isSavingOrDeleting || !draft.agentRunnerId}
                      >
                        {!draft.agentRunnerId ? (
                          <option value="">Select a runner first</option>
                        ) : draftRunnerModelNames.length === 0 ? (
                          <option value="">No models reported by selected runner</option>
                        ) : (
                          <>
                            <option value="">Select model</option>
                            {draftRunnerModelNames.map((modelName) => (
                              <option key={`${agent.id}-model-${modelName}`} value={modelName}>
                                {modelName}
                              </option>
                            ))}
                          </>
                        )}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-reasoning-${agent.id}`}>
                        Reasoning
                      </label>
                      <select
                        id={`agent-reasoning-${agent.id}`}
                        value={draft.modelReasoningLevel}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "modelReasoningLevel", event.target.value)
                        }
                        disabled={isSavingOrDeleting || !draft.agentRunnerId || !draft.model}
                      >
                        {!draft.agentRunnerId ? (
                          <option value="">Select a runner first</option>
                        ) : !draft.model ? (
                          <option value="">Select a model first</option>
                        ) : draftRunnerReasoningLevels.length === 0 ? (
                          <option value="">No reasoning levels reported for this model</option>
                        ) : (
                          <>
                            <option value="">Select reasoning</option>
                            {draftRunnerReasoningLevels.map((reasoningLevel) => (
                              <option
                                key={`${agent.id}-reasoning-${reasoningLevel}`}
                                value={reasoningLevel}
                              >
                                {reasoningLevel}
                              </option>
                            ))}
                          </>
                        )}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-skills-assigned-${agent.id}`}>
                        Assigned skills
                      </label>
                      <div id={`agent-skills-assigned-${agent.id}`} className="inline-selection-list">
                        {draftSkillIds.length === 0 ? (
                          <span className="empty-hint">No skills assigned.</span>
                        ) : (
                          draftSkillIds.map((skillId) => {
                            const skill = skillLookup.get(skillId);
                            const skillLabel = skill ? formatSkillLabel(skill) : skillId;
                            return (
                              <button
                                key={`agent-remove-skill-${agent.id}-${skillId}`}
                                type="button"
                                className="tag-remove-btn"
                                onClick={() =>
                                  onAgentDraftChange(
                                    agent.id,
                                    "skillIds",
                                    draftSkillIds.filter((candidateId) => candidateId !== skillId),
                                  )
                                }
                                disabled={isSavingOrDeleting}
                                title={`Remove ${skillLabel}`}
                              >
                                {skillLabel} ×
                              </button>
                            );
                          })
                        )}
                      </div>

                      <label className="relationship-field" htmlFor={`agent-skills-add-${agent.id}`}>
                        Add skill
                      </label>
                      <select
                        id={`agent-skills-add-${agent.id}`}
                        value=""
                        onChange={(event) => {
                          const nextSkillId = String(event.target.value || "").trim();
                          if (!nextSkillId) {
                            return;
                          }
                          onAgentDraftChange(agent.id, "skillIds", [...draftSkillIds, nextSkillId]);
                        }}
                        disabled={isSavingOrDeleting || draftAvailableSkills.length === 0}
                      >
                        <option value="">
                          {draftAvailableSkills.length === 0
                            ? "All company skills already assigned"
                            : "Select skill to assign"}
                        </option>
                        {draftAvailableSkills.map((skill) => (
                          <option key={`agent-skill-option-${agent.id}-${skill.id}`} value={skill.id}>
                            {formatSkillLabel(skill)}
                          </option>
                        ))}
                      </select>

                      <label className="relationship-field" htmlFor={`agent-mcp-assigned-${agent.id}`}>
                        Assigned MCP servers
                      </label>
                      <div id={`agent-mcp-assigned-${agent.id}`} className="inline-selection-list">
                        {draftMcpServerIds.length === 0 ? (
                          <span className="empty-hint">No MCP servers assigned.</span>
                        ) : (
                          draftMcpServerIds.map((mcpServerId) => {
                            const mcpServer = mcpServerLookup.get(mcpServerId);
                            const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                            return (
                              <button
                                key={`agent-remove-mcp-${agent.id}-${mcpServerId}`}
                                type="button"
                                className="tag-remove-btn"
                                onClick={() =>
                                  onAgentDraftChange(
                                    agent.id,
                                    "mcpServerIds",
                                    draftMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                                  )
                                }
                                disabled={isSavingOrDeleting}
                                title={`Remove ${mcpServerLabel}`}
                              >
                                {mcpServerLabel} ×
                              </button>
                            );
                          })
                        )}
                      </div>

                      <label className="relationship-field" htmlFor={`agent-mcp-add-${agent.id}`}>
                        Add MCP server
                      </label>
                      <select
                        id={`agent-mcp-add-${agent.id}`}
                        value=""
                        onChange={(event) => {
                          const nextMcpServerId = String(event.target.value || "").trim();
                          if (!nextMcpServerId) {
                            return;
                          }
                          onAgentDraftChange(
                            agent.id,
                            "mcpServerIds",
                            [...draftMcpServerIds, nextMcpServerId],
                          );
                        }}
                        disabled={isSavingOrDeleting || draftAvailableMcpServers.length === 0}
                      >
                        <option value="">
                          {draftAvailableMcpServers.length === 0
                            ? "All company MCP servers already assigned"
                            : "Select MCP server to assign"}
                        </option>
                        {draftAvailableMcpServers.map((mcpServer) => (
                          <option key={`agent-mcp-option-${agent.id}-${mcpServer.id}`} value={mcpServer.id}>
                            {mcpServer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onOpenAgentSessions(agent.id)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        Chats
                      </button>
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveAgent(agent.id)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        {savingAgentId === agent.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onInitializeAgent(agent.id)}
                        disabled={
                          !canInitializeAgents ||
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        {initializingAgentId === agent.id ? "Initializing..." : "Initialize"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteAgent(agent.id, agent.name)}
                        disabled={
                          savingAgentId === agent.id ||
                          deletingAgentId === agent.id ||
                          initializingAgentId === agent.id
                        }
                      >
                        {deletingAgentId === agent.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-agent-modal"
        title="Create agent"
        description="Register a new agent profile for this company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateAgentSubmit}>
          <label htmlFor="agent-runner-id">Assigned runner (optional)</label>
          <select
            id="agent-runner-id"
            name="agentRunnerId"
            value={agentRunnerId}
            onChange={(event) => onAgentRunnerChange(event.target.value)}
          >
            <option value="">Unassigned</option>
            {agentRunners.map((runner) => (
              <option key={runner.id} value={runner.id}>
                {formatRunnerLabel(runner)}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-skills-assigned">Assigned skills (optional)</label>
          <div id="create-agent-skills-assigned" className="inline-selection-list">
            {createAssignedSkillIds.length === 0 ? (
              <span className="empty-hint">No skills assigned.</span>
            ) : (
              createAssignedSkillIds.map((skillId) => {
                const skill = skillLookup.get(skillId);
                const skillLabel = skill ? formatSkillLabel(skill) : skillId;
                return (
                  <button
                    key={`create-agent-remove-skill-${skillId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onAgentSkillIdsChange(
                        createAssignedSkillIds.filter((candidateId) => candidateId !== skillId),
                      )
                    }
                    title={`Remove ${skillLabel}`}
                  >
                    {skillLabel} ×
                  </button>
                );
              })
            )}
          </div>

          <label htmlFor="create-agent-skill-add">Add skill</label>
          <select
            id="create-agent-skill-add"
            value=""
            onChange={(event) => {
              const nextSkillId = String(event.target.value || "").trim();
              if (!nextSkillId) {
                return;
              }
              onAgentSkillIdsChange([...createAssignedSkillIds, nextSkillId]);
            }}
            disabled={createAvailableSkills.length === 0}
          >
            <option value="">
              {createAvailableSkills.length === 0
                ? "All company skills already assigned"
                : "Select skill to assign"}
            </option>
            {createAvailableSkills.map((skill) => (
              <option key={`create-agent-skill-${skill.id}`} value={skill.id}>
                {formatSkillLabel(skill)}
              </option>
            ))}
          </select>

          <label htmlFor="create-agent-mcp-assigned">Assigned MCP servers (optional)</label>
          <div id="create-agent-mcp-assigned" className="inline-selection-list">
            {createAssignedMcpServerIds.length === 0 ? (
              <span className="empty-hint">No MCP servers assigned.</span>
            ) : (
              createAssignedMcpServerIds.map((mcpServerId) => {
                const mcpServer = mcpServerLookup.get(mcpServerId);
                const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                return (
                  <button
                    key={`create-agent-remove-mcp-${mcpServerId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onAgentMcpServerIdsChange(
                        createAssignedMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                      )
                    }
                    title={`Remove ${mcpServerLabel}`}
                  >
                    {mcpServerLabel} ×
                  </button>
                );
              })
            )}
          </div>

          <label htmlFor="create-agent-mcp-add">Add MCP server</label>
          <select
            id="create-agent-mcp-add"
            value=""
            onChange={(event) => {
              const nextMcpServerId = String(event.target.value || "").trim();
              if (!nextMcpServerId) {
                return;
              }
              onAgentMcpServerIdsChange([...createAssignedMcpServerIds, nextMcpServerId]);
            }}
            disabled={createAvailableMcpServers.length === 0}
          >
            <option value="">
              {createAvailableMcpServers.length === 0
                ? "All company MCP servers already assigned"
                : "Select MCP server to assign"}
            </option>
            {createAvailableMcpServers.map((mcpServer) => (
              <option key={`create-agent-mcp-${mcpServer.id}`} value={mcpServer.id}>
                {mcpServer.name}
              </option>
            ))}
          </select>

          <label htmlFor="agent-name">Name</label>
          <input
            id="agent-name"
            name="name"
            placeholder="e.g. CEO Agent"
            value={agentName}
            onChange={(event) => onAgentNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="agent-sdk">Agent SDK</label>
          <select
            id="agent-sdk"
            name="agentSdk"
            value={agentSdk}
            onChange={(event) => onAgentSdkChange(event.target.value)}
            required
          >
            {AVAILABLE_AGENT_SDKS.map((sdkName) => (
              <option key={`create-agent-sdk-${sdkName}`} value={sdkName}>
                {sdkName}
              </option>
            ))}
          </select>

          <label htmlFor="agent-model">Model</label>
          <select
            id="agent-model"
            name="model"
            value={agentModel}
            onChange={(event) => onAgentModelChange(event.target.value)}
            required
            disabled={!agentRunnerId}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : createRunnerModelNames.length === 0 ? (
              <option value="">No models reported by selected runner</option>
            ) : (
              <>
                <option value="">Select model</option>
                {createRunnerModelNames.map((modelName) => (
                  <option key={`create-agent-model-${modelName}`} value={modelName}>
                    {modelName}
                  </option>
                ))}
              </>
            )}
          </select>

          <label htmlFor="agent-reasoning-level">Model reasoning level</label>
          <select
            id="agent-reasoning-level"
            name="modelReasoningLevel"
            value={agentModelReasoningLevel}
            onChange={(event) => onAgentModelReasoningLevelChange(event.target.value)}
            required
            disabled={!agentRunnerId || !agentModel}
          >
            {!agentRunnerId ? (
              <option value="">Select a runner first</option>
            ) : !agentModel ? (
              <option value="">Select a model first</option>
            ) : createRunnerReasoningLevels.length === 0 ? (
              <option value="">No reasoning levels reported for this model</option>
            ) : (
              <>
                <option value="">Select reasoning</option>
                {createRunnerReasoningLevels.map((reasoningLevel) => (
                  <option key={`create-agent-reasoning-${reasoningLevel}`} value={reasoningLevel}>
                    {reasoningLevel}
                  </option>
                ))}
              </>
            )}
          </select>

          <button type="submit" disabled={isCreatingAgent}>
            {isCreatingAgent ? "Creating..." : "Create agent"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function SkillsPage({
  selectedCompanyId,
  skills,
  isLoadingSkills,
  skillError,
  isCreatingSkill,
  savingSkillId,
  deletingSkillId,
  skillName,
  skillType,
  skillSkillsMpPackageName,
  skillDescription,
  skillInstructions,
  skillDrafts,
  skillCountLabel,
  onSkillNameChange,
  onSkillTypeChange,
  onSkillSkillsMpPackageNameChange,
  onSkillDescriptionChange,
  onSkillInstructionsChange,
  onCreateSkill,
  onSkillDraftChange,
  onSaveSkill,
  onDeleteSkill,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateSkillSubmit(event) {
    const didCreate = await onCreateSkill(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Skill Library</p>
        <h1>Skills page</h1>
        <p className="subcopy">
          Capture reusable skills with clear descriptions and detailed instructions.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Skills</h2>
          <div className="task-meta">
            <span>{skillCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create skill"
              title="Create skill"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {skillError ? <p className="error-banner">{skillError}</p> : null}
        {isLoadingSkills ? <p className="empty-hint">Loading skills...</p> : null}
        {!isLoadingSkills && skills.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No skills created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create skill
            </button>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <ul className="task-list">
            {skills.map((skill) => {
              const draft = skillDrafts[skill.id] || {
                name: "",
                skillType: SKILL_TYPE_TEXT,
                skillsMpPackageName: "",
                description: "",
                instructions: "",
              };
              const resolvedSkillType = normalizeSkillType(draft.skillType);
              const isSavingOrDeleting =
                savingSkillId === skill.id || deletingSkillId === skill.id;
              return (
                <li key={skill.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{skill.name}</strong>
                    <code className="runner-id">{skill.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    Type: <strong>{resolvedSkillType === SKILL_TYPE_SKILLSMP ? "SkillsMP" : "Text"}</strong>
                  </p>
                  {resolvedSkillType === SKILL_TYPE_SKILLSMP ? (
                    <p className="agent-subcopy">
                      Package: <strong>{draft.skillsMpPackageName || "-"}</strong>
                    </p>
                  ) : (
                    <p className="agent-subcopy">{draft.description}</p>
                  )}
                  <div className="relationship-editor">
                    <div className="skill-edit-grid">
                      <label className="relationship-field" htmlFor={`skill-name-${skill.id}`}>
                        Name
                      </label>
                      <input
                        id={`skill-name-${skill.id}`}
                        value={draft.name}
                        onChange={(event) =>
                          onSkillDraftChange(skill.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`skill-type-${skill.id}`}>
                        Type
                      </label>
                      <select
                        id={`skill-type-${skill.id}`}
                        value={resolvedSkillType}
                        onChange={(event) =>
                          onSkillDraftChange(skill.id, "skillType", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {SKILL_TYPE_OPTIONS.map((option) => (
                          <option key={`${skill.id}-skill-type-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {resolvedSkillType === SKILL_TYPE_SKILLSMP ? (
                        <>
                          <label
                            className="relationship-field"
                            htmlFor={`skill-package-${skill.id}`}
                          >
                            SkillsMP package
                          </label>
                          <input
                            id={`skill-package-${skill.id}`}
                            value={draft.skillsMpPackageName}
                            onChange={(event) =>
                              onSkillDraftChange(
                                skill.id,
                                "skillsMpPackageName",
                                event.target.value,
                              )
                            }
                            placeholder="upstash/context7 or npx skills add upstash/context7"
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      ) : (
                        <>
                          <label
                            className="relationship-field"
                            htmlFor={`skill-description-${skill.id}`}
                          >
                            Description
                          </label>
                          <textarea
                            id={`skill-description-${skill.id}`}
                            rows={2}
                            value={draft.description}
                            onChange={(event) =>
                              onSkillDraftChange(skill.id, "description", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />

                          <label
                            className="relationship-field"
                            htmlFor={`skill-instructions-${skill.id}`}
                          >
                            Instructions
                          </label>
                          <textarea
                            id={`skill-instructions-${skill.id}`}
                            rows={4}
                            value={draft.instructions}
                            onChange={(event) =>
                              onSkillDraftChange(skill.id, "instructions", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      )}
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveSkill(skill.id)}
                        disabled={isSavingOrDeleting}
                      >
                        {savingSkillId === skill.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteSkill(skill.id, skill.name)}
                        disabled={isSavingOrDeleting}
                      >
                        {deletingSkillId === skill.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-skill-modal"
        title="Create skill"
        description="Add a reusable skill for the active company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateSkillSubmit}>
          <label htmlFor="skill-name">Name</label>
          <input
            id="skill-name"
            name="name"
            placeholder="e.g. Sprint Planning"
            value={skillName}
            onChange={(event) => onSkillNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="skill-type">Type</label>
          <select
            id="skill-type"
            name="skillType"
            value={skillType}
            onChange={(event) => onSkillTypeChange(event.target.value)}
          >
            {SKILL_TYPE_OPTIONS.map((option) => (
              <option key={`create-skill-type-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {normalizeSkillType(skillType) === SKILL_TYPE_SKILLSMP ? (
            <>
              <label htmlFor="skill-package-name">SkillsMP package</label>
              <input
                id="skill-package-name"
                name="skillsMpPackageName"
                placeholder="upstash/context7 or npx skills add upstash/context7"
                value={skillSkillsMpPackageName}
                onChange={(event) => onSkillSkillsMpPackageNameChange(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="skill-description">Description</label>
              <textarea
                id="skill-description"
                name="description"
                rows={2}
                placeholder="One sentence summary..."
                value={skillDescription}
                onChange={(event) => onSkillDescriptionChange(event.target.value)}
                required
              />

              <label htmlFor="skill-instructions">Instructions</label>
              <textarea
                id="skill-instructions"
                name="instructions"
                rows={5}
                placeholder="Detailed instructions..."
                value={skillInstructions}
                onChange={(event) => onSkillInstructionsChange(event.target.value)}
                required
              />
            </>
          )}

          <button type="submit" disabled={isCreatingSkill}>
            {isCreatingSkill ? "Creating..." : "Create skill"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function McpServersPage({
  selectedCompanyId,
  mcpServers,
  isLoadingMcpServers,
  mcpServerError,
  isCreatingMcpServer,
  savingMcpServerId,
  deletingMcpServerId,
  mcpServerName,
  mcpServerTransportType,
  mcpServerUrl,
  mcpServerCommand,
  mcpServerArgsText,
  mcpServerEnvVarsText,
  mcpServerAuthType,
  mcpServerBearerToken,
  mcpServerCustomHeadersText,
  mcpServerEnabled,
  mcpServerDrafts,
  mcpServerCountLabel,
  onMcpServerNameChange,
  onMcpServerTransportTypeChange,
  onMcpServerUrlChange,
  onMcpServerCommandChange,
  onMcpServerArgsTextChange,
  onMcpServerEnvVarsTextChange,
  onMcpServerAuthTypeChange,
  onMcpServerBearerTokenChange,
  onMcpServerCustomHeadersTextChange,
  onMcpServerEnabledChange,
  onCreateMcpServer,
  onMcpServerDraftChange,
  onSaveMcpServer,
  onDeleteMcpServer,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateMcpServerSubmit(event) {
    const didCreate = await onCreateMcpServer(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">MCP Registry</p>
        <h1>MCP servers page</h1>
        <p className="subcopy">
          Register company-level MCP servers as streamable HTTP or stdio transports.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>MCP servers</h2>
          <div className="task-meta">
            <span>{mcpServerCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create MCP server"
              title="Create MCP server"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {mcpServerError ? <p className="error-banner">{mcpServerError}</p> : null}
        {isLoadingMcpServers ? <p className="empty-hint">Loading MCP servers...</p> : null}
        {!isLoadingMcpServers && mcpServers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No MCP servers created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create MCP server
            </button>
          </div>
        ) : null}

        {mcpServers.length > 0 ? (
          <ul className="task-list">
            {mcpServers.map((mcpServer) => {
              const draft = mcpServerDrafts[mcpServer.id] || {
                name: "",
                transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
                url: "",
                command: "",
                argsText: "",
                envVarsText: "",
                authType: MCP_AUTH_TYPE_NONE,
                bearerToken: "",
                customHeadersText: "",
                enabled: true,
              };
              const isSavingOrDeleting =
                savingMcpServerId === mcpServer.id || deletingMcpServerId === mcpServer.id;
              const transportLabel =
                MCP_TRANSPORT_TYPE_OPTIONS.find((option) => option.value === draft.transportType)
                  ?.label || "Streamable HTTP";
              const authLabel =
                MCP_AUTH_TYPE_OPTIONS.find((option) => option.value === draft.authType)?.label ||
                "No auth";
              const endpointLabel =
                draft.transportType === MCP_TRANSPORT_TYPE_STDIO
                  ? `Command: ${draft.command || "-"}`
                  : `URL: ${draft.url || "-"}`;

              return (
                <li key={mcpServer.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{mcpServer.name}</strong>
                    <code className="runner-id">{mcpServer.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    Transport: <strong>{transportLabel}</strong> • {endpointLabel}
                  </p>
                  <p className="agent-subcopy">
                    Auth:{" "}
                    <strong>
                      {draft.transportType === MCP_TRANSPORT_TYPE_STDIO ? "n/a" : authLabel}
                    </strong>{" "}
                    • enabled:{" "}
                    <strong>{draft.enabled ? "yes" : "no"}</strong>
                  </p>

                  <div className="relationship-editor">
                    <div className="mcp-edit-grid">
                      <label className="relationship-field" htmlFor={`mcp-name-${mcpServer.id}`}>
                        Name
                      </label>
                      <input
                        id={`mcp-name-${mcpServer.id}`}
                        type="text"
                        value={draft.name}
                        onChange={(event) =>
                          onMcpServerDraftChange(mcpServer.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`mcp-transport-${mcpServer.id}`}>
                        Transport
                      </label>
                      <select
                        id={`mcp-transport-${mcpServer.id}`}
                        value={draft.transportType}
                        onChange={(event) =>
                          onMcpServerDraftChange(mcpServer.id, "transportType", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {MCP_TRANSPORT_TYPE_OPTIONS.map((option) => (
                          <option key={`${mcpServer.id}-transport-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {draft.transportType === MCP_TRANSPORT_TYPE_STDIO ? (
                        <>
                          <label className="relationship-field" htmlFor={`mcp-command-${mcpServer.id}`}>
                            Command
                          </label>
                          <input
                            id={`mcp-command-${mcpServer.id}`}
                            type="text"
                            value={draft.command}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "command", event.target.value)
                            }
                            placeholder="npx"
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-args-${mcpServer.id}`}>
                            Arguments
                          </label>
                          <textarea
                            id={`mcp-args-${mcpServer.id}`}
                            rows={4}
                            value={draft.argsText}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "argsText", event.target.value)
                            }
                            placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-env-${mcpServer.id}`}>
                            Environment variables
                          </label>
                          <textarea
                            id={`mcp-env-${mcpServer.id}`}
                            rows={4}
                            value={draft.envVarsText}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "envVarsText", event.target.value)
                            }
                            placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      ) : (
                        <>
                          <label className="relationship-field" htmlFor={`mcp-url-${mcpServer.id}`}>
                            URL
                          </label>
                          <input
                            id={`mcp-url-${mcpServer.id}`}
                            type="text"
                            value={draft.url}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "url", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />

                          <label className="relationship-field" htmlFor={`mcp-auth-${mcpServer.id}`}>
                            Auth
                          </label>
                          <select
                            id={`mcp-auth-${mcpServer.id}`}
                            value={draft.authType}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "authType", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          >
                            {MCP_AUTH_TYPE_OPTIONS.map((option) => (
                              <option key={`${mcpServer.id}-auth-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <label className="relationship-field" htmlFor={`mcp-token-${mcpServer.id}`}>
                            Bearer token
                          </label>
                          <input
                            id={`mcp-token-${mcpServer.id}`}
                            type="text"
                            value={draft.bearerToken}
                            onChange={(event) =>
                              onMcpServerDraftChange(mcpServer.id, "bearerToken", event.target.value)
                            }
                            placeholder="Token value only"
                            disabled={
                              isSavingOrDeleting || draft.authType !== MCP_AUTH_TYPE_BEARER_TOKEN
                            }
                          />

                          <label className="relationship-field" htmlFor={`mcp-headers-${mcpServer.id}`}>
                            Custom headers
                          </label>
                          <textarea
                            id={`mcp-headers-${mcpServer.id}`}
                            rows={4}
                            value={draft.customHeadersText}
                            onChange={(event) =>
                              onMcpServerDraftChange(
                                mcpServer.id,
                                "customHeadersText",
                                event.target.value,
                              )
                            }
                            placeholder={"Authorization: Bearer <token>\nX-Env: staging"}
                            disabled={
                              isSavingOrDeleting || draft.authType !== MCP_AUTH_TYPE_CUSTOM_HEADERS
                            }
                          />
                        </>
                      )}

                      <label className="relationship-field" htmlFor={`mcp-enabled-${mcpServer.id}`}>
                        Enabled
                      </label>
                      <label htmlFor={`mcp-enabled-${mcpServer.id}`}>
                        <input
                          id={`mcp-enabled-${mcpServer.id}`}
                          type="checkbox"
                          checked={Boolean(draft.enabled)}
                          onChange={(event) =>
                            onMcpServerDraftChange(mcpServer.id, "enabled", event.target.checked)
                          }
                          disabled={isSavingOrDeleting}
                        />{" "}
                        Enable this MCP server
                      </label>
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveMcpServer(mcpServer.id)}
                        disabled={isSavingOrDeleting}
                      >
                        {savingMcpServerId === mcpServer.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteMcpServer(mcpServer.id, mcpServer.name)}
                        disabled={isSavingOrDeleting}
                      >
                        {deletingMcpServerId === mcpServer.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-mcp-server-modal"
        title="Create MCP server"
        description="Add a company-level MCP server with streamable HTTP or stdio transport."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateMcpServerSubmit}>
          <label htmlFor="create-mcp-name">Name</label>
          <input
            id="create-mcp-name"
            value={mcpServerName}
            onChange={(event) => onMcpServerNameChange(event.target.value)}
            placeholder="e.g. GitHub MCP"
            required
            autoFocus
          />

          <label htmlFor="create-mcp-transport">Transport</label>
          <select
            id="create-mcp-transport"
            value={mcpServerTransportType}
            onChange={(event) => onMcpServerTransportTypeChange(event.target.value)}
          >
            {MCP_TRANSPORT_TYPE_OPTIONS.map((option) => (
              <option key={`create-mcp-transport-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {mcpServerTransportType === MCP_TRANSPORT_TYPE_STDIO ? (
            <>
              <label htmlFor="create-mcp-command">Command</label>
              <input
                id="create-mcp-command"
                value={mcpServerCommand}
                onChange={(event) => onMcpServerCommandChange(event.target.value)}
                placeholder="npx"
                required
              />

              <label htmlFor="create-mcp-args">Arguments</label>
              <textarea
                id="create-mcp-args"
                rows={4}
                value={mcpServerArgsText}
                onChange={(event) => onMcpServerArgsTextChange(event.target.value)}
                placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/workspace"}
              />

              <label htmlFor="create-mcp-env">Environment variables</label>
              <textarea
                id="create-mcp-env"
                rows={4}
                value={mcpServerEnvVarsText}
                onChange={(event) => onMcpServerEnvVarsTextChange(event.target.value)}
                placeholder={"API_KEY=secret\nLOG_LEVEL=debug"}
              />
            </>
          ) : (
            <>
              <label htmlFor="create-mcp-url">URL</label>
              <input
                id="create-mcp-url"
                value={mcpServerUrl}
                onChange={(event) => onMcpServerUrlChange(event.target.value)}
                placeholder="https://example.com/mcp"
                required
              />

              <label htmlFor="create-mcp-auth">Auth</label>
              <select
                id="create-mcp-auth"
                value={mcpServerAuthType}
                onChange={(event) => onMcpServerAuthTypeChange(event.target.value)}
              >
                {MCP_AUTH_TYPE_OPTIONS.map((option) => (
                  <option key={`create-mcp-auth-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label htmlFor="create-mcp-token">Bearer token</label>
              <input
                id="create-mcp-token"
                value={mcpServerBearerToken}
                onChange={(event) => onMcpServerBearerTokenChange(event.target.value)}
                placeholder="Token value only"
                disabled={mcpServerAuthType !== MCP_AUTH_TYPE_BEARER_TOKEN}
              />

              <label htmlFor="create-mcp-headers">Custom headers</label>
              <textarea
                id="create-mcp-headers"
                rows={4}
                value={mcpServerCustomHeadersText}
                onChange={(event) => onMcpServerCustomHeadersTextChange(event.target.value)}
                placeholder={"Authorization: Bearer <token>\nX-Env: staging"}
                disabled={mcpServerAuthType !== MCP_AUTH_TYPE_CUSTOM_HEADERS}
              />
            </>
          )}

          <label htmlFor="create-mcp-enabled">
            <input
              id="create-mcp-enabled"
              type="checkbox"
              checked={Boolean(mcpServerEnabled)}
              onChange={(event) => onMcpServerEnabledChange(event.target.checked)}
            />{" "}
            Enable this MCP server
          </label>

          <button type="submit" disabled={isCreatingMcpServer}>
            {isCreatingMcpServer ? "Creating..." : "Create MCP server"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function ChatsOverviewPage({
  selectedCompanyId,
  agents,
  chatSessionsByAgent,
  isLoadingChatIndex,
  chatIndexError,
  isCreatingChatSession,
  onRefreshChatLists,
  onCreateChatForAgent,
  onOpenChat,
}) {
  const sortedAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent, rightAgent) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Chats</h1>
        <p className="subcopy">Browse all agents and open chats from a single page.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Agent chats</h2>
          <button type="button" className="secondary-btn" onClick={onRefreshChatLists}>
            Refresh
          </button>
        </header>
        {chatIndexError ? <p className="error-banner">Chat error: {chatIndexError}</p> : null}
        {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
        {!isLoadingChatIndex && sortedAgents.length === 0 ? (
          <p className="empty-hint">No agents available yet.</p>
        ) : null}
        {sortedAgents.length > 0 ? (
          <ul className="task-list">
            {sortedAgents.map((agent) => {
              const agentChats = Array.isArray(chatSessionsByAgent?.[agent.id])
                ? chatSessionsByAgent[agent.id]
                : [];
              const sortedChats = [...agentChats].sort((leftChat, rightChat) =>
                compareTurnsByTimestamp(
                  { createdAt: leftChat?.updatedAt, id: leftChat?.id },
                  { createdAt: rightChat?.updatedAt, id: rightChat?.id },
                ),
              );
              const hasChats = sortedChats.length > 0;
              return (
                <li key={`chat-agent-${agent.id}`} className="task-card">
                  <div className="task-card-top">
                    <strong>{agent.name}</strong>
                    <code className="runner-id">{agent.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    SDK: <strong>{agent.agentSdk}</strong> • model: <strong>{agent.model}</strong>
                  </p>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onCreateChatForAgent(agent.id)}
                      disabled={isCreatingChatSession}
                    >
                      {isCreatingChatSession ? "Creating..." : "New chat"}
                    </button>
                  </div>
                  {!hasChats ? <p className="empty-hint">No chats yet for this agent.</p> : null}
                  {hasChats ? (
                    <ul className="chat-session-list">
                      {sortedChats.map((chatSession) => (
                        <li key={`chat-session-${agent.id}-${chatSession.id}`} className="chat-session-row">
                          <div>
                            <strong>{chatSession.title || "Untitled chat"}</strong>
                            <p className="agent-subcopy">
                              Updated: <strong>{formatTimestamp(chatSession.updatedAt)}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                              onOpenChat({
                                agentId: agent.id,
                                sessionId: chatSession.id,
                                sessionsForAgent: sortedChats,
                              })
                            }
                          >
                            Open chat
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function AgentChatsPage({
  selectedCompanyId,
  agent,
  chatSessions,
  isLoadingChatSessions,
  isCreatingChatSession,
  chatError,
  chatSessionTitleDraft,
  chatSessionRemoteIdDraft,
  onChatSessionTitleDraftChange,
  onChatSessionRemoteIdDraftChange,
  onCreateChatSession,
  onOpenChat,
  onBackToAgents,
}) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Agent chats</h1>
        <p className="subcopy">Browse, create, and open chats for a single agent.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <p className="context-pill">
          Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
        </p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={onBackToAgents}>
            Back to agents
          </button>
        </div>
      </section>

      <section className="panel list-panel">
        <header className="panel-header">
          <h2>Chats</h2>
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && isLoadingChatSessions ? <p className="empty-hint">Loading chats...</p> : null}
        {agent && !isLoadingChatSessions && chatSessions.length === 0 ? (
          <p className="empty-hint">No chats yet. Create one below.</p>
        ) : null}
        {agent && chatSessions.length > 0 ? (
          <ul className="task-list">
            {chatSessions.map((session) => (
              <li key={`agent-session-${session.id}`} className="task-card">
                <div className="task-card-top">
                  <strong>{session.title || "Untitled chat"}</strong>
                  <code className="runner-id">{session.id}</code>
                </div>
                <p className="agent-subcopy">
                  Updated: <strong>{formatTimestamp(session.updatedAt)}</strong>
                </p>
                {session.remoteSessionId ? (
                  <p className="agent-subcopy">
                    Remote chat ID: <strong>{session.remoteSessionId}</strong>
                  </p>
                ) : null}
                <div className="task-card-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onOpenChat(session.id)}
                  >
                    Open chat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel codex-auth-panel">
        <header className="panel-header">
          <h2>Create chat</h2>
        </header>
        <form
          className="task-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const createdSessionId = await onCreateChatSession({
              title: chatSessionTitleDraft,
              remoteSessionId: chatSessionRemoteIdDraft,
            });
            if (createdSessionId) {
              onOpenChat(createdSessionId);
            }
          }}
        >
          <label htmlFor="chat-session-title">Title (optional)</label>
          <input
            id="chat-session-title"
            value={chatSessionTitleDraft}
            onChange={(event) => onChatSessionTitleDraftChange(event.target.value)}
            placeholder="e.g. Release planning"
            disabled={!agent || isCreatingChatSession}
          />
          <label htmlFor="chat-session-remote-id">Remote chat ID (optional)</label>
          <input
            id="chat-session-remote-id"
            value={chatSessionRemoteIdDraft}
            onChange={(event) => onChatSessionRemoteIdDraftChange(event.target.value)}
            placeholder="Provider thread/chat id"
            disabled={!agent || isCreatingChatSession}
          />
          <button type="submit" disabled={!agent || isCreatingChatSession}>
            {isCreatingChatSession ? "Creating..." : "Create chat"}
          </button>
        </form>
      </section>
    </div>
  );
}

function AgentChatPage({
  selectedCompanyId,
  agent,
  session,
  chatTurns,
  isLoadingChat,
  chatError,
  chatDraftMessage,
  isSendingChatMessage,
  onChatDraftMessageChange,
  onBackToChats,
  onSendChatMessage,
}) {
  const canChat = Boolean(agent && session);
  const [selectedCommandOutputItem, setSelectedCommandOutputItem] = useState(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState(CHAT_MESSAGE_BATCH_SIZE);
  const transcriptScrollRef = useRef(null);
  const orderedTurns = useMemo(
    () => [...(Array.isArray(chatTurns) ? chatTurns : [])].sort(compareTurnsByTimestamp),
    [chatTurns],
  );
  const { visibleTurns, totalMessageCount } = useMemo(
    () => selectVisibleTurnsByMessageCount(orderedTurns, visibleMessageCount),
    [orderedTurns, visibleMessageCount],
  );
  const visibleMessageTotal = useMemo(() => {
    return visibleTurns.reduce((count, turn) => {
      return count + (Array.isArray(turn?.items) ? turn.items.length : 0);
    }, 0);
  }, [visibleTurns]);
  const isShowingPartialTranscript = visibleMessageCount < totalMessageCount;

  useEffect(() => {
    setVisibleMessageCount(CHAT_MESSAGE_BATCH_SIZE);
  }, [session?.id]);

  useEffect(() => {
    const transcriptNode = transcriptScrollRef.current;
    if (!transcriptNode) {
      return;
    }
    const distanceFromBottom =
      transcriptNode.scrollHeight - transcriptNode.scrollTop - transcriptNode.clientHeight;
    const isNearBottom = distanceFromBottom <= 32;
    if (isNearBottom || visibleMessageCount <= CHAT_MESSAGE_BATCH_SIZE) {
      transcriptNode.scrollTop = transcriptNode.scrollHeight;
    }
  }, [session?.id, visibleMessageCount, visibleMessageTotal]);

  function handleChatMessageKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    if (!canChat || isSendingChatMessage || !chatDraftMessage.trim()) {
      return;
    }
    event.preventDefault();
    onSendChatMessage();
  }

  function handleTranscriptScroll(event) {
    const transcriptNode = event.currentTarget;
    const canLoadMoreMessages = visibleMessageCount < totalMessageCount;
    if (!canLoadMoreMessages || transcriptNode.scrollTop > 12) {
      return;
    }
    setVisibleMessageCount((currentCount) =>
      Math.min(currentCount + CHAT_MESSAGE_BATCH_SIZE, totalMessageCount),
    );
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Agent chat</h1>
        <p className="subcopy">Send new messages to the selected agent chat.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <p className="context-pill">
          Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
        </p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={onBackToChats}>
            Back to chats
          </button>
        </div>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Chat</h2>
        </header>
        {session ? (
          <div className="codex-auth-state">
            <p className="codex-auth-row">
              <strong>Title:</strong> {session.title || "Untitled chat"}
            </p>
            <p className="codex-auth-row">
              <strong>Chat ID:</strong> <code className="runner-id">{session.id}</code>
            </p>
            <p className="codex-auth-row">
              <strong>Remote chat ID:</strong> {session.remoteSessionId || "not set"}
            </p>
          </div>
        ) : (
          <p className="empty-hint">Chat not found.</p>
        )}
      </section>

      <section className="panel chat-panel">
        <header className="panel-header">
          <h2>Transcript</h2>
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && !session ? <p className="empty-hint">Chat not found.</p> : null}
        {canChat && isLoadingChat ? <p className="empty-hint">Loading chat messages...</p> : null}
        {canChat && !isLoadingChat && orderedTurns.length === 0 ? (
          <p className="empty-hint">No messages yet. Send the first prompt below.</p>
        ) : null}
        {orderedTurns.length > 0 ? (
          <div
            ref={transcriptScrollRef}
            className="chat-transcript-scroll"
            onScroll={handleTranscriptScroll}
          >
            {isShowingPartialTranscript ? (
              <p className="chat-transcript-hint">
                Showing latest {visibleMessageTotal} of {totalMessageCount} messages. Scroll up to load older
                messages.
              </p>
            ) : null}
            <ul className="chat-turn-list">
              {visibleTurns.map((turn) => {
              const turnStatus = String(turn?.status || "").toLowerCase() === "running" ? "running" : "idle";
              const turnItems = Array.isArray(turn?.items) ? turn.items : [];

              return (
                <li key={turn.id} className={`chat-turn-item chat-turn-item-${turnStatus}`}>
                  <div className="chat-turn-meta">
                    <strong>turn</strong>
                    <code className="runner-id">{String(turn.id || "").slice(0, 8)}</code>
                    <span className={`chat-turn-status chat-turn-status-${turnStatus}`}>{turnStatus}</span>
                    {turnStatus === "running" ? (
                      <span
                        className="chat-turn-spinner"
                        aria-label="Turn is running"
                        title="Turn in progress"
                      />
                    ) : null}
                    <span>{formatTimestamp(turn.createdAt)}</span>
                  </div>

                  {turnItems.length === 0 ? (
                    <p className="empty-hint">No items yet for this turn.</p>
                  ) : (
                    <ul className="chat-item-list">
                      {turnItems.map((item) => {
                        const itemRole = String(item?.role || "").toLowerCase();
                        const roleLabel = itemRole === "human" ? "human" : "llm";
                        const itemType = String(item?.itemType || "").trim() || "agent_message";
                        const itemStatus =
                          String(item?.status || "").toLowerCase() === "running" ? "running" : "completed";
                        const isCommandExecution = itemType === "command_execution";
                        const bodyText = isCommandExecution
                          ? String(item?.command || "").trim() || "(command unavailable)"
                          : String(item?.content || "").trim() || "(no content)";

                        return (
                          <li
                            key={item.id}
                            className={`chat-item-entry chat-item-entry-${itemStatus} chat-item-entry-${roleLabel}`}
                          >
                            <div className="chat-item-meta">
                              <strong>{roleLabel}</strong>
                              <span className="chat-message-kind">
                                {itemType}
                                {item.unknownType ? " (unknown)" : ""}
                              </span>
                              <span>{itemStatus}</span>
                              {itemStatus === "running" ? (
                                <span
                                  className="chat-turn-spinner chat-item-spinner"
                                  aria-label="Item is running"
                                  title="Item in progress"
                                />
                              ) : null}
                              <span>start {formatTimestamp(item.startedAt || item.createdAt)}</span>
                              <span>end {item.endedAt ? formatTimestamp(item.endedAt) : "..."}</span>
                            </div>

                            {isCommandExecution ? (
                              <p className="chat-message-content chat-message-content-command">
                                <code>{bodyText}</code>
                              </p>
                            ) : (
                              <div className="chat-message-content chat-message-content-markdown">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyText}</ReactMarkdown>
                              </div>
                            )}

                            {isCommandExecution ? (
                              <div className="task-card-actions">
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={() => setSelectedCommandOutputItem(item)}
                                >
                                  View output
                                </button>
                              </div>
                            ) : null}

                            {item.error ? <p className="chat-message-error">{item.error}</p> : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {turn.reasoningText ? (
                    <p className="chat-turn-reasoning">
                      <span>{turn.reasoningText}</span>
                    </p>
                  ) : null}
                </li>
              );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <CreationModal
        modalId="chat-command-output-modal"
        title="Command Output"
        description="Hidden command output for the selected command execution item."
        isOpen={Boolean(selectedCommandOutputItem)}
        onClose={() => setSelectedCommandOutputItem(null)}
      >
        <div className="chat-command-output-modal">
          <p>
            <strong>Command</strong>
          </p>
          <pre className="runner-command runner-command-inline">
            <code>{selectedCommandOutputItem?.command || "(command unavailable)"}</code>
          </pre>
          <p>
            <strong>Output</strong>
          </p>
          <pre className="chat-command-output-pre">
            <code>{selectedCommandOutputItem?.output || "(no output captured)"}</code>
          </pre>
        </div>
      </CreationModal>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Send message</h2>
        </header>
        <form className="task-form" onSubmit={onSendChatMessage}>
          <label htmlFor="chat-message-input">Message</label>
          <textarea
            id="chat-message-input"
            rows={4}
            placeholder="Ask the agent to plan, debug, or implement something..."
            value={chatDraftMessage}
            onChange={(event) => onChatDraftMessageChange(event.target.value)}
            onKeyDown={handleChatMessageKeyDown}
            disabled={!canChat || isSendingChatMessage}
          />
          <button
            type="submit"
            disabled={!canChat || !chatDraftMessage.trim() || isSendingChatMessage}
          >
            {isSendingChatMessage ? "Sending..." : "Send message"}
          </button>
        </form>
      </section>
    </div>
  );
}

function SettingsPage({
  hasCompanies,
  selectedCompanyId,
  selectedCompany,
  companyError,
  githubInstallations,
  githubRepositories,
  isLoadingGithubInstallations,
  isLoadingGithubRepositories,
  githubInstallationError,
  githubInstallationNotice,
  isAddingGithubInstallationFromCallback,
  pendingGithubInstallCallback,
  deletingGithubInstallationId,
  refreshingGithubInstallationId,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
  onDeleteGithubInstallation,
  onRefreshGithubInstallationRepositories,
}) {
  const repositoriesByInstallationId = githubRepositories.reduce((grouped, repository) => {
    const installationId = String(repository.githubInstallationId || "").trim();
    if (!installationId) {
      return grouped;
    }
    if (!grouped[installationId]) {
      grouped[installationId] = [];
    }
    grouped[installationId].push(repository);
    return grouped;
  }, {});

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Settings</p>
        <h1>Company settings</h1>
        <p className="subcopy">
          Create new companies and manage deletion from a dedicated settings page.
        </p>
        <p className="context-pill">
          Active company: {selectedCompany ? selectedCompany.name : "none"}
        </p>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Create company</h2>
        </header>
        <form className="task-form" onSubmit={onCreateCompany}>
          <label htmlFor="settings-company-name">
            {hasCompanies ? "Company name" : "Create your first company"}
          </label>
          <input
            id="settings-company-name"
            value={newCompanyName}
            onChange={(event) => onNewCompanyNameChange(event.target.value)}
            placeholder="e.g. Acme Labs"
            disabled={isCreatingCompany}
          />
          <button type="submit" disabled={isCreatingCompany}>
            {isCreatingCompany ? "Creating..." : "Create company"}
          </button>
        </form>
      </section>

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>GitHub installations</h2>
          </header>
          <p className="subcopy">
            Link this company to one or more GitHub App installations.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => window.location.assign(GITHUB_APP_INSTALL_URL)}
              disabled={!selectedCompanyId}
            >
              Install CompanyHelm GitHub App
            </button>
          </div>
          {pendingGithubInstallCallback && !selectedCompanyId ? (
            <p className="error-banner">
              Select a company to finish linking installation{" "}
              <code>{pendingGithubInstallCallback.installationId || "unknown"}</code>.
            </p>
          ) : null}
          {isAddingGithubInstallationFromCallback ? (
            <p className="empty-hint">Linking GitHub installation...</p>
          ) : null}
          {githubInstallationNotice ? (
            <p className="success-banner">{githubInstallationNotice}</p>
          ) : null}
          {githubInstallationError ? (
            <p className="error-banner">GitHub installation error: {githubInstallationError}</p>
          ) : null}
          {isLoadingGithubInstallations ? (
            <p className="empty-hint">Loading GitHub installations...</p>
          ) : null}
          {!isLoadingGithubInstallations && githubInstallations.length === 0 ? (
            <p className="empty-hint">No GitHub installations linked to this company yet.</p>
          ) : null}
          {githubInstallations.length > 0 ? (
            <ul className="task-list">
              {githubInstallations.map((installation) => (
                <li key={`github-installation-${installation.installationId}`} className="task-card">
                  <div className="task-card-top">
                    <strong>Installation {installation.installationId}</strong>
                    <code className="runner-id">{installation.installationId}</code>
                  </div>
                  <p className="agent-subcopy">
                    Linked at: <strong>{formatTimestamp(installation.createdAt)}</strong>
                  </p>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        onRefreshGithubInstallationRepositories(installation.installationId)
                      }
                      disabled={
                        refreshingGithubInstallationId === installation.installationId ||
                        deletingGithubInstallationId === installation.installationId
                      }
                    >
                      {refreshingGithubInstallationId === installation.installationId
                        ? "Refreshing repos..."
                        : "Refresh repos"}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDeleteGithubInstallation(installation.installationId)}
                      disabled={
                        deletingGithubInstallationId === installation.installationId ||
                        refreshingGithubInstallationId === installation.installationId
                      }
                    >
                      {deletingGithubInstallationId === installation.installationId
                        ? "Deleting..."
                        : "Delete installation"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>Repos</h2>
          </header>
          <p className="subcopy">Repositories linked through this company’s GitHub installations.</p>
          {isLoadingGithubRepositories ? (
            <p className="empty-hint">Loading repositories...</p>
          ) : null}
          {!isLoadingGithubRepositories && githubRepositories.length === 0 ? (
            <p className="empty-hint">No repositories imported yet. Refresh an installation above.</p>
          ) : null}
          {githubInstallations.length > 0 ? (
            <ul className="task-list">
              {githubInstallations.map((installation) => {
                const installationRepositories =
                  repositoriesByInstallationId[installation.installationId] || [];
                return (
                  <li
                    key={`repo-installation-${installation.installationId}`}
                    className="task-card"
                  >
                    <div className="task-card-top">
                      <strong>Installation {installation.installationId}</strong>
                      <span>{installationRepositories.length} repos</span>
                    </div>
                    {installationRepositories.length === 0 ? (
                      <p className="empty-hint">No repos cached for this installation.</p>
                    ) : (
                      <ul className="repo-list">
                        {installationRepositories.map((repository) => (
                          <li key={repository.id} className="repo-list-item">
                            <a
                              href={repository.htmlUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {repository.fullName}
                            </a>
                            <code>{repository.defaultBranch || "no-default-branch"}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>Danger zone</h2>
          </header>
          <p className="subcopy">
            Delete the currently selected company and all of its tasks, skills, MCP servers,
            agents, and runners.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="danger-btn"
              onClick={onDeleteCompany}
              disabled={!selectedCompany || isDeletingCompany}
            >
              {isDeletingCompany ? "Deleting..." : "Delete active company"}
            </button>
          </div>
        </section>
      ) : null}

      {companyError ? <p className="error-banner">Company error: {companyError}</p> : null}
    </div>
  );
}

function ProfilePage({ selectedCompany, tasks, skills, agents, agentRunners }) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Profile</p>
        <h1>Workspace profile</h1>
        <p className="subcopy">
          Account preferences can live here. This page currently shows your active workspace
          context.
        </p>
        <p className="context-pill">Company: {selectedCompany ? selectedCompany.name : "none"}</p>
      </section>

      <section className="runner-summary-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Tasks</p>
          <p className="stat-value">{tasks.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Skills</p>
          <p className="stat-value">{skills.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Agents</p>
          <p className="stat-value">{agents.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Runners</p>
          <p className="stat-value">{agentRunners.length}</p>
        </article>
      </section>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState(() => getPageFromPathname());
  const [agentsRoute, setAgentsRoute] = useState(() => getAgentsRouteFromPathname());
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => getPersistedCompanyId());
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [githubInstallations, setGithubInstallations] = useState([]);
  const [githubRepositories, setGithubRepositories] = useState([]);
  const [isLoadingGithubInstallations, setIsLoadingGithubInstallations] = useState(false);
  const [isLoadingGithubRepositories, setIsLoadingGithubRepositories] = useState(false);
  const [githubInstallationError, setGithubInstallationError] = useState("");
  const [githubInstallationNotice, setGithubInstallationNotice] = useState("");
  const [isAddingGithubInstallationFromCallback, setIsAddingGithubInstallationFromCallback] = useState(false);
  const [deletingGithubInstallationId, setDeletingGithubInstallationId] = useState("");
  const [refreshingGithubInstallationId, setRefreshingGithubInstallationId] = useState("");
  const [pendingGithubInstallCallback, setPendingGithubInstallCallback] = useState(
    () => parseGithubInstallCallbackFromLocation(),
  );
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [hasLoadedAgentRunners, setHasLoadedAgentRunners] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingMcpServers, setIsLoadingMcpServers] = useState(false);
  const [isLoadingRunners, setIsLoadingRunners] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [skillError, setSkillError] = useState("");
  const [mcpServerError, setMcpServerError] = useState("");
  const [runnerError, setRunnerError] = useState("");
  const [agentError, setAgentError] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [isCreatingMcpServer, setIsCreatingMcpServer] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [savingMcpServerId, setSavingMcpServerId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [deletingSkillId, setDeletingSkillId] = useState(null);
  const [deletingMcpServerId, setDeletingMcpServerId] = useState(null);
  const [deletingRunnerId, setDeletingRunnerId] = useState(null);
  const [regeneratingRunnerId, setRegeneratingRunnerId] = useState(null);
  const [isCreatingRunner, setIsCreatingRunner] = useState(false);
  const [runnerIdDraft, setRunnerIdDraft] = useState("");
  const [runnerSecretDraft, setRunnerSecretDraft] = useState("");
  const [runnerSecretsById, setRunnerSecretsById] = useState({});
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [savingAgentId, setSavingAgentId] = useState(null);
  const [deletingAgentId, setDeletingAgentId] = useState(null);
  const [initializingAgentId, setInitializingAgentId] = useState(null);
  const [retryingAgentSkillInstallKey, setRetryingAgentSkillInstallKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [relationshipDrafts, setRelationshipDrafts] = useState({});
  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState(SKILL_TYPE_TEXT);
  const [skillSkillsMpPackageName, setSkillSkillsMpPackageName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillInstructions, setSkillInstructions] = useState("");
  const [skillDrafts, setSkillDrafts] = useState({});
  const [mcpServerName, setMcpServerName] = useState("");
  const [mcpServerTransportType, setMcpServerTransportType] = useState(
    MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
  );
  const [mcpServerUrl, setMcpServerUrl] = useState("");
  const [mcpServerCommand, setMcpServerCommand] = useState("");
  const [mcpServerArgsText, setMcpServerArgsText] = useState("");
  const [mcpServerEnvVarsText, setMcpServerEnvVarsText] = useState("");
  const [mcpServerAuthType, setMcpServerAuthType] = useState(MCP_AUTH_TYPE_NONE);
  const [mcpServerBearerToken, setMcpServerBearerToken] = useState("");
  const [mcpServerCustomHeadersText, setMcpServerCustomHeadersText] = useState("");
  const [mcpServerEnabled, setMcpServerEnabled] = useState(true);
  const [mcpServerDrafts, setMcpServerDrafts] = useState({});
  const [agentName, setAgentName] = useState("");
  const [agentRunnerId, setAgentRunnerId] = useState("");
  const [agentSkillIds, setAgentSkillIds] = useState([]);
  const [agentMcpServerIds, setAgentMcpServerIds] = useState([]);
  const [agentSdk, setAgentSdk] = useState(DEFAULT_AGENT_SDK);
  const [agentModel, setAgentModel] = useState("");
  const [agentModelReasoningLevel, setAgentModelReasoningLevel] = useState("");
  const [agentDrafts, setAgentDrafts] = useState({});
  const [chatAgentId, setChatAgentId] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [chatSessionsByAgent, setChatSessionsByAgent] = useState({});
  const [chatSessionId, setChatSessionId] = useState("");
  const [chatSessionTitleDraft, setChatSessionTitleDraft] = useState("");
  const [chatSessionRemoteIdDraft, setChatSessionRemoteIdDraft] = useState("");
  const [chatTurns, setChatTurns] = useState([]);
  const [chatDraftMessage, setChatDraftMessage] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatIndexError, setChatIndexError] = useState("");
  const [isLoadingChatIndex, setIsLoadingChatIndex] = useState(false);
  const [isLoadingChatSessions, setIsLoadingChatSessions] = useState(false);
  const [isCreatingChatSession, setIsCreatingChatSession] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [codexAuthState, setCodexAuthState] = useState(null);
  const [isLoadingCodexAuthState, setIsLoadingCodexAuthState] = useState(false);
  const [codexAuthError, setCodexAuthError] = useState("");
  const [isStartingCodexAuth, setIsStartingCodexAuth] = useState(false);
  const [codexAuthCopyFeedback, setCodexAuthCopyFeedback] = useState("");
  const hasCompanies = companies.length > 0;

  const selectedCompany = useMemo(() => {
    return companies.find((company) => company.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const agentRunnerLookup = useMemo(() => {
    return agentRunners.reduce((map, runner) => {
      map.set(runner.id, runner);
      return map;
    }, new Map());
  }, [agentRunners]);

  const runnerCodexModelEntriesById = useMemo(() => {
    return agentRunners.reduce((map, runner) => {
      map.set(runner.id, normalizeRunnerCodexAvailableModels(runner));
      return map;
    }, new Map());
  }, [agentRunners]);

  const selectedChatSession = useMemo(() => {
    return chatSessions.find((session) => session.id === chatSessionId) || null;
  }, [chatSessions, chatSessionId]);

  const breadcrumbItems = useMemo(() => {
    const currentPageLabel = NAV_ITEM_LOOKUP.get(activePage)?.label || "Dashboard";

    const getAgentLabel = (agentId) => {
      const resolvedAgentId = String(agentId || "").trim();
      if (!resolvedAgentId) {
        return "Agent";
      }
      const matchingAgent = agents.find((agent) => agent.id === resolvedAgentId);
      return matchingAgent?.name || `Agent ${resolvedAgentId.slice(0, 8)}`;
    };

    const getChatLabel = (sessionId) => {
      const resolvedSessionId = String(sessionId || "").trim();
      if (!resolvedSessionId) {
        return "Chat";
      }
      const chatTitle = String(selectedChatSession?.title || "").trim();
      return chatTitle || `Chat ${resolvedSessionId.slice(0, 8)}`;
    };

    if (activePage === "agents") {
      if (agentsRoute.view === "list" || !agentsRoute.agentId) {
        return [{ label: "Agents" }];
      }

      const chatsHref = `/agents/${agentsRoute.agentId}/chats`;
      const items = [
        { label: "Agents", href: "/agents" },
        { label: getAgentLabel(agentsRoute.agentId), href: chatsHref },
      ];

      if (agentsRoute.view === "chat" && agentsRoute.sessionId) {
        return [
          ...items,
          { label: "Chats", href: chatsHref },
          { label: getChatLabel(agentsRoute.sessionId) },
        ];
      }

      return [...items, { label: "Chats" }];
    }

    if (activePage === "chats") {
      const items = [{ label: "Chats" }];
      if (chatAgentId) {
        items.push({ label: getAgentLabel(chatAgentId) });
      }
      if (chatSessionId) {
        items.push({ label: getChatLabel(chatSessionId) });
      }
      return items;
    }

    return [{ label: currentPageLabel }];
  }, [
    activePage,
    agents,
    agentsRoute.agentId,
    agentsRoute.sessionId,
    agentsRoute.view,
    chatAgentId,
    chatSessionId,
    selectedChatSession?.title,
  ]);

  const isChatsConversationView = activePage === "chats" && Boolean(chatAgentId) && Boolean(chatSessionId);
  const shouldSubscribeChatSessions =
    (activePage === "agents" && (agentsRoute.view === "chats" || agentsRoute.view === "chat")) ||
    (activePage === "chats" && Boolean(chatAgentId));
  const shouldSubscribeChatTurns = isChatsConversationView || (
    activePage === "agents" && agentsRoute.view === "chat" && Boolean(chatSessionId)
  );
  const shouldSubscribeCodexAuth =
    activePage === "dashboard" || (activePage === "agents" && agentsRoute.view === "chat") || isChatsConversationView;
  const shouldLoadGithubData = activePage === "settings";
  const shouldLoadTaskData = activePage === "dashboard" || activePage === "tasks" || activePage === "profile";
  const shouldLoadSkillData =
    activePage === "skills" ||
    (activePage === "agents" && agentsRoute.view === "list") ||
    activePage === "profile";
  const shouldLoadMcpServerData =
    activePage === "mcp-servers" || (activePage === "agents" && agentsRoute.view === "list");
  const shouldLoadRunnerData =
    activePage === "dashboard" ||
    activePage === "agent-runner" ||
    activePage === "agents" ||
    activePage === "profile";
  const shouldLoadAgentData =
    activePage === "dashboard" ||
    activePage === "agent-runner" ||
    activePage === "agents" ||
    activePage === "chats" ||
    activePage === "profile";
  const shouldSubscribeAgentRunners =
    activePage === "dashboard" || activePage === "agent-runner" || activePage === "agents";

  const loadCompanies = useCallback(async () => {
    try {
      setCompanyError("");
      setIsLoadingCompanies(true);
      const data = await executeGraphQL(LIST_COMPANIES_QUERY);
      const nextCompanies = data.companies || [];
      setCompanies(nextCompanies);
      setSelectedCompanyId((currentId) => {
        const preferredId = currentId || getPersistedCompanyId();
        if (preferredId && nextCompanies.some((company) => company.id === preferredId)) {
          return preferredId;
        }
        return nextCompanies[0]?.id || "";
      });
    } catch (loadError) {
      setCompanyError(loadError.message);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, []);

  const loadGithubInstallations = useCallback(async () => {
    if (!selectedCompanyId) {
      setGithubInstallations([]);
      setGithubInstallationError("");
      setIsLoadingGithubInstallations(false);
      return;
    }

    try {
      setGithubInstallationError("");
      setIsLoadingGithubInstallations(true);
      const data = await executeGraphQL(LIST_GITHUB_INSTALLATIONS_QUERY, {
        companyId: selectedCompanyId,
      });
      setGithubInstallations(data.githubInstallations || []);
    } catch (loadError) {
      setGithubInstallationError(loadError.message);
    } finally {
      setIsLoadingGithubInstallations(false);
    }
  }, [selectedCompanyId]);

  const loadGithubRepositories = useCallback(async () => {
    if (!selectedCompanyId) {
      setGithubRepositories([]);
      setGithubInstallationError("");
      setIsLoadingGithubRepositories(false);
      return;
    }

    try {
      setGithubInstallationError("");
      setIsLoadingGithubRepositories(true);
      const data = await executeGraphQL(LIST_REPOSITORIES_QUERY, {
        companyId: selectedCompanyId,
        provider: "github",
      });
      setGithubRepositories(data.repositories || []);
    } catch (loadError) {
      setGithubInstallationError(loadError.message);
    } finally {
      setIsLoadingGithubRepositories(false);
    }
  }, [selectedCompanyId]);

  const loadTasks = useCallback(async () => {
    if (!selectedCompanyId) {
      setTaskError("");
      setTasks([]);
      setRelationshipDrafts({});
      setIsLoadingTasks(false);
      return;
    }

    try {
      setTaskError("");
      setIsLoadingTasks(true);
      const data = await executeGraphQL(LIST_TASKS_QUERY, { companyId: selectedCompanyId });
      const nextTasks = data.tasks || [];
      setTasks(nextTasks);
      setRelationshipDrafts(createRelationshipDrafts(nextTasks));
    } catch (loadError) {
      setTaskError(loadError.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedCompanyId]);

  const loadSkills = useCallback(async () => {
    if (!selectedCompanyId) {
      setSkillError("");
      setSkills([]);
      setSkillDrafts({});
      setIsLoadingSkills(false);
      return;
    }

    try {
      setSkillError("");
      setIsLoadingSkills(true);
      const data = await executeGraphQL(LIST_SKILLS_QUERY, { companyId: selectedCompanyId });
      const nextSkills = data.skills || [];
      setSkills(nextSkills);
      setSkillDrafts(createSkillDrafts(nextSkills));
    } catch (loadError) {
      setSkillError(loadError.message);
    } finally {
      setIsLoadingSkills(false);
    }
  }, [selectedCompanyId]);

  const loadMcpServers = useCallback(async () => {
    if (!selectedCompanyId) {
      setMcpServerError("");
      setMcpServers([]);
      setMcpServerDrafts({});
      setIsLoadingMcpServers(false);
      return;
    }

    try {
      setMcpServerError("");
      setIsLoadingMcpServers(true);
      const data = await executeGraphQL(LIST_MCP_SERVERS_QUERY, { companyId: selectedCompanyId });
      const nextMcpServers = data.mcpServers || [];
      setMcpServers(nextMcpServers);
      setMcpServerDrafts(createMcpServerDrafts(nextMcpServers));
    } catch (loadError) {
      setMcpServerError(loadError.message);
    } finally {
      setIsLoadingMcpServers(false);
    }
  }, [selectedCompanyId]);

  const loadAgentRunners = useCallback(async ({ silently = false } = {}) => {
    if (!selectedCompanyId) {
      setAgentRunners([]);
      setHasLoadedAgentRunners(false);
      if (!silently) {
        setRunnerError("");
        setIsLoadingRunners(false);
      }
      return;
    }

    try {
      if (!silently) {
        setRunnerError("");
        setIsLoadingRunners(true);
      }
      const data = await executeGraphQL(LIST_AGENT_RUNNERS_QUERY, {
        companyId: selectedCompanyId,
      });
      setAgentRunners((currentRunners) =>
        mergeAgentRunnerPayloadList(currentRunners, data.agentRunners || []),
      );
      setHasLoadedAgentRunners(true);
    } catch (loadError) {
      if (!silently) {
        setRunnerError(loadError.message);
      }
    } finally {
      if (!silently) {
        setIsLoadingRunners(false);
      }
    }
  }, [selectedCompanyId]);

  const loadAgents = useCallback(async () => {
    if (!selectedCompanyId) {
      setAgentError("");
      setAgents([]);
      setAgentDrafts({});
      setAgentRunnerId("");
      setAgentSkillIds([]);
      setAgentMcpServerIds([]);
      setAgentSdk(DEFAULT_AGENT_SDK);
      setAgentModel("");
      setAgentModelReasoningLevel("");
      setIsLoadingAgents(false);
      return;
    }

    try {
      setAgentError("");
      setIsLoadingAgents(true);
      const data = await executeGraphQL(LIST_AGENTS_QUERY, { companyId: selectedCompanyId });
      const nextAgents = data.agents || [];
      setAgents(nextAgents);
      setAgentDrafts(createAgentDrafts(nextAgents));
    } catch (loadError) {
      setAgentError(loadError.message);
    } finally {
      setIsLoadingAgents(false);
    }
  }, [selectedCompanyId]);

  const loadAgentChatSessions = useCallback(
    async ({ silently = false } = {}) => {
      if (!selectedCompanyId || !chatAgentId) {
        setChatSessions([]);
        setChatSessionId("");
        if (!silently) {
          setChatError("");
          setIsLoadingChatSessions(false);
        }
        return;
      }

      try {
        if (!silently) {
          setChatError("");
          setIsLoadingChatSessions(true);
        }
        const data = await executeGraphQL(LIST_AGENT_CHAT_SESSIONS_QUERY, {
          companyId: selectedCompanyId,
          agentId: chatAgentId,
          limit: 200,
        });
        const nextSessions = data.agentChatSessions || [];
        setChatSessions(nextSessions);
        setChatSessionsByAgent((currentSessionsByAgent) => ({
          ...currentSessionsByAgent,
          [chatAgentId]: nextSessions,
        }));
      } catch (loadError) {
        if (!silently) {
          setChatError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingChatSessions(false);
        }
      }
    },
    [selectedCompanyId, chatAgentId],
  );

  const loadAgentChatTurns = useCallback(
    async ({ silently = false } = {}) => {
      if (!selectedCompanyId || !chatAgentId || !chatSessionId) {
        setChatTurns([]);
        if (!silently) {
          setChatError("");
          setIsLoadingChat(false);
        }
        return;
      }

      try {
        if (!silently) {
          setChatError("");
          setIsLoadingChat(true);
        }
        const data = await executeGraphQL(LIST_AGENT_CHAT_TURNS_QUERY, {
          companyId: selectedCompanyId,
          agentId: chatAgentId,
          sessionId: chatSessionId,
          limit: 200,
        });
        setChatTurns(data.agentChatTurns || []);
      } catch (loadError) {
        if (!silently) {
          setChatError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingChat(false);
        }
      }
    },
    [selectedCompanyId, chatAgentId, chatSessionId],
  );

  const loadChatSessionIndexByAgent = useCallback(
    async ({ silently = false } = {}) => {
      if (!selectedCompanyId) {
        setChatSessionsByAgent({});
        setChatIndexError("");
        setIsLoadingChatIndex(false);
        return;
      }

      const agentsToLoad = Array.isArray(agents) ? agents : [];
      if (agentsToLoad.length === 0) {
        setChatSessionsByAgent({});
        if (!silently) {
          setChatIndexError("");
          setIsLoadingChatIndex(false);
        }
        return;
      }

      try {
        if (!silently) {
          setChatIndexError("");
          setIsLoadingChatIndex(true);
        }
        const sessionEntries = await Promise.all(
          agentsToLoad.map(async (agentEntry) => {
            const resolvedAgentId = String(agentEntry?.id || "").trim();
            if (!resolvedAgentId) {
              return [resolvedAgentId, []];
            }
            const data = await executeGraphQL(LIST_AGENT_CHAT_SESSIONS_QUERY, {
              companyId: selectedCompanyId,
              agentId: resolvedAgentId,
              limit: 200,
            });
            return [resolvedAgentId, data.agentChatSessions || []];
          }),
        );

        const nextSessionsByAgent = {};
        for (const [agentId, sessionsForAgent] of sessionEntries) {
          if (!agentId) {
            continue;
          }
          nextSessionsByAgent[agentId] = sessionsForAgent;
        }
        setChatSessionsByAgent(nextSessionsByAgent);
      } catch (loadError) {
        if (!silently) {
          setChatIndexError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingChatIndex(false);
        }
      }
    },
    [agents, selectedCompanyId],
  );

  const loadCodexAuthState = useCallback(
    async ({ silently = false } = {}) => {
      if (!selectedCompanyId || !chatAgentId) {
        setCodexAuthState(null);
        if (!silently) {
          setCodexAuthError("");
          setIsLoadingCodexAuthState(false);
        }
        return;
      }

      try {
        if (!silently) {
          setCodexAuthError("");
          setIsLoadingCodexAuthState(true);
        }
        const data = await executeGraphQL(GET_AGENT_CODEX_AUTH_STATE_QUERY, {
          companyId: selectedCompanyId,
          agentId: chatAgentId,
        });
        setCodexAuthState(data.agentCodexAuthState || null);
      } catch (loadError) {
        if (!silently) {
          setCodexAuthError(loadError.message);
        }
      } finally {
        if (!silently) {
          setIsLoadingCodexAuthState(false);
        }
      }
    },
    [selectedCompanyId, chatAgentId],
  );

  const handleAgentRunnersSubscriptionData = useCallback((payload) => {
    setAgentRunners((currentRunners) =>
      mergeAgentRunnerPayloadList(currentRunners, payload?.agentRunnersUpdated || []),
    );
    setRunnerError("");
    setIsLoadingRunners(false);
  }, []);

  const handleAgentRunnersSubscriptionError = useCallback((error) => {
    setRunnerError(error.message);
    setIsLoadingRunners(false);
  }, []);

  const handleAgentChatSessionsSubscriptionData = useCallback((payload) => {
    const nextSessions = payload?.agentChatSessionsUpdated || [];
    setChatSessions(nextSessions);
    if (chatAgentId) {
      setChatSessionsByAgent((currentSessionsByAgent) => ({
        ...currentSessionsByAgent,
        [chatAgentId]: nextSessions,
      }));
    }
    setChatError("");
    setIsLoadingChatSessions(false);
  }, [chatAgentId]);

  const handleAgentChatTurnsSubscriptionData = useCallback((payload) => {
    setChatTurns(payload?.agentChatTurnsUpdated || []);
    setChatError("");
    setIsLoadingChat(false);
  }, []);

  const handleAgentChatSubscriptionError = useCallback((error) => {
    setChatError(error.message);
    setIsLoadingChat(false);
    setIsLoadingChatSessions(false);
  }, []);

  const handleCodexAuthSubscriptionData = useCallback((payload) => {
    setCodexAuthState(payload?.agentCodexAuthStateUpdated || null);
    setCodexAuthError("");
    setIsLoadingCodexAuthState(false);
  }, []);

  const handleCodexAuthSubscriptionError = useCallback((error) => {
    setCodexAuthError(error.message);
    setIsLoadingCodexAuthState(false);
  }, []);

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && shouldSubscribeAgentRunners && hasLoadedAgentRunners),
    query: AGENT_RUNNERS_SUBSCRIPTION,
    variables: selectedCompanyId ? { companyId: selectedCompanyId } : undefined,
    onData: handleAgentRunnersSubscriptionData,
    onError: handleAgentRunnersSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && chatAgentId && shouldSubscribeChatSessions),
    query: AGENT_CHAT_SESSIONS_SUBSCRIPTION,
    variables:
      selectedCompanyId && chatAgentId
        ? { companyId: selectedCompanyId, agentId: chatAgentId }
        : undefined,
    onData: handleAgentChatSessionsSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && chatAgentId && chatSessionId && shouldSubscribeChatTurns),
    query: AGENT_CHAT_TURNS_SUBSCRIPTION,
    variables:
      selectedCompanyId && chatAgentId && chatSessionId
        ? {
            companyId: selectedCompanyId,
            agentId: chatAgentId,
            sessionId: chatSessionId,
          }
        : undefined,
    onData: handleAgentChatTurnsSubscriptionData,
    onError: handleAgentChatSubscriptionError,
  });

  useGraphQLSubscription({
    enabled: Boolean(selectedCompanyId && chatAgentId && shouldSubscribeCodexAuth),
    query: AGENT_CODEX_AUTH_STATE_SUBSCRIPTION,
    variables:
      selectedCompanyId && chatAgentId
        ? {
            companyId: selectedCompanyId,
            agentId: chatAgentId,
          }
        : undefined,
    onData: handleCodexAuthSubscriptionData,
    onError: handleCodexAuthSubscriptionError,
  });

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    persistCompanyId(selectedCompanyId);
  }, [selectedCompanyId]);

  useEffect(() => {
    setAgentRunners([]);
    setAgentRunnerId("");
    setAgentSkillIds([]);
    setAgentSdk(DEFAULT_AGENT_SDK);
    setAgentModel("");
    setAgentModelReasoningLevel("");
    setRunnerIdDraft("");
    setRunnerSecretDraft("");
    setRunnerSecretsById({});
    setHasLoadedAgentRunners(false);
    setRegeneratingRunnerId(null);
    setGithubInstallations([]);
    setGithubRepositories([]);
    setGithubInstallationError("");
    setGithubInstallationNotice("");
    setDeletingGithubInstallationId("");
    setRefreshingGithubInstallationId("");
    setSkillName("");
    setSkillType(SKILL_TYPE_TEXT);
    setSkillSkillsMpPackageName("");
    setSkillDescription("");
    setSkillInstructions("");
    setMcpServers([]);
    setMcpServerDrafts({});
    setMcpServerName("");
    setMcpServerTransportType(MCP_TRANSPORT_TYPE_STREAMABLE_HTTP);
    setMcpServerUrl("");
    setMcpServerCommand("");
    setMcpServerArgsText("");
    setMcpServerEnvVarsText("");
    setMcpServerAuthType(MCP_AUTH_TYPE_NONE);
    setMcpServerBearerToken("");
    setMcpServerCustomHeadersText("");
    setMcpServerEnabled(true);
    setMcpServerError("");
    setChatAgentId("");
    setChatSessions([]);
    setChatSessionsByAgent({});
    setChatSessionId("");
    setChatSessionTitleDraft("");
    setChatSessionRemoteIdDraft("");
    setChatTurns([]);
    setChatDraftMessage("");
    setChatError("");
    setChatIndexError("");
    setIsLoadingChatIndex(false);
    setCodexAuthState(null);
    setCodexAuthError("");
    setCodexAuthCopyFeedback("");
    setAgentMcpServerIds([]);
    setRetryingAgentSkillInstallKey("");
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isAvailableAgentSdk(agentSdk)) {
      setAgentSdk(DEFAULT_AGENT_SDK);
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: agentModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    if (resolvedSelection.model !== agentModel) {
      setAgentModel(resolvedSelection.model);
    }
    if (resolvedSelection.modelReasoningLevel !== agentModelReasoningLevel) {
      setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
    }
  }, [
    agentModel,
    agentModelReasoningLevel,
    agentRunnerId,
    agentSdk,
    runnerCodexModelEntriesById,
  ]);

  useEffect(() => {
    const validMcpServerIds = new Set(mcpServers.map((mcpServer) => mcpServer.id));

    setAgentMcpServerIds((currentIds) => {
      const normalizedIds = normalizeUniqueStringList(currentIds).filter((id) => validMcpServerIds.has(id));
      if (
        normalizedIds.length === currentIds.length &&
        normalizedIds.every((id, index) => id === currentIds[index])
      ) {
        return currentIds;
      }
      return normalizedIds;
    });

    setAgentDrafts((currentDrafts) => {
      let changed = false;
      const nextDrafts = {};
      for (const [agentId, draft] of Object.entries(currentDrafts)) {
        if (!draft || typeof draft !== "object") {
          nextDrafts[agentId] = draft;
          continue;
        }

        const currentMcpServerIds = Array.isArray(draft.mcpServerIds) ? draft.mcpServerIds : [];
        const normalizedMcpServerIds = normalizeUniqueStringList(currentMcpServerIds).filter((id) =>
          validMcpServerIds.has(id),
        );

        if (
          normalizedMcpServerIds.length === currentMcpServerIds.length &&
          normalizedMcpServerIds.every((id, index) => id === currentMcpServerIds[index])
        ) {
          nextDrafts[agentId] = draft;
          continue;
        }

        changed = true;
        nextDrafts[agentId] = {
          ...draft,
          mcpServerIds: normalizedMcpServerIds,
        };
      }

      return changed ? nextDrafts : currentDrafts;
    });
  }, [mcpServers]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadGithubData) {
      return;
    }
    loadGithubInstallations();
    loadGithubRepositories();
  }, [
    loadGithubInstallations,
    loadGithubRepositories,
    selectedCompanyId,
    shouldLoadGithubData,
  ]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadTaskData) {
      return;
    }
    loadTasks();
  }, [loadTasks, selectedCompanyId, shouldLoadTaskData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadSkillData) {
      return;
    }
    loadSkills();
  }, [loadSkills, selectedCompanyId, shouldLoadSkillData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadMcpServerData) {
      return;
    }
    loadMcpServers();
  }, [loadMcpServers, selectedCompanyId, shouldLoadMcpServerData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadRunnerData) {
      return;
    }
    loadAgentRunners();
  }, [loadAgentRunners, selectedCompanyId, shouldLoadRunnerData]);

  useEffect(() => {
    if (!selectedCompanyId || !shouldLoadAgentData) {
      return;
    }
    loadAgents();
  }, [loadAgents, selectedCompanyId, shouldLoadAgentData]);

  useEffect(() => {
    if (!selectedCompanyId || activePage !== "chats") {
      return;
    }
    loadChatSessionIndexByAgent();
  }, [activePage, loadChatSessionIndexByAgent, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setChatAgentId("");
      setChatTurns([]);
      return;
    }

    setChatAgentId((currentAgentId) => {
      if (currentAgentId && agents.some((agent) => agent.id === currentAgentId)) {
        return currentAgentId;
      }
      return agents[0]?.id || "";
    });
  }, [agents, selectedCompanyId]);

  useEffect(() => {
    setCodexAuthCopyFeedback("");
  }, [chatAgentId, codexAuthState?.requestId, codexAuthState?.userCode]);

  useEffect(() => {
    if (!chatAgentId) {
      setChatSessionId((currentSessionId) => (currentSessionId ? "" : currentSessionId));
      setChatSessions((currentSessions) => (currentSessions.length > 0 ? [] : currentSessions));
      setChatTurns((currentTurns) => (currentTurns.length > 0 ? [] : currentTurns));
      return;
    }

    if (activePage === "chats") {
      setChatSessionId((currentSessionId) => {
        if (!currentSessionId) {
          return "";
        }
        if (chatSessions.some((session) => session.id === currentSessionId)) {
          return currentSessionId;
        }
        return "";
      });
      if (!chatSessionId) {
        setChatTurns((currentTurns) => (currentTurns.length > 0 ? [] : currentTurns));
      }
      return;
    }

    if (activePage === "agents" && agentsRoute.view === "chat" && agentsRoute.sessionId) {
      setChatSessionId(agentsRoute.sessionId);
      return;
    }

    if (activePage === "agents" && agentsRoute.view === "chats") {
      setChatSessionId("");
      setChatTurns([]);
      return;
    }

    setChatSessionId((currentSessionId) => {
      if (currentSessionId && chatSessions.some((session) => session.id === currentSessionId)) {
        return currentSessionId;
      }
      return chatSessions[0]?.id || "";
    });
  }, [activePage, agentsRoute.sessionId, agentsRoute.view, chatAgentId, chatSessionId, chatSessions]);

  useEffect(() => {
    const legacyHashRoute = String(window.location.hash || "")
      .replace(/^#/, "")
      .trim();
    if (legacyHashRoute) {
      setBrowserPath(`/${legacyHashRoute}`, { replace: true });
      return;
    }

    if (normalizePathname(window.location.pathname) === "/") {
      setBrowserPath(`/${NAV_ITEMS[0].id}`, { replace: true });
      return;
    }

    const handlePopState = () => {
      setActivePage(getPageFromPathname());
      setAgentsRoute(getAgentsRouteFromPathname());
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (activePage !== "agents") {
      return;
    }
    if (agentsRoute.view === "chats" || agentsRoute.view === "chat") {
      if (agentsRoute.agentId) {
        setChatAgentId(agentsRoute.agentId);
      }
      if (agentsRoute.view === "chats") {
        setChatSessionId("");
        setChatTurns([]);
      }
      if (agentsRoute.view === "chat" && agentsRoute.sessionId) {
        setChatSessionId(agentsRoute.sessionId);
      }
    }
  }, [activePage, agentsRoute.agentId, agentsRoute.sessionId, agentsRoute.view]);

  useEffect(() => {
    if (isLoadingCompanies) {
      return;
    }
    const activeItem = NAV_ITEM_LOOKUP.get(activePage);
    if (activeItem?.requiresCompany && !selectedCompanyId) {
      navigateTo("settings");
    }
  }, [activePage, isLoadingCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!pendingGithubInstallCallback) {
      return;
    }

    navigateTo("settings");

    const installationId = String(pendingGithubInstallCallback.installationId || "").trim();
    const setupAction = String(pendingGithubInstallCallback.setupAction || "").trim();
    if (!installationId) {
      setGithubInstallationError("GitHub install callback is missing installation_id.");
      setPendingGithubInstallCallback(null);
      clearGithubInstallCallbackFromLocation();
      return;
    }

    if (!selectedCompanyId) {
      setGithubInstallationError(
        `Select a company to link GitHub installation ${installationId}.`,
      );
      return;
    }

    let isCancelled = false;
    const linkGithubInstallation = async () => {
      try {
        setIsAddingGithubInstallationFromCallback(true);
        setGithubInstallationError("");
        setGithubInstallationNotice("");
        const data = await executeGraphQL(ADD_GITHUB_INSTALLATION_MUTATION, {
          companyId: selectedCompanyId,
          installationId,
          setupAction: setupAction || null,
        });
        const result = data.addGithubInstallation;
        if (!result.ok) {
          throw new Error(result.error || "Failed to link GitHub installation.");
        }

        if (!isCancelled) {
          setGithubInstallationNotice(`Linked GitHub installation ${installationId}.`);
          await loadGithubInstallations();
          await loadGithubRepositories();
        }
      } catch (linkError) {
        if (!isCancelled) {
          setGithubInstallationError(linkError.message);
        }
      } finally {
        if (!isCancelled) {
          setIsAddingGithubInstallationFromCallback(false);
          setPendingGithubInstallCallback(null);
          clearGithubInstallCallbackFromLocation();
        }
      }
    };

    linkGithubInstallation();
    return () => {
      isCancelled = true;
    };
  }, [loadGithubInstallations, loadGithubRepositories, pendingGithubInstallCallback, selectedCompanyId]);

  async function handleCreateCompany(event) {
    event.preventDefault();
    if (!newCompanyName.trim()) {
      setCompanyError("Company name is required.");
      return;
    }

    try {
      setIsCreatingCompany(true);
      setCompanyError("");
      const data = await executeGraphQL(CREATE_COMPANY_MUTATION, {
        name: newCompanyName.trim(),
      });
      const result = data.createCompany;
      if (!result.ok) {
        throw new Error(result.error || "Company creation failed.");
      }
      const createdCompany = result.company;
      setNewCompanyName("");
      await loadCompanies();
      setSelectedCompanyId(createdCompany.id);
    } catch (createError) {
      setCompanyError(createError.message);
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function handleDeleteCompany() {
    if (!selectedCompany) {
      setCompanyError("Select a company before deleting.");
      return;
    }

    const confirmed = window.confirm(
      `Delete company "${selectedCompany.name}"? This will also delete all tasks, skills, MCP servers, agents, and agent runners in that company.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingCompany(true);
      setCompanyError("");
      const data = await executeGraphQL(DELETE_COMPANY_MUTATION, {
        id: selectedCompany.id,
      });
      const result = data.deleteCompany;
      if (!result.ok) {
        throw new Error(result.error || "Company deletion failed.");
      }

      setTasks([]);
      setRelationshipDrafts({});
      setSkills([]);
      setSkillDrafts({});
      setMcpServers([]);
      setMcpServerDrafts({});
      setAgents([]);
      setAgentDrafts({});
      setAgentRunners([]);
      await loadCompanies();
    } catch (deleteError) {
      setCompanyError(deleteError.message);
    } finally {
      setIsDeletingCompany(false);
    }
  }

  async function handleDeleteGithubInstallation(installationId) {
    if (!selectedCompanyId) {
      setGithubInstallationError("Select a company before deleting GitHub installations.");
      return;
    }

    const resolvedInstallationId = String(installationId || "").trim();
    if (!resolvedInstallationId) {
      setGithubInstallationError("installationId is required.");
      return;
    }

    const confirmed = window.confirm(
      `Delete GitHub installation ${resolvedInstallationId} from this company?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingGithubInstallationId(resolvedInstallationId);
      setGithubInstallationError("");
      setGithubInstallationNotice("");
      const data = await executeGraphQL(DELETE_GITHUB_INSTALLATION_MUTATION, {
        companyId: selectedCompanyId,
        installationId: resolvedInstallationId,
      });
      const result = data.deleteGithubInstallation;
      if (!result.ok) {
        throw new Error(result.error || "Failed to delete GitHub installation.");
      }
      setGithubInstallationNotice(`Deleted GitHub installation ${resolvedInstallationId}.`);
      await loadGithubInstallations();
      await loadGithubRepositories();
    } catch (deleteError) {
      setGithubInstallationError(deleteError.message);
    } finally {
      setDeletingGithubInstallationId("");
    }
  }

  async function handleRefreshGithubInstallationRepositories(installationId) {
    if (!selectedCompanyId) {
      setGithubInstallationError("Select a company before refreshing repositories.");
      return;
    }

    const resolvedInstallationId = String(installationId || "").trim();
    if (!resolvedInstallationId) {
      setGithubInstallationError("installationId is required.");
      return;
    }

    try {
      setRefreshingGithubInstallationId(resolvedInstallationId);
      setGithubInstallationError("");
      setGithubInstallationNotice("");
      const data = await executeGraphQL(REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION, {
        companyId: selectedCompanyId,
        installationId: resolvedInstallationId,
      });
      const result = data.refreshGithubInstallationRepositories;
      if (!result.ok) {
        throw new Error(result.error || "Failed to refresh repositories.");
      }
      const refreshedRepositories = result.repositories || [];
      setGithubInstallationNotice(
        `Refreshed ${refreshedRepositories.length} repos for installation ${resolvedInstallationId}.`,
      );
      await loadGithubRepositories();
    } catch (refreshError) {
      setGithubInstallationError(refreshError.message);
    } finally {
      setRefreshingGithubInstallationId("");
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setTaskError("Select a company before creating tasks.");
      return false;
    }
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return false;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const data = await executeGraphQL(CREATE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        name: name.trim(),
        description: description.trim() || null,
        parentTaskId: toGraphQLTaskId(parentTaskId),
        dependsOnTaskId: toGraphQLTaskId(dependsOnTaskId),
      });

      const result = data.createTask;
      if (!result.ok) {
        throw new Error(result.error || "Task creation failed.");
      }

      setName("");
      setDescription("");
      setParentTaskId("");
      setDependsOnTaskId("");
      await loadTasks();
      return true;
    } catch (submitError) {
      setTaskError(submitError.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleDeleteTask(taskId, taskName) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before deleting tasks.");
      return;
    }

    const confirmed = window.confirm(`Delete task "${taskName}" (#${taskId})?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setTaskError("");
      const data = await executeGraphQL(DELETE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        id: taskId,
      });
      const result = data.deleteTask;
      if (!result.ok) {
        throw new Error(result.error || "Task deletion failed.");
      }
      await loadTasks();
    } catch (deleteError) {
      setTaskError(deleteError.message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleRelationshipSave(taskId) {
    if (!selectedCompanyId) {
      setTaskError("Select a company before updating tasks.");
      return;
    }
    const draft = relationshipDrafts[taskId] || {
      parentTaskId: "",
      dependsOnTaskId: "",
    };

    try {
      setSavingTaskId(taskId);
      setTaskError("");

      const data = await executeGraphQL(UPDATE_TASK_MUTATION, {
        companyId: selectedCompanyId,
        id: taskId,
        parentTaskId: toGraphQLTaskId(draft.parentTaskId),
        dependsOnTaskId: toGraphQLTaskId(draft.dependsOnTaskId),
      });

      const result = data.updateTask;
      if (!result.ok) {
        throw new Error(result.error || "Task relationship update failed.");
      }

      await loadTasks();
    } catch (updateError) {
      setTaskError(updateError.message);
    } finally {
      setSavingTaskId(null);
    }
  }

  function resolveSkillMutationPayload({
    name: rawName,
    skillType: rawSkillType,
    skillsMpPackageName: rawSkillsMpPackageName,
    description: rawDescription,
    instructions: rawInstructions,
  }) {
    const name = String(rawName || "").trim();
    const resolvedSkillType = normalizeSkillType(rawSkillType);
    const skillsMpPackageName = String(rawSkillsMpPackageName || "").trim();
    const description = String(rawDescription || "").trim();
    const instructions = String(rawInstructions || "").trim();

    if (!name) {
      return { payload: null, error: "Skill name is required." };
    }

    if (resolvedSkillType === SKILL_TYPE_SKILLSMP) {
      if (!skillsMpPackageName) {
        return {
          payload: null,
          error: "SkillsMP package is required (for example: upstash/context7).",
        };
      }
      return {
        payload: {
          name,
          skillType: resolvedSkillType,
          skillsMpPackageName,
          description: description || null,
          instructions: instructions || null,
        },
        error: "",
      };
    }

    if (!description || !instructions) {
      return {
        payload: null,
        error: "Text skills require both description and instructions.",
      };
    }

    return {
      payload: {
        name,
        skillType: resolvedSkillType,
        skillsMpPackageName: null,
        description,
        instructions,
      },
      error: "",
    };
  }

  async function handleCreateSkill(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setSkillError("Select a company before creating skills.");
      return false;
    }

    const { payload, error } = resolveSkillMutationPayload({
      name: skillName,
      skillType,
      skillsMpPackageName: skillSkillsMpPackageName,
      description: skillDescription,
      instructions: skillInstructions,
    });
    if (error) {
      setSkillError(error);
      return false;
    }

    try {
      setIsCreatingSkill(true);
      setSkillError("");
      const data = await executeGraphQL(CREATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        ...payload,
      });
      const result = data.createSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill creation failed.");
      }
      setSkillName("");
      setSkillType(SKILL_TYPE_TEXT);
      setSkillSkillsMpPackageName("");
      setSkillDescription("");
      setSkillInstructions("");
      await loadSkills();
      return true;
    } catch (createError) {
      setSkillError(createError.message);
      return false;
    } finally {
      setIsCreatingSkill(false);
    }
  }

  async function handleSaveSkill(skillId) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before updating skills.");
      return;
    }
    const draft = skillDrafts[skillId] || {
      name: "",
      skillType: SKILL_TYPE_TEXT,
      skillsMpPackageName: "",
      description: "",
      instructions: "",
    };

    const { payload, error } = resolveSkillMutationPayload({
      name: draft.name,
      skillType: draft.skillType,
      skillsMpPackageName: draft.skillsMpPackageName,
      description: draft.description,
      instructions: draft.instructions,
    });
    if (error) {
      setSkillError(error);
      return;
    }

    try {
      setSavingSkillId(skillId);
      setSkillError("");
      const data = await executeGraphQL(UPDATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        id: skillId,
        ...payload,
      });
      const result = data.updateSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill update failed.");
      }
      await loadSkills();
    } catch (updateError) {
      setSkillError(updateError.message);
    } finally {
      setSavingSkillId(null);
    }
  }

  async function handleDeleteSkill(skillId, skillDisplayName) {
    if (!selectedCompanyId) {
      setSkillError("Select a company before deleting skills.");
      return;
    }

    const confirmed = window.confirm(`Delete skill "${skillDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSkillId(skillId);
      setSkillError("");
      const data = await executeGraphQL(DELETE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        id: skillId,
      });
      const result = data.deleteSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill deletion failed.");
      }
      await loadSkills();
    } catch (deleteError) {
      setSkillError(deleteError.message);
    } finally {
      setDeletingSkillId(null);
    }
  }

  function resolveMcpServerMutationPayload({
    name: rawName,
    transportType: rawTransportType,
    url: rawUrl,
    command: rawCommand,
    argsText: rawArgsText,
    envVarsText: rawEnvVarsText,
    authType: rawAuthType,
    bearerToken: rawBearerToken,
    customHeadersText: rawCustomHeadersText,
    enabled: rawEnabled,
  }) {
    const name = String(rawName || "").trim();
    const transportType = normalizeMcpTransportType(rawTransportType);
    const url = String(rawUrl || "").trim();
    const command = String(rawCommand || "").trim();
    const argsText = String(rawArgsText || "");
    const envVarsText = String(rawEnvVarsText || "");
    const authType = normalizeMcpAuthType(rawAuthType);
    const bearerToken = String(rawBearerToken || "").trim();
    const customHeadersText = String(rawCustomHeadersText || "");

    if (!name) {
      return { payload: null, error: "MCP server name is required." };
    }

    if (transportType === MCP_TRANSPORT_TYPE_STDIO) {
      if (!command) {
        return { payload: null, error: "MCP server command is required for stdio transport." };
      }
      const parsedArgs = parseMcpArgsText(argsText);
      if (parsedArgs.error) {
        return { payload: null, error: parsedArgs.error };
      }
      const parsedEnvVars = parseMcpEnvVarsText(envVarsText);
      if (parsedEnvVars.error) {
        return { payload: null, error: parsedEnvVars.error };
      }

      return {
        payload: {
          name,
          transportType,
          url: null,
          command,
          args: parsedArgs.args,
          envVars: parsedEnvVars.envVars,
          authType: MCP_AUTH_TYPE_NONE,
          bearerToken: null,
          customHeaders: [],
          enabled: Boolean(rawEnabled),
        },
        error: "",
      };
    }

    if (!url) {
      return { payload: null, error: "MCP server URL is required for streamable HTTP transport." };
    }

    let customHeaders = [];
    if (authType === MCP_AUTH_TYPE_CUSTOM_HEADERS) {
      const parsed = parseMcpHeadersText(customHeadersText);
      if (parsed.error) {
        return { payload: null, error: parsed.error };
      }
      if (parsed.headers.length === 0) {
        return { payload: null, error: "At least one custom header is required." };
      }
      customHeaders = parsed.headers;
    } else if (customHeadersText.trim()) {
      const parsed = parseMcpHeadersText(customHeadersText);
      if (parsed.error) {
        return { payload: null, error: parsed.error };
      }
    }

    if (authType === MCP_AUTH_TYPE_BEARER_TOKEN && !bearerToken) {
      return { payload: null, error: "Bearer token is required when auth type is Bearer token." };
    }

    return {
      payload: {
        name,
        transportType,
        url,
        command: null,
        args: [],
        envVars: [],
        authType,
        bearerToken: authType === MCP_AUTH_TYPE_BEARER_TOKEN ? bearerToken : null,
        customHeaders: authType === MCP_AUTH_TYPE_CUSTOM_HEADERS ? customHeaders : [],
        enabled: Boolean(rawEnabled),
      },
      error: "",
    };
  }

  async function handleCreateMcpServer(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before creating MCP servers.");
      return false;
    }

    const { payload, error } = resolveMcpServerMutationPayload({
      name: mcpServerName,
      transportType: mcpServerTransportType,
      url: mcpServerUrl,
      command: mcpServerCommand,
      argsText: mcpServerArgsText,
      envVarsText: mcpServerEnvVarsText,
      authType: mcpServerAuthType,
      bearerToken: mcpServerBearerToken,
      customHeadersText: mcpServerCustomHeadersText,
      enabled: mcpServerEnabled,
    });
    if (error) {
      setMcpServerError(error);
      return false;
    }

    try {
      setIsCreatingMcpServer(true);
      setMcpServerError("");
      const data = await executeGraphQL(CREATE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        ...payload,
      });
      const result = data.createMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server creation failed.");
      }
      setMcpServerName("");
      setMcpServerTransportType(MCP_TRANSPORT_TYPE_STREAMABLE_HTTP);
      setMcpServerUrl("");
      setMcpServerCommand("");
      setMcpServerArgsText("");
      setMcpServerEnvVarsText("");
      setMcpServerAuthType(MCP_AUTH_TYPE_NONE);
      setMcpServerBearerToken("");
      setMcpServerCustomHeadersText("");
      setMcpServerEnabled(true);
      await loadMcpServers();
      return true;
    } catch (createError) {
      setMcpServerError(createError.message);
      return false;
    } finally {
      setIsCreatingMcpServer(false);
    }
  }

  function handleMcpServerDraftChange(mcpServerId, field, value) {
    setMcpServerDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[mcpServerId] || {
        name: "",
        transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
        url: "",
        command: "",
        argsText: "",
        envVarsText: "",
        authType: MCP_AUTH_TYPE_NONE,
        bearerToken: "",
        customHeadersText: "",
        enabled: true,
      };

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      if (field === "authType") {
        nextDraft.authType = normalizeMcpAuthType(value);
      }
      if (field === "transportType") {
        nextDraft.transportType = normalizeMcpTransportType(value);
        if (nextDraft.transportType === MCP_TRANSPORT_TYPE_STDIO) {
          nextDraft.authType = MCP_AUTH_TYPE_NONE;
        }
      }
      if (field === "enabled") {
        nextDraft.enabled = Boolean(value);
      }

      return {
        ...currentDrafts,
        [mcpServerId]: nextDraft,
      };
    });
  }

  async function handleSaveMcpServer(mcpServerId) {
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before updating MCP servers.");
      return;
    }
    const draft = mcpServerDrafts[mcpServerId] || {
      name: "",
      transportType: MCP_TRANSPORT_TYPE_STREAMABLE_HTTP,
      url: "",
      command: "",
      argsText: "",
      envVarsText: "",
      authType: MCP_AUTH_TYPE_NONE,
      bearerToken: "",
      customHeadersText: "",
      enabled: true,
    };

    const { payload, error } = resolveMcpServerMutationPayload(draft);
    if (error) {
      setMcpServerError(error);
      return;
    }

    try {
      setSavingMcpServerId(mcpServerId);
      setMcpServerError("");
      const data = await executeGraphQL(UPDATE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        id: mcpServerId,
        ...payload,
      });
      const result = data.updateMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server update failed.");
      }
      await loadMcpServers();
    } catch (updateError) {
      setMcpServerError(updateError.message);
    } finally {
      setSavingMcpServerId(null);
    }
  }

  async function handleDeleteMcpServer(mcpServerId, mcpServerDisplayName) {
    if (!selectedCompanyId) {
      setMcpServerError("Select a company before deleting MCP servers.");
      return;
    }

    const confirmed = window.confirm(`Delete MCP server "${mcpServerDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingMcpServerId(mcpServerId);
      setMcpServerError("");
      const data = await executeGraphQL(DELETE_MCP_SERVER_MUTATION, {
        companyId: selectedCompanyId,
        id: mcpServerId,
      });
      const result = data.deleteMcpServer;
      if (!result.ok) {
        throw new Error(result.error || "MCP server deletion failed.");
      }
      await loadMcpServers();
    } catch (deleteError) {
      setMcpServerError(deleteError.message);
    } finally {
      setDeletingMcpServerId(null);
    }
  }

  async function handleRegenerateRunnerSecret(runnerId) {
    if (!selectedCompanyId) {
      setRunnerError("Select a company before regenerating runner keys.");
      return;
    }

    const confirmed = window.confirm(
      `Regenerate API key for runner ${runnerId}? Existing runner processes using the old key will need to reconnect with the new key.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setRegeneratingRunnerId(runnerId);
      setRunnerError("");
      const data = await executeGraphQL(REGENERATE_AGENT_RUNNER_SECRET_MUTATION, {
        companyId: selectedCompanyId,
        id: runnerId,
      });
      const result = data.regenerateAgentRunnerSecret;
      if (!result.ok) {
        throw new Error(result.error || "Runner key regeneration failed.");
      }

      const regeneratedSecret = result.provisionedAuthSecret || "";
      if (!regeneratedSecret) {
        throw new Error("Runner key regeneration failed: missing secret.");
      }
      setRunnerSecretsById((currentSecrets) => ({
        ...currentSecrets,
        [runnerId]: regeneratedSecret,
      }));
      await loadAgentRunners({ silently: true });
    } catch (regenerateError) {
      setRunnerError(regenerateError.message);
    } finally {
      setRegeneratingRunnerId(null);
    }
  }

  async function handleDeleteRunner(runnerId) {
    if (!selectedCompanyId) {
      setRunnerError("Select a company before deleting runners.");
      return;
    }

    const confirmed = window.confirm(`Delete runner ${runnerId}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingRunnerId(runnerId);
      setRunnerError("");
      const data = await executeGraphQL(DELETE_AGENT_RUNNER_MUTATION, {
        companyId: selectedCompanyId,
        id: runnerId,
      });
      const result = data.deleteAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Runner deletion failed.");
      }
      setRunnerSecretsById((currentSecrets) => {
        if (!(runnerId in currentSecrets)) {
          return currentSecrets;
        }
        const nextSecrets = { ...currentSecrets };
        delete nextSecrets[runnerId];
        return nextSecrets;
      });
      await loadAgentRunners();
    } catch (deleteError) {
      setRunnerError(deleteError.message);
    } finally {
      setDeletingRunnerId(null);
    }
  }

  async function handleCreateRunner(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setRunnerError("Select a company before creating runners.");
      return false;
    }

    try {
      setIsCreatingRunner(true);
      setRunnerError("");
      const requestedRunnerSecret = runnerSecretDraft.trim();
      const data = await executeGraphQL(CREATE_AGENT_RUNNER_MUTATION, {
        companyId: selectedCompanyId,
        id: runnerIdDraft.trim() || null,
        authSecret: requestedRunnerSecret || null,
      });
      const result = data.createAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Runner creation failed.");
      }

      const createdRunnerId = result.agentRunner?.id;
      const effectiveRunnerSecret = requestedRunnerSecret || result.provisionedAuthSecret || "";
      if (createdRunnerId && effectiveRunnerSecret) {
        setRunnerSecretsById((currentSecrets) => ({
          ...currentSecrets,
          [createdRunnerId]: effectiveRunnerSecret,
        }));
      }

      setRunnerIdDraft("");
      setRunnerSecretDraft("");
      await loadAgentRunners();
      return true;
    } catch (createError) {
      setRunnerError(createError.message);
      return false;
    } finally {
      setIsCreatingRunner(false);
    }
  }

  async function handleCreateAgent(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setAgentError("Select a company before creating agents.");
      return false;
    }
    if (!agentName.trim()) {
      setAgentError("Agent name is required.");
      return false;
    }
    if (!agentRunnerId) {
      setAgentError("Assign a runner before creating an agent.");
      return false;
    }

    const selectedRunner = agentRunnerLookup.get(agentRunnerId);
    if (!selectedRunner) {
      setAgentError(`Assigned runner ${agentRunnerId} was not found for this company.`);
      return false;
    }

    const normalizedSdk = normalizeAgentSdkValue(agentSdk);
    if (!isAvailableAgentSdk(normalizedSdk)) {
      setAgentError(`agentSdk must be one of: ${AVAILABLE_AGENT_SDKS.join(", ")}.`);
      return false;
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    if (selectedRunnerCodexModels.length === 0) {
      setAgentError(`Runner ${agentRunnerId} has not reported any available models yet.`);
      return false;
    }

    const normalizedModel = String(agentModel || "").trim();
    if (!normalizedModel) {
      setAgentError("Model is required.");
      return false;
    }
    if (!getRunnerModelNames(selectedRunnerCodexModels).includes(normalizedModel)) {
      setAgentError(
        `Model "${normalizedModel}" is not available on runner ${agentRunnerId}. Wait for runner model updates and try again.`,
      );
      return false;
    }

    const normalizedReasoning = String(agentModelReasoningLevel || "").trim();
    if (!normalizedReasoning) {
      setAgentError("Model reasoning level is required.");
      return false;
    }
    if (!getRunnerReasoningLevels(selectedRunnerCodexModels, normalizedModel).includes(normalizedReasoning)) {
      setAgentError(
        `Reasoning "${normalizedReasoning}" is not available for model "${normalizedModel}" on runner ${agentRunnerId}.`,
      );
      return false;
    }

    try {
      setIsCreatingAgent(true);
      setAgentError("");
      const cleanAgentMcpServerIds = normalizeUniqueStringList(agentMcpServerIds);
      const data = await executeGraphQL(CREATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        agentRunnerId: agentRunnerId || null,
        skillIds: agentSkillIds,
        mcpServerIds: cleanAgentMcpServerIds,
        name: agentName.trim(),
        agentSdk: normalizedSdk,
        model: normalizedModel,
        modelReasoningLevel: normalizedReasoning,
      });
      const result = data.createAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent creation failed.");
      }
      setAgentName("");
      setAgentRunnerId("");
      setAgentSkillIds([]);
      setAgentMcpServerIds([]);
      setAgentSdk(DEFAULT_AGENT_SDK);
      setAgentModel("");
      setAgentModelReasoningLevel("");
      await loadAgents();
      return true;
    } catch (createError) {
      setAgentError(createError.message);
      return false;
    } finally {
      setIsCreatingAgent(false);
    }
  }

  async function handleSaveAgent(agentId) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before updating agents.");
      return;
    }
    const draft = agentDrafts[agentId] || {
      agentRunnerId: "",
      skillIds: [],
      mcpServerIds: [],
      name: "",
      agentSdk: DEFAULT_AGENT_SDK,
      model: "",
      modelReasoningLevel: "",
    };
    if (!draft.name.trim()) {
      setAgentError("Agent name is required to save.");
      return;
    }
    if (!draft.agentRunnerId) {
      setAgentError("Assigned runner is required to save an agent.");
      return;
    }

    const assignedRunner = agentRunnerLookup.get(draft.agentRunnerId);
    if (!assignedRunner) {
      setAgentError(`Assigned runner ${draft.agentRunnerId} was not found for this company.`);
      return;
    }

    const normalizedSdk = normalizeAgentSdkValue(draft.agentSdk);
    if (!isAvailableAgentSdk(normalizedSdk)) {
      setAgentError(`agentSdk must be one of: ${AVAILABLE_AGENT_SDKS.join(", ")}.`);
      return;
    }

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      draft.agentRunnerId,
    );
    if (selectedRunnerCodexModels.length === 0) {
      setAgentError(`Runner ${draft.agentRunnerId} has not reported any available models yet.`);
      return;
    }

    const normalizedModel = String(draft.model || "").trim();
    if (!normalizedModel) {
      setAgentError("Model is required to save.");
      return;
    }
    if (!getRunnerModelNames(selectedRunnerCodexModels).includes(normalizedModel)) {
      setAgentError(
        `Model "${normalizedModel}" is not available on runner ${draft.agentRunnerId}.`,
      );
      return;
    }

    const normalizedReasoning = String(draft.modelReasoningLevel || "").trim();
    if (!normalizedReasoning) {
      setAgentError("Model reasoning level is required to save.");
      return;
    }
    if (!getRunnerReasoningLevels(selectedRunnerCodexModels, normalizedModel).includes(normalizedReasoning)) {
      setAgentError(
        `Reasoning "${normalizedReasoning}" is not available for model "${normalizedModel}" on runner ${draft.agentRunnerId}.`,
      );
      return;
    }

    try {
      setSavingAgentId(agentId);
      setAgentError("");
      const cleanDraftMcpServerIds = normalizeUniqueStringList(draft.mcpServerIds);
      const data = await executeGraphQL(UPDATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        id: agentId,
        agentRunnerId: draft.agentRunnerId || null,
        skillIds: draft.skillIds || [],
        mcpServerIds: cleanDraftMcpServerIds,
        name: draft.name.trim(),
        agentSdk: normalizedSdk,
        model: normalizedModel,
        modelReasoningLevel: normalizedReasoning,
      });
      const result = data.updateAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent update failed.");
      }
      await loadAgents();
    } catch (updateError) {
      setAgentError(updateError.message);
    } finally {
      setSavingAgentId(null);
    }
  }

  async function handleDeleteAgent(agentId, agentDisplayName) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before deleting agents.");
      return;
    }

    const confirmed = window.confirm(`Delete agent "${agentDisplayName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingAgentId(agentId);
      setAgentError("");
      const data = await executeGraphQL(DELETE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        id: agentId,
      });
      const result = data.deleteAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent deletion failed.");
      }
      await loadAgents();
    } catch (deleteError) {
      setAgentError(deleteError.message);
    } finally {
      setDeletingAgentId(null);
    }
  }

  async function handleInitializeAgent(agentId) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before initializing agents.");
      return;
    }

    const agent = agents.find((candidate) => candidate.id === agentId);
    if (!agent) {
      setAgentError(`Agent ${agentId} not found in the current list.`);
      return;
    }

    const assignedRunner = agent.agentRunnerId ? agentRunnerLookup.get(agent.agentRunnerId) : null;
    if (agent.agentRunnerId && !assignedRunner) {
      setAgentError(`Assigned runner ${agent.agentRunnerId} was not found for this company.`);
      return;
    }

    const readyRunner = assignedRunner
      ? normalizeRunnerStatus(assignedRunner.status) === "ready"
        ? assignedRunner
        : null
      : agentRunners.find((runner) => normalizeRunnerStatus(runner.status) === "ready");
    if (!readyRunner) {
      setAgentError(
        assignedRunner
          ? `Assigned runner ${assignedRunner.id} is not ready.`
          : "No ready runner found. Start a runner before initializing agents.",
      );
      return;
    }

    try {
      setInitializingAgentId(agentId);
      setAgentError("");
      const data = await executeGraphQL(INITIALIZE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        runnerId: readyRunner.id,
        agentId,
      });
      const result = data.initializeAgentRunner;
      if (!result.ok) {
        throw new Error(result.error || "Initialize agent failed.");
      }
      await loadAgentRunners({ silently: true });
      await loadAgents();
    } catch (initializeError) {
      setAgentError(initializeError.message);
    } finally {
      setInitializingAgentId(null);
    }
  }

  async function handleRetryAgentSkillInstall(agentId, skillId) {
    if (!selectedCompanyId) {
      setAgentError("Select a company before retrying skill installs.");
      return;
    }

    const resolvedAgentId = String(agentId || "").trim();
    const resolvedSkillId = String(skillId || "").trim();
    if (!resolvedAgentId || !resolvedSkillId) {
      setAgentError("Agent id and skill id are required to retry installation.");
      return;
    }

    const selectedAgent = agents.find((agent) => agent.id === resolvedAgentId) || null;
    if (!selectedAgent) {
      setAgentError(`Agent ${resolvedAgentId} was not found.`);
      return;
    }
    if (!selectedAgent.agentRunnerId) {
      setAgentError("Assign a runner to this agent before retrying install.");
      return;
    }

    const retryKey = `${resolvedAgentId}:${resolvedSkillId}`;
    try {
      setRetryingAgentSkillInstallKey(retryKey);
      setAgentError("");
      const data = await executeGraphQL(RETRY_AGENT_SKILL_INSTALL_MUTATION, {
        companyId: selectedCompanyId,
        agentId: resolvedAgentId,
        skillId: resolvedSkillId,
        runnerId: selectedAgent.agentRunnerId,
      });
      const result = data.retryAgentSkillInstall;
      if (!result.ok) {
        throw new Error(result.error || "Retry skill install failed.");
      }
      await loadAgents();
    } catch (retryError) {
      setAgentError(retryError.message);
    } finally {
      setRetryingAgentSkillInstallKey("");
    }
  }

  async function handleSendChatMessage(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!selectedCompanyId) {
      setChatError("Select a company before sending chat messages.");
      return;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before sending a message.");
      return;
    }
    if (!chatDraftMessage.trim()) {
      setChatError("Message cannot be empty.");
      return;
    }

    const selectedAgentForChat = agents.find((agent) => agent.id === chatAgentId) || null;
    let targetSessionId = chatSessionId;
    if (!targetSessionId) {
      targetSessionId = await handleCreateChatSession({
        title: chatSessionTitleDraft || null,
        remoteSessionId: chatSessionRemoteIdDraft || null,
        preferredRunnerId: selectedAgentForChat?.agentRunnerId || null,
      });
      if (!targetSessionId) {
        return;
      }
    }

    try {
      setIsSendingChatMessage(true);
      setChatError("");
      const data = await executeGraphQL(SEND_AGENT_SESSION_MESSAGE_MUTATION, {
        companyId: selectedCompanyId,
        agentId: chatAgentId,
        sessionId: targetSessionId,
        message: chatDraftMessage.trim(),
        runnerId: selectedAgentForChat?.agentRunnerId || null,
      });
      const result = data.sendAgentSessionMessage;
      if (!result.ok) {
        throw new Error(result.error || "Failed to send chat message.");
      }
      if (result.sessionId) {
        setChatSessionId(result.sessionId);
      }
      setChatDraftMessage("");
      await loadAgentChatSessions({ silently: true });
      await loadAgentChatTurns();
    } catch (sendError) {
      setChatError(sendError.message);
    } finally {
      setIsSendingChatMessage(false);
    }
  }

  async function handleCreateChatSession({
    agentId = null,
    title = null,
    remoteSessionId = null,
    preferredRunnerId = null,
  } = {}) {
    const targetAgentId = String(agentId || chatAgentId || "").trim();
    if (!selectedCompanyId) {
      setChatError("Select a company before creating a chat.");
      return null;
    }
    if (!targetAgentId) {
      setChatError("Select an agent before creating a chat.");
      return null;
    }

    const selectedAgentForChat = agents.find((agent) => agent.id === targetAgentId) || null;

    try {
      setIsCreatingChatSession(true);
      setChatError("");
      const data = await executeGraphQL(CREATE_AGENT_CHAT_SESSION_MUTATION, {
        companyId: selectedCompanyId,
        agentId: targetAgentId,
        title: title ? title.trim() : null,
        remoteSessionId: remoteSessionId ? remoteSessionId.trim() : null,
        runnerId: preferredRunnerId || selectedAgentForChat?.agentRunnerId || null,
      });
      const result = data.createAgentChatSession;
      if (!result.ok || !result.session) {
        throw new Error(result.error || "Failed to create chat.");
      }

      const sessionsData = await executeGraphQL(LIST_AGENT_CHAT_SESSIONS_QUERY, {
        companyId: selectedCompanyId,
        agentId: targetAgentId,
        limit: 200,
      });
      const nextSessionsForAgent = sessionsData.agentChatSessions || [];

      setChatAgentId(targetAgentId);
      setChatSessions(nextSessionsForAgent);
      setChatSessionsByAgent((currentSessionsByAgent) => ({
        ...currentSessionsByAgent,
        [targetAgentId]: nextSessionsForAgent,
      }));
      setChatSessionTitleDraft("");
      setChatSessionRemoteIdDraft("");
      setChatSessionId(result.session.id);
      return result.session.id;
    } catch (createError) {
      setChatError(createError.message);
      return null;
    } finally {
      setIsCreatingChatSession(false);
    }
  }

  function handleOpenChatFromList({ agentId, sessionId, sessionsForAgent = [] }) {
    const resolvedAgentId = String(agentId || "").trim();
    const resolvedSessionId = String(sessionId || "").trim();
    if (!resolvedAgentId || !resolvedSessionId) {
      return;
    }

    setChatAgentId(resolvedAgentId);
    setChatSessions(Array.isArray(sessionsForAgent) ? sessionsForAgent : []);
    setChatSessionId(resolvedSessionId);
    setChatTurns([]);
    setChatError("");
    setBrowserPath(`/agents/${resolvedAgentId}/chats/${resolvedSessionId}`);
  }

  async function handleCreateChatForAgent(agentId) {
    const resolvedAgentId = String(agentId || "").trim();
    if (!resolvedAgentId) {
      return;
    }
    setChatAgentId(resolvedAgentId);
    setChatSessionId("");
    setChatTurns([]);
    const createdSessionId = await handleCreateChatSession({ agentId: resolvedAgentId });
    if (createdSessionId) {
      setBrowserPath(`/agents/${resolvedAgentId}/chats/${createdSessionId}`);
    }
  }

  async function handleStartCodexDeviceAuth() {
    if (!selectedCompanyId) {
      setCodexAuthError("Select a company before starting device auth.");
      return;
    }
    if (!chatAgentId) {
      setCodexAuthError("Select an agent before starting device auth.");
      return;
    }

    const selectedAgentForAuth = agents.find((agent) => agent.id === chatAgentId) || null;
    if (!selectedAgentForAuth) {
      setCodexAuthError("Selected agent was not found.");
      return;
    }
    if (!isCodexAgent(selectedAgentForAuth)) {
      setCodexAuthError("Only agents with SDK codex support device auth.");
      return;
    }

    try {
      setIsStartingCodexAuth(true);
      setCodexAuthError("");
      setCodexAuthCopyFeedback("");
      const data = await executeGraphQL(START_AGENT_CODEX_DEVICE_AUTH_MUTATION, {
        companyId: selectedCompanyId,
        agentId: chatAgentId,
        runnerId: selectedAgentForAuth.agentRunnerId || null,
      });
      const result = data.startAgentCodexDeviceAuth;
      if (!result.ok) {
        throw new Error(result.error || "Failed to start Codex device auth.");
      }
      await loadCodexAuthState();
    } catch (startError) {
      setCodexAuthError(startError.message);
    } finally {
      setIsStartingCodexAuth(false);
    }
  }

  async function handleStartRunnerCodexDeviceAuth(runnerId, agentId) {
    if (!selectedCompanyId) {
      setCodexAuthError("Select a company before starting device auth.");
      return;
    }

    const resolvedRunnerId = String(runnerId || "").trim();
    const resolvedAgentId = String(agentId || "").trim();
    if (!resolvedRunnerId) {
      setCodexAuthError("Runner id is required to start device auth from the runner page.");
      return;
    }
    if (!resolvedAgentId) {
      setCodexAuthError("Assign a Codex agent to this runner before starting device auth.");
      return;
    }

    const selectedAgentForAuth = agents.find((agent) => agent.id === resolvedAgentId) || null;
    if (!selectedAgentForAuth) {
      setCodexAuthError("Selected agent was not found.");
      return;
    }
    if (!isCodexAgent(selectedAgentForAuth)) {
      setCodexAuthError("Only agents with SDK codex support device auth.");
      return;
    }

    try {
      setIsStartingCodexAuth(true);
      setCodexAuthError("");
      setCodexAuthCopyFeedback("");
      setChatAgentId(resolvedAgentId);

      const data = await executeGraphQL(START_AGENT_CODEX_DEVICE_AUTH_MUTATION, {
        companyId: selectedCompanyId,
        agentId: resolvedAgentId,
        runnerId: resolvedRunnerId,
      });
      const result = data.startAgentCodexDeviceAuth;
      if (!result.ok) {
        throw new Error(result.error || "Failed to start Codex device auth.");
      }

      const stateData = await executeGraphQL(GET_AGENT_CODEX_AUTH_STATE_QUERY, {
        companyId: selectedCompanyId,
        agentId: resolvedAgentId,
      });
      setCodexAuthState(stateData.agentCodexAuthState || null);
      navigateTo("dashboard");
    } catch (startError) {
      setCodexAuthError(startError.message);
    } finally {
      setIsStartingCodexAuth(false);
    }
  }

  async function handleCopyDeviceCode(deviceCode) {
    const trimmedCode = String(deviceCode || "").trim();
    if (!trimmedCode) {
      setCodexAuthCopyFeedback("No device code available yet.");
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmedCode);
        setCodexAuthCopyFeedback("Device code copied.");
        return;
      }
      throw new Error("Clipboard API unavailable.");
    } catch (copyError) {
      setCodexAuthCopyFeedback(
        `Copy failed (${copyError?.message || "unknown error"}). Copy the code manually.`,
      );
    }
  }

  function handleDraftChange(taskId, field, value) {
    setRelationshipDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...(currentDrafts[taskId] || { parentTaskId: "", dependsOnTaskId: "" }),
        [field]: value,
      },
    }));
  }

  function handleSkillDraftChange(skillId, field, value) {
    setSkillDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[skillId] || {
        name: "",
        skillType: SKILL_TYPE_TEXT,
        skillsMpPackageName: "",
        description: "",
        instructions: "",
      };
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };
      if (field === "skillType") {
        nextDraft.skillType = normalizeSkillType(value);
      }
      return {
        ...currentDrafts,
        [skillId]: nextDraft,
      };
    });
  }

  function handleCreateAgentRunnerChange(nextRunnerId) {
    const normalizedRunnerId = String(nextRunnerId || "").trim();
    setAgentRunnerId(normalizedRunnerId);

    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      normalizedRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: agentModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    setAgentSdk(DEFAULT_AGENT_SDK);
    setAgentModel(resolvedSelection.model);
    setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
  }

  function handleCreateAgentSdkChange(nextSdk) {
    if (!isAvailableAgentSdk(nextSdk)) {
      setAgentSdk(DEFAULT_AGENT_SDK);
      return;
    }
    setAgentSdk(normalizeAgentSdkValue(nextSdk));
  }

  function handleCreateAgentModelChange(nextModel) {
    const normalizedModel = String(nextModel || "").trim();
    const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
      runnerCodexModelEntriesById,
      agentRunnerId,
    );
    const resolvedSelection = resolveRunnerBackedModelSelection({
      codexModelEntries: selectedRunnerCodexModels,
      requestedModel: normalizedModel,
      requestedReasoning: agentModelReasoningLevel,
    });

    setAgentModel(resolvedSelection.model);
    setAgentModelReasoningLevel(resolvedSelection.modelReasoningLevel);
  }

  function handleCreateAgentReasoningLevelChange(nextReasoningLevel) {
    setAgentModelReasoningLevel(String(nextReasoningLevel || "").trim());
  }

  function handleCreateAgentSkillIdsChange(nextSkillIds) {
    setAgentSkillIds(normalizeUniqueStringList(nextSkillIds));
  }

  function handleAgentDraftChange(agentId, field, value) {
    setAgentDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[agentId] || {
        agentRunnerId: "",
        skillIds: [],
        mcpServerIds: [],
        name: "",
        agentSdk: DEFAULT_AGENT_SDK,
        model: "",
        modelReasoningLevel: "",
      };

      const nextDraft = {
        ...currentDraft,
        [field]: value,
      };

      if (field === "agentSdk" && !isAvailableAgentSdk(nextDraft.agentSdk)) {
        nextDraft.agentSdk = DEFAULT_AGENT_SDK;
      }

      if (field === "agentRunnerId") {
        nextDraft.agentRunnerId = String(value || "").trim();
      }
      if (field === "skillIds") {
        nextDraft.skillIds = normalizeUniqueStringList(value);
      }
      if (field === "mcpServerIds") {
        nextDraft.mcpServerIds = normalizeUniqueStringList(value);
      }
      if (field === "model") {
        nextDraft.model = String(value || "").trim();
      }
      if (field === "modelReasoningLevel") {
        nextDraft.modelReasoningLevel = String(value || "").trim();
      }

      if (field === "agentRunnerId" || field === "model" || field === "modelReasoningLevel") {
        const selectedRunnerCodexModels = getRunnerCodexModelEntriesForRunner(
          runnerCodexModelEntriesById,
          nextDraft.agentRunnerId,
        );
        const resolvedSelection = resolveRunnerBackedModelSelection({
          codexModelEntries: selectedRunnerCodexModels,
          requestedModel: nextDraft.model,
          requestedReasoning: nextDraft.modelReasoningLevel,
        });
        nextDraft.model = resolvedSelection.model;
        nextDraft.modelReasoningLevel = resolvedSelection.modelReasoningLevel;
      }

      return {
        ...currentDrafts,
        [agentId]: nextDraft,
      };
    });
  }

  function navigateTo(pageId) {
    setBrowserPath(getPathForPage(pageId));
  }

  function handleOpenAgentSessions(agentId) {
    const resolvedAgentId = String(agentId || "").trim();
    if (!resolvedAgentId) {
      navigateTo("agents");
      return;
    }
    setChatAgentId(resolvedAgentId);
    setChatSessionId("");
    setChatTurns([]);
    setBrowserPath(`/agents/${resolvedAgentId}/chats`);
  }

  const taskLookup = useMemo(() => {
    return tasks.reduce((map, task) => {
      map.set(task.id, task);
      return map;
    }, new Map());
  }, [tasks]);

  const taskCountLabel = useMemo(() => {
    if (tasks.length === 0) {
      return "No tasks yet";
    }
    if (tasks.length === 1) {
      return "1 task";
    }
    return `${tasks.length} tasks`;
  }, [tasks.length]);

  const skillCountLabel = useMemo(() => {
    if (skills.length === 0) {
      return "No skills";
    }
    if (skills.length === 1) {
      return "1 skill";
    }
    return `${skills.length} skills`;
  }, [skills.length]);

  const mcpServerCountLabel = useMemo(() => {
    if (mcpServers.length === 0) {
      return "No MCP servers";
    }
    if (mcpServers.length === 1) {
      return "1 MCP server";
    }
    return `${mcpServers.length} MCP servers`;
  }, [mcpServers.length]);

  const runnerCountLabel = useMemo(() => {
    if (agentRunners.length === 0) {
      return "No runners";
    }
    if (agentRunners.length === 1) {
      return "1 runner";
    }
    return `${agentRunners.length} runners`;
  }, [agentRunners.length]);

  const agentCountLabel = useMemo(() => {
    if (agents.length === 0) {
      return "No agents";
    }
    if (agents.length === 1) {
      return "1 agent";
    }
    return `${agents.length} agents`;
  }, [agents.length]);

  const hasReadyRunner = useMemo(() => {
    return agentRunners.some((runner) => normalizeRunnerStatus(runner.status) === "ready");
  }, [agentRunners]);

  const codexVerificationUrl = useMemo(
    () => getCodexAuthVerificationUrl(codexAuthState),
    [codexAuthState],
  );

  const renderTaskLink = useCallback(
    (taskId) => {
      if (taskId == null) {
        return "none";
      }
      const linkedTask = taskLookup.get(taskId);
      if (linkedTask == null) {
        return `#${taskId}`;
      }
      return `#${linkedTask.id} ${linkedTask.name}`;
    },
    [taskLookup],
  );

  return (
    <div className="layout-shell">
      <aside className="side-menu">
        <div className="side-brand">
          <p className="side-overline">Control Plane</p>
          <h2>CompanyHelm</h2>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isDisabled = item.requiresCompany && !selectedCompanyId;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-disabled={isDisabled ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  if (isDisabled) {
                    navigateTo("settings");
                    return;
                  }
                  navigateTo(item.id);
                }}
                className={`nav-link nav-link-${item.tone} ${
                  activePage === item.id ? "nav-link-active" : ""
                } ${isDisabled ? "nav-link-disabled" : ""}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <nav className="side-nav side-nav-profile" aria-label="Profile navigation">
          <a
            href={PROFILE_NAV_ITEM.href}
            onClick={(event) => {
              event.preventDefault();
              navigateTo(PROFILE_NAV_ITEM.id);
            }}
            className={`nav-link nav-link-${PROFILE_NAV_ITEM.tone} ${
              activePage === PROFILE_NAV_ITEM.id ? "nav-link-active" : ""
            }`}
          >
            {PROFILE_NAV_ITEM.label}
          </a>
        </nav>

        {hasCompanies ? (
          <div className="side-status">
            <p>Company: {selectedCompany ? selectedCompany.name : "none"}</p>
            <p>Tasks: {selectedCompanyId ? tasks.length : "n/a"}</p>
            <p>Skills: {selectedCompanyId ? skills.length : "n/a"}</p>
            <p>MCP: {selectedCompanyId ? mcpServers.length : "n/a"}</p>
            <p>Agents: {selectedCompanyId ? agents.length : "n/a"}</p>
            <p>Runners: {selectedCompanyId ? agentRunners.length : "n/a"}</p>
          </div>
        ) : null}
      </aside>

      <main className="page-shell">
        <AppHeader
          hasCompanies={hasCompanies}
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          selectedCompany={selectedCompany}
          isLoadingCompanies={isLoadingCompanies}
          companyError={companyError}
          onCompanyChange={setSelectedCompanyId}
          onOpenSettings={() => navigateTo("settings")}
        />
        <Breadcrumbs items={breadcrumbItems} onNavigate={setBrowserPath} />

        {!selectedCompanyId && activePage !== "settings" && activePage !== "profile" ? (
          <CompanyRequiredPanel hasCompanies={hasCompanies} />
        ) : null}

        {selectedCompanyId && activePage === "dashboard" ? (
          <DashboardPage
            selectedCompanyId={selectedCompanyId}
            tasks={tasks}
            agentRunners={agentRunners}
            agents={agents}
            chatAgentId={chatAgentId}
            codexAuthState={codexAuthState}
            isLoadingCodexAuthState={isLoadingCodexAuthState}
            isStartingCodexAuth={isStartingCodexAuth}
            codexVerificationUrl={codexVerificationUrl}
            codexAuthCopyFeedback={codexAuthCopyFeedback}
            isLoadingTasks={isLoadingTasks}
            isLoadingRunners={isLoadingRunners}
            taskError={taskError}
            runnerError={runnerError}
            onStartCodexDeviceAuth={handleStartCodexDeviceAuth}
            onCopyDeviceCode={handleCopyDeviceCode}
            onNavigate={navigateTo}
          />
        ) : null}

        {selectedCompanyId && activePage === "tasks" ? (
          <TasksPage
            selectedCompanyId={selectedCompanyId}
            tasks={tasks}
            isLoadingTasks={isLoadingTasks}
            taskError={taskError}
            isSubmittingTask={isSubmittingTask}
            savingTaskId={savingTaskId}
            deletingTaskId={deletingTaskId}
            name={name}
            description={description}
            parentTaskId={parentTaskId}
            dependsOnTaskId={dependsOnTaskId}
            relationshipDrafts={relationshipDrafts}
            taskCountLabel={taskCountLabel}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onParentTaskChange={setParentTaskId}
            onDependsOnTaskChange={setDependsOnTaskId}
            onCreateTask={handleCreateTask}
            onDraftChange={handleDraftChange}
            onSaveRelationships={handleRelationshipSave}
            onDeleteTask={handleDeleteTask}
            renderTaskLink={renderTaskLink}
          />
        ) : null}

        {selectedCompanyId && activePage === "skills" ? (
          <SkillsPage
            selectedCompanyId={selectedCompanyId}
            skills={skills}
            isLoadingSkills={isLoadingSkills}
            skillError={skillError}
            isCreatingSkill={isCreatingSkill}
            savingSkillId={savingSkillId}
            deletingSkillId={deletingSkillId}
            skillName={skillName}
            skillType={skillType}
            skillSkillsMpPackageName={skillSkillsMpPackageName}
            skillDescription={skillDescription}
            skillInstructions={skillInstructions}
            skillDrafts={skillDrafts}
            skillCountLabel={skillCountLabel}
            onSkillNameChange={setSkillName}
            onSkillTypeChange={(value) => setSkillType(normalizeSkillType(value))}
            onSkillSkillsMpPackageNameChange={setSkillSkillsMpPackageName}
            onSkillDescriptionChange={setSkillDescription}
            onSkillInstructionsChange={setSkillInstructions}
            onCreateSkill={handleCreateSkill}
            onSkillDraftChange={handleSkillDraftChange}
            onSaveSkill={handleSaveSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        ) : null}

        {selectedCompanyId && activePage === "mcp-servers" ? (
          <McpServersPage
            selectedCompanyId={selectedCompanyId}
            mcpServers={mcpServers}
            isLoadingMcpServers={isLoadingMcpServers}
            mcpServerError={mcpServerError}
            isCreatingMcpServer={isCreatingMcpServer}
            savingMcpServerId={savingMcpServerId}
            deletingMcpServerId={deletingMcpServerId}
            mcpServerName={mcpServerName}
            mcpServerTransportType={mcpServerTransportType}
            mcpServerUrl={mcpServerUrl}
            mcpServerCommand={mcpServerCommand}
            mcpServerArgsText={mcpServerArgsText}
            mcpServerEnvVarsText={mcpServerEnvVarsText}
            mcpServerAuthType={mcpServerAuthType}
            mcpServerBearerToken={mcpServerBearerToken}
            mcpServerCustomHeadersText={mcpServerCustomHeadersText}
            mcpServerEnabled={mcpServerEnabled}
            mcpServerDrafts={mcpServerDrafts}
            mcpServerCountLabel={mcpServerCountLabel}
            onMcpServerNameChange={setMcpServerName}
            onMcpServerTransportTypeChange={(value) =>
              setMcpServerTransportType(normalizeMcpTransportType(value))
            }
            onMcpServerUrlChange={setMcpServerUrl}
            onMcpServerCommandChange={setMcpServerCommand}
            onMcpServerArgsTextChange={setMcpServerArgsText}
            onMcpServerEnvVarsTextChange={setMcpServerEnvVarsText}
            onMcpServerAuthTypeChange={(value) => setMcpServerAuthType(normalizeMcpAuthType(value))}
            onMcpServerBearerTokenChange={setMcpServerBearerToken}
            onMcpServerCustomHeadersTextChange={setMcpServerCustomHeadersText}
            onMcpServerEnabledChange={setMcpServerEnabled}
            onCreateMcpServer={handleCreateMcpServer}
            onMcpServerDraftChange={handleMcpServerDraftChange}
            onSaveMcpServer={handleSaveMcpServer}
            onDeleteMcpServer={handleDeleteMcpServer}
          />
        ) : null}

        {selectedCompanyId && activePage === "agent-runner" ? (
          <AgentRunnerPage
            selectedCompanyId={selectedCompanyId}
            agentRunners={agentRunners}
            agents={agents}
            isLoadingRunners={isLoadingRunners}
            runnerError={runnerError}
            codexAuthError={codexAuthError}
            isStartingCodexAuth={isStartingCodexAuth}
            isCreatingRunner={isCreatingRunner}
            runnerIdDraft={runnerIdDraft}
            runnerSecretDraft={runnerSecretDraft}
            runnerGrpcTarget={DEFAULT_RUNNER_GRPC_TARGET}
            runnerSecretsById={runnerSecretsById}
            regeneratingRunnerId={regeneratingRunnerId}
            deletingRunnerId={deletingRunnerId}
            runnerCountLabel={runnerCountLabel}
            onRunnerIdChange={setRunnerIdDraft}
            onRunnerSecretChange={setRunnerSecretDraft}
            onRunnerCommandSecretChange={(runnerId, value) =>
              setRunnerSecretsById((currentSecrets) => ({
                ...currentSecrets,
                [runnerId]: value,
              }))
            }
            onCreateRunner={handleCreateRunner}
            onStartRunnerCodexDeviceAuth={handleStartRunnerCodexDeviceAuth}
            onNavigate={navigateTo}
            onRegenerateRunnerSecret={handleRegenerateRunnerSecret}
            onDeleteRunner={handleDeleteRunner}
          />
        ) : null}

        {selectedCompanyId && activePage === "chats" ? (
          chatSessionId ? (
            <AgentChatPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
              session={selectedChatSession}
              chatTurns={chatTurns}
              isLoadingChat={isLoadingChat}
              chatError={chatError}
              chatDraftMessage={chatDraftMessage}
              isSendingChatMessage={isSendingChatMessage}
              onChatDraftMessageChange={setChatDraftMessage}
              onBackToChats={() => {
                setChatSessionId("");
                setChatTurns([]);
                loadChatSessionIndexByAgent({ silently: true });
              }}
              onSendChatMessage={handleSendChatMessage}
            />
          ) : (
            <ChatsOverviewPage
              selectedCompanyId={selectedCompanyId}
              agents={agents}
              chatSessionsByAgent={chatSessionsByAgent}
              isLoadingChatIndex={isLoadingChatIndex}
              chatIndexError={chatIndexError}
              isCreatingChatSession={isCreatingChatSession}
              onRefreshChatLists={() => loadChatSessionIndexByAgent()}
              onCreateChatForAgent={handleCreateChatForAgent}
              onOpenChat={handleOpenChatFromList}
            />
          )
        ) : null}

        {selectedCompanyId && activePage === "agents" ? (
          agentsRoute.view === "chats" ? (
            <AgentChatsPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
              chatSessions={chatSessions}
              isLoadingChatSessions={isLoadingChatSessions}
              isCreatingChatSession={isCreatingChatSession}
              chatError={chatError}
              chatSessionTitleDraft={chatSessionTitleDraft}
              chatSessionRemoteIdDraft={chatSessionRemoteIdDraft}
              onChatSessionTitleDraftChange={setChatSessionTitleDraft}
              onChatSessionRemoteIdDraftChange={setChatSessionRemoteIdDraft}
              onCreateChatSession={handleCreateChatSession}
              onOpenChat={(sessionId) => {
                if (!chatAgentId || !sessionId) {
                  return;
                }
                setBrowserPath(`/agents/${chatAgentId}/chats/${sessionId}`);
              }}
              onBackToAgents={() => {
                navigateTo("agents");
              }}
            />
          ) : agentsRoute.view === "chat" ? (
            <AgentChatPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
              session={selectedChatSession}
              chatTurns={chatTurns}
              isLoadingChat={isLoadingChat}
              chatError={chatError}
              chatDraftMessage={chatDraftMessage}
              isSendingChatMessage={isSendingChatMessage}
              onChatDraftMessageChange={setChatDraftMessage}
              onBackToChats={() => {
                if (!chatAgentId) {
                  navigateTo("agents");
                  return;
                }
                setBrowserPath(`/agents/${chatAgentId}/chats`);
              }}
              onSendChatMessage={handleSendChatMessage}
            />
          ) : (
            <AgentsPage
              selectedCompanyId={selectedCompanyId}
              agents={agents}
              skills={skills}
              mcpServers={mcpServers}
              agentRunners={agentRunners}
              agentRunnerLookup={agentRunnerLookup}
              runnerCodexModelEntriesById={runnerCodexModelEntriesById}
              isLoadingAgents={isLoadingAgents}
              agentError={agentError}
              isCreatingAgent={isCreatingAgent}
              savingAgentId={savingAgentId}
              deletingAgentId={deletingAgentId}
              initializingAgentId={initializingAgentId}
              retryingAgentSkillInstallKey={retryingAgentSkillInstallKey}
              canInitializeAgents={hasReadyRunner}
              agentRunnerId={agentRunnerId}
              agentSkillIds={agentSkillIds}
              agentMcpServerIds={agentMcpServerIds}
              agentName={agentName}
              agentSdk={agentSdk}
              agentModel={agentModel}
              agentModelReasoningLevel={agentModelReasoningLevel}
              agentDrafts={agentDrafts}
              agentCountLabel={agentCountLabel}
              onAgentRunnerChange={handleCreateAgentRunnerChange}
              onAgentSkillIdsChange={handleCreateAgentSkillIdsChange}
              onAgentMcpServerIdsChange={setAgentMcpServerIds}
              onAgentNameChange={setAgentName}
              onAgentSdkChange={handleCreateAgentSdkChange}
              onAgentModelChange={handleCreateAgentModelChange}
              onAgentModelReasoningLevelChange={handleCreateAgentReasoningLevelChange}
              onCreateAgent={handleCreateAgent}
              onAgentDraftChange={handleAgentDraftChange}
              onSaveAgent={handleSaveAgent}
              onInitializeAgent={handleInitializeAgent}
              onRetryAgentSkillInstall={handleRetryAgentSkillInstall}
              onOpenAgentSessions={handleOpenAgentSessions}
              onDeleteAgent={handleDeleteAgent}
            />
          )
        ) : null}

        {activePage === "settings" ? (
          <SettingsPage
            hasCompanies={hasCompanies}
            selectedCompanyId={selectedCompanyId}
            selectedCompany={selectedCompany}
            companyError={companyError}
            githubInstallations={githubInstallations}
            githubRepositories={githubRepositories}
            isLoadingGithubInstallations={isLoadingGithubInstallations}
            isLoadingGithubRepositories={isLoadingGithubRepositories}
            githubInstallationError={githubInstallationError}
            githubInstallationNotice={githubInstallationNotice}
            isAddingGithubInstallationFromCallback={isAddingGithubInstallationFromCallback}
            pendingGithubInstallCallback={pendingGithubInstallCallback}
            deletingGithubInstallationId={deletingGithubInstallationId}
            refreshingGithubInstallationId={refreshingGithubInstallationId}
            newCompanyName={newCompanyName}
            isCreatingCompany={isCreatingCompany}
            isDeletingCompany={isDeletingCompany}
            onNewCompanyNameChange={setNewCompanyName}
            onCreateCompany={handleCreateCompany}
            onDeleteCompany={handleDeleteCompany}
            onDeleteGithubInstallation={handleDeleteGithubInstallation}
            onRefreshGithubInstallationRepositories={handleRefreshGithubInstallationRepositories}
          />
        ) : null}

        {activePage === "profile" ? (
          <ProfilePage
            selectedCompany={selectedCompany}
            tasks={tasks}
            skills={skills}
            agents={agents}
            agentRunners={agentRunners}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
