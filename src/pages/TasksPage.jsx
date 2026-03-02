import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

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
  dependencyTaskIds,
  relationshipDrafts,
  taskCountLabel,
  onNameChange,
  onDescriptionChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onDraftChange,
  onSaveRelationships,
  onDeleteTask,
  renderTaskLink,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");

  function openEditTaskModal(taskId) {
    setEditingTaskId(taskId);
  }

  async function handleCreateTaskSubmit(event) {
    const didCreate = await onCreateTask(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  async function handleSaveTaskDependencies(taskId) {
    const didSave = await onSaveRelationships(taskId);
    if (didSave) {
      setEditingTaskId("");
    }
  }

  const pageActions = useMemo(() => (
    <>
      <span className="chat-card-meta">{taskCountLabel}</span>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Create task"
        title="Create task"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), [taskCountLabel]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">

      <section className="panel list-panel">

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
          <ul className="chat-card-list">
            {tasks.map((task) => {
              const isBusy = savingTaskId === task.id || deletingTaskId === task.id;
              return (
                <li
                  key={task.id}
                  className="chat-card"
                  onClick={() => openEditTaskModal(task.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEditTaskModal(task.id);
                  }}
                >
                  <div className="chat-card-content">
                    <strong>{task.name}</strong>
                    <span className="chat-card-meta">
                      {task.description || "No description provided."}
                      {Array.isArray(task.dependencyTaskIds) && task.dependencyTaskIds.length > 0
                        ? (
                          <>
                            {" "}
                            &middot; depends on: {task.dependencyTaskIds.map(renderTaskLink).join(", ")}
                          </>
                        )
                        : null}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="chat-card-icon-btn"
                    aria-label="Delete task"
                    title="Delete task"
                    disabled={isBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id, task.name);
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {tasks.length > 0 ? (
        <section className="panel list-panel">
          <h3>Dependency map</h3>
          <ul className="chat-card-list">
            {tasks.map((task) => {
              const dependencyTaskIdsForTask = Array.isArray(task.dependencyTaskIds)
                ? task.dependencyTaskIds
                : [];
              return (
                <li key={`task-map-${task.id}`} className="chat-card">
                  <div className="chat-card-content">
                    <strong>{task.name}</strong>
                    <span className="chat-card-meta">#{task.id}</span>
                  </div>
                  <span className="chat-card-meta">
                    {dependencyTaskIdsForTask.length === 0
                      ? "Independent task"
                      : dependencyTaskIdsForTask
                          .map((dependencyTaskId) => `\u2192 ${renderTaskLink(dependencyTaskId)}`)
                          .join("  ")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

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

          <label htmlFor="task-dependency">Dependencies</label>
          <select
            id="task-dependency"
            name="dependencyTaskIds"
            multiple
            value={Array.isArray(dependencyTaskIds) ? dependencyTaskIds : []}
            onChange={(event) =>
              onDependencyTaskIdsChange(
                Array.from(event.target.selectedOptions).map((option) => option.value),
              )
            }
          >
            {tasks.map((task) => (
              <option key={`create-dependency-${task.id}`} value={String(task.id)}>
                #{task.id} {task.name}
              </option>
            ))}
          </select>
          <p className="chat-card-meta">Select one or more tasks this task depends on.</p>

          <button type="submit" disabled={isSubmittingTask}>
            {isSubmittingTask ? "Creating..." : "Create task"}
          </button>
        </form>
      </CreationModal>

      {editingTaskId ? (() => {
        const editTask = tasks.find((t) => t.id === editingTaskId);
        const editDraft = relationshipDrafts[editingTaskId];
        if (!editTask) return null;
        return (
          <CreationModal
            modalId="edit-task-modal"
            title="Edit task"
            description="Update task relationships."
            isOpen={!!editingTaskId}
            onClose={() => setEditingTaskId("")}
          >
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <span className="chat-settings-label">Name</span>
                <p className="chat-settings-input">{editTask.name}</p>
              </div>

              <div className="chat-settings-field">
                <span className="chat-settings-label">Description</span>
                <p className="chat-settings-input">
                  {editTask.description || "No description provided."}
                </p>
              </div>

              <div className="chat-settings-field">
                <label className="chat-settings-label" htmlFor="edit-dependency-tasks">
                  Dependencies
                </label>
                <select
                  id="edit-dependency-tasks"
                  className="chat-settings-input"
                  multiple
                  value={Array.isArray(editDraft?.dependencyTaskIds) ? editDraft.dependencyTaskIds : []}
                  onChange={(e) =>
                    onDraftChange(
                      editingTaskId,
                      "dependencyTaskIds",
                      Array.from(e.target.selectedOptions).map((option) => option.value),
                    )
                  }
                >
                  {tasks
                    .filter((t) => t.id !== editingTaskId)
                    .map((t) => (
                      <option key={`edit-depends-${t.id}`} value={String(t.id)}>
                        #{t.id} {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="chat-settings-field">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => void handleSaveTaskDependencies(editingTaskId)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingTaskId("")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </CreationModal>
        );
      })() : null}
    </div></Page>
  );
}
