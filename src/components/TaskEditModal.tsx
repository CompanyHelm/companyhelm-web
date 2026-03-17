import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { CreationModal } from "./CreationModal.tsx";
import type { TaskItem, TaskRelationshipDraft } from "../types/domain.ts";

interface TaskEditModalProps {
  task: TaskItem | null;
  tasks: TaskItem[];
  agents: Array<{
    id: string;
    name: string;
  }>;
  actors: Array<{
    id: string;
    kind: "agent" | "user";
    displayName: string;
    agentId?: string | null;
  }>;
  taskCategories?: Array<{
    id: string;
    name: string;
  }>;
  relationshipDraft?: TaskRelationshipDraft;
  savingTaskId: string | null;
  commentingTaskId: string | null;
  deletingTaskId: string | null;
  onDraftChange: (
    taskId: string,
    field: "dependencyTaskIds" | "parentTaskId" | "childTaskIds" | "assigneeActorId" | "status" | "category",
    value: string | string[],
  ) => void;
  onSaveRelationships: (taskId: string) => Promise<boolean> | boolean;
  onExecuteTask: (taskId: string, agentId: string) => Promise<boolean> | boolean;
  onCreateTaskComment: (taskId: string, comment: string) => Promise<boolean> | boolean;
  onDeleteTask: (taskId: string, taskName: string) => void;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  onClose: () => void;
}

