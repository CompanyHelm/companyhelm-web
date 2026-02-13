import { useCallback, useEffect, useMemo, useState } from "react";

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "/graphql";

const LIST_TASKS_QUERY = `
  query ListTasks {
    tasks {
      id
      name
      description
      parentTaskId
      dependsOnTaskId
    }
  }
`;

const LIST_AGENT_RUNNERS_QUERY = `
  query ListAgentRunners {
    agentRunners {
      id
      callbackUrl
      status
      lastHealthCheckAt
      lastSeenAt
    }
  }
`;

const CREATE_TASK_MUTATION = `
  mutation CreateTask(
    $name: String!
    $description: String
    $parentTaskId: Int
    $dependsOnTaskId: Int
  ) {
    createTask(
      name: $name
      description: $description
      parentTaskId: $parentTaskId
      dependsOnTaskId: $dependsOnTaskId
    ) {
      ok
      error
      task {
        id
        name
        description
        parentTaskId
        dependsOnTaskId
      }
    }
  }
`;

const UPDATE_TASK_MUTATION = `
  mutation UpdateTask($id: Int!, $parentTaskId: Int, $dependsOnTaskId: Int) {
    updateTask(id: $id, parentTaskId: $parentTaskId, dependsOnTaskId: $dependsOnTaskId) {
      ok
      error
      task {
        id
        name
        description
        parentTaskId
        dependsOnTaskId
      }
    }
  }
`;

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "#dashboard", tone: "mint" },
  { id: "tasks", label: "Tasks", href: "#tasks", tone: "sand" },
  { id: "agent-runner", label: "Agent Runner", href: "#agent-runner", tone: "sky" },
];

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

