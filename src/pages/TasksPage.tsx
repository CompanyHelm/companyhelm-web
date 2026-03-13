import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { TaskGraphView } from "../components/TaskGraphView.tsx";
import { TaskTableView } from "../components/TaskTableView.tsx";
import { TaskCreateModal } from "../components/TaskCreateModal.tsx";
import { TaskEditModal } from "../components/TaskEditModal.tsx";
import { buildTaskExecutionPlan } from "../utils/task-execution.ts";
import {
  getDescendantTaskTree,
  getDirectChildTasks,
  getTaskSubtree,
  getTopLevelTasks,
} from "../utils/task-hierarchy.ts";
import type {
  Agent,
  Principal,
  TaskItem,
  TaskRelationshipDraftById,
} from "../types/domain.ts";

type TaskDetailTab = "overview" | "graph" | "table";

interface TasksPageProps {
  tasks: TaskItem[];
  taskOptions: TaskItem[];
  agents: Agent[];
  principals: Principal[];
  isLoadingTasks: boolean;
  taskError: string;
  isSubmittingTask: boolean;
  savingTaskId: string | null;
  commentingTaskId: string | null;
  deletingTaskId: string | null;
  name: string;
  description: string;
  assigneePrincipalId: string;
  status: string;
  parentTaskId: string;
  dependencyTaskIds: string[];
  relationshipDrafts: TaskRelationshipDraftById;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssigneePrincipalIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onParentTaskIdChange: (value: string) => void;
  onDependencyTaskIdsChange: (value: string[]) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onCreateAndExecuteTask: (event: FormEvent<HTMLFormElement>, agentId: string) => Promise<boolean> | boolean;
  onDraftChange: (taskId: string, field: string, value: string | string[]) => void;
  onSaveRelationships: (taskId: string) => Promise<boolean> | boolean;
  onExecuteTask: (taskId: string, agentId: string) => Promise<boolean> | boolean;
  onAddDependency?: (taskId: string, dependencyTaskId: string) => void;
  onCreateTaskComment: (taskId: string, comment: string) => Promise<boolean> | boolean;
  onDeleteTask: (taskId: string, taskName: string) => void;
  onBatchDeleteTasks: (taskIds: string[]) => Promise<boolean> | boolean;
  onBatchExecuteTasks: (taskIds: string[], fallbackAgentId?: string) => Promise<boolean> | boolean;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  activeTaskId: string;
  visibleDepth: string;
  onVisibleDepthChange: (value: string) => void;
  onOpenTask: (taskId: string) => void;
  onBackToTasks: () => void;
}

const DEPTH_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "all"] as const;

function toCountLabel(count: number, singularLabel: string, pluralLabel?: string) {
  if (count === 0) {
    return `No ${pluralLabel || `${singularLabel}s`}`;
  }
  if (count === 1) {
    return `1 ${singularLabel}`;
  }
  return `${count} ${pluralLabel || `${singularLabel}s`}`;
}

