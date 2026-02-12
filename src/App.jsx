import { useEffect, useMemo, useState } from "react";

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

const CREATE_TASK_MUTATION = `
  mutation CreateTask($name: String!, $description: String) {
    createTask(name: $name, description: $description) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadTasks() {
    try {
      setError("");
      const data = await executeGraphQL(LIST_TASKS_QUERY);
      setTasks(data.tasks || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

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
      });

      const result = data.createTask;
      if (!result.ok) {
        throw new Error(result.error || "Task creation failed.");
      }

      setName("");
      setDescription("");
      await loadTasks();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
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
                    <em>{task.parentTaskId != null ? task.parentTaskId : "none"}</em>
                  </span>
                  <span>
                    depends on:{" "}
                    <em>
                      {task.dependsOnTaskId != null ? task.dependsOnTaskId : "none"}
                    </em>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

export default App;
