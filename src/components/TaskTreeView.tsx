import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { TaskItem } from "../types/domain.ts";
import { getDescendantTaskTree } from "../utils/task-hierarchy.ts";

interface TaskTreeViewProps {
  tasks: TaskItem[];
  rootTaskId: string;
  maxDepth?: number;
  onTaskClick: (taskId: string) => void;
}

export function TaskTreeView({ tasks, rootTaskId, maxDepth, onTaskClick }: TaskTreeViewProps) {
  const descendantTree = useMemo(
    () => getDescendantTaskTree(tasks, rootTaskId, maxDepth),
    [tasks, rootTaskId, maxDepth],
  );

  const childCountByParentId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { task } of descendantTree) {
      const parentTaskId = String(task.parentTaskId || "").trim();
      if (!parentTaskId) {
        continue;
      }
      counts.set(parentTaskId, (counts.get(parentTaskId) || 0) + 1);
    }
    return counts;
  }, [descendantTree]);

  const expandableTaskIds = useMemo(
    () =>
      descendantTree
        .map(({ task }) => String(task.id || "").trim())
        .filter((taskId) => childCountByParentId.has(taskId)),
    [childCountByParentId, descendantTree],
  );

  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedTaskIds(new Set(expandableTaskIds));
  }, [expandableTaskIds, maxDepth, rootTaskId]);

  const visibleEntries = useMemo(() => {
    const visibleTaskIds = new Set<string>();
    return descendantTree.filter(({ task }) => {
      const taskId = String(task.id || "").trim();
      const parentTaskId = String(task.parentTaskId || "").trim();
      const isVisible = !parentTaskId
        || parentTaskId === rootTaskId
        || (visibleTaskIds.has(parentTaskId) && expandedTaskIds.has(parentTaskId));
      if (isVisible) {
        visibleTaskIds.add(taskId);
      }
      return isVisible;
    });
  }, [descendantTree, expandedTaskIds, rootTaskId]);

  if (descendantTree.length === 0) {
    return null;
  }

  function toggleExpanded(taskId: string) {
    setExpandedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function handleToggleClick(event: MouseEvent<HTMLButtonElement>, taskId: string) {
    event.stopPropagation();
    toggleExpanded(taskId);
  }

  return (
    <div className="task-tree-scroll">
      <div className="task-tree-toolbar">
        <span className="task-tree-toolbar-copy">
          {visibleEntries.length} visible of {descendantTree.length} subtasks
        </span>
        <div className="task-tree-toolbar-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setExpandedTaskIds(new Set(expandableTaskIds))}
            disabled={expandableTaskIds.length === 0}
          >
            Expand all
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setExpandedTaskIds(new Set())}
            disabled={expandableTaskIds.length === 0}
          >
            Collapse all
          </button>
        </div>
      </div>

      <table className="task-table task-tree-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Description</th>
            <th>Subtasks</th>
            <th>Comments</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {visibleEntries.map(({ task, depth }) => {
            const taskId = String(task.id || "").trim();
            const childCount = childCountByParentId.get(taskId) || 0;
            const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;
            const isExpandable = childCount > 0;
            const isExpanded = expandedTaskIds.has(taskId);

            return (
              <tr
                key={`task-tree-row-${taskId}`}
                className="task-table-row"
                onClick={() => onTaskClick(taskId)}
                role="button"
                tabIndex={0}
                onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onTaskClick(taskId);
                  }
                }}
              >
                <td className="task-tree-name">
                  <div
                    className="task-tree-name-cell"
                    style={{ "--task-depth": depth } as CSSProperties}
                  >
                    {isExpandable ? (
                      <button
                        type="button"
                        className="task-tree-toggle"
                        onClick={(event) => handleToggleClick(event, taskId)}
                        aria-label={isExpanded ? `Collapse ${task.name}` : `Expand ${task.name}`}
                      >
                        {isExpanded ? "-" : "+"}
                      </button>
                    ) : (
                      <span className="task-tree-toggle-spacer" aria-hidden="true" />
                    )}
                    <span className="task-tree-name-text">{task.name || `Task ${taskId}`}</span>
                  </div>
                </td>
                <td>
                  <span className={`task-status-pill task-status-pill-${task.status || "draft"}`}>
                    {task.status || "draft"}
                  </span>
                </td>
                <td className="task-table-desc">{task.description || "\u2014"}</td>
                <td>{childCount}</td>
                <td>{commentCount}</td>
                <td className="task-table-date">
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
