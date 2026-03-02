import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";
import { buildTaskDependencyLanes } from "../utils/task-graph.js";

export function TasksPage({
  selectedCompanyId,
  tasks,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  commentingTaskId,
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
  onCreateTaskComment,
  onDeleteTask,
  renderTaskLink,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  function openEditTaskModal(taskId) {
    setEditingTaskId(taskId);
    setCommentDraft("");
  }

  function closeEditTaskModal() {
    setEditingTaskId("");
    setCommentDraft("");
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
      closeEditTaskModal();
    }
  }

  async function handleCreateTaskCommentSubmit(event) {
    event.preventDefault();
    if (!editingTaskId) {
      return;
    }
    const didCreateComment = await onCreateTaskComment(editingTaskId, commentDraft);
    if (didCreateComment) {
      setCommentDraft("");
    }
  }

  const dependencyLanes = useMemo(() => buildTaskDependencyLanes(tasks), [tasks]);

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
                      {Array.isArray(task.comments) && task.comments.length > 0
                        ? (
                          <>
                            {" "}
                            &middot; {task.comments.length} comment{task.comments.length === 1 ? "" : "s"}
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
          <div className="task-lane-header">
            <h3>Dependency lanes</h3>
            <span className="chat-card-meta">
              Left to right shows prerequisite flow for all tasks.
            </span>
          </div>
          <div className="task-lane-board">
            {dependencyLanes.map((lane) => (
              <section key={`task-lane-${lane.level}`} className="task-lane-column">
                <header className="task-lane-column-header">
                  <strong>{lane.title}</strong>
                  <span className="chat-card-meta">{lane.tasks.length} task{lane.tasks.length === 1 ? "" : "s"}</span>
                </header>
                <ul className="task-lane-list">
                  {lane.tasks.map((task) => (
                    <li key={`task-lane-node-${task.id}`} className="task-lane-card">
                      <button
                        type="button"
                        className="task-lane-open-btn"
                        onClick={() => openEditTaskModal(task.id)}
                      >
                        <span className="task-lane-title-row">
                          <strong>{task.name}</strong>
                          <span className={`task-status-pill task-status-pill-${task.status}`}>
                            {task.status}
                          </span>
                        </span>
                        <span className="task-lane-meta">#{task.id}</span>
                        <span className="task-lane-meta">
                          {task.dependencyTaskIds.length === 0
                            ? "No blockers"
                            : `Depends on ${task.dependencyTaskIds.length} task${task.dependencyTaskIds.length === 1 ? "" : "s"}`}
                        </span>
                        <span className="task-lane-meta">
                          {task.dependentTaskIds.length === 0
                            ? "Terminal item"
                            : `Unblocks ${task.dependentTaskIds.length} task${task.dependentTaskIds.length === 1 ? "" : "s"}`}
                        </span>
                        <span className="task-lane-meta">
                          {task.commentCount === 0
                            ? "No comments"
                            : `${task.commentCount} comment${task.commentCount === 1 ? "" : "s"}`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
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
            description="Update task dependencies and comments."
            isOpen={!!editingTaskId}
            onClose={closeEditTaskModal}
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
                <span className="chat-settings-label">Comments</span>
                {Array.isArray(editTask.comments) && editTask.comments.length > 0 ? (
                  <ul className="task-comments-list">
                    {editTask.comments.map((comment) => (
                      <li key={`task-comment-${comment.id}`} className="task-comment-item">
                        <p>{comment.comment}</p>
                        <span className="chat-card-meta">
                          {comment.authorPrincipalId ? `Author ${comment.authorPrincipalId}` : "Unknown author"}
                          {comment.createdAt ? ` \u00b7 ${new Date(comment.createdAt).toLocaleString()}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="chat-settings-input">No comments yet.</p>
                )}
              </div>

              <form className="task-comment-form" onSubmit={handleCreateTaskCommentSubmit}>
                <label className="chat-settings-label" htmlFor="task-comment-draft">
                  Add comment
                </label>
                <textarea
                  id="task-comment-draft"
                  className="chat-settings-input"
                  rows={3}
                  placeholder="Document context, blockers, or handoff notes."
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />
                <button
                  type="submit"
                  className="secondary-btn"
                  disabled={commentingTaskId === editingTaskId || !commentDraft.trim()}
                >
                  {commentingTaskId === editingTaskId ? "Adding comment..." : "Add comment"}
                </button>
              </form>

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
                  onClick={closeEditTaskModal}
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