function getPageFromHash() {
  const parsed = window.location.hash.replace("#", "").toLowerCase();
  if (PAGE_IDS.has(parsed)) {
    return parsed;
  }
  return NAV_ITEMS[0].id;
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

function normalizeRunnerStatus(value) {
  return value === "ready" ? "ready" : "disconnected";
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

function DashboardPage({
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
  tasks,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
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
  renderTaskLink,
}) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Task Management</p>
        <h1>Task page</h1>
        <p className="subcopy">
          Create tasks, update dependency links, and keep planning relationships in sync.
        </p>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Create task</h2>
        </header>
        <form className="task-form" onSubmit={onCreateTask}>
          <label htmlFor="task-name">Name</label>
          <input
            id="task-name"
            name="name"
            placeholder="e.g. Build API docs"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
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
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Tasks</h2>
          <div className="task-meta">
            <span>{taskCountLabel}</span>
            <button type="button" className="secondary-btn" onClick={onRefreshTasks}>
              Refresh
            </button>
          </div>
        </header>

        {taskError ? <p className="error-banner">{taskError}</p> : null}
        {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}
        {!isLoadingTasks && tasks.length === 0 ? (
          <p className="empty-hint">Create your first task to populate this board.</p>
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
                      disabled={savingTaskId === task.id}
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
                      disabled={savingTaskId === task.id}
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
                  <button
                    type="button"
                    className="secondary-btn relationship-save-btn"
                    onClick={() => onSaveRelationships(task.id)}
                    disabled={savingTaskId === task.id}
                  >
                    {savingTaskId === task.id ? "Saving links..." : "Save links"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function AgentRunnerPage({
  agentRunners,
  isLoadingRunners,
  runnerError,
  runnerCountLabel,
  onRefreshRunners,
}) {
  const readyRunnerCount = useMemo(() => {
    return agentRunners.filter((runner) => normalizeRunnerStatus(runner.status) === "ready")
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - readyRunnerCount;
  }, [agentRunners.length, readyRunnerCount]);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Infrastructure</p>
        <h1>Agent runner page</h1>
        <p className="subcopy">
          Track callback endpoints, status signals, and heartbeat timestamps for each runner.
        </p>
      </section>

      <section className="runner-summary-grid">
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
          <button type="button" className="secondary-btn" onClick={onRefreshRunners}>
            Refresh
          </button>
        </header>

        {runnerError ? <p className="error-banner">{runnerError}</p> : null}
        {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
        {!isLoadingRunners && agentRunners.length === 0 ? (
          <p className="empty-hint">No agent runners registered yet.</p>
        ) : null}

        {agentRunners.length > 0 ? (
          <ul className="runner-list">
            {[...agentRunners]
              .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
              .map((runner) => {
                const runnerStatus = normalizeRunnerStatus(runner.status);
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
                  </li>
                );
              })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState(() => getPageFromHash());
  const [tasks, setTasks] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingRunners, setIsLoadingRunners] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [runnerError, setRunnerError] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [relationshipDrafts, setRelationshipDrafts] = useState({});

  const loadTasks = useCallback(async () => {
    try {
      setTaskError("");
      const data = await executeGraphQL(LIST_TASKS_QUERY);
      const nextTasks = data.tasks || [];
      setTasks(nextTasks);
      setRelationshipDrafts(createRelationshipDrafts(nextTasks));
    } catch (loadError) {
      setTaskError(loadError.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const loadAgentRunners = useCallback(async ({ silently = false } = {}) => {
    try {
      if (!silently) {
        setRunnerError("");
        setIsLoadingRunners(true);
      }
      const data = await executeGraphQL(LIST_AGENT_RUNNERS_QUERY);
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
  }, []);

  useEffect(() => {
    loadTasks();
    loadAgentRunners();
  }, [loadAgentRunners, loadTasks]);

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
    const pollId = window.setInterval(() => {
      loadAgentRunners({ silently: true });
    }, 10000);
    return () => window.clearInterval(pollId);
  }, [loadAgentRunners]);

  async function handleCreateTask(event) {
    event.preventDefault();
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const data = await executeGraphQL(CREATE_TASK_MUTATION, {
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
    } catch (submitError) {
      setTaskError(submitError.message);
    } finally {
      setIsSubmittingTask(false);
    }
  }

  async function handleRelationshipSave(taskId) {
    const draft = relationshipDrafts[taskId] || {
      parentTaskId: "",
      dependsOnTaskId: "",
    };

    try {
      setSavingTaskId(taskId);
      setTaskError("");

      const data = await executeGraphQL(UPDATE_TASK_MUTATION, {
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

  function handleDraftChange(taskId, field, value) {
    setRelationshipDrafts((currentDrafts) => ({
      ...currentDrafts,
      [taskId]: {
        ...(currentDrafts[taskId] || { parentTaskId: "", dependsOnTaskId: "" }),
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

  const runnerCountLabel = useMemo(() => {
    if (agentRunners.length === 0) {
      return "No runners";
    }
    if (agentRunners.length === 1) {
      return "1 runner";
    }
    return `${agentRunners.length} runners`;
  }, [agentRunners.length]);

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
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-link nav-link-${item.tone} ${
                activePage === item.id ? "nav-link-active" : ""
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="side-status">
          <p>Tasks: {tasks.length}</p>
          <p>Runners: {agentRunners.length}</p>
        </div>
      </aside>

      <main className="page-shell">
        {activePage === "dashboard" ? (
          <DashboardPage
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

        {activePage === "tasks" ? (
          <TasksPage
            tasks={tasks}
            isLoadingTasks={isLoadingTasks}
            taskError={taskError}
            isSubmittingTask={isSubmittingTask}
            savingTaskId={savingTaskId}
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
            renderTaskLink={renderTaskLink}
          />
        ) : null}

        {activePage === "agent-runner" ? (
          <AgentRunnerPage
            agentRunners={agentRunners}
            isLoadingRunners={isLoadingRunners}
            runnerError={runnerError}
            runnerCountLabel={runnerCountLabel}
            onRefreshRunners={() => loadAgentRunners()}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;
