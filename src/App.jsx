import { useCallback, useEffect, useMemo, useState } from "react";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";
const SELECTED_COMPANY_STORAGE_KEY = "companyhelm.selectedCompanyId";
const DEFAULT_RUNNER_GRPC_TARGET =
  import.meta.env.VITE_AGENT_RUNNER_GRPC_TARGET || "localhost:50051";

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
      callbackUrl
      hasAuthSecret
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
    $callbackUrl: String
    $authSecret: String
  ) {
    createAgentRunner(
      companyId: $companyId
      id: $id
      callbackUrl: $callbackUrl
      authSecret: $authSecret
    ) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
        id
        companyId
        callbackUrl
        hasAuthSecret
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
  if (PAGE_IDS.has(parsed)) {
    return parsed;
  }
  return NAV_ITEMS[0].id;
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
      agentSdk: agent.agentSdk || "",
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
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message =
      payload?.errors?.[0]?.message || `GraphQL request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.data;
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
  isLoadingTasks,
  isLoadingRunners,
  taskError,
  runnerError,
  onRefreshTasks,
  onRefreshRunners,
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
  isLoadingRunners,
  runnerError,
  isCreatingRunner,
  runnerIdDraft,
  runnerCallbackUrlDraft,
  runnerSecretDraft,
  runnerGrpcTarget,
  runnerSecretsById,
  deletingRunnerId,
  runnerCountLabel,
  onRunnerIdChange,
  onRunnerCallbackUrlChange,
  onRunnerSecretChange,
  onRunnerCommandSecretChange,
  onCreateRunner,
  onRefreshRunners,
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
          Track callback endpoints, status signals, and heartbeat timestamps for each runner.
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
                const runnerCommand = buildRunnerStartCommand({
                  backendGrpcTarget: runnerGrpcTarget,
                  runnerSecret: runnerSecret || "<RUNNER_SECRET>",
                });
                return (
                  <li key={runner.id} className="runner-card">
                    <div className="runner-card-top">
                      <code className="runner-id">{runner.id}</code>
                      <span className={`runner-status runner-status-${runnerStatus}`}>
                        {runnerStatus}
                      </span>
                    </div>
                    <p className="runner-url">
                      {runner.callbackUrl || "No callback URL configured."}
                    </p>
                    <p className="runner-last-seen">
                      Last seen: <em>{formatTimestamp(runner.lastSeenAt)}</em>
                    </p>
                    <p className="runner-last-seen">
                      Last health check: <em>{formatTimestamp(runner.lastHealthCheckAt)}</em>
                    </p>
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
                        className="danger-btn"
                        onClick={() => onDeleteRunner(runner.id)}
                        disabled={deletingRunnerId === runner.id}
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

          <label htmlFor="runner-callback-url">Callback URL (optional)</label>
          <input
            id="runner-callback-url"
            name="callbackUrl"
            placeholder="e.g. http://127.0.0.1:9100"
            value={runnerCallbackUrlDraft}
            onChange={(event) => onRunnerCallbackUrlChange(event.target.value)}
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
  onDeleteAgent,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const skillLookup = useMemo(() => {
    return skills.reduce((map, skill) => {
      map.set(skill.id, skill);
      return map;
    }, new Map());
  }, [skills]);

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
                        value={agentDrafts[agent.id]?.agentRunnerId ?? ""}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentRunnerId", event.target.value)
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
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
                        value={agentDrafts[agent.id]?.name ?? ""}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "name", event.target.value)
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
                      />

                      <label className="relationship-field" htmlFor={`agent-sdk-${agent.id}`}>
                        SDK
                      </label>
                      <input
                        id={`agent-sdk-${agent.id}`}
                        value={agentDrafts[agent.id]?.agentSdk ?? ""}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "agentSdk", event.target.value)
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
                      />

                      <label className="relationship-field" htmlFor={`agent-model-${agent.id}`}>
                        Model
                      </label>
                      <input
                        id={`agent-model-${agent.id}`}
                        value={agentDrafts[agent.id]?.model ?? ""}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "model", event.target.value)
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
                      />

                      <label className="relationship-field" htmlFor={`agent-reasoning-${agent.id}`}>
                        Reasoning
                      </label>
                      <input
                        id={`agent-reasoning-${agent.id}`}
                        value={agentDrafts[agent.id]?.modelReasoningLevel ?? ""}
                        onChange={(event) =>
                          onAgentDraftChange(agent.id, "modelReasoningLevel", event.target.value)
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
                      />

                      <label className="relationship-field" htmlFor={`agent-skills-${agent.id}`}>
                        Skills
                      </label>
                      <select
                        id={`agent-skills-${agent.id}`}
                        className="multi-select-input"
                        multiple
                        size={Math.min(6, Math.max(3, skills.length || 3))}
                        value={agentDrafts[agent.id]?.skillIds ?? []}
                        onChange={(event) =>
                          onAgentDraftChange(
                            agent.id,
                            "skillIds",
                            getSelectedMultiValues(event.target),
                          )
                        }
                        disabled={savingAgentId === agent.id || deletingAgentId === agent.id}
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
          <input
            id="agent-sdk"
            name="agentSdk"
            placeholder="e.g. codex, claude-code"
            value={agentSdk}
            onChange={(event) => onAgentSdkChange(event.target.value)}
            required
          />

          <label htmlFor="agent-model">Model</label>
          <input
            id="agent-model"
            name="model"
            placeholder="e.g. gpt-5"
            value={agentModel}
            onChange={(event) => onAgentModelChange(event.target.value)}
            required
          />

          <label htmlFor="agent-reasoning-level">Model reasoning level</label>
          <input
            id="agent-reasoning-level"
            name="modelReasoningLevel"
            placeholder="e.g. low, medium, high"
            value={agentModelReasoningLevel}
            onChange={(event) => onAgentModelReasoningLevelChange(event.target.value)}
            required
          />

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
  const [isCreatingRunner, setIsCreatingRunner] = useState(false);
  const [runnerIdDraft, setRunnerIdDraft] = useState("");
  const [runnerCallbackUrlDraft, setRunnerCallbackUrlDraft] = useState("");
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
  const [agentSdk, setAgentSdk] = useState("");
  const [agentModel, setAgentModel] = useState("");
  const [agentModelReasoningLevel, setAgentModelReasoningLevel] = useState("");
  const [agentDrafts, setAgentDrafts] = useState({});
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

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    persistCompanyId(selectedCompanyId);
  }, [selectedCompanyId]);

  useEffect(() => {
    setAgentRunnerId("");
    setAgentSkillIds([]);
    setRunnerIdDraft("");
    setRunnerCallbackUrlDraft("");
    setRunnerSecretDraft("");
    setRunnerSecretsById({});
    setSkillName("");
    setSkillDescription("");
    setSkillInstructions("");
  }, [selectedCompanyId]);

  useEffect(() => {
    loadTasks();
    loadSkills();
    loadAgentRunners();
    loadAgents();
  }, [loadAgentRunners, loadAgents, loadSkills, loadTasks, selectedCompanyId]);

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = `#${NAV_ITEMS[0].id}`;
    }

    const handleHashChange = () => {
      setActivePage(getPageFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
        callbackUrl: runnerCallbackUrlDraft.trim() || null,
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
      setRunnerCallbackUrlDraft("");
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
    if (!agentSdk.trim() || !agentModel.trim() || !agentModelReasoningLevel.trim()) {
      setAgentError("agentSdk, model, and modelReasoningLevel are required.");
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
        agentSdk: agentSdk.trim(),
        model: agentModel.trim(),
        modelReasoningLevel: agentModelReasoningLevel.trim(),
      });
      const result = data.createAgent;
      if (!result.ok) {
        throw new Error(result.error || "Agent creation failed.");
      }
      setAgentName("");
      setAgentRunnerId("");
      setAgentSkillIds([]);
      setAgentSdk("");
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
      agentSdk: "",
      model: "",
      modelReasoningLevel: "",
    };
    if (
      !draft.name.trim() ||
      !draft.agentSdk.trim() ||
      !draft.model.trim() ||
      !draft.modelReasoningLevel.trim()
    ) {
      setAgentError("All agent fields are required to save.");
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
        agentSdk: draft.agentSdk.trim(),
        model: draft.model.trim(),
        modelReasoningLevel: draft.modelReasoningLevel.trim(),
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

  function handleAgentDraftChange(agentId, field, value) {
    setAgentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [agentId]: {
        ...(currentDrafts[agentId] || {
          agentRunnerId: "",
          skillIds: [],
          name: "",
          agentSdk: "",
          model: "",
          modelReasoningLevel: "",
        }),
        [field]: value,
      },
    }));
  }

  function navigateTo(pageId) {
    window.location.hash = `#${pageId}`;
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
            isLoadingTasks={isLoadingTasks}
            isLoadingRunners={isLoadingRunners}
            taskError={taskError}
            runnerError={runnerError}
            onRefreshTasks={loadTasks}
            onRefreshRunners={() => loadAgentRunners()}
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
            isLoadingRunners={isLoadingRunners}
            runnerError={runnerError}
            isCreatingRunner={isCreatingRunner}
            runnerIdDraft={runnerIdDraft}
            runnerCallbackUrlDraft={runnerCallbackUrlDraft}
            runnerSecretDraft={runnerSecretDraft}
            runnerGrpcTarget={DEFAULT_RUNNER_GRPC_TARGET}
            runnerSecretsById={runnerSecretsById}
            deletingRunnerId={deletingRunnerId}
            runnerCountLabel={runnerCountLabel}
            onRunnerIdChange={setRunnerIdDraft}
            onRunnerCallbackUrlChange={setRunnerCallbackUrlDraft}
            onRunnerSecretChange={setRunnerSecretDraft}
            onRunnerCommandSecretChange={(runnerId, value) =>
              setRunnerSecretsById((currentSecrets) => ({
                ...currentSecrets,
                [runnerId]: value,
              }))
            }
            onCreateRunner={handleCreateRunner}
            onRefreshRunners={() => loadAgentRunners()}
            onDeleteRunner={handleDeleteRunner}
          />
        ) : null}

        {selectedCompanyId && activePage === "agents" ? (
          <AgentsPage
            selectedCompanyId={selectedCompanyId}
            agents={agents}
            skills={skills}
            agentRunners={agentRunners}
            agentRunnerLookup={agentRunnerLookup}
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
            onAgentRunnerChange={setAgentRunnerId}
            onAgentSkillIdsChange={setAgentSkillIds}
            onAgentNameChange={setAgentName}
            onAgentSdkChange={setAgentSdk}
            onAgentModelChange={setAgentModel}
            onAgentModelReasoningLevelChange={setAgentModelReasoningLevel}
            onCreateAgent={handleCreateAgent}
            onRefreshAgents={loadAgents}
            onAgentDraftChange={handleAgentDraftChange}
            onSaveAgent={handleSaveAgent}
            onInitializeAgent={handleInitializeAgent}
            onDeleteAgent={handleDeleteAgent}
          />
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