export function TasksPage({
  tasks,
  taskOptions,
  agents,
  principals,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  name,
  description,
  assigneePrincipalId,
  status,
  parentTaskId,
  dependencyTaskIds,
  relationshipDrafts,
  onNameChange,
  onDescriptionChange,
  onAssigneePrincipalIdChange,
  onStatusChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onCreateAndExecuteTask,
  onDraftChange,
  onSaveRelationships,
  onExecuteTask,
  onAddDependency,
  onCreateTaskComment,
  onDeleteTask,
  onBatchDeleteTasks,
  onBatchExecuteTasks,
  onOpenTaskThread,
  activeTaskId,
  visibleDepth,
  onVisibleDepthChange,
  onOpenTask,
  onBackToTasks,
}: TasksPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [activeTab, setActiveTab] = useState<TaskDetailTab>("overview");
  const [isExecuteFallbackModalOpen, setIsExecuteFallbackModalOpen] = useState(false);
  const [executeFallbackAgentId, setExecuteFallbackAgentId] = useState("");
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [overviewCommentDraft, setOverviewCommentDraft] = useState("");

  const visibleTaskById = useMemo(() => {
    return tasks.reduce((map, task) => {
      map.set(String(task.id || "").trim(), task);
      return map;
    }, new Map<string, TaskItem>());
  }, [tasks]);

  const taskLookup = useMemo(() => {
    const map = new Map<string, TaskItem>();
    for (const task of taskOptions) {
      map.set(String(task.id || "").trim(), task);
    }
    for (const task of tasks) {
      map.set(String(task.id || "").trim(), task);
    }
    return map;
  }, [taskOptions, tasks]);

  const topLevelTasks = useMemo(() => getTopLevelTasks(taskOptions), [taskOptions]);
  const activeTask = useMemo(() => {
    const normalizedTaskId = String(activeTaskId || "").trim();
    return normalizedTaskId ? visibleTaskById.get(normalizedTaskId) || null : null;
  }, [activeTaskId, visibleTaskById]);
  const editingTask = editingTaskId ? visibleTaskById.get(editingTaskId) || null : null;

  const directChildTasks = useMemo(
    () => (activeTask ? getDirectChildTasks(taskOptions, activeTask.id) : []),
    [activeTask, taskOptions],
  );
  const directChildCount = directChildTasks.length;
  const fullDescendantTree = useMemo(
    () => (activeTask ? getDescendantTaskTree(taskOptions, activeTask.id) : []),
    [activeTask, taskOptions],
  );
  const totalSubtaskCount = fullDescendantTree.length;
  const maxAvailableDepth = useMemo(
    () => fullDescendantTree.reduce((maxDepth, entry) => Math.max(maxDepth, entry.depth + 1), 0),
    [fullDescendantTree],
  );
  const visibleDescendantTree = useMemo(
    () => (activeTask ? getDescendantTaskTree(tasks, activeTask.id) : []),
    [activeTask, tasks],
  );
  const visibleDescendantTasks = useMemo(
    () => visibleDescendantTree.map((entry) => entry.task),
    [visibleDescendantTree],
  );
  const visibleTaskDepthById = useMemo(
    () =>
      new Map(
        visibleDescendantTree.map((entry) => [
          String(entry.task.id || "").trim(),
          entry.depth + 1,
        ]),
      ),
    [visibleDescendantTree],
  );
  const graphTasks = useMemo(
    () => (activeTask ? getTaskSubtree(tasks, activeTask.id) : []),
    [activeTask, tasks],
  );
  const activeTaskComments = Array.isArray(activeTask?.comments) ? activeTask.comments : [];

  const activeTaskDraft = useMemo(() => {
    if (!activeTask) {
      return null;
    }
    return relationshipDrafts[activeTask.id] || {
      dependencyTaskIds: Array.isArray(activeTask.dependencyTaskIds) ? activeTask.dependencyTaskIds : [],
      parentTaskId: String(activeTask.parentTaskId || "").trim(),
      childTaskIds: directChildTasks.map((task) => String(task.id || "").trim()),
      assigneePrincipalId: String(activeTask.assigneePrincipalId || "").trim(),
      status: String(activeTask.status || "").trim() || "draft",
    };
  }, [activeTask, directChildTasks, relationshipDrafts]);

  const availableFallbackAgents = useMemo(
    () =>
      agents
        .map((agent) => ({
          id: String(agent?.id || "").trim(),
          name: String(agent?.name || "").trim(),
        }))
        .filter((agent) => agent.id),
    [agents],
  );

  const activeTaskExecutionPlan = useMemo(
    () =>
      activeTask
        ? buildTaskExecutionPlan({
          taskIds: [activeTask.id],
          tasks: [activeTask],
          fallbackAgentId: "",
        })
        : { groups: [], missingTaskIds: [] },
    [activeTask],
  );

  useEffect(() => {
    setActiveTab("overview");
    setIsExecuteFallbackModalOpen(false);
    setOverviewCommentDraft("");
  }, [activeTaskId]);

  useEffect(() => {
    setExecuteFallbackAgentId((currentValue) => {
      if (currentValue && availableFallbackAgents.some((agent) => agent.id === currentValue)) {
        return currentValue;
      }
      return availableFallbackAgents[0]?.id || "";
    });
  }, [availableFallbackAgents]);

  const openCreateModal = useCallback((defaultParentTaskId = "") => {
    onParentTaskIdChange(defaultParentTaskId);
    setIsCreateModalOpen(true);
  }, [onParentTaskIdChange]);

  const closeEditTaskModal = useCallback(() => {
    setEditingTaskId("");
  }, []);

  const handleDeleteTask = useCallback((taskId: string, taskName?: string) => {
    onDeleteTask(taskId, taskName || "Untitled task");
    setEditingTaskId("");
  }, [onDeleteTask]);

  async function handleSaveOverviewTask() {
    if (!activeTask) {
      return;
    }
    await onSaveRelationships(activeTask.id);
  }

  async function handleOverviewCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTask) {
      return;
    }

    const nextComment = overviewCommentDraft.trim();
    if (!nextComment) {
      return;
    }

    const didCreate = await onCreateTaskComment(activeTask.id, nextComment);
    if (didCreate) {
      setOverviewCommentDraft("");
    }
  }

  async function executeActiveTask(fallbackAgentId = "") {
    if (!activeTask) {
      return;
    }

    try {
      setIsExecutingTask(true);
      const didExecute = await onBatchExecuteTasks([activeTask.id], fallbackAgentId);
      if (didExecute) {
        setIsExecuteFallbackModalOpen(false);
      }
    } finally {
      setIsExecutingTask(false);
    }
  }

  function handleExecuteActiveTask() {
    if (!activeTask || isExecutingTask) {
      return;
    }
    if (activeTaskExecutionPlan.missingTaskIds.length > 0) {
      if (availableFallbackAgents.length === 0) {
        return;
      }
      setIsExecuteFallbackModalOpen(true);
      return;
    }
    void executeActiveTask("");
  }

  const visibleSubtaskCount = visibleDescendantTasks.length;
  const hiddenSubtaskCount = Math.max(totalSubtaskCount - visibleSubtaskCount, 0);
  const currentParentTask = activeTaskDraft?.parentTaskId
    ? taskLookup.get(String(activeTaskDraft.parentTaskId || "").trim()) || null
    : null;
  const dependencyLabels = (activeTaskDraft?.dependencyTaskIds || [])
    .map((taskId) => taskLookup.get(String(taskId || "").trim())?.name || "Untitled task")
    .filter(Boolean);
  const isOverviewSavePending = activeTask ? savingTaskId === activeTask.id : false;
  const isOverviewCommentPending = activeTask ? commentingTaskId === activeTask.id : false;
  const executeButtonDisabled = !activeTask
    || isExecutingTask
    || (activeTaskExecutionPlan.missingTaskIds.length > 0 && availableFallbackAgents.length === 0);

  const topLevelTaskCountLabel = toCountLabel(topLevelTasks.length, "top-level task");
  const detailTaskCountLabel = activeTask
    ? toCountLabel(totalSubtaskCount, "subtask")
    : topLevelTaskCountLabel;

  const depthSummaryText = visibleDepth === "all"
    ? `Showing all ${totalSubtaskCount} subtasks`
    : hiddenSubtaskCount > 0
      ? `Showing ${visibleSubtaskCount} of ${totalSubtaskCount} subtasks up to depth ${visibleDepth}`
      : `Showing ${visibleSubtaskCount} subtasks up to depth ${visibleDepth}`;

  const pageActions = useMemo(() => {
    if (activeTaskId && !activeTask) {
      return (
        <>
          <button type="button" className="secondary-btn" onClick={onBackToTasks}>
            All tasks
          </button>
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create task"
            title="Create task"
            onClick={() => openCreateModal("")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </>
      );
    }

    if (activeTask) {
      return (
        <>
          <span className="chat-card-meta">{detailTaskCountLabel}</span>
          {currentParentTask ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onOpenTask(String(currentParentTask.id || "").trim())}
            >
              Parent: {currentParentTask.name || "Untitled task"}
            </button>
          ) : null}
          <button type="button" className="secondary-btn" onClick={onBackToTasks}>
            All tasks
          </button>
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create subtask"
            title="Create subtask"
            onClick={() => openCreateModal(String(activeTask.id || "").trim())}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </>
      );
    }

    return (
      <>
        <span className="chat-card-meta">{topLevelTaskCountLabel}</span>
        <button
          type="button"
          className="chat-minimal-header-icon-btn"
          aria-label="Create task"
          title="Create task"
          onClick={() => openCreateModal("")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </>
    );
  }, [
    activeTask,
    activeTaskId,
    currentParentTask,
    detailTaskCountLabel,
    onBackToTasks,
    onOpenTask,
    openCreateModal,
    topLevelTaskCountLabel,
  ]);
  useSetPageActions(pageActions);

  return (
    <Page className="page-container-full">
      <div className="task-page-stack">
        {taskError ? <p className="error-banner">{taskError}</p> : null}
        {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}

        {!isLoadingTasks && !activeTaskId ? (
          <section className="panel task-list-panel">
            {tasks.length > 0 ? (
              <TaskTableView
                tasks={tasks}
                agents={agents}
                onTaskClick={onOpenTask}
                onDeleteTask={handleDeleteTask}
                onBatchDeleteTasks={onBatchDeleteTasks}
                onBatchExecuteTasks={onBatchExecuteTasks}
              />
            ) : (
              <div className="task-empty-panel">
                <p className="empty-hint">Create a top-level task to start structuring work.</p>
                <button
                  type="button"
                  className="secondary-btn empty-create-btn"
                  onClick={() => openCreateModal("")}
                >
                  + Create task
                </button>
              </div>
            )}
          </section>
        ) : null}

        {!isLoadingTasks && activeTaskId && !activeTask ? (
          <section className="panel task-empty-panel">
            <p className="empty-hint">This task could not be found.</p>
            <button type="button" className="secondary-btn" onClick={onBackToTasks}>
              Back to tasks
            </button>
          </section>
        ) : null}

        {!isLoadingTasks && activeTask ? (
          <section className="panel task-detail-panel">
              <div className="task-detail-header">
                <div className="task-view-tabs">
                  <button
                    type="button"
                    className={`task-view-tab${activeTab === "overview" ? " task-view-tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
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

                <div className="task-depth-controls">
                  <label htmlFor="task-depth-select" className="task-depth-label">Depth</label>
                  <select
                    id="task-depth-select"
                    value={visibleDepth}
                    onChange={(event) => onVisibleDepthChange(event.target.value)}
                  >
                    {DEPTH_OPTIONS.map((option) => (
                      <option key={`task-depth-${option}`} value={option}>
                        {option === "all"
                          ? maxAvailableDepth > 0 ? `All levels (${maxAvailableDepth})` : "All levels"
                          : `${option} level${option === "1" ? "" : "s"}`}
                      </option>
                    ))}
                  </select>
                  <span className="task-depth-summary">{depthSummaryText}</span>
                </div>
              </div>

              <div className="task-view-container">
                {activeTab === "overview" ? (
                  <div className="task-overview-grid">
                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Task fields</h3>
                        <p className="chat-card-meta">
                          Save assignee and status here. Use relationship editing for parent and dependency changes.
                        </p>
                      </div>

                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Name</span>
                        <strong>{activeTask.name || "Untitled task"}</strong>
                      </div>
                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Description</span>
                        <span>{activeTask.description || "No description provided."}</span>
                      </div>

                      <label htmlFor="overview-task-assignee">Assignee</label>
                      <select
                        id="overview-task-assignee"
                        value={String(activeTaskDraft?.assigneePrincipalId || "")}
                        onChange={(event) =>
                          onDraftChange(activeTask.id, "assigneePrincipalId", event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {principals.map((principal) => (
                          <option key={`overview-assignee-${principal.id}`} value={principal.id}>
                            {principal.displayName} ({principal.kind === "agent" ? "Agent" : "Human"})
                          </option>
                        ))}
                      </select>

                      <label htmlFor="overview-task-status">Status</label>
                      <select
                        id="overview-task-status"
                        value={String(activeTaskDraft?.status || "draft")}
                        onChange={(event) => onDraftChange(activeTask.id, "status", event.target.value)}
                      >
                        <option value="draft">draft</option>
                        <option value="pending">pending</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                      </select>

                      <div className="task-form-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => void handleSaveOverviewTask()}
                          disabled={isOverviewSavePending}
                        >
                          {isOverviewSavePending ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </section>

                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Actions</h3>
                        <p className="chat-card-meta">Run the task, open the task thread, or edit relationships.</p>
                      </div>

                      <div className="task-overview-actions">
                        <button
                          type="button"
                          onClick={handleExecuteActiveTask}
                          disabled={executeButtonDisabled}
                          title={activeTaskExecutionPlan.missingTaskIds.length > 0 && availableFallbackAgents.length === 0
                            ? "Create at least one agent to execute unassigned tasks."
                            : undefined}
                        >
                          {isExecutingTask ? "Executing..." : "Execute task"}
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setEditingTaskId(activeTask.id)}
                        >
                          Edit relationships
                        </button>
                        {String(activeTask.threadId || "").trim() ? (
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => void onOpenTaskThread(String(activeTask.threadId || "").trim())}
                          >
                            Open thread
                          </button>
                        ) : null}
                      </div>

                      {activeTaskExecutionPlan.missingTaskIds.length > 0 && availableFallbackAgents.length === 0 ? (
                        <p className="chat-card-meta">
                          This task has no assigned agent. Add an agent to execute it.
                        </p>
                      ) : null}
                    </section>

                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Relationships</h3>
                        <p className="chat-card-meta">Hierarchy, dependencies, and visible depth coverage.</p>
                      </div>

                      <div className="task-overview-stats">
                        <div className="task-overview-stat">
                          <span className="task-overview-stat-label">Parent</span>
                          <strong>{currentParentTask?.name || "No parent task"}</strong>
                        </div>
                        <div className="task-overview-stat">
                          <span className="task-overview-stat-label">Direct subtasks</span>
                          <strong>{directChildCount}</strong>
                        </div>
                        <div className="task-overview-stat">
                          <span className="task-overview-stat-label">Dependencies</span>
                          <strong>{dependencyLabels.length}</strong>
                        </div>
                        <div className="task-overview-stat">
                          <span className="task-overview-stat-label">Depth</span>
                          <strong>{visibleDepth === "all" ? "All" : visibleDepth}</strong>
                        </div>
                        <div className="task-overview-stat">
                          <span className="task-overview-stat-label">Comments</span>
                          <strong>{activeTaskComments.length}</strong>
                        </div>
                      </div>

                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Blocked by</span>
                        <span>{dependencyLabels.length > 0 ? dependencyLabels.join(", ") : "No dependencies"}</span>
                      </div>
                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Coverage</span>
                        <span>{depthSummaryText}</span>
                      </div>
                    </section>

                    <section className="task-overview-card task-overview-card-wide">
                      <div className="task-overview-card-header">
                        <h3>Comments</h3>
                        <p className="chat-card-meta">Capture execution context, blockers, and handoff notes without leaving the overview.</p>
                      </div>

                      {activeTaskComments.length > 0 ? (
                        <ul className="task-comments-list">
                          {activeTaskComments.map((comment) => (
                            <li key={`overview-task-comment-${comment.id}`} className="task-comment-item">
                              <p>{comment.comment}</p>
                              <span className="chat-card-meta">
                                {String(comment.authorPrincipal?.displayName || "").trim() || "Unknown principal"} · {" "}
                                {comment.authorPrincipal?.kind === "agent" ? "Agent" : "Human"} · {" "}
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="chat-card-meta">No comments yet.</p>
                      )}

                      <form className="task-comment-form" onSubmit={handleOverviewCommentSubmit}>
                        <label htmlFor="overview-task-comment-draft">Add comment</label>
                        <textarea
                          id="overview-task-comment-draft"
                          rows={3}
                          placeholder="Document context, blockers, or handoff notes."
                          value={overviewCommentDraft}
                          onChange={(event) => setOverviewCommentDraft(event.target.value)}
                        />
                        <div className="task-form-actions">
                          <button
                            type="submit"
                            className="secondary-btn"
                            disabled={isOverviewCommentPending || !overviewCommentDraft.trim()}
                          >
                            {isOverviewCommentPending ? "Adding comment..." : "Add comment"}
                          </button>
                        </div>
                      </form>
                    </section>
                  </div>
                ) : null}

                {activeTab === "graph" ? (
                  <TaskGraphView
                    tasks={graphTasks}
                    onTaskClick={onOpenTask}
                    onAddDependency={onAddDependency}
                  />
                ) : null}

                {activeTab === "table" ? (
                  visibleDescendantTasks.length > 0 ? (
                    <TaskTableView
                      tasks={visibleDescendantTasks}
                      agents={agents}
                      onTaskClick={onOpenTask}
                      onDeleteTask={handleDeleteTask}
                      onBatchDeleteTasks={onBatchDeleteTasks}
                      onBatchExecuteTasks={onBatchExecuteTasks}
                      taskDepthById={visibleTaskDepthById}
                    />
                  ) : (
                    <div className="task-empty-panel">
                      <p className="empty-hint">No subtasks are visible at the current depth.</p>
                    </div>
                  )
                ) : null}
              </div>
            </section>
        ) : null}
      </div>

      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tasks={taskOptions}
        principals={principals}
        name={name}
        description={description}
        assigneePrincipalId={assigneePrincipalId}
        status={status}
        parentTaskId={parentTaskId}
        dependencyTaskIds={dependencyTaskIds}
        isSubmittingTask={isSubmittingTask}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
        onAssigneePrincipalIdChange={onAssigneePrincipalIdChange}
        onStatusChange={onStatusChange}
        onParentTaskIdChange={onParentTaskIdChange}
        onDependencyTaskIdsChange={onDependencyTaskIdsChange}
        onCreateTask={onCreateTask}
        onCreateAndExecuteTask={onCreateAndExecuteTask}
        agents={agents}
      />

      <TaskEditModal
        task={editingTask}
        tasks={taskOptions}
        agents={agents}
        principals={principals}
        relationshipDraft={editingTaskId ? relationshipDrafts[editingTaskId] : undefined}
        savingTaskId={savingTaskId}
        commentingTaskId={commentingTaskId}
        deletingTaskId={deletingTaskId}
        onDraftChange={onDraftChange}
        onSaveRelationships={onSaveRelationships}
        onExecuteTask={onExecuteTask}
        onCreateTaskComment={onCreateTaskComment}
        onDeleteTask={handleDeleteTask}
        onOpenTaskThread={onOpenTaskThread}
        onClose={closeEditTaskModal}
      />

      <CreationModal
        modalId="task-execute-fallback-modal"
        title="Select fallback agent"
        description="Use a fallback agent when this task is not assigned to one."
        isOpen={isExecuteFallbackModalOpen}
        onClose={() => setIsExecuteFallbackModalOpen(false)}
      >
        <div className="task-form">
          <label htmlFor="task-execute-fallback-agent">Fallback agent</label>
          <select
            id="task-execute-fallback-agent"
            value={executeFallbackAgentId}
            onChange={(event) => setExecuteFallbackAgentId(event.target.value)}
          >
            {availableFallbackAgents.map((agent) => (
              <option key={`task-execute-fallback-${agent.id}`} value={agent.id}>
                {agent.name || "Unnamed agent"}
              </option>
            ))}
          </select>

          <div className="task-form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsExecuteFallbackModalOpen(false)}
              disabled={isExecutingTask}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void executeActiveTask(executeFallbackAgentId)}
              disabled={isExecutingTask || !executeFallbackAgentId}
            >
              {isExecutingTask ? "Executing..." : "Execute task"}
            </button>
          </div>
        </div>
      </CreationModal>
    </Page>
  );
}
