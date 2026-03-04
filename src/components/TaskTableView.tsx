import { useMemo, type KeyboardEvent, type MouseEvent } from "react";

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

export function TaskTableView({ tasks, onTaskClick, onDeleteTask }: TaskTableViewProps) {
  const taskArray = Array.isArray(tasks) ? tasks : [];

  const { nameById, blocksMap } = useMemo(
    () => buildDependencyMaps(taskArray),
    [taskArray],
  );

  if (taskArray.length === 0) {
    return null;
  }

  return (
    <div className="task-table-scroll">
      <table className="task-table">
        <thead>
          <tr>
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
