import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";
import { CreationModal } from "./CreationModal.tsx";
import { buildTaskExecutionPlan } from "../utils/task-execution.ts";

interface TaskTableTask {
  id: string | number;
  name?: string;
  status?: string;
  description?: string;
  assigneePrincipalId?: string | null;
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
}

function buildDependencyMaps(tasks: TaskTableTask[]) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskIds = new Set(taskArray.map((task) => String(task.id)));
  const nameById = new Map<string, string>();
  const blocksMap = new Map<string, string[]>();

  for (const task of taskArray) {
    nameById.set(String(task.id), task.name || `Task ${task.id}`);
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
}: TaskTableViewProps) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const agentArray = Array.isArray(agents) ? agents : [];
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [fallbackAgentId, setFallbackAgentId] = useState("");
  const [isBatchActionPending, setIsBatchActionPending] = useState(false);

  const { nameById, blocksMap } = useMemo(
    () => buildDependencyMaps(taskArray),
    [taskArray],
  );
  const selectedTaskIdList = useMemo(
    () => [...selectedTaskIds],
    [selectedTaskIds],
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
    const availableTaskIds = new Set(taskArray.map((task) => String(task.id)));
    setSelectedTaskIds((previous) => {
      const next = new Set([...previous].filter((taskId) => availableTaskIds.has(taskId)));
      return next.size === previous.size ? previous : next;
    });
  }, [taskArray]);

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

  if (taskArray.length === 0) {
    return null;
  }

  const allSelected = taskArray.length > 0 && taskArray.every((task) => selectedTaskIds.has(String(task.id)));
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
      setSelectedTaskIds(new Set(taskArray.map((task) => String(task.id))));
      return;
    }
    setSelectedTaskIds(new Set());
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
              <th>Status</th>
              <th>Description</th>
              <th>Blocking</th>
              <th>Blocked by</th>
              <th>Comments</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {taskArray.map((task) => {
              const taskId = String(task.id);
              const deps = (Array.isArray(task.dependencyTaskIds) ? task.dependencyTaskIds : [])
                .filter((id) => nameById.has(String(id)) && String(id) !== taskId);
              const blocking = blocksMap.get(taskId) || [];
              const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;
              const isSelected = selectedTaskIds.has(taskId);

              return (
                <tr
                  key={taskId}
                  className="task-table-row"
                  onClick={() => onTaskClick(taskId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key === "Enter" || event.key === " ") onTaskClick(taskId);
                  }}
                >
                  <td
                    className="task-table-select-col"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select task ${task.name || taskId}`}
                      checked={isSelected}
                      onChange={(event) => toggleTaskSelection(taskId, event.target.checked)}
                    />
                  </td>
                  <td className="task-table-name">{task.name}</td>
                  <td>
                    <span className={`task-status-pill task-status-pill-${task.status || "draft"}`}>
                      {task.status || "draft"}
                    </span>
                  </td>
                  <td className="task-table-desc">{task.description || "\u2014"}</td>
                  <td className="task-table-deps">
                    {blocking.length === 0
                      ? "\u2014"
                      : blocking.map((id) => nameById.get(id) || id).join(", ")}
                  </td>
                  <td className="task-table-deps">
                    {deps.length === 0
                      ? "\u2014"
                      : deps.map((id) => nameById.get(String(id)) || String(id)).join(", ")}
                  </td>
                  <td>{commentCount}</td>
                  <td className="task-table-date">
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="task-table-action">
                    <button
                      type="button"
                      className="task-table-delete-btn"
                      aria-label="Delete task"
                      title="Delete task"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
