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

function App() {
  const [tasks, setTasks] = useState([]);
  const [agentRunners, setAgentRunners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRunners, setIsLoadingRunners] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [relationshipDrafts, setRelationshipDrafts] = useState({});

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const data = await executeGraphQL(LIST_TASKS_QUERY);
      const nextTasks = data.tasks || [];
      setTasks(nextTasks);
      setRelationshipDrafts(createRelationshipDrafts(nextTasks));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAgentRunners = useCallback(async ({ silently = false } = {}) => {
    try {
      if (!silently) {
        setError("");
        setIsLoadingRunners(true);
      }
      const data = await executeGraphQL(LIST_AGENT_RUNNERS_QUERY);
      setAgentRunners(data.agentRunners || []);
    } catch (loadError) {
      if (!silently) {
        setError(loadError.message);
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
    const pollId = window.setInterval(() => {
      loadAgentRunners({ silently: true });
    }, 10000);
    return () => window.clearInterval(pollId);
  }, [loadAgentRunners]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
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
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRelationshipSave(taskId) {
    const draft = relationshipDrafts[taskId] || {
      parentTaskId: "",
      dependsOnTaskId: "",
    };

    try {
      setSavingTaskId(taskId);
      setError("");

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
      setError(updateError.message);
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

  const taskLookup = useMemo(() => {
    return tasks.reduce((map, task) => {
      map.set(task.id, task);
      return map;
    }, new Map());
  }, [tasks]);

  function renderTaskLink(taskId) {
    if (taskId == null) {
      return "none";
    }
    const linkedTask = taskLookup.get(taskId);
    if (linkedTask == null) {
      return `#${taskId}`;
    }
    return `#${linkedTask.id} ${linkedTask.name}`;
  }

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

  return (
    <main className="app-shell">
      <div className="ambient-orb" />
      <section className="panel hero-panel">
        <p className="eyebrow">Task Console</p>
        <h1>Plan flow, one task at a time.</h1>
        <p className="subcopy">
          Create tasks through GraphQL and track everything in one list.
        </p>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Create task</h2>
        </header>
        <form className="task-form" onSubmit={handleSubmit}>
          <label htmlFor="task-name">Name</label>
          <input
            id="task-name"
            name="name"
            placeholder="e.g. Build API docs"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            rows={3}
            placeholder="Optional details..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <label htmlFor="task-parent">Parent task</label>
          <select
            id="task-parent"
            name="parentTaskId"
            value={parentTaskId}
            onChange={(event) => setParentTaskId(event.target.value)}
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
            onChange={(event) => setDependsOnTaskId(event.target.value)}
          >
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={`create-dependency-${task.id}`} value={String(task.id)}>
                #{task.id} {task.name}
              </option>
            ))}
          </select>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create task"}
          </button>
        </form>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Tasks</h2>
          <div className="task-meta">
            <span>{taskCountLabel}</span>
            <button type="button" className="secondary-btn" onClick={loadTasks}>
              Refresh
            </button>
          </div>
        </header>

        {error ? <p className="error-banner">{error}</p> : null}
        {isLoading ? <p className="empty-hint">Loading tasks...</p> : null}
        {!isLoading && tasks.length === 0 ? (
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
                    parent:{" "}
                    <em>{renderTaskLink(task.parentTaskId)}</em>
                  </span>
                  <span>
                    depends on:{" "}
                    <em>{renderTaskLink(task.dependsOnTaskId)}</em>
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
                        handleDraftChange(task.id, "parentTaskId", event.target.value)
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
                        handleDraftChange(task.id, "dependsOnTaskId", event.target.value)
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
                    onClick={() => handleRelationshipSave(task.id)}
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

      <section className="panel runner-panel">
        <header className="panel-header panel-header-row">
          <h2>Agent runners</h2>
          <div className="task-meta">
            <span>{runnerCountLabel}</span>
            <button type="button" className="secondary-btn" onClick={() => loadAgentRunners()}>
              Refresh
            </button>
          </div>
        </header>

        {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
        {!isLoadingRunners && agentRunners.length === 0 ? (
          <p className="empty-hint">No agent runners registered yet.</p>
        ) : null}

        {agentRunners.length > 0 ? (
          <ul className="runner-list">
            {agentRunners.map((runner) => {
              const runnerStatus = normalizeRunnerStatus(runner.status);
              return (
                <li key={runner.id} className="runner-card">
                  <div className="runner-card-top">
                    <code className="runner-id">{runner.id}</code>
                    <span className={`runner-status runner-status-${runnerStatus}`}>
                      {runnerStatus}
                    </span>
                  </div>
                  <p className="runner-url">{runner.callbackUrl || "No callback URL configured."}</p>
                  <p className="runner-last-seen">
                    Last seen: <em>{formatTimestamp(runner.lastSeenAt)}</em>
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

export default App;
