import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";

interface TaskTableTask {
  id: string | number;
  name?: string;
  status?: string;
  description?: string;
  dependencyTaskIds?: Array<string | number>;
  comments?: unknown[];
  createdAt?: string;
}

interface TaskTableViewProps {
  tasks: TaskTableTask[];
  onTaskClick: (taskId: string) => void;
  onDeleteTask: (taskId: string, taskName?: string) => void;
  onBatchDeleteTasks: (taskIds: string[]) => Promise<boolean> | boolean;
  onBatchExecuteTasks: (taskIds: string[], agentId: string) => Promise<boolean> | boolean;
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
  onTaskClick,
  onDeleteTask,
  onBatchDeleteTasks,
  onBatchExecuteTasks,
}: TaskTableViewProps) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchAgentId, setBatchAgentId] = useState("");
  const [isBatchActionPending, setIsBatchActionPending] = useState(false);

  const { nameById, blocksMap } = useMemo(
    () => buildDependencyMaps(taskArray),
    [taskArray],
  );

  useEffect(() => {
    const availableTaskIds = new Set(taskArray.map((task) => String(task.id)));
    setSelectedTaskIds((previous) => {
      const next = new Set([...previous].filter((taskId) => availableTaskIds.has(taskId)));
      return next.size === previous.size ? previous : next;
    });
  }, [taskArray]);

  if (taskArray.length === 0) {
    return null;
  }

  const allSelected = taskArray.length > 0 && taskArray.every((task) => selectedTaskIds.has(String(task.id)));
  const selectedCount = selectedTaskIds.size;

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
    if (selectedCount === 0 || isBatchActionPending) {
      return;
    }
    const normalizedAgentId = batchAgentId.trim();
    if (!normalizedAgentId) {
      return;
    }
    setIsBatchActionPending(true);
    try {
      const didExecute = await onBatchExecuteTasks([...selectedTaskIds], normalizedAgentId);
      if (didExecute) {
        setSelectedTaskIds(new Set());
      }
    } finally {
      setIsBatchActionPending(false);
    }
  }

  return (
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
          <input
            type="text"
            className="task-table-agent-input"
            value={batchAgentId}
            onChange={(event) => setBatchAgentId(event.target.value)}
            placeholder="Agent ID for batch execute"
            aria-label="Agent ID for batch execute"
          />
          <button
            type="button"
            className="secondary-btn"
            onClick={handleBatchExecuteClick}
            disabled={selectedCount === 0 || isBatchActionPending || !batchAgentId.trim()}
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
  );
}
