import { useCallback, useEffect, useMemo, useState } from "react";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";
const SELECTED_COMPANY_STORAGE_KEY = "companyhelm.selectedCompanyId";
const DEFAULT_RUNNER_GRPC_TARGET =
  import.meta.env.VITE_AGENT_RUNNER_GRPC_TARGET || "localhost:50051";
const CODEX_DEVICE_AUTH_URL = "https://auth.openai.com/codex/device";
const AVAILABLE_AGENT_SDKS = ["codex"];
const DEFAULT_AGENT_SDK = AVAILABLE_AGENT_SDKS[0];

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

const LIST_AGENT_RUNNERS_QUERY_LEGACY = `
  query ListAgentRunners($companyId: String!) {
    agentRunners(companyId: $companyId) {
      id
      companyId
      hasAuthSecret
      codexAuthenticated
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

const CREATE_AGENT_RUNNER_MUTATION_LEGACY = `
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

const REGENERATE_AGENT_RUNNER_SECRET_MUTATION_LEGACY = `
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
      description
      instructions
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
    $name: String!
    $agentSdk: String!
    $model: String!
    $modelReasoningLevel: String!
  ) {
    createAgent(
      companyId: $companyId
      agentRunnerId: $agentRunnerId
      skillIds: $skillIds
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
    $description: String!
    $instructions: String!
  ) {
    createSkill(
      companyId: $companyId
      name: $name
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        companyId
        name
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
    $description: String!
    $instructions: String!
  ) {
    updateSkill(
      companyId: $companyId
      id: $id
      name: $name
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        companyId
        name
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

const INITIALIZE_AGENT_MUTATION = `
  mutation InitializeAgentRunner($companyId: String!, $runnerId: String!, $agentId: String!) {
    initializeAgentRunner(companyId: $companyId, runnerId: $runnerId, agentId: $agentId) {
      ok
      error
      commandId
      runnerId
      agentId
    }
  }
`;

const LIST_AGENT_CHAT_MESSAGES_QUERY = `
  query ListAgentChatMessages(
    $companyId: String!
    $agentId: String!
    $sessionId: String
    $limit: Int
  ) {
    agentChatMessages(
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
      role
      content
      status
      commandId
      error
      createdAt
      updatedAt
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
    href: "#dashboard",
    tone: "mint",
    requiresCompany: true,
  },
  { id: "tasks", label: "Tasks", href: "#tasks", tone: "sand", requiresCompany: true },
  { id: "skills", label: "Skills", href: "#skills", tone: "sand", requiresCompany: true },
  {
    id: "agent-runner",
    label: "Agent Runner",
    href: "#agent-runner",
    tone: "sky",
    requiresCompany: true,
  },
  { id: "agents", label: "Agents", href: "#agents", tone: "coral", requiresCompany: true },
  {
    id: "settings",
    label: "Settings",
    href: "#settings",
    tone: "slate",
    requiresCompany: false,
  },
];

