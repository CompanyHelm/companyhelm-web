import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { TaskGraphView } from "../components/TaskGraphView.tsx";
import { TaskBoardView } from "../components/TaskBoardView.tsx";
import { TaskTableView } from "../components/TaskTableView.tsx";
import { TaskCreateModal } from "../components/TaskCreateModal.tsx";
import { TaskEditModal } from "../components/TaskEditModal.tsx";
import { TasksPageModalState } from "./TasksPageModalState.ts";
import { buildTaskExecutionPlan } from "../utils/task-execution.ts";
import {
  getDescendantTaskTree,
  getDirectChildTasks,
  getTaskSubtree,
  getTopLevelTasks,
} from "../utils/task-hierarchy.ts";
import { filterTasksByCategories } from "../utils/task-board.ts";
import type {
  Agent,
  Actor,
  TaskCategory,
  TaskItem,
  TaskRelationshipDraftById,
} from "../types/domain.ts";

type TaskDetailTab = "overview" | "runs" | "graph" | "table";

interface OverviewPropertyOption {
  value: string;
  label: string;
  description?: string;
}

interface TasksPageProps {
  tasks: TaskItem[];
  taskOptions: TaskItem[];
  taskCategories: TaskCategory[];
  agents: Agent[];
  actors: Actor[];
  isLoadingTasks: boolean;
  taskError: string;
  isSubmittingTask: boolean;
  savingTaskId: string | null;
  commentingTaskId: string | null;
  deletingTaskId: string | null;
  name: string;
  category: string;
  description: string;
  assigneeActorId: string;
  status: string;
  parentTaskId: string;
  dependencyTaskIds: string[];
  relationshipDrafts: TaskRelationshipDraftById;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssigneeActorIdChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onParentTaskIdChange: (value: string) => void;
  onDependencyTaskIdsChange: (value: string[]) => void;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onCreateAndExecuteTask: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onDraftChange: (taskId: string, field: string, value: string | string[]) => void;
  onSaveRelationships: (taskId: string) => Promise<boolean> | boolean;
  onSetTaskName: (taskId: string, name: string) => Promise<boolean> | boolean;
  onSetTaskDescription: (taskId: string, description: string) => Promise<boolean> | boolean;
  onSetTaskCategory: (taskId: string, category: string) => Promise<boolean> | boolean;
  onExecuteTask: (taskId: string, agentId: string) => Promise<boolean> | boolean;
  onAddDependency?: (taskId: string, dependencyTaskId: string) => void;
  onRemoveDependency?: (taskId: string, dependencyTaskId: string) => void;
  onCreateTaskComment: (taskId: string, comment: string) => Promise<boolean> | boolean;
  onDeleteTask: (taskId: string, taskName: string) => void;
  onBatchDeleteTasks: (taskIds: string[]) => Promise<boolean> | boolean;
  onBatchExecuteTasks: (taskIds: string[], fallbackAgentId?: string) => Promise<boolean> | boolean;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  activeTaskId: string;
  activeTab: TaskDetailTab;
  onTabChange: (tab: TaskDetailTab) => void;
  onOpenTask: (taskId: string) => void;
}

function toCountLabel(count: number, singularLabel: string, pluralLabel?: string) {
  if (count === 0) {
    return `No ${pluralLabel || `${singularLabel}s`}`;
  }
  if (count === 1) {
    return `1 ${singularLabel}`;
  }
  return `${count} ${pluralLabel || `${singularLabel}s`}`;
}

