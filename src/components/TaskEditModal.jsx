import { useState } from "react";
import { CreationModal } from "./CreationModal.jsx";

export function TaskEditModal({
  task,
  tasks,
  relationshipDraft,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  onDraftChange,
  onSaveRelationships,
  onCreateTaskComment,
  onDeleteTask,
  onClose,
}) {
  const [commentDraft, setCommentDraft] = useState("");

  if (!task) {
    return null;
  }

  const taskId = task.id;
  const isBusy = savingTaskId === taskId || deletingTaskId === taskId;

  async function handleSave() {
    const didSave = await onSaveRelationships(taskId);
    if (didSave) {
      onClose();
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    const didCreate = await onCreateTaskComment(taskId, commentDraft);
    if (didCreate) {
      setCommentDraft("");
    }
  }

  function handleDelete() {
    onDeleteTask(taskId, task.name);
  }

  return (
    <CreationModal
      modalId="edit-task-modal"
      title="Edit task"
      description="Update task dependencies and comments."
      isOpen
      onClose={onClose}
    >
      <div className="task-form">
        <label htmlFor="edit-task-name">Name</label>
        <input
          id="edit-task-name"
          value={task.name}
          readOnly
          className="task-form-readonly"
        />

        <label htmlFor="edit-task-description">Description</label>
        <textarea
          id="edit-task-description"
          rows={3}
          value={task.description || ""}
          readOnly
          className="task-form-readonly"
          placeholder="No description provided."
        />

        <label htmlFor="edit-dependency-tasks">Dependencies</label>
        <select
          id="edit-dependency-tasks"
          multiple
          value={Array.isArray(relationshipDraft?.dependencyTaskIds) ? relationshipDraft.dependencyTaskIds : []}
          onChange={(e) =>
            onDraftChange(
              taskId,
              "dependencyTaskIds",
              Array.from(e.target.selectedOptions).map((option) => option.value),
            )
          }
        >
          {tasks
            .filter((t) => t.id !== taskId)
            .map((t) => (
              <option key={`edit-depends-${t.id}`} value={String(t.id)}>
                #{t.id} {t.name}
              </option>
            ))}
        </select>

        <label>Comments</label>
        {Array.isArray(task.comments) && task.comments.length > 0 ? (
          <ul className="task-comments-list">
            {task.comments.map((comment) => (
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
          <p className="chat-card-meta">No comments yet.</p>
        )}

        <form className="task-comment-form" onSubmit={handleCommentSubmit}>
          <label htmlFor="task-comment-draft">Add comment</label>
          <textarea
            id="task-comment-draft"
            rows={3}
            placeholder="Document context, blockers, or handoff notes."
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
          />
          <button
            type="submit"
            className="secondary-btn"
            disabled={commentingTaskId === taskId || !commentDraft.trim()}
          >
            {commentingTaskId === taskId ? "Adding comment..." : "Add comment"}
          </button>
        </form>

        <div className="task-form-actions">
          <button
            type="button"
            className="secondary-btn"
            disabled={isBusy}
            onClick={handleSave}
          >
            {savingTaskId === taskId ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="danger-btn"
            disabled={isBusy}
            onClick={handleDelete}
          >
            {deletingTaskId === taskId ? "Deleting..." : "Delete task"}
          </button>
        </div>
      </div>
    </CreationModal>
  );
}
