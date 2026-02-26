import { useState } from "react";
import { CreationModal } from "../components/CreationModal.jsx";

export function TasksPage({
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
