import { useState, type DragEvent } from "react";
import type { TaskCategory, TaskItem } from "../types/domain.ts";
import { buildTaskBoardColumns } from "../utils/task-board.ts";

interface TaskBoardViewProps {
  tasks: TaskItem[];
  taskCategories: TaskCategory[];
  onTaskClick: (taskId: string) => void;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  onTaskCategoryDrop: (taskId: string, category: string) => Promise<boolean> | boolean;
}

export function TaskBoardView({
  tasks,
  taskCategories,
  onTaskClick,
  onOpenTaskThread,
  onTaskCategoryDrop,
}: TaskBoardViewProps) {
  const [dropTargetKey, setDropTargetKey] = useState("");
  const columns = buildTaskBoardColumns({
    tasks: Array.isArray(tasks) ? tasks : [],
    taskCategories: Array.isArray(taskCategories) ? taskCategories : [],
  });

  async function handleDrop(event: DragEvent<HTMLDivElement>, columnKey: string) {
    event.preventDefault();
    setDropTargetKey("");
    const taskId = String(event.dataTransfer.getData("text/task-id") || "").trim();
    if (!taskId) {
      return;
    }
    const nextCategory = columnKey === "uncategorized" ? "" : columnKey;
    await onTaskCategoryDrop(taskId, nextCategory);
  }

  return (
    <div className="task-board" role="list" aria-label="Task board">
      {columns.map((column) => (
        <section
          key={column.key}
          className={`task-board-column${dropTargetKey === column.key ? " task-board-column-drop-target" : ""}`}
        >
          <header className="task-board-column-header">
            <h3>{column.label}</h3>
            <span className="chat-card-meta">{column.tasks.length}</span>
          </header>
          <div
            className="task-board-column-body"
            onDragOver={(event) => {
              event.preventDefault();
              setDropTargetKey(column.key);
            }}
            onDragLeave={() => {
              setDropTargetKey((current) => (current === column.key ? "" : current));
            }}
            onDrop={(event) => void handleDrop(event, column.key)}
          >
            {column.tasks.length > 0 ? (
              column.tasks.map((task) => {
                const taskId = String(task.id || "").trim();
                const runningThreadId = String(task.runningThreadId || "").trim();
                const hasRunningTaskRun = Boolean(task.hasRunningThreads);
                const taskStatus = String(task.status || "draft").trim() || "draft";

                return (
                  <article
                    key={task.id}
                    className="task-board-card"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", taskId);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onTaskClick(taskId)}
                  >
                    <div className="task-board-card-header">
                      <strong>{task.name || "Untitled task"}</strong>
                      <div className="task-board-card-actions">
                        <span className={`task-status-pill task-status-pill-${taskStatus}`}>
                          {taskStatus}
                        </span>
                        {hasRunningTaskRun ? (
                          <span
                            className="task-table-running-indicator"
                            aria-label="Task run in progress"
                            title="Task run in progress"
                          />
                        ) : null}
                        {runningThreadId ? (
                          <button
                            type="button"
                            className="task-table-thread-btn"
                            aria-label="Open thread"
                            title="Open thread"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onOpenTaskThread(runningThreadId);
                            }}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" width="14" height="14">
                              <path d="M2 2h12v8H5l-3 3V2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {task.description ? <p className="task-board-card-copy">{task.description}</p> : null}
                  </article>
                );
              })
            ) : (
              <p className="chat-card-meta">Drop tasks here.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
