import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { CreationModal } from "./CreationModal.tsx";
import { buildTaskExecutionPlan } from "../utils/task-execution.ts";
import { buildTaskTableHierarchyRows } from "../utils/task-table-hierarchy.ts";
import {
  getPersistedTaskTableColumnIds,
  persistTaskTableColumnIds,
} from "../utils/persistence.ts";

interface TaskTableTask {
  id: string | number;
  name?: string;
  parentTaskId?: string | number | null;
  status?: string;
  lastRunStatus?: string | null;
  hasRunningRuns?: boolean;
  activeRun?: {
    status?: string | null;
  } | null;
  description?: string;
  assigneeActorId?: string | null;
  assigneeAgentId?: string | null;
  dependencyTaskIds?: Array<string | number>;
  comments?: unknown[];
  createdAt?: string;
}

interface TaskTableAgent {
  id: string | number;
  name?: string;
}

interface TaskTableViewProps {
  tasks: TaskTableTask[];
  agents: TaskTableAgent[];
  onTaskClick: (taskId: string) => void;
  onDeleteTask: (taskId: string, taskName?: string) => void;
  onBatchDeleteTasks: (taskIds: string[]) => Promise<boolean> | boolean;
  onBatchExecuteTasks: (taskIds: string[], fallbackAgentId?: string) => Promise<boolean> | boolean;
  taskDepthById?: Map<string, number>;
  collapsibleHierarchy?: boolean;
}

type TaskTableOptionalColumnId =
  | "status"
  | "run"
  | "description"
  | "blocking"
  | "blockedBy"
  | "comments"
  | "created";

interface TaskTableColumnRenderContext {
  blocksMap: Map<string, string[]>;
  nameById: Map<string, string>;
}

interface TaskTableOptionalColumnDefinition {
  id: TaskTableOptionalColumnId;
  label: string;
  defaultVisible: boolean;
  className?: string;
  renderCell: (task: TaskTableTask, context: TaskTableColumnRenderContext, taskId: string) => ReactNode;
}

const TASK_TABLE_OPTIONAL_COLUMNS: TaskTableOptionalColumnDefinition[] = [
  {
    id: "status",
    label: "Status",
    defaultVisible: true,
    renderCell: (task) => (
      <span className={`task-status-pill task-status-pill-${task.status || "draft"}`}>
        {task.status || "draft"}
      </span>
    ),
  },
  {
    id: "run",
    label: "Run",
    defaultVisible: true,
    renderCell: (task) => {
      const runStatus = String(task.lastRunStatus || "").trim();
      if (!runStatus) {
        return "\u2014";
      }
      return (
        <span className={`task-status-pill task-status-pill-${runStatus}`}>
          {runStatus}
        </span>
      );
    },
  },
  {
    id: "description",
    label: "Description",
    defaultVisible: true,
    className: "task-table-desc",
    renderCell: (task) => task.description || "\u2014",
  },
  {
    id: "blocking",
    label: "Blocking",
    defaultVisible: true,
    className: "task-table-deps",
    renderCell: (_task, context, taskId) => {
      const blocking = context.blocksMap.get(taskId) || [];
      return blocking.length === 0
        ? "\u2014"
        : blocking.map((id) => context.nameById.get(id) || id).join(", ");
    },
  },
  {
    id: "blockedBy",
    label: "Blocked by",
    defaultVisible: true,
    className: "task-table-deps",
    renderCell: (task, context, taskId) => {
      const deps = (Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [])
        .filter((id) => context.nameById.has(String(id)) && String(id) !== taskId);
      return deps.length === 0
        ? "\u2014"
        : deps.map((id) => context.nameById.get(String(id)) || String(id)).join(", ");
    },
  },
  {
    id: "comments",
    label: "Comments",
    defaultVisible: true,
    renderCell: (task) => (Array.isArray(task.comments) ? task.comments.length : 0),
  },
  {
    id: "created",
    label: "Created",
    defaultVisible: true,
    className: "task-table-date",
    renderCell: (task) => (
      task.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : "\u2014"
    ),
  },
];

const TASK_TABLE_OPTIONAL_COLUMN_IDS = TASK_TABLE_OPTIONAL_COLUMNS.map((column) => column.id);
const TASK_TABLE_DEFAULT_OPTIONAL_COLUMN_IDS = TASK_TABLE_OPTIONAL_COLUMNS
  .filter((column) => column.defaultVisible)
  .map((column) => column.id);

