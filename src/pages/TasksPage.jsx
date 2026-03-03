import { useCallback, useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";
import { TaskGraphView } from "../components/TaskGraphView.jsx";
import { TaskTableView } from "../components/TaskTableView.jsx";

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
  const [activeTab, setActiveTab] = useState("graph");

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

  const handleTaskClick = useCallback((taskId) => {
    openEditTaskModal(taskId);
  }, []);

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
    <Page className="page-container-full">
      <div className="task-view-fullscreen">
        <div className="task-view-tabs">
          <button
            type="button"
            className={`task-view-tab${activeTab === "graph" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph
          </button>
          <button
            type="button"
            className={`task-view-tab${activeTab === "table" ? " task-view-tab-active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            Table
          </button>
        </div>

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
          <div className="task-view-container">
            {activeTab === "graph" ? (
              <TaskGraphView tasks={tasks} onTaskClick={handleTaskClick} />
            ) : (
              <TaskTableView tasks={tasks} onTaskClick={handleTaskClick} />
            )}
          </div>
        ) : null}
      </div>

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
    </Page>
  );
}