const PROFILE_NAV_ITEM = {
  id: "profile",
  label: "Profile",
  href: "#profile",
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

function getSelectedMultiValues(selectElement) {
  return Array.from(selectElement.selectedOptions, (option) => option.value);
}

function getPageFromHash() {
  const parsed = window.location.hash.replace("#", "").toLowerCase();
  const [pageId] = parsed.split("/").filter(Boolean);
  if (pageId && PAGE_IDS.has(pageId)) {
    return pageId;
  }
  return NAV_ITEMS[0].id;
}

function getAgentsRouteFromHash() {
  const parsed = window.location.hash.replace("#", "").trim();
  const segments = parsed.split("/").filter(Boolean);
  if (segments[0] !== "agents") {
    return { view: "list", agentId: "", sessionId: "" };
  }

  const agentId = segments[1] || "";
  if (!agentId) {
    return { view: "list", agentId: "", sessionId: "" };
  }

  if (segments[2] !== "sessions") {
    return { view: "list", agentId: "", sessionId: "" };
  }

  const sessionId = segments[3] || "";
  if (sessionId && segments[4] === "chat") {
    return { view: "chat", agentId, sessionId };
  }
  return { view: "sessions", agentId, sessionId: "" };
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
    drafts[skill.id] = {
      name: skill.name || "",
      description: skill.description || "",
      instructions: skill.instructions || "",
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
  const fallbacks = new Map([
    [LIST_AGENT_RUNNERS_QUERY, LIST_AGENT_RUNNERS_QUERY_LEGACY],
    [CREATE_AGENT_RUNNER_MUTATION, CREATE_AGENT_RUNNER_MUTATION_LEGACY],
    [REGENERATE_AGENT_RUNNER_SECRET_MUTATION, REGENERATE_AGENT_RUNNER_SECRET_MUTATION_LEGACY],
  ]);
  const candidateQueries = [query, ...(fallbacks.get(query) ? [fallbacks.get(query)] : [])];

  let lastMessage = "GraphQL request failed.";

  for (let attempt = 0; attempt < candidateQueries.length; attempt += 1) {
    const currentQuery = candidateQueries[attempt];
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: currentQuery, variables }),
    });

    const payload = await response.json();
    if (!response.ok || payload.errors) {
      const message = payload?.errors?.[0]?.message || `GraphQL request failed (${response.status})`;
      const canRetryWithoutCodexModels =
        attempt === 0 &&
        payload?.errors?.some((error) =>
          String(error?.message || "").includes(
            'Cannot query field "codexAvailableModels" on type "AgentRunnerType"',
          ),
        ) &&
        candidateQueries.length > 1;

      if (canRetryWithoutCodexModels) {
        lastMessage = message;
        continue;
      }

      throw new Error(message);
    }

    return payload.data;
  }

  throw new Error(lastMessage);
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
  onRefreshTasks,
  onRefreshRunners,
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
          <button type="button" className="secondary-btn" onClick={onRefreshTasks}>
            Refresh tasks
          </button>
          <button type="button" className="secondary-btn" onClick={onRefreshRunners}>
            Refresh runners
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
                onClick={() => onNavigate("chat")}
              >
                Open chat
              </button>
            </div>
          </header>

          {!authAgent ? (
            <p className="empty-hint">Create a Codex agent, then start device authentication.</p>
          ) : null}

          {authAgent && !authAgentIsCodex ? (
            <p className="empty-hint">
              No Codex agent is selected for chat. Choose a Codex agent in the chat page.
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
  onRefreshTasks,
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
            <button type="button" className="secondary-btn" onClick={onRefreshTasks}>
              Refresh
            </button>
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
  onRefreshRunners,
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
            <button type="button" className="secondary-btn" onClick={onRefreshRunners}>
              Refresh
            </button>
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
  agentRunners,
  agentRunnerLookup,
  runnerCodexModelEntriesById,
  isLoadingAgents,
  agentError,
  isCreatingAgent,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  canInitializeAgents,
  agentRunnerId,
  agentSkillIds,
  agentName,
  agentSdk,
  agentModel,
  agentModelReasoningLevel,
  agentDrafts,
  agentCountLabel,
  onAgentRunnerChange,
  onAgentSkillIdsChange,
  onAgentNameChange,
  onAgentSdkChange,
  onAgentModelChange,
  onAgentModelReasoningLevelChange,
  onCreateAgent,
  onRefreshAgents,
  onAgentDraftChange,
  onSaveAgent,
  onInitializeAgent,
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
  const createRunnerCodexModelEntries = useMemo(() => {
    return getRunnerCodexModelEntriesForRunner(runnerCodexModelEntriesById, agentRunnerId);
  }, [agentRunnerId, runnerCodexModelEntriesById]);
  const createRunnerModelNames = useMemo(() => {
    return getRunnerModelNames(createRunnerCodexModelEntries);
  }, [createRunnerCodexModelEntries]);
  const createRunnerReasoningLevels = useMemo(() => {
    return getRunnerReasoningLevels(createRunnerCodexModelEntries, agentModel);
  }, [agentModel, createRunnerCodexModelEntries]);

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
            <button type="button" className="secondary-btn" onClick={onRefreshAgents}>
              Refresh
            </button>
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
                return skill ? skill.name : skillId;
              });
              const assignedSkillSummary =
                assignedSkillLabels.length > 0 ? assignedSkillLabels.join(", ") : "none";
              const draft = agentDrafts[agent.id] || {
                agentRunnerId: "",
                skillIds: [],
                name: "",
                agentSdk: DEFAULT_AGENT_SDK,
                model: "",
                modelReasoningLevel: "",
              };
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

                      <label className="relationship-field" htmlFor={`agent-skills-${agent.id}`}>
                        Skills
                      </label>
                      <select
                        id={`agent-skills-${agent.id}`}
                        className="multi-select-input"
                        multiple
                        size={Math.min(6, Math.max(3, skills.length || 3))}
                        value={draft.skillIds}
                        onChange={(event) =>
                          onAgentDraftChange(
                            agent.id,
                            "skillIds",
                            getSelectedMultiValues(event.target),
                          )
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {skills.map((skill) => (
                          <option key={`agent-skill-option-${agent.id}-${skill.id}`} value={skill.id}>
                            {skill.name}
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
                        Sessions
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

          <label htmlFor="agent-skill-ids">Assigned skills (optional)</label>
          <select
            id="agent-skill-ids"
            className="multi-select-input"
            name="skillIds"
            multiple
            size={Math.min(6, Math.max(3, skills.length || 3))}
            value={agentSkillIds}
            onChange={(event) => onAgentSkillIdsChange(getSelectedMultiValues(event.target))}
          >
            {skills.map((skill) => (
              <option key={`create-agent-skill-${skill.id}`} value={skill.id}>
                {skill.name}
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
  skillDescription,
  skillInstructions,
  skillDrafts,
  skillCountLabel,
  onSkillNameChange,
  onSkillDescriptionChange,
  onSkillInstructionsChange,
  onCreateSkill,
  onRefreshSkills,
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
            <button type="button" className="secondary-btn" onClick={onRefreshSkills}>
              Refresh
            </button>
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
            {skills.map((skill) => (
              <li key={skill.id} className="task-card">
                <div className="task-card-top">
                  <strong>{skill.name}</strong>
                  <code className="runner-id">{skill.id}</code>
                </div>
                <p className="agent-subcopy">{skill.description}</p>
                <div className="relationship-editor">
                  <div className="skill-edit-grid">
                    <label className="relationship-field" htmlFor={`skill-name-${skill.id}`}>
                      Name
                    </label>
                    <input
                      id={`skill-name-${skill.id}`}
                      value={skillDrafts[skill.id]?.name ?? ""}
                      onChange={(event) =>
                        onSkillDraftChange(skill.id, "name", event.target.value)
                      }
                      disabled={savingSkillId === skill.id || deletingSkillId === skill.id}
                    />

                    <label
                      className="relationship-field"
                      htmlFor={`skill-description-${skill.id}`}
                    >
                      Description
                    </label>
                    <textarea
                      id={`skill-description-${skill.id}`}
                      rows={2}
                      value={skillDrafts[skill.id]?.description ?? ""}
                      onChange={(event) =>
                        onSkillDraftChange(skill.id, "description", event.target.value)
                      }
                      disabled={savingSkillId === skill.id || deletingSkillId === skill.id}
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
                      value={skillDrafts[skill.id]?.instructions ?? ""}
                      onChange={(event) =>
                        onSkillDraftChange(skill.id, "instructions", event.target.value)
                      }
                      disabled={savingSkillId === skill.id || deletingSkillId === skill.id}
                    />
                  </div>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn relationship-save-btn"
                      onClick={() => onSaveSkill(skill.id)}
                      disabled={savingSkillId === skill.id || deletingSkillId === skill.id}
                    >
                      {savingSkillId === skill.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDeleteSkill(skill.id, skill.name)}
                      disabled={savingSkillId === skill.id || deletingSkillId === skill.id}
                    >
                      {deletingSkillId === skill.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
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

          <button type="submit" disabled={isCreatingSkill}>
            {isCreatingSkill ? "Creating..." : "Create skill"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}

function AgentSessionsPage({
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
  onRefreshSessions,
  onCreateChatSession,
  onOpenChat,
  onBackToAgents,
}) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Agent sessions</h1>
        <p className="subcopy">Browse, create, and open chat sessions for a single agent.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <p className="context-pill">
          Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
        </p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={onBackToAgents}>
            Back to agents
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onRefreshSessions}
            disabled={!agent}
          >
            Refresh sessions
          </button>
        </div>
      </section>

      <section className="panel list-panel">
        <header className="panel-header">
          <h2>Sessions</h2>
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && isLoadingChatSessions ? <p className="empty-hint">Loading sessions...</p> : null}
        {agent && !isLoadingChatSessions && chatSessions.length === 0 ? (
          <p className="empty-hint">No sessions yet. Create one below.</p>
        ) : null}
        {agent && chatSessions.length > 0 ? (
          <ul className="task-list">
            {chatSessions.map((session) => (
              <li key={`agent-session-${session.id}`} className="task-card">
                <div className="task-card-top">
                  <strong>{session.title || "Untitled session"}</strong>
                  <code className="runner-id">{session.id}</code>
                </div>
                <p className="agent-subcopy">
                  Updated: <strong>{formatTimestamp(session.updatedAt)}</strong>
                </p>
                {session.remoteSessionId ? (
                  <p className="agent-subcopy">
                    Remote session ID: <strong>{session.remoteSessionId}</strong>
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
          <h2>Create session</h2>
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
          <label htmlFor="chat-session-remote-id">Remote session ID (optional)</label>
          <input
            id="chat-session-remote-id"
            value={chatSessionRemoteIdDraft}
            onChange={(event) => onChatSessionRemoteIdDraftChange(event.target.value)}
            placeholder="Provider thread/session id"
            disabled={!agent || isCreatingChatSession}
          />
          <button type="submit" disabled={!agent || isCreatingChatSession}>
            {isCreatingChatSession ? "Creating..." : "Create session"}
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
  chatMessages,
  isLoadingChat,
  chatError,
  chatDraftMessage,
  isSendingChatMessage,
  onChatDraftMessageChange,
  onRefreshChat,
  onBackToSessions,
  onSendChatMessage,
}) {
  const canChat = Boolean(agent && session);

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

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Agent chat</h1>
        <p className="subcopy">Send new messages to the selected agent session.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <p className="context-pill">
          Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
        </p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={onBackToSessions}>
            Back to sessions
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onRefreshChat}
            disabled={!agent}
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Session</h2>
        </header>
        {session ? (
          <div className="codex-auth-state">
            <p className="codex-auth-row">
              <strong>Title:</strong> {session.title || "Untitled session"}
            </p>
            <p className="codex-auth-row">
              <strong>Session ID:</strong> <code className="runner-id">{session.id}</code>
            </p>
            <p className="codex-auth-row">
              <strong>Remote session ID:</strong> {session.remoteSessionId || "not set"}
            </p>
          </div>
        ) : (
          <p className="empty-hint">Session not found.</p>
        )}
      </section>

      <section className="panel chat-panel">
        <header className="panel-header">
          <h2>Transcript</h2>
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && !session ? <p className="empty-hint">Session not found.</p> : null}
        {canChat && isLoadingChat ? <p className="empty-hint">Loading chat messages...</p> : null}
        {canChat && !isLoadingChat && chatMessages.length === 0 ? (
          <p className="empty-hint">No messages yet. Send the first prompt below.</p>
        ) : null}
        {chatMessages.length > 0 ? (
          <ul className="chat-message-list">
            {chatMessages.map((message) => (
              <li
                key={message.id}
                className={`chat-message-item chat-message-item-${
                  message.role === "human" ? "user" : "assistant"
                }`}
              >
                <div className="chat-message-meta">
                  <strong>{message.role === "human" ? "human" : "llm"}</strong>
                  <span>{message.status}</span>
                  <span>{formatTimestamp(message.createdAt)}</span>
                </div>
                <p className="chat-message-content">{message.content}</p>
                {message.error ? <p className="chat-message-error">{message.error}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

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
  selectedCompany,
  companyError,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
}) {
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
            <h2>Danger zone</h2>
          </header>
          <p className="subcopy">
            Delete the currently selected company and all of its tasks, skills, agents, and runners.
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
  const [activePage, setActivePage] = useState(() => getPageFromHash());
  const [agentsRoute, setAgentsRoute] = useState(() => getAgentsRouteFromHash());
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => getPersistedCompanyId());
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingRunners, setIsLoadingRunners] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [skillError, setSkillError] = useState("");
  const [runnerError, setRunnerError] = useState("");
  const [agentError, setAgentError] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [deletingSkillId, setDeletingSkillId] = useState(null);
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [relationshipDrafts, setRelationshipDrafts] = useState({});
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillInstructions, setSkillInstructions] = useState("");
  const [skillDrafts, setSkillDrafts] = useState({});
  const [agentName, setAgentName] = useState("");
  const [agentRunnerId, setAgentRunnerId] = useState("");
  const [agentSkillIds, setAgentSkillIds] = useState([]);
  const [agentSdk, setAgentSdk] = useState(DEFAULT_AGENT_SDK);
  const [agentModel, setAgentModel] = useState("");
  const [agentModelReasoningLevel, setAgentModelReasoningLevel] = useState("");
  const [agentDrafts, setAgentDrafts] = useState({});
  const [chatAgentId, setChatAgentId] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [chatSessionId, setChatSessionId] = useState("");
  const [chatSessionTitleDraft, setChatSessionTitleDraft] = useState("");
  const [chatSessionRemoteIdDraft, setChatSessionRemoteIdDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraftMessage, setChatDraftMessage] = useState("");
  const [chatError, setChatError] = useState("");
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

  const loadAgentRunners = useCallback(async ({ silently = false } = {}) => {
    if (!selectedCompanyId) {
      setAgentRunners([]);
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
      setAgentRunners(data.agentRunners || []);
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
        setChatSessions(data.agentChatSessions || []);
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

  const loadAgentChatMessages = useCallback(
    async ({ silently = false } = {}) => {
      if (!selectedCompanyId || !chatAgentId || !chatSessionId) {
        setChatMessages([]);
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
        const data = await executeGraphQL(LIST_AGENT_CHAT_MESSAGES_QUERY, {
          companyId: selectedCompanyId,
          agentId: chatAgentId,
          sessionId: chatSessionId,
          limit: 200,
        });
        setChatMessages(data.agentChatMessages || []);
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

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    persistCompanyId(selectedCompanyId);
  }, [selectedCompanyId]);

  useEffect(() => {
    setAgentRunnerId("");
    setAgentSkillIds([]);
    setAgentSdk(DEFAULT_AGENT_SDK);
    setAgentModel("");
    setAgentModelReasoningLevel("");
    setRunnerIdDraft("");
    setRunnerSecretDraft("");
    setRunnerSecretsById({});
    setRegeneratingRunnerId(null);
    setSkillName("");
    setSkillDescription("");
    setSkillInstructions("");
    setChatAgentId("");
    setChatSessions([]);
    setChatSessionId("");
    setChatSessionTitleDraft("");
    setChatSessionRemoteIdDraft("");
    setChatMessages([]);
    setChatDraftMessage("");
    setChatError("");
    setCodexAuthState(null);
    setCodexAuthError("");
    setCodexAuthCopyFeedback("");
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
    loadTasks();
    loadSkills();
    loadAgentRunners();
    loadAgents();
    loadAgentChatSessions();
    loadAgentChatMessages();
    loadCodexAuthState();
  }, [
    loadAgentChatSessions,
    loadAgentChatMessages,
    loadCodexAuthState,
    loadAgentRunners,
    loadAgents,
    loadSkills,
    loadTasks,
    selectedCompanyId,
  ]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setChatAgentId("");
      setChatMessages([]);
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
      setChatSessionId("");
      setChatSessions([]);
      setChatMessages([]);
      return;
    }

    if (activePage === "agents" && agentsRoute.view === "chat" && agentsRoute.sessionId) {
      setChatSessionId(agentsRoute.sessionId);
      return;
    }

    if (activePage === "agents" && agentsRoute.view === "sessions") {
      setChatSessionId("");
      setChatMessages([]);
      return;
    }

    setChatSessionId((currentSessionId) => {
      if (currentSessionId && chatSessions.some((session) => session.id === currentSessionId)) {
        return currentSessionId;
      }
      return chatSessions[0]?.id || "";
    });
  }, [activePage, agentsRoute.sessionId, agentsRoute.view, chatAgentId, chatSessions]);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = `#${NAV_ITEMS[0].id}`;
    }

    const handleHashChange = () => {
      setActivePage(getPageFromHash());
      setAgentsRoute(getAgentsRouteFromHash());
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (activePage !== "agents") {
      return;
    }
    if (agentsRoute.view === "sessions" || agentsRoute.view === "chat") {
      if (agentsRoute.agentId) {
        setChatAgentId(agentsRoute.agentId);
      }
      if (agentsRoute.view === "sessions") {
        setChatSessionId("");
        setChatMessages([]);
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
      window.location.hash = "#settings";
    }
  }, [activePage, isLoadingCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      return undefined;
    }
    const pollId = window.setInterval(() => {
      loadAgentRunners({ silently: true });
    }, 10000);
    return () => window.clearInterval(pollId);
  }, [loadAgentRunners, selectedCompanyId]);

  useEffect(() => {
    const shouldPollChat = activePage === "agents" && agentsRoute.view === "chat";
    const shouldPollSessions =
      activePage === "agents" && (agentsRoute.view === "sessions" || agentsRoute.view === "chat");
    const shouldPollCodexAuth =
      activePage === "dashboard" || (activePage === "agents" && agentsRoute.view === "chat");
    if (!selectedCompanyId || !chatAgentId || (!shouldPollChat && !shouldPollCodexAuth)) {
      return undefined;
    }
    const pollId = window.setInterval(() => {
      if (shouldPollSessions) {
        loadAgentChatSessions({ silently: true });
      }
      if (shouldPollChat) {
        loadAgentChatMessages({ silently: true });
      }
      if (shouldPollCodexAuth) {
        loadCodexAuthState({ silently: true });
      }
    }, 5000);
    return () => window.clearInterval(pollId);
  }, [
    activePage,
    agentsRoute.view,
    chatAgentId,
    loadAgentChatMessages,
    loadAgentChatSessions,
    loadCodexAuthState,
    selectedCompanyId,
  ]);

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
      `Delete company "${selectedCompany.name}"? This will also delete all tasks, skills, agents, and agent runners in that company.`,
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

  async function handleCreateSkill(event) {
    event.preventDefault();
    if (!selectedCompanyId) {
      setSkillError("Select a company before creating skills.");
      return false;
    }
    if (!skillName.trim() || !skillDescription.trim() || !skillInstructions.trim()) {
      setSkillError("Skill name, description, and instructions are required.");
      return false;
    }

    try {
      setIsCreatingSkill(true);
      setSkillError("");
      const data = await executeGraphQL(CREATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        name: skillName.trim(),
        description: skillDescription.trim(),
        instructions: skillInstructions.trim(),
      });
      const result = data.createSkill;
      if (!result.ok) {
        throw new Error(result.error || "Skill creation failed.");
      }
      setSkillName("");
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
      description: "",
      instructions: "",
    };
    if (!draft.name.trim() || !draft.description.trim() || !draft.instructions.trim()) {
      setSkillError("Skill name, description, and instructions are required to save.");
      return;
    }

    try {
      setSavingSkillId(skillId);
      setSkillError("");
      const data = await executeGraphQL(UPDATE_SKILL_MUTATION, {
        companyId: selectedCompanyId,
        id: skillId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        instructions: draft.instructions.trim(),
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
        `Model "${normalizedModel}" is not available on runner ${agentRunnerId}. Refresh runners and try again.`,
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
      const data = await executeGraphQL(CREATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        agentRunnerId: agentRunnerId || null,
        skillIds: agentSkillIds,
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
      const data = await executeGraphQL(UPDATE_AGENT_MUTATION, {
        companyId: selectedCompanyId,
        id: agentId,
        agentRunnerId: draft.agentRunnerId || null,
        skillIds: draft.skillIds || [],
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
    } catch (initializeError) {
      setAgentError(initializeError.message);
    } finally {
      setInitializingAgentId(null);
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
      await loadAgentChatMessages();
    } catch (sendError) {
      setChatError(sendError.message);
    } finally {
      setIsSendingChatMessage(false);
    }
  }

  async function handleCreateChatSession({
    title = null,
    remoteSessionId = null,
    preferredRunnerId = null,
  } = {}) {
    if (!selectedCompanyId) {
      setChatError("Select a company before creating a chat session.");
      return null;
    }
    if (!chatAgentId) {
      setChatError("Select an agent before creating a chat session.");
      return null;
    }

    const selectedAgentForChat = agents.find((agent) => agent.id === chatAgentId) || null;

    try {
      setIsCreatingChatSession(true);
      setChatError("");
      const data = await executeGraphQL(CREATE_AGENT_CHAT_SESSION_MUTATION, {
        companyId: selectedCompanyId,
        agentId: chatAgentId,
        title: title ? title.trim() : null,
        remoteSessionId: remoteSessionId ? remoteSessionId.trim() : null,
        runnerId: preferredRunnerId || selectedAgentForChat?.agentRunnerId || null,
      });
      const result = data.createAgentChatSession;
      if (!result.ok || !result.session) {
        throw new Error(result.error || "Failed to create chat session.");
      }

      setChatSessionTitleDraft("");
      setChatSessionRemoteIdDraft("");
      await loadAgentChatSessions();
      setChatSessionId(result.session.id);
      return result.session.id;
    } catch (createError) {
      setChatError(createError.message);
      return null;
    } finally {
      setIsCreatingChatSession(false);
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
    setSkillDrafts((currentDrafts) => ({
      ...currentDrafts,
      [skillId]: {
        ...(currentDrafts[skillId] || { name: "", description: "", instructions: "" }),
        [field]: value,
      },
    }));
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

  function handleAgentDraftChange(agentId, field, value) {
    setAgentDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[agentId] || {
        agentRunnerId: "",
        skillIds: [],
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
    if (pageId === "chat") {
      if (chatAgentId) {
        window.location.hash = `#agents/${chatAgentId}/sessions`;
      } else {
        window.location.hash = "#agents";
      }
      return;
    }
    window.location.hash = `#${pageId}`;
  }

  function handleOpenAgentSessions(agentId) {
    setChatAgentId(agentId);
    setChatSessionId("");
    setChatMessages([]);
    window.location.hash = `#agents/${agentId}/sessions`;
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
                  if (!isDisabled) {
                    return;
                  }
                  event.preventDefault();
                  navigateTo("settings");
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
            onRefreshTasks={loadTasks}
            onRefreshRunners={() => loadAgentRunners()}
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
            onRefreshTasks={loadTasks}
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
            skillDescription={skillDescription}
            skillInstructions={skillInstructions}
            skillDrafts={skillDrafts}
            skillCountLabel={skillCountLabel}
            onSkillNameChange={setSkillName}
            onSkillDescriptionChange={setSkillDescription}
            onSkillInstructionsChange={setSkillInstructions}
            onCreateSkill={handleCreateSkill}
            onRefreshSkills={loadSkills}
            onSkillDraftChange={handleSkillDraftChange}
            onSaveSkill={handleSaveSkill}
            onDeleteSkill={handleDeleteSkill}
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
            onRefreshRunners={() => loadAgentRunners()}
            onStartRunnerCodexDeviceAuth={handleStartRunnerCodexDeviceAuth}
            onNavigate={navigateTo}
            onRegenerateRunnerSecret={handleRegenerateRunnerSecret}
            onDeleteRunner={handleDeleteRunner}
          />
        ) : null}

        {selectedCompanyId && activePage === "agents" ? (
          agentsRoute.view === "sessions" ? (
            <AgentSessionsPage
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
              onRefreshSessions={() => loadAgentChatSessions()}
              onCreateChatSession={handleCreateChatSession}
              onOpenChat={(sessionId) => {
                if (!chatAgentId || !sessionId) {
                  return;
                }
                window.location.hash = `#agents/${chatAgentId}/sessions/${sessionId}/chat`;
              }}
              onBackToAgents={() => {
                window.location.hash = "#agents";
              }}
            />
          ) : agentsRoute.view === "chat" ? (
            <AgentChatPage
              selectedCompanyId={selectedCompanyId}
              agent={agents.find((agent) => agent.id === chatAgentId) || null}
              session={selectedChatSession}
              chatMessages={chatMessages}
              isLoadingChat={isLoadingChat}
              chatError={chatError}
              chatDraftMessage={chatDraftMessage}
              isSendingChatMessage={isSendingChatMessage}
              onChatDraftMessageChange={setChatDraftMessage}
              onRefreshChat={() => {
                loadAgentChatSessions();
                loadAgentChatMessages();
              }}
              onBackToSessions={() => {
                if (!chatAgentId) {
                  window.location.hash = "#agents";
                  return;
                }
                window.location.hash = `#agents/${chatAgentId}/sessions`;
              }}
              onSendChatMessage={handleSendChatMessage}
            />
          ) : (
            <AgentsPage
              selectedCompanyId={selectedCompanyId}
              agents={agents}
              skills={skills}
              agentRunners={agentRunners}
              agentRunnerLookup={agentRunnerLookup}
              runnerCodexModelEntriesById={runnerCodexModelEntriesById}
              isLoadingAgents={isLoadingAgents}
              agentError={agentError}
              isCreatingAgent={isCreatingAgent}
              savingAgentId={savingAgentId}
              deletingAgentId={deletingAgentId}
              initializingAgentId={initializingAgentId}
              canInitializeAgents={hasReadyRunner}
              agentRunnerId={agentRunnerId}
              agentSkillIds={agentSkillIds}
              agentName={agentName}
              agentSdk={agentSdk}
              agentModel={agentModel}
              agentModelReasoningLevel={agentModelReasoningLevel}
              agentDrafts={agentDrafts}
              agentCountLabel={agentCountLabel}
              onAgentRunnerChange={handleCreateAgentRunnerChange}
              onAgentSkillIdsChange={setAgentSkillIds}
              onAgentNameChange={setAgentName}
              onAgentSdkChange={handleCreateAgentSdkChange}
              onAgentModelChange={handleCreateAgentModelChange}
              onAgentModelReasoningLevelChange={handleCreateAgentReasoningLevelChange}
              onCreateAgent={handleCreateAgent}
              onRefreshAgents={loadAgents}
              onAgentDraftChange={handleAgentDraftChange}
              onSaveAgent={handleSaveAgent}
              onInitializeAgent={handleInitializeAgent}
              onOpenAgentSessions={handleOpenAgentSessions}
              onDeleteAgent={handleDeleteAgent}
            />
          )
        ) : null}

        {activePage === "settings" ? (
          <SettingsPage
            hasCompanies={hasCompanies}
            selectedCompany={selectedCompany}
            companyError={companyError}
            newCompanyName={newCompanyName}
            isCreatingCompany={isCreatingCompany}
            isDeletingCompany={isDeletingCompany}
            onNewCompanyNameChange={setNewCompanyName}
            onCreateCompany={handleCreateCompany}
            onDeleteCompany={handleDeleteCompany}
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