function formatTaskStatusLabel(status: string) {
  if (status === "in_progress") {
    return "In progress";
  }
  if (!status) {
    return "Draft";
  }
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function OverviewPropertyDropdown({
  buttonId,
  label,
  options,
  value,
  placeholder,
  onChange,
}: {
  buttonId: string;
  label: string;
  options: OverviewPropertyOption[];
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) || null;
  const selectedLabel = selectedOption?.label || placeholder;
  const selectedDescription = selectedOption?.description || "No selection";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="task-overview-property-field">
      <label className="task-overview-property-label" htmlFor={buttonId}>{label}</label>
      <div className="task-overview-property-menu-anchor" ref={anchorRef}>
        <button
          id={buttonId}
          type="button"
          className="task-overview-property-menu-trigger"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="task-overview-property-menu-trigger-copy">
            <span className="task-overview-property-menu-trigger-value">{selectedLabel}</span>
            <span className="task-overview-property-menu-trigger-description">{selectedDescription}</span>
          </span>
          <span className="task-overview-property-menu-trigger-caret" aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="task-overview-property-menu" role="listbox" aria-labelledby={buttonId}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={`${buttonId}-${option.value || "empty"}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`task-overview-property-menu-option${isSelected ? " task-overview-property-menu-option-selected" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="task-overview-property-menu-option-label">{option.label}</span>
                  <span className="task-overview-property-menu-option-description">
                    {option.description || " "}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TasksPage({
  tasks,
  taskOptions,
  taskCategories,
  agents,
  actors,
  isLoadingTasks,
  taskError,
  isSubmittingTask,
  savingTaskId,
  commentingTaskId,
  deletingTaskId,
  name,
  category,
  description,
  assigneeActorId,
  status,
  parentTaskId,
  dependencyTaskIds,
  relationshipDrafts,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onAssigneeActorIdChange,
  onStatusChange,
  onParentTaskIdChange,
  onDependencyTaskIdsChange,
  onCreateTask,
  onCreateAndExecuteTask,
  onDraftChange,
  onSaveRelationships,
  onSetTaskName,
  onSetTaskDescription,
  onSetTaskCategory,
  onExecuteTask,
  onAddDependency,
  onRemoveDependency,
  onCreateTaskComment,
  onDeleteTask,
  onBatchDeleteTasks,
  onBatchExecuteTasks,
  onOpenTaskThread,
  activeTaskId,
  activeTab = "overview",
  onTabChange,
  onOpenTask,
}: TasksPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [isExecuteFallbackModalOpen, setIsExecuteFallbackModalOpen] = useState(false);
  const [executeFallbackAgentId, setExecuteFallbackAgentId] = useState("");
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [overviewCommentDraft, setOverviewCommentDraft] = useState("");
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isDependenciesModalOpen, setIsDependenciesModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [taskListViewMode, setTaskListViewMode] = useState<"table" | "board">("table");
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const resolvedActiveTab = activeTab === "runs"
    ? "runs"
    : activeTab === "graph"
      ? "graph"
      : activeTab === "table"
        ? "table"
        : "overview";

  const visibleTaskById = useMemo(() => {
    return tasks.reduce((map, task) => {
      map.set(String(task.id || "").trim(), task);
      return map;
    }, new Map<string, TaskItem>());
  }, [tasks]);
  const agentNameById = useMemo(() => {
    return agents.reduce((map, agent) => {
      const agentId = String(agent.id || "").trim();
      if (!agentId) {
        return map;
      }
      map.set(agentId, String(agent.name || "").trim() || "Unnamed agent");
      return map;
    }, new Map<string, string>());
  }, [agents]);

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
  const filteredListTasks = useMemo(
    () => filterTasksByCategories(tasks, selectedCategoryFilters),
    [selectedCategoryFilters, tasks],
  );
  const activeTask = useMemo(() => {
    const normalizedTaskId = String(activeTaskId || "").trim();
    return normalizedTaskId ? visibleTaskById.get(normalizedTaskId) || null : null;
  }, [activeTaskId, visibleTaskById]);
  const editingTask = useMemo(
    () =>
      TasksPageModalState.resolveEditTask({
        isOpen: isEditModalOpen,
        activeTask,
        requestedTaskId: editingTaskId,
        visibleTaskById,
      }),
    [activeTask, editingTaskId, isEditModalOpen, visibleTaskById],
  );

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
  const activeTaskRuns = Array.isArray(activeTask?.runs) ? activeTask.runs : [];
  const activeTaskLatestRun = activeTask?.latestRun || null;
  const activeTaskDraft = useMemo(() => {
    if (!activeTask) {
      return null;
    }
    return relationshipDrafts[activeTask.id] || {
      dependencyTaskIds: Array.isArray(activeTask.dependencyTaskIds) ? activeTask.dependencyTaskIds : [],
      parentTaskId: String(activeTask.parentTaskId || "").trim(),
      childTaskIds: directChildTasks.map((task) => String(task.id || "").trim()),
      assigneeActorId: String(activeTask.assigneeActorId || "").trim(),
      status: String(activeTask.status || "").trim() || "draft",
      category: String(activeTask.category || "").trim(),
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
    setIsExecuteFallbackModalOpen(false);
    setOverviewCommentDraft("");
    setIsEditModalOpen(false);
    setEditingTaskId("");
    setIsDescriptionModalOpen(false);
    setIsDependenciesModalOpen(false);
    setIsEditingName(false);
  }, [activeTaskId]);

  useEffect(() => {
    setExecuteFallbackAgentId((currentValue) => {
      if (currentValue && availableFallbackAgents.some((agent) => agent.id === currentValue)) {
        return currentValue;
      }
      return availableFallbackAgents[0]?.id || "";
    });
  }, [availableFallbackAgents]);

  const openCreateModal = useCallback((action: "create-task" | "create-subtask") => {
    onParentTaskIdChange(
      TasksPageModalState.getCreateParentTaskId({
        action,
        activeTask,
      }),
    );
    setIsCreateModalOpen(true);
  }, [activeTask, onParentTaskIdChange]);

  const closeEditTaskModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingTaskId("");
  }, []);

  const openActiveTaskEditModal = useCallback(() => {
    if (!activeTask) {
      return;
    }
    setEditingTaskId(String(activeTask.id || "").trim());
    setIsEditModalOpen(true);
  }, [activeTask]);

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

  function startEditingName() {
    if (!activeTask) return;
    setNameDraft(activeTask.name || "");
    setIsEditingName(true);
  }

  async function saveNameEdit() {
    if (!activeTask || !nameDraft.trim()) return;
    const didSave = await onSetTaskName(activeTask.id, nameDraft);
    if (didSave) {
      setIsEditingName(false);
    }
  }

  function openDescriptionModal() {
    if (!activeTask) return;
    setDescriptionDraft(activeTask.description || "");
    setIsDescriptionModalOpen(true);
  }

  async function saveDescriptionEdit() {
    if (!activeTask) return;
    const didSave = await onSetTaskDescription(activeTask.id, descriptionDraft);
    if (didSave) {
      setIsDescriptionModalOpen(false);
    }
  }

  function toggleCategoryFilter(categoryValue: string) {
    setSelectedCategoryFilters((currentFilters) => (
      currentFilters.includes(categoryValue)
        ? currentFilters.filter((filterValue) => filterValue !== categoryValue)
        : [...currentFilters, categoryValue]
    ));
  }

  async function handleTaskCategoryDrop(taskId: string, nextCategory: string) {
    await onSetTaskCategory(taskId, nextCategory);
  }

  function handleUnlinkDependency(depId: string) {
    if (!activeTask || !onRemoveDependency) return;
    onRemoveDependency(activeTask.id, depId);
  }

  function handleAddDependencyFromModal(depId: string) {
    if (!activeTask || !depId || !onAddDependency) return;
    onAddDependency(activeTask.id, depId);
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

  const currentParentTask = activeTaskDraft?.parentTaskId
    ? taskLookup.get(String(activeTaskDraft.parentTaskId || "").trim()) || null
    : null;
  const dependencyItems = (activeTaskDraft?.dependencyTaskIds || [])
    .map((depId) => {
      const normalizedId = String(depId || "").trim();
      return {
        id: normalizedId,
        name: taskLookup.get(normalizedId)?.name || "Untitled task",
      };
    })
    .filter((item) => item.id);
  const dependencyIdSet = new Set(dependencyItems.map((d) => d.id));
  const availableDependencyOptions = taskOptions.filter(
    (t) => t.id !== activeTask?.id && !dependencyIdSet.has(String(t.id || "").trim()),
  );
  const assigneeOptions = useMemo(
    () => [
      {
        value: "",
        label: "Unassigned",
        description: "No owner selected",
      },
      ...actors.map((actor) => ({
        value: actor.id,
        label: actor.displayName,
        description: actor.kind === "agent" ? "Agent assignee" : "Human assignee",
      })),
    ],
    [actors],
  );
  const statusOptions = useMemo(
    () => [
      { value: "draft", label: "Draft", description: "Not ready to run yet" },
      { value: "pending", label: "Pending", description: "Ready and waiting" },
      { value: "in_progress", label: "In progress", description: "Currently being worked" },
      { value: "completed", label: "Completed", description: "Finished work" },
    ],
    [],
  );
  const categoryOptions = useMemo(
    () => [
      {
        value: "",
        label: "Uncategorized",
        description: "No category assigned",
      },
      ...taskCategories.map((taskCategory) => ({
        value: taskCategory.name,
        label: taskCategory.name,
        description: "Task lane",
      })),
    ],
    [taskCategories],
  );
  const categoryFilterOptions = useMemo(
    () => [
      ...taskCategories.map((taskCategory) => taskCategory.name),
      "uncategorized",
    ],
    [taskCategories],
  );
  const isOverviewSavePending = activeTask ? savingTaskId === activeTask.id : false;
  const isOverviewCommentPending = activeTask ? commentingTaskId === activeTask.id : false;
  const executeButtonDisabled = !activeTask
    || isExecutingTask
    || (activeTaskExecutionPlan.missingTaskIds.length > 0 && availableFallbackAgents.length === 0);

  const topLevelTaskCountLabel = toCountLabel(topLevelTasks.length, "top-level task");
  const detailTaskCountLabel = activeTask
    ? toCountLabel(totalSubtaskCount, "subtask")
    : topLevelTaskCountLabel;
  const activeTaskDescription = String(activeTask?.description || "");
  const hasLongTaskDescription = activeTaskDescription.trim().length > 220;
  const descriptionSaveShortcutLabel = typeof navigator !== "undefined" && navigator.platform?.includes("Mac")
    ? "\u2318"
    : "Ctrl";
  const descriptionCharacterCount = descriptionDraft.trim().length;

  const pageActions = useMemo(() => {
    if (activeTaskId && !activeTask) {
      return (
        <>
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create task"
            title="Create task"
            onClick={() => openCreateModal("create-task")}
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
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create subtask"
            title="Create subtask"
            onClick={() => openCreateModal("create-subtask")}
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
          onClick={() => openCreateModal("create-task")}
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
              <>
                <div className="task-detail-header">
                  <div className="task-view-tabs" role="tablist" aria-label="Task list views">
                    <button
                      type="button"
                      className={`task-view-tab${taskListViewMode === "table" ? " task-view-tab-active" : ""}`}
                      onClick={() => setTaskListViewMode("table")}
                    >
                      Table
                    </button>
                    <button
                      type="button"
                      className={`task-view-tab${taskListViewMode === "board" ? " task-view-tab-active" : ""}`}
                      onClick={() => setTaskListViewMode("board")}
                    >
                      Kanban
                    </button>
                  </div>
                </div>
                <div className="task-category-filter-bar">
                  {categoryFilterOptions.map((categoryValue) => {
                    const label = categoryValue === "uncategorized" ? "Uncategorized" : categoryValue;
                    const isSelected = selectedCategoryFilters.includes(categoryValue);
                    return (
                      <button
                        key={`task-category-filter-${categoryValue}`}
                        type="button"
                        className={`task-category-filter-chip${isSelected ? " task-category-filter-chip-active" : ""}`}
                        onClick={() => toggleCategoryFilter(categoryValue)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {taskListViewMode === "table" ? (
                  <TaskTableView
                    tasks={filteredListTasks}
                    agents={agents}
                    onTaskClick={onOpenTask}
                    onDeleteTask={handleDeleteTask}
                    onBatchDeleteTasks={onBatchDeleteTasks}
                    onBatchExecuteTasks={onBatchExecuteTasks}
                    onOpenTaskThread={onOpenTaskThread}
                    collapsibleHierarchy
                  />
                ) : (
                  <TaskBoardView
                    tasks={filteredListTasks}
                    taskCategories={taskCategories}
                    onTaskClick={onOpenTask}
                    onTaskCategoryDrop={handleTaskCategoryDrop}
                  />
                )}
              </>
            ) : (
              <div className="task-empty-panel">
                <p className="empty-hint">Create your first task.</p>
                <button
                  type="button"
                  className="secondary-btn empty-create-btn"
                  onClick={() => openCreateModal("create-task")}
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
          </section>
        ) : null}

        {!isLoadingTasks && activeTask ? (
          <section className="panel task-detail-panel">
              {/* ── Tabs ── */}
              <div className="task-detail-header">
                <div className="task-view-tabs">
                  <button
                    type="button"
                    className={`task-view-tab${resolvedActiveTab === "overview" ? " task-view-tab-active" : ""}`}
                    onClick={() => onTabChange("overview")}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    className={`task-view-tab${resolvedActiveTab === "runs" ? " task-view-tab-active" : ""}`}
                    onClick={() => onTabChange("runs")}
                  >
                    Runs
                  </button>
                  <button
                    type="button"
                    className={`task-view-tab${resolvedActiveTab === "graph" ? " task-view-tab-active" : ""}`}
                    onClick={() => onTabChange("graph")}
                  >
                    Graph
                  </button>
                  <button
                    type="button"
                    className={`task-view-tab${resolvedActiveTab === "table" ? " task-view-tab-active" : ""}`}
                    onClick={() => onTabChange("table")}
                  >
                    Sub tasks
                  </button>
                </div>
              </div>

              {/* ── Tab content ── */}
              <div className="task-view-container">
                {resolvedActiveTab === "overview" ? (
                  <div className="task-overview-scroll">
                    {/* ── Hero section ── */}
                    <div className="task-detail-hero">
                      <div className="task-detail-hero-section task-detail-hero-heading-section">
                        <p className="task-detail-hero-section-label">Task</p>
                        {isEditingName ? (
                          <div className="role-detail-hero-edit-form">
                            <input
                              className="role-detail-hero-edit-input"
                              value={nameDraft}
                              onChange={(e) => setNameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void saveNameEdit();
                                if (e.key === "Escape") setIsEditingName(false);
                              }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => void saveNameEdit()}
                              disabled={!nameDraft.trim() || isOverviewSavePending}
                            >
                              {isOverviewSavePending ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => setIsEditingName(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="role-detail-hero-title-row">
                            <h1 className="role-detail-hero-title">{activeTask.name || "Untitled task"}</h1>
                            <span className={`task-status-pill task-status-pill-${String(activeTask.status || "draft").trim()}`}>
                              {activeTask.status || "draft"}
                            </span>
                            <button
                              type="button"
                              className="role-detail-hero-edit-btn"
                              onClick={startEditingName}
                              aria-label="Edit name"
                              title="Edit name"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="task-detail-hero-section task-detail-hero-description-section">
                        <div className="task-detail-hero-description-header">
                          <p className="task-detail-hero-section-label">Description</p>
                          <div className="task-overview-inline-edit-actions">
                            {hasLongTaskDescription ? (
                              <button type="button" className="task-overview-show-more-btn" onClick={() => openDescriptionModal()}>
                                Show more
                              </button>
                            ) : null}
                            <button type="button" className="task-overview-show-more-btn" onClick={() => openDescriptionModal()}>
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="task-detail-hero-description">
                          {activeTaskDescription.trim() ? (
                            <div
                              className={[
                                "chat-message-content",
                                "chat-message-content-markdown",
                                "task-detail-hero-description-text",
                                "task-detail-hero-description-markdown",
                                hasLongTaskDescription ? "task-detail-hero-description-markdown-clamped" : "",
                              ].filter(Boolean).join(" ")}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {activeTaskDescription}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="task-detail-hero-description-text">No description provided.</p>
                          )}
                        </div>
                      </div>

                      <div className="role-detail-stats task-detail-hero-stats">
                        <div className="role-detail-stat">
                          <p className="role-detail-stat-value">{directChildCount}</p>
                          <p className="role-detail-stat-label">Subtasks</p>
                        </div>
                        <div className="role-detail-stat">
                          <p className="role-detail-stat-value">{dependencyItems.length}</p>
                          <p className="role-detail-stat-label">Dependencies</p>
                        </div>
                        <div className="role-detail-stat">
                          <p className="role-detail-stat-value">{activeTaskComments.length}</p>
                          <p className="role-detail-stat-label">Comments</p>
                        </div>
                        <div className="role-detail-stat">
                          <p className="role-detail-stat-value">
                            {currentParentTask
                              ? (currentParentTask.name || "Untitled").length > 16
                                ? `${(currentParentTask.name || "Untitled").slice(0, 16)}...`
                                : currentParentTask.name || "Untitled"
                              : "None"}
                          </p>
                          <p className="role-detail-stat-label">Parent</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Overview cards ── */}
                    <div className="task-overview-grid task-overview-grid-2col">
                    {/* Properties card */}
                    <section className="task-overview-card task-overview-card-properties">
                      <div className="task-overview-card-header">
                        <h3>Properties</h3>
                        <p className="task-overview-card-subtitle">Assignment and execution state for this task.</p>
                      </div>

                      <OverviewPropertyDropdown
                        buttonId="overview-task-assignee"
                        label="Assignee"
                        options={assigneeOptions}
                        value={String(activeTaskDraft?.assigneeActorId || "")}
                        placeholder="Unassigned"
                        onChange={(nextValue) => onDraftChange(activeTask.id, "assigneeActorId", nextValue)}
                      />

                      <OverviewPropertyDropdown
                        buttonId="overview-task-status"
                        label="Status"
                        options={statusOptions}
                        value={String(activeTaskDraft?.status || "draft")}
                        placeholder={formatTaskStatusLabel(String(activeTaskDraft?.status || "draft"))}
                        onChange={(nextValue) => onDraftChange(activeTask.id, "status", nextValue)}
                      />

                      <OverviewPropertyDropdown
                        buttonId="overview-task-category"
                        label="Category"
                        options={categoryOptions}
                        value={String(activeTaskDraft?.category || "")}
                        placeholder="Uncategorized"
                        onChange={(nextValue) => onDraftChange(activeTask.id, "category", nextValue)}
                      />

                      <div className="task-form-actions task-overview-property-actions">
                        <button
                          type="button"
                          className="task-overview-save-btn"
                          onClick={() => void handleSaveOverviewTask()}
                          disabled={isOverviewSavePending}
                        >
                          {isOverviewSavePending ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </section>

                    {/* Relationships card */}
                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Relationships</h3>
                      </div>

                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Parent</span>
                        <span>
                          {currentParentTask ? (
                            <button
                              type="button"
                              className="task-overview-show-more-btn"
                              onClick={() => onOpenTask(String(currentParentTask.id || "").trim())}
                            >
                              {currentParentTask.name || "Untitled task"}
                            </button>
                          ) : "No parent task"}
                        </span>
                      </div>
                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Direct subtasks</span>
                        <strong>{directChildCount}</strong>
                      </div>
                      <div className="task-overview-field">
                        <span className="task-overview-field-label">Dependencies</span>
                        {dependencyItems.length > 0 ? (
                          <div className="task-relation-pills">
                            {dependencyItems.map((dep) => (
                              <span key={dep.id} className="task-relation-pill">
                                <span>{dep.name}</span>
                                <button
                                  type="button"
                                  className="task-relation-pill-remove"
                                  onClick={() => void handleUnlinkDependency(dep.id)}
                                  aria-label={`Unlink ${dep.name}`}
                                  disabled={isOverviewSavePending}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="chat-card-meta">No dependencies</span>
                        )}
                      </div>

                      <div className="task-form-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setIsDependenciesModalOpen(true)}
                        >
                          Edit task dependencies
                        </button>
                      </div>
                    </section>

                    {/* Actions card */}
                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Actions</h3>
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
                          onClick={() => openCreateModal("create-subtask")}
                        >
                          Create subtask
                        </button>
                      </div>

                      {activeTaskExecutionPlan.missingTaskIds.length > 0 && availableFallbackAgents.length === 0 ? (
                        <p className="chat-card-meta">
                          This task has no assigned agent. Add an agent to execute it.
                        </p>
                      ) : null}
                    </section>

                    {/* Comments card */}
                    <section className="task-overview-card">
                      <div className="task-overview-card-header">
                        <h3>Comments</h3>
                      </div>

                      {activeTaskComments.length > 0 ? (
                        <ul className="task-comments-list">
                          {activeTaskComments.map((comment) => (
                            <li key={`overview-task-comment-${comment.id}`} className="task-comment-item">
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
                  </div>
                ) : null}

                {resolvedActiveTab === "runs" ? (
                  activeTaskRuns.length > 0 ? (
                    <div className="task-overview-scroll">
                      <div className="task-overview-grid task-overview-grid-2col">
                        <section className="task-overview-card">
                          <div className="task-overview-card-header">
                            <h3>Execution</h3>
                          </div>
                          <div className="task-overview-field">
                            <span className="task-overview-field-label">Attempts</span>
                            <strong>{activeTask.attemptCount || activeTaskRuns.length}</strong>
                          </div>
                          <div className="task-overview-field">
                            <span className="task-overview-field-label">Latest status</span>
                            <span className={`task-status-pill task-status-pill-${String(activeTask.lastRunStatus || activeTaskLatestRun?.status || "draft").trim()}`}>
                              {String(activeTask.lastRunStatus || activeTaskLatestRun?.status || "unknown").trim()}
                            </span>
                          </div>
                          {activeTaskLatestRun?.failureMessage ? (
                            <div className="task-overview-field">
                              <span className="task-overview-field-label">Latest failure</span>
                              <span>{activeTaskLatestRun.failureMessage}</span>
                            </div>
                          ) : null}
                        </section>
                        <section className="task-overview-card task-overview-card-wide">
                          <div className="task-overview-card-header">
                            <h3>Run history</h3>
                          </div>
                          <div className="task-runs-list">
                            {activeTaskRuns.map((run) => {
                              const runThreadId = String(run.threadId || "").trim();
                              const runAgentName = agentNameById.get(String(run.agentId || "").trim()) || "Unknown agent";
                              return (
                                <article key={run.id} className="task-run-item">
                                  <div className="task-run-item-header">
                                    <div>
                                      <strong>{run.status}</strong>
                                      <p className="chat-card-meta">
                                        {run.createdAt ? new Date(run.createdAt).toLocaleString() : "Unknown start"}
                                      </p>
                                    </div>
                                    {runThreadId ? (
                                      <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => void onOpenTaskThread(runThreadId)}
                                      >
                                        Open thread
                                      </button>
                                    ) : null}
                                  </div>
                                  <div className="task-run-item-body">
                                    <span className="chat-card-meta">Agent: {runAgentName}</span>
                                    <span className="chat-card-meta">Started: {run.startedAt ? new Date(run.startedAt).toLocaleString() : "Not started"}</span>
                                    <span className="chat-card-meta">Finished: {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "Not finished"}</span>
                                    {run.failureMessage ? (
                                      <p className="error-banner task-run-failure">{run.failureMessage}</p>
                                    ) : null}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : (
                    <div className="task-empty-panel">
                      <p className="empty-hint">No task runs yet.</p>
                    </div>
                  )
                ) : null}

                {resolvedActiveTab === "graph" ? (
                  <TaskGraphView
                    tasks={graphTasks}
                    onTaskClick={onOpenTask}
                    onAddDependency={onAddDependency}
                  />
                ) : null}

                {resolvedActiveTab === "table" ? (
                  visibleDescendantTasks.length > 0 ? (
                    <TaskTableView
                      tasks={visibleDescendantTasks}
                      agents={agents}
                      onTaskClick={onOpenTask}
                      onDeleteTask={handleDeleteTask}
                      onBatchDeleteTasks={onBatchDeleteTasks}
                      onBatchExecuteTasks={onBatchExecuteTasks}
                      onOpenTaskThread={onOpenTaskThread}
                      taskDepthById={visibleTaskDepthById}
                    />
                  ) : (
                    <div className="task-empty-panel">
                      <p className="empty-hint">No subtasks yet.</p>
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
        taskCategories={taskCategories}
        actors={actors}
        name={name}
        category={category}
        description={description}
        assigneeActorId={assigneeActorId}
        status={status}
        parentTaskId={parentTaskId}
        dependencyTaskIds={dependencyTaskIds}
        isSubmittingTask={isSubmittingTask}
        onNameChange={onNameChange}
        onCategoryChange={onCategoryChange}
        onDescriptionChange={onDescriptionChange}
        onAssigneeActorIdChange={onAssigneeActorIdChange}
        onStatusChange={onStatusChange}
        onParentTaskIdChange={onParentTaskIdChange}
        onDependencyTaskIdsChange={onDependencyTaskIdsChange}
        onCreateTask={onCreateTask}
        onCreateAndExecuteTask={onCreateAndExecuteTask}
      />

      <TaskEditModal
        task={editingTask}
        tasks={taskOptions}
        agents={agents}
        actors={actors}
        taskCategories={taskCategories}
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

      <CreationModal
        modalId="task-description-modal"
        title="Edit description"
        description="Write the task brief in markdown. This editor stays open until you save or cancel."
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        cardClassName="modal-card-fullscreen task-description-modal-card"
      >
        <div className="task-description-modal-body">
          <div className="task-description-modal-toolbar">
            <div className="task-description-modal-toolbar-group">
              <span className="task-description-modal-chip">Markdown enabled</span>
              <span className="task-description-modal-hint">{descriptionSaveShortcutLabel}+Enter to save</span>
            </div>
            <span className="task-description-modal-count">
              {descriptionCharacterCount > 0 ? `${descriptionCharacterCount} chars` : "Start typing"}
            </span>
          </div>
          <div className="task-description-modal-editor-frame">
            <label className="task-description-modal-editor-label" htmlFor="task-description-modal-textarea">
              Description
            </label>
            <textarea
              id="task-description-modal-textarea"
              className="task-description-modal-textarea"
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void saveDescriptionEdit();
                }
              }}
              placeholder={"Describe the task, constraints, acceptance criteria, or paste markdown notes here."}
              autoFocus
            />
          </div>
          <div className="task-form-actions task-description-modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsDescriptionModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveDescriptionEdit()}
              disabled={isOverviewSavePending}
            >
              {isOverviewSavePending ? "Saving..." : "Save description"}
            </button>
          </div>
        </div>
      </CreationModal>

      <CreationModal
        modalId="task-dependencies-modal"
        title="Edit task dependencies"
        isOpen={isDependenciesModalOpen}
        onClose={() => setIsDependenciesModalOpen(false)}
        cardClassName="task-dependencies-modal-card"
      >
        <div className="task-dependencies-modal-body">
          <div className="task-dependencies-modal-header">
            <span className="task-overview-field-label">
              {dependencyItems.length > 0
                ? `${dependencyItems.length} ${dependencyItems.length === 1 ? "dependency" : "dependencies"}`
                : "No dependencies"}
            </span>
            <div className="task-dependencies-modal-add">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddDependencyFromModal(e.target.value);
                }}
                disabled={isOverviewSavePending}
              >
                <option value="">+ Add dependency</option>
                {availableDependencyOptions.map((t) => (
                  <option key={`dep-add-${t.id}`} value={t.id}>
                    {t.name || "Untitled task"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dependencyItems.length > 0 ? (
            <ul className="task-dependencies-modal-list">
              {dependencyItems.map((dep) => (
                <li key={dep.id} className="task-dependencies-modal-item">
                  <span className="task-dependencies-modal-item-name">{dep.name}</span>
                  <button
                    type="button"
                    className="task-dependencies-modal-unlink"
                    onClick={() => void handleUnlinkDependency(dep.id)}
                    disabled={isOverviewSavePending}
                    aria-label={`Unlink ${dep.name}`}
                  >
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chat-card-meta task-dependencies-modal-empty">
              This task has no dependencies. Add one using the dropdown above.
            </p>
          )}
        </div>
      </CreationModal>
    </Page>
  );
}
