import { useMemo, useState } from "react";
import { CreationModal } from "./CreationModal.tsx";
import {
  normalizeThreadTaskList,
  normalizeThreadTaskStatus,
  toThreadTaskStatusLabel,
} from "../utils/thread-tasks.ts";

const DEFAULT_VISIBLE_TASK_COUNT = 3;

export function ThreadTaskSummary({
  tasks,
  threadTitle,
  modalId,
  maxVisibleTasks = DEFAULT_VISIBLE_TASK_COUNT,
}: any) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<any>(false);
  const sortedTasks = useMemo(() => normalizeThreadTaskList(tasks), [tasks]);
  if (sortedTasks.length === 0) {
    return null;
  }

  const resolvedMaxVisibleTasks =
    Number.isInteger(maxVisibleTasks) && Number(maxVisibleTasks) > 0 ? Number(maxVisibleTasks) : DEFAULT_VISIBLE_TASK_COUNT;
  const visibleTasks = sortedTasks.slice(0, resolvedMaxVisibleTasks);
  const hiddenTaskCount = Math.max(0, sortedTasks.length - visibleTasks.length);
  const resolvedThreadTitle = String(threadTitle || "").trim() || "Untitled chat";

  return (
    <>
      <div className="chat-thread-task-summary">
        {visibleTasks.map((task: any) => {
          const normalizedStatus = normalizeThreadTaskStatus(task?.status);
          return (
            <div key={`thread-task-preview-${task.id}`} className="chat-thread-task-row">
              <span className="chat-thread-task-name" title={task.name}>
                {task.name}
              </span>
              <span className={`task-status-pill task-status-pill-${normalizedStatus}`}>
                {toThreadTaskStatusLabel(normalizedStatus)}
              </span>
            </div>
          );
        })}
        {hiddenTaskCount > 0 ? (
          <button
            type="button"
            className="chat-thread-task-more-btn"
            onClick={(event: any) => {
              event.stopPropagation();
              setIsTaskModalOpen(true);
            }}
            onKeyDown={(event: any) => {
              event.stopPropagation();
            }}
          >
            +{hiddenTaskCount} more
          </button>
        ) : null}
      </div>

      <CreationModal
        modalId={`${modalId}-tasks`}
        title={`Tasks for ${resolvedThreadTitle}`}
        description="Tasks are sorted by active status first."
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      >
        <ul className="compact-list chat-thread-task-modal-list">
          {sortedTasks.map((task: any) => {
            const normalizedStatus = normalizeThreadTaskStatus(task?.status);
            return (
              <li key={`thread-task-modal-${task.id}`} className="compact-item chat-thread-task-modal-item">
                <div className="chat-thread-task-modal-row">
                  <p className="chat-thread-task-modal-name">{task.name}</p>
                  <span className={`task-status-pill task-status-pill-${normalizedStatus}`}>
                    {toThreadTaskStatusLabel(normalizedStatus)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CreationModal>
    </>
  );
}