function buildDependencyMaps(tasks: TaskTableTask[]) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskIds = new Set(taskArray.map((task) => String(task.id)));
  const nameById = new Map<string, string>();
  const blocksMap = new Map<string, string[]>();

  for (const task of taskArray) {
    nameById.set(String(task.id), task.name || "Untitled task");
  }

  for (const task of taskArray) {
    const deps = Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [];
    for (const depId of deps) {
      if (taskIds.has(String(depId)) && String(depId) !== String(task.id)) {
        const existing = blocksMap.get(String(depId)) || [];
        existing.push(String(task.id));
        blocksMap.set(String(depId), existing);
      }
    }
  }

  return { nameById, blocksMap };
}

export function TaskTableView({
  tasks,
  agents,
  onTaskClick,
  onDeleteTask,
  onBatchDeleteTasks,
  onBatchExecuteTasks,
  taskDepthById,
  collapsibleHierarchy = false,
}: TaskTableViewProps) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const agentArray = Array.isArray(agents) ? agents : [];
  const columnMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [fallbackAgentId, setFallbackAgentId] = useState("");
  const [isBatchActionPending, setIsBatchActionPending] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [visibleOptionalColumnIds, setVisibleOptionalColumnIds] = useState<TaskTableOptionalColumnId[]>(() =>
    getPersistedTaskTableColumnIds(
      TASK_TABLE_OPTIONAL_COLUMN_IDS,
      TASK_TABLE_DEFAULT_OPTIONAL_COLUMN_IDS,
    ) as TaskTableOptionalColumnId[],
  );

  const { nameById, blocksMap } = useMemo(
    () => buildDependencyMaps(taskArray),
    [taskArray],
  );
  const visibleOptionalColumnIdSet = useMemo(
    () => new Set(visibleOptionalColumnIds),
    [visibleOptionalColumnIds],
  );
  const visibleOptionalColumns = useMemo(
    () => TASK_TABLE_OPTIONAL_COLUMNS.filter((column) => visibleOptionalColumnIdSet.has(column.id)),
    [visibleOptionalColumnIdSet],
  );
  const selectedTaskIdList = useMemo(
    () => [...selectedTaskIds],
    [selectedTaskIds],
  );
  const taskRows = useMemo(
    () => collapsibleHierarchy
      ? buildTaskTableHierarchyRows(taskArray, expandedTaskIds)
      : taskArray.map((task) => ({
        task,
        depth: taskDepthById?.get(String(task.id)) || 0,
        hasChildren: false,
      })),
    [collapsibleHierarchy, expandedTaskIds, taskArray, taskDepthById],
  );
  const visibleTaskIdList = useMemo(
    () => taskRows.map((row) => String(row.task.id)),
    [taskRows],
  );
  const availableFallbackAgents = useMemo(
    () =>
      agentArray
        .map((agent) => ({
          id: String(agent?.id || "").trim(),
          name: String(agent?.name || "").trim(),
        }))
        .filter((agent) => agent.id),
    [agentArray],
  );
  const selectionPlanWithoutFallback = useMemo(
    () => buildTaskExecutionPlan({
      taskIds: selectedTaskIdList,
      tasks: taskArray,
      fallbackAgentId: "",
    }),
    [selectedTaskIdList, taskArray],
  );

  useEffect(() => {
    const availableTaskIds = new Set(visibleTaskIdList);
    setSelectedTaskIds((previous) => {
      const next = new Set([...previous].filter((taskId) => availableTaskIds.has(taskId)));
      return next.size === previous.size ? previous : next;
    });
  }, [visibleTaskIdList]);

  useEffect(() => {
    if (!collapsibleHierarchy) {
      setExpandedTaskIds((previous) => (previous.size === 0 ? previous : new Set()));
      return;
    }

    const allTaskIds = new Set(taskArray.map((task) => String(task.id)));
    const expandableTaskIds = new Set(
      buildTaskTableHierarchyRows(taskArray, allTaskIds)
        .filter((row) => row.hasChildren)
        .map((row) => String(row.task.id)),
    );
    setExpandedTaskIds((previous) => {
      const next = new Set([...previous].filter((taskId) => expandableTaskIds.has(taskId)));
      return next.size === previous.size ? previous : next;
    });
  }, [collapsibleHierarchy, taskArray]);

  useEffect(() => {
    if (!isFallbackModalOpen) {
      return;
    }
    if (selectedTaskIds.size === 0 || selectionPlanWithoutFallback.missingTaskIds.length === 0) {
      setIsFallbackModalOpen(false);
    }
  }, [isFallbackModalOpen, selectedTaskIds.size, selectionPlanWithoutFallback.missingTaskIds.length]);

  useEffect(() => {
    if (availableFallbackAgents.length === 0) {
      setFallbackAgentId("");
      setIsFallbackModalOpen(false);
      return;
    }
    setFallbackAgentId((currentValue) => {
      if (currentValue && availableFallbackAgents.some((agent) => agent.id === currentValue)) {
        return currentValue;
      }
      return availableFallbackAgents[0].id;
    });
  }, [availableFallbackAgents]);

  useEffect(() => {
    persistTaskTableColumnIds(visibleOptionalColumnIds);
  }, [visibleOptionalColumnIds]);

  useEffect(() => {
    if (!isColumnMenuOpen || typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (!columnMenuRef.current?.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    }

    function handleEscapeKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsColumnMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isColumnMenuOpen]);

  if (taskRows.length === 0) {
    return null;
  }

  const allSelected = visibleTaskIdList.length > 0 && visibleTaskIdList.every((taskId) => selectedTaskIds.has(taskId));
  const selectedCount = selectedTaskIds.size;
  const selectedMissingAssigneeCount = selectionPlanWithoutFallback.missingTaskIds.length;
  const hasFallbackOptions = availableFallbackAgents.length > 0;
  const executeButtonDisabled = selectedCount === 0
    || isBatchActionPending
    || (selectedMissingAssigneeCount > 0 && !hasFallbackOptions);

  function toggleTaskSelection(taskId: string, checked: boolean) {
    setSelectedTaskIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }

  function handleToggleAll(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      setSelectedTaskIds(new Set(visibleTaskIdList));
      return;
    }
    setSelectedTaskIds(new Set());
  }

  function toggleTaskExpansion(taskId: string) {
    setExpandedTaskIds((previous) => {
      const next = new Set(previous);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function handleOptionalColumnToggle(columnId: TaskTableOptionalColumnId, checked: boolean) {
    setVisibleOptionalColumnIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(columnId);
      } else {
        next.delete(columnId);
      }
      return TASK_TABLE_OPTIONAL_COLUMN_IDS.filter((id) => next.has(id));
    });
  }

  async function executeSelectedTasks(nextFallbackAgentId: string) {
    setIsBatchActionPending(true);
    try {
      const didExecute = await onBatchExecuteTasks(selectedTaskIdList, nextFallbackAgentId);
      if (didExecute) {
        setSelectedTaskIds(new Set());
        setIsFallbackModalOpen(false);
      }
    } finally {
      setIsBatchActionPending(false);
    }
  }

  async function handleBatchDeleteClick() {
    if (selectedCount === 0 || isBatchActionPending) {
      return;
    }
    setIsBatchActionPending(true);
    try {
      const didDelete = await onBatchDeleteTasks([...selectedTaskIds]);
      if (didDelete) {
        setSelectedTaskIds(new Set());
      }
    } finally {
      setIsBatchActionPending(false);
    }
  }

  async function handleBatchExecuteClick() {
    if (executeButtonDisabled) {
      return;
    }
    if (selectedMissingAssigneeCount > 0) {
      setIsFallbackModalOpen(true);
      return;
    }
    await executeSelectedTasks("");
  }

  async function handleFallbackModalExecuteClick() {
    if (isBatchActionPending) {
      return;
    }
    const normalizedFallbackAgentId = fallbackAgentId.trim();
    if (!normalizedFallbackAgentId) {
      return;
    }
    await executeSelectedTasks(normalizedFallbackAgentId);
  }

  return (
    <>
      <div className="task-table-scroll">
        <div className="task-table-toolbar">
          <div className="task-table-toolbar-selection">
            <input
              type="checkbox"
              aria-label="Select all tasks"
              checked={allSelected}
              onChange={handleToggleAll}
            />
            <span>{selectedCount > 0 ? `${selectedCount} selected` : `${taskArray.length} tasks`}</span>
          </div>
          <div className="task-table-toolbar-actions">
            <div className="task-table-columns-menu-anchor" ref={columnMenuRef}>
              <button
                type="button"
                className="secondary-btn task-table-columns-toggle"
                aria-haspopup="menu"
                aria-expanded={isColumnMenuOpen}
                onClick={() => setIsColumnMenuOpen((open) => !open)}
              >
                Columns
              </button>
              {isColumnMenuOpen ? (
                <div
                  className="task-table-columns-menu"
                  role="menu"
                  aria-label="Select visible task table columns"
                >
                  {TASK_TABLE_OPTIONAL_COLUMNS.map((column) => (
                    <label key={column.id} className="task-table-columns-option">
                      <input
                        type="checkbox"
                        checked={visibleOptionalColumnIdSet.has(column.id)}
                        onChange={(event) => handleOptionalColumnToggle(column.id, event.target.checked)}
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleBatchExecuteClick}
              disabled={executeButtonDisabled}
              title={selectedMissingAssigneeCount > 0 && !hasFallbackOptions
                ? "Create at least one agent to execute unassigned tasks."
                : undefined}
            >
              Execute selected
            </button>
            <button
              type="button"
              className="task-table-batch-delete-btn"
              onClick={handleBatchDeleteClick}
              disabled={selectedCount === 0 || isBatchActionPending}
            >
              Delete selected
            </button>
          </div>
        </div>
        <table className="task-table">
          <thead>
            <tr>
              <th className="task-table-select-col">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  onChange={handleToggleAll}
                />
              </th>
              <th>Name</th>
              {visibleOptionalColumns.map((column) => (
                <th key={column.id}>{column.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {taskRows.map((row) => {
              const task = row.task;
              const taskId = String(task.id);
              const taskDepth = row.depth;
              const isExpanded = expandedTaskIds.has(taskId);
              const isSelected = selectedTaskIds.has(taskId);
              const hasRunningTaskRun = Boolean(task.hasRunningRuns);

              return (
                <tr
                  key={taskId}
                  className="task-table-row"
                  onClick={() => onTaskClick(taskId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === "Enter" || event.key === " ") onTaskClick(taskId);
                  }}
                >
                  <td
                    className="task-table-select-col"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select task ${task.name || "Untitled task"}`}
                      checked={isSelected}
                      onChange={(event) => toggleTaskSelection(taskId, event.target.checked)}
                    />
                  </td>
                  <td className="task-table-name">
                    <div
                      className="task-table-name-cell"
                      style={{ "--task-depth": taskDepth } as CSSProperties}
                    >
                      {hasRunningTaskRun ? (
                        <span
                          className="task-table-running-indicator"
                          aria-label="Task run in progress"
                          title="Task run in progress"
                        />
                      ) : null}
                      {taskDepth > 0 ? <span className="task-table-tree-branch" aria-hidden="true" /> : null}
                      {row.hasChildren ? (
                        <button
                          type="button"
                          className={`task-table-tree-toggle${isExpanded ? " task-table-tree-toggle-expanded" : ""}`}
                          aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                          aria-expanded={isExpanded}
                          onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            toggleTaskExpansion(taskId);
                          }}
                        >
                          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <path d="M3 2.5 8 6 3 9.5" />
                          </svg>
                        </button>
                      ) : null}
                      <span className="task-table-name-text">{task.name || "Untitled task"}</span>
                    </div>
                  </td>
                  {visibleOptionalColumns.map((column) => (
                    <td key={`${taskId}-${column.id}`} className={column.className}>
                      {column.renderCell(task, { nameById, blocksMap }, taskId)}
                    </td>
                  ))}
                  <td className="task-table-action">
                    <button
                      type="button"
                      className="task-table-delete-btn"
                      aria-label="Delete task"
                      title="Delete task"
                      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        onDeleteTask(taskId, task.name);
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <CreationModal
        modalId="task-execution-fallback-modal"
        title="Select fallback agent"
        description="Tasks without an assigned agent will run with this fallback."
        isOpen={isFallbackModalOpen}
        onClose={() => setIsFallbackModalOpen(false)}
      >
        <div className="task-form">
          <p className="chat-card-meta">
            {selectedMissingAssigneeCount} selected task{selectedMissingAssigneeCount === 1 ? "" : "s"}{" "}
            {selectedMissingAssigneeCount === 1 ? "does" : "do"} not have an assigned agent.
          </p>
          <label htmlFor="task-fallback-agent">Fallback agent</label>
          <select
            id="task-fallback-agent"
            value={fallbackAgentId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFallbackAgentId(event.target.value)}
          >
            {availableFallbackAgents.map((agent) => (
              <option key={`task-fallback-agent-${agent.id}`} value={agent.id}>
                {agent.name || "Unnamed agent"}
              </option>
            ))}
          </select>
          <div className="task-card-actions modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsFallbackModalOpen(false)}
              disabled={isBatchActionPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFallbackModalExecuteClick}
              disabled={isBatchActionPending || !fallbackAgentId.trim()}
            >
              Execute selected
            </button>
          </div>
        </div>
      </CreationModal>
    </>
  );
}