export function TaskEditModal({
  task,
  tasks,
  agents,
  actors,
  taskCategories = [],
  relationshipDraft,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  onDraftChange,
  onSaveRelationships,
  onExecuteTask,
  onCreateTaskComment,
  onDeleteTask,
  onOpenTaskThread,
  onClose,
}: TaskEditModalProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [selectedExecuteAgentId, setSelectedExecuteAgentId] = useState("");

  const taskId = task?.id || "";

  useEffect(() => {
    setCommentDraft("");
    setSelectedExecuteAgentId("");
  }, [taskId]);

  if (!task) {
    return null;
  }
  const taskName = task.name;
  const currentChildTaskIds = tasks
    .filter((candidateTask) => String(candidateTask.parentTaskId || "").trim() === taskId)
    .map((candidateTask) => String(candidateTask.id || "").trim())
    .filter(Boolean);
  const draft = relationshipDraft || {
    dependencyTaskIds: Array.isArray(task?.dependencyTaskIds) ? task.dependencyTaskIds : [],
    parentTaskId: String(task?.parentTaskId || "").trim(),
    childTaskIds: currentChildTaskIds,
    assigneeActorId: String(task?.assigneeActorId || "").trim(),
    status: String(task?.status || "").trim() || "draft",
    category: String(task?.category || "").trim(),
  };
  const selectedChildTaskIds = Array.isArray(draft?.childTaskIds) ? draft.childTaskIds : [];
  const draftDependencyTaskIds = Array.isArray(draft?.dependencyTaskIds) ? draft.dependencyTaskIds : [];
  const parentTaskId = String(draft?.parentTaskId || "").trim();
  const assigneeActorId = String(draft?.assigneeActorId || "").trim();
  const status = String(draft?.status || "").trim() || "draft";
  const category = String(draft?.category || "").trim();
  const taskThreadId = String(task?.threadId || "").trim();
  const isBusy = savingTaskId === taskId || deletingTaskId === taskId;
  const currentAssigneeActorId = String(task?.assigneeActorId || "").trim();
  const currentAssigneeAgentId = String(task?.assigneeAgentId || "").trim();
  const draftAssigneeAgentId = String(
    actors.find((actor) => actor.id === assigneeActorId && actor.kind === "agent")?.agentId || "",
  ).trim();
  const derivedExecuteAgentId = selectedExecuteAgentId.trim()
    || draftAssigneeAgentId
    || (assigneeActorId === currentAssigneeActorId ? currentAssigneeAgentId : "");
  const normalizedCurrentDependencyTaskIds = [...(Array.isArray(task?.dependencyTaskIds) ? task.dependencyTaskIds : [])]
    .map((value) => String(value).trim())
    .filter(Boolean)
    .sort();
  const normalizedDraftDependencyTaskIds = [...draftDependencyTaskIds]
    .map((value) => String(value).trim())
    .filter(Boolean)
    .sort();
  const normalizedCurrentChildTaskIds = [...currentChildTaskIds].sort();
  const normalizedDraftChildTaskIds = [...selectedChildTaskIds]
    .map((value) => String(value).trim())
    .filter(Boolean)
    .sort();
  const hasDraftChanges = JSON.stringify(normalizedCurrentDependencyTaskIds) !== JSON.stringify(normalizedDraftDependencyTaskIds)
    || parentTaskId !== String(task?.parentTaskId || "").trim()
    || JSON.stringify(normalizedCurrentChildTaskIds) !== JSON.stringify(normalizedDraftChildTaskIds)
    || assigneeActorId !== currentAssigneeActorId
    || status !== (String(task?.status || "").trim() || "draft")
    || category !== String(task?.category || "").trim();

  function removeDependency(depId: string) {
    onDraftChange(taskId, "dependencyTaskIds", draftDependencyTaskIds.filter((id) => id !== depId));
  }
  function addDependency(depId: string) {
    if (depId && !draftDependencyTaskIds.includes(depId)) {
      onDraftChange(taskId, "dependencyTaskIds", [...draftDependencyTaskIds, depId]);
    }
  }
  function removeChild(childId: string) {
    onDraftChange(taskId, "childTaskIds", selectedChildTaskIds.filter((id) => id !== childId));
  }
  function addChild(childId: string) {
    if (childId && !selectedChildTaskIds.includes(childId)) {
      onDraftChange(taskId, "childTaskIds", [...selectedChildTaskIds, childId]);
    }
  }

  const availableParentOptions = tasks.filter(
    (candidateTask) => candidateTask.id !== taskId && !selectedChildTaskIds.includes(candidateTask.id),
  );
  const availableChildOptions = tasks.filter(
    (candidateTask) =>
      candidateTask.id !== taskId
      && candidateTask.id !== parentTaskId
      && !selectedChildTaskIds.includes(candidateTask.id),
  );
  const availableDependencyOptions = tasks.filter(
    (candidateTask) => candidateTask.id !== taskId && !draftDependencyTaskIds.includes(candidateTask.id),
  );

  async function handleSave() {
    const didSave = await onSaveRelationships(taskId);
    if (didSave) {
      onClose();
    }
  }

  async function handleExecute() {
    if (isBusy || taskThreadId || !derivedExecuteAgentId) {
      return;
    }

    if (hasDraftChanges) {
      const didSave = await onSaveRelationships(taskId);
      if (!didSave) {
        return;
      }
    }

    await onExecuteTask(taskId, derivedExecuteAgentId);
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const didCreate = await onCreateTaskComment(taskId, commentDraft);
    if (didCreate) {
      setCommentDraft("");
    }
  }

  function handleDelete() {
    onDeleteTask(taskId, taskName || "Untitled task");
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

        <label htmlFor="edit-task-assignee">Assignee</label>
        <select
          id="edit-task-assignee"
          value={assigneeActorId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onDraftChange(taskId, "assigneeActorId", event.target.value)}
        >
          <option value="">Unassigned</option>
          {actors.map((actor) => (
            <option key={`edit-assignee-${actor.id}`} value={actor.id}>
              {actor.displayName} ({actor.kind === "agent" ? "Agent" : "Human"})
            </option>
          ))}
        </select>

        <label htmlFor="edit-task-status">Status</label>
        <select
          id="edit-task-status"
          value={status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onDraftChange(taskId, "status", event.target.value)}
        >
          <option value="draft">draft</option>
          <option value="pending">pending</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
        </select>

        <label htmlFor="edit-task-category">Category</label>
        <select
          id="edit-task-category"
          value={category}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onDraftChange(taskId, "category", event.target.value)}
        >
          <option value="">Uncategorized</option>
          {taskCategories.map((taskCategory) => (
            <option key={`edit-category-${taskCategory.id}`} value={taskCategory.name}>
              {taskCategory.name}
            </option>
          ))}
        </select>

        <label>Thread</label>
        {taskThreadId ? (
          <div className="task-thread-row">
            <button
              type="button"
              className="task-thread-open-btn"
              onClick={() => void onOpenTaskThread(taskThreadId)}
            >
              Open thread chat
            </button>
          </div>
        ) : (
          <p className="chat-card-meta">Thread not present.</p>
        )}

        {!taskThreadId ? (
          <>
            <label htmlFor="edit-task-execute-agent">Execute with agent</label>
            <select
              id="edit-task-execute-agent"
              value={selectedExecuteAgentId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedExecuteAgentId(event.target.value)}
            >
              <option value="">
                {draftAssigneeAgentId || (assigneeActorId === currentAssigneeActorId && currentAssigneeAgentId)
                  ? "Use assigned agent"
                  : "Select agent"}
              </option>
              {agents.map((agent) => (
                <option key={`edit-execute-agent-${agent.id}`} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <p className="chat-card-meta">Uses the assigned agent by default. Choose another agent to override it.</p>
          </>
        ) : null}

        <label htmlFor="edit-parent-task">Parent task</label>
        <div className="task-parent-row">
          <select
            id="edit-parent-task"
            value={parentTaskId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onDraftChange(taskId, "parentTaskId", event.target.value)}
          >
            <option value="">No parent task</option>
            {availableParentOptions.map((candidateTask) => (
              <option key={`edit-parent-${candidateTask.id}`} value={String(candidateTask.id)}>{candidateTask.name}</option>
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
            {selectedChildTaskIds.map((childId) => {
              const childTask = tasks.find((candidateTask) => candidateTask.id === childId);
              return (
                <span key={childId} className="task-relation-pill">
                  <span>{childTask?.name || "Untitled task"}</span>
                  <button
                    type="button"
                    className="task-relation-pill-remove"
                    onClick={() => removeChild(childId)}
                    aria-label={`Remove child ${childTask?.name || "Untitled task"}`}
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        <select
          className="task-relation-add"
          value=""
          onChange={(event: ChangeEvent<HTMLSelectElement>) => addChild(event.target.value)}
        >
          <option value="">Add child task…</option>
          {availableChildOptions.map((candidateTask) => (
            <option key={`edit-child-${candidateTask.id}`} value={String(candidateTask.id)}>{candidateTask.name}</option>
          ))}
        </select>

        <label>Dependencies</label>
        {draftDependencyTaskIds.length > 0 && (
          <div className="task-relation-pills">
            {draftDependencyTaskIds.map((depId) => {
              const depTask = tasks.find((candidateTask) => candidateTask.id === depId);
              return (
                <span key={depId} className="task-relation-pill">
                  <span>{depTask?.name || "Untitled task"}</span>
                  <button
                    type="button"
                    className="task-relation-pill-remove"
                    onClick={() => removeDependency(depId)}
                    aria-label={`Remove dependency ${depTask?.name || "Untitled task"}`}
                  >×</button>
                </span>
              );
            })}
          </div>
        )}
        <select
          className="task-relation-add"
          value=""
          onChange={(event: ChangeEvent<HTMLSelectElement>) => addDependency(event.target.value)}
        >
          <option value="">Add dependency…</option>
          {availableDependencyOptions.map((candidateTask) => (
            <option key={`edit-depends-${candidateTask.id}`} value={String(candidateTask.id)}>{candidateTask.name}</option>
          ))}
        </select>

        <label>Comments</label>
        {Array.isArray(task.comments) && task.comments.length > 0 ? (
          <ul className="task-comments-list">
            {task.comments.map((comment) => (
              <li key={`task-comment-${comment.id}`} className="task-comment-item">
                <p>{comment.comment}</p>
                <span className="chat-card-meta">
                  {String(comment.authorActor?.displayName || "").trim() || "Unknown actor"} · {" "}
                  {comment.authorActor?.kind === "agent" ? "Agent" : "Human"} · {" "}
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
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setCommentDraft(event.target.value)}
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
            disabled={isBusy || Boolean(taskThreadId) || !derivedExecuteAgentId}
            onClick={() => void handleExecute()}
            title={taskThreadId
              ? "Task already has a linked execution thread."
              : !derivedExecuteAgentId
                ? "Select an agent above or assign the task to an agent."
                : ""}
          >
            {savingTaskId === taskId && hasDraftChanges ? "Saving..." : hasDraftChanges ? "Save & Execute" : "Execute task"}
          </button>
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
