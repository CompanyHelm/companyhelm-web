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
                      {task.parentTaskId
                        ? <> &middot; parent: {renderTaskLink(task.parentTaskId)}</>
                        : null}
                      {task.dependsOnTaskId
                        ? <> &middot; depends on: {renderTaskLink(task.dependsOnTaskId)}</>
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
                <label className="chat-settings-label" htmlFor="edit-parent-task">
                  Parent task
                </label>
                <select
                  id="edit-parent-task"
                  className="chat-settings-input"
                  value={editDraft?.parentTaskId ?? ""}
                  onChange={(e) =>
                    onDraftChange(editingTaskId, "parentTaskId", e.target.value)
                  }
                >
                  <option value="">None</option>
                  {tasks
                    .filter((t) => t.id !== editingTaskId)
                    .map((t) => (
                      <option key={`edit-parent-${t.id}`} value={String(t.id)}>
                        #{t.id} {t.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="chat-settings-field">
                <label className="chat-settings-label" htmlFor="edit-depends-on-task">
                  Depends on
                </label>
                <select
                  id="edit-depends-on-task"
                  className="chat-settings-input"
                  value={editDraft?.dependsOnTaskId ?? ""}
                  onChange={(e) =>
                    onDraftChange(editingTaskId, "dependsOnTaskId", e.target.value)
                  }
                >
                  <option value="">None</option>
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
                  onClick={() => {
                    onSaveRelationships(editingTaskId);
                    setEditingTaskId("");
                  }}
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
