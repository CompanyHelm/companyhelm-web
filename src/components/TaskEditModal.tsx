import { useState } from "react";
import { CreationModal } from "./CreationModal.tsx";

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
}: any) {
  const [commentDraft, setCommentDraft] = useState<any>("");

  if (!task) {
    return null;
  }

  const taskId = task.id;
  const currentChildTaskIds = tasks
    .filter((candidateTask: any) => String(candidateTask?.parentTaskId || "").trim() === taskId)
    .map((candidateTask: any) => String(candidateTask?.id || "").trim())
    .filter(Boolean);
  const draft = relationshipDraft || {
    dependencyTaskIds: Array.isArray(task?.dependencyTaskIds) ? task.dependencyTaskIds : [],
    parentTaskId: String(task?.parentTaskId || "").trim(),
    childTaskIds: currentChildTaskIds,
  };
  const selectedChildTaskIds = Array.isArray(draft?.childTaskIds) ? draft.childTaskIds : [];
  const draftDependencyTaskIds = Array.isArray(draft?.dependencyTaskIds) ? draft.dependencyTaskIds : [];
  const parentTaskId = String(draft?.parentTaskId || "").trim();
  const isBusy = savingTaskId === taskId || deletingTaskId === taskId;

  function removeDependency(depId: any) {
    onDraftChange(taskId, "dependencyTaskIds", draftDependencyTaskIds.filter((id: any) => id !== depId));
  }
  function addDependency(depId: any) {
    if (depId && !draftDependencyTaskIds.includes(depId)) {
      onDraftChange(taskId, "dependencyTaskIds", [...draftDependencyTaskIds, depId]);
    }
  }
  function removeChild(childId: any) {
    onDraftChange(taskId, "childTaskIds", selectedChildTaskIds.filter((id: any) => id !== childId));
  }
  function addChild(childId: any) {
    if (childId && !selectedChildTaskIds.includes(childId)) {
      onDraftChange(taskId, "childTaskIds", [...selectedChildTaskIds, childId]);
    }
  }

  const availableParentOptions = tasks.filter(
    (t: any) => t.id !== taskId && !selectedChildTaskIds.includes(t.id),
  );
  const availableChildOptions = tasks.filter(
    (t: any) => t.id !== taskId && t.id !== parentTaskId && !selectedChildTaskIds.includes(t.id),
  );
  const availableDependencyOptions = tasks.filter(
    (t: any) => t.id !== taskId && !draftDependencyTaskIds.includes(t.id),
  );

  async function handleSave() {
    const didSave = await onSaveRelationships(taskId);
    if (didSave) {
      onClose();
    }
  }

  async function handleCommentSubmit(event: any) {
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
      description="Update parent/child links, dependencies, and comments."
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

        <label htmlFor="edit-parent-task">Parent task</label>
        <div className="task-parent-row">
          <select
            id="edit-parent-task"
            value={parentTaskId}
            onChange={(event: any) => onDraftChange(taskId, "parentTaskId", event.target.value)}
          >
            <option value="">No parent task</option>
            {availableParentOptions.map((t: any) => (
              <option key={`edit-parent-${t.id}`} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
          {parentTaskId && (
            <button
              type="button"
              className="task-parent-clear"
              onClick={() => onDraftChange(taskId, "parentTaskId", "")}
            >
              Remove
            </button>
          )}
        </div>

        <label>Child tasks</label>
        {selectedChildTaskIds.length > 0 && (
          <div className="task-relation-pills">
            {selectedChildTaskIds.map((childId: any) => {
              const childTask = tasks.find((t: any) => t.id === childId);
              return (
                <span key={childId} className="task-relation-pill">
                  <span>{childTask?.name || childId}</span>
                  <button
                    type="button"
                    className="task-relation-pill-remove"
                    onClick={() => removeChild(childId)}
                    aria-label={`Remove child ${childTask?.name || childId}`}
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        <select
          className="task-relation-add"
          value=""
          onChange={(e: any) => addChild(e.target.value)}
        >
          <option value="">Add child task…</option>
          {availableChildOptions.map((t: any) => (
            <option key={`edit-child-${t.id}`} value={String(t.id)}>{t.name}</option>
          ))}
        </select>

        <label>Dependencies</label>
        {draftDependencyTaskIds.length > 0 && (
          <div className="task-relation-pills">
            {draftDependencyTaskIds.map((depId: any) => {
              const depTask = tasks.find((t: any) => t.id === depId);
              return (
                <span key={depId} className="task-relation-pill">
                  <span>{depTask?.name || depId}</span>
                  <button
                    type="button"
                    className="task-relation-pill-remove"
                    onClick={() => removeDependency(depId)}
                    aria-label={`Remove dependency ${depTask?.name || depId}`}
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        <select
          className="task-relation-add"
          value=""
          onChange={(e: any) => addDependency(e.target.value)}
        >
          <option value="">Add dependency…</option>
          {availableDependencyOptions.map((t: any) => (
            <option key={`edit-depends-${t.id}`} value={String(t.id)}>{t.name}</option>
          ))}
        </select>

        <label>Comments</label>
        {Array.isArray(task.comments) && task.comments.length > 0 ? (
          <ul className="task-comments-list">
            {task.comments.map((comment: any) => (
              <li key={`task-comment-${comment.id}`} className="task-comment-item">
                <p>{comment.comment}</p>
                <span className="chat-card-meta">
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
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
            onChange={(event: any) => setCommentDraft(event.target.value)}
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
