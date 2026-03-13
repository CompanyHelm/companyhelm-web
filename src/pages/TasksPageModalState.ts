import type { TaskItem } from "../types/domain.ts";

interface ResolveEditTaskParams {
  isOpen: boolean;
  activeTask: TaskItem | null;
  requestedTaskId?: string | null;
  visibleTaskById: Map<string, TaskItem>;
}

interface GetCreateParentTaskIdParams {
  action: "create-task" | "create-subtask";
  activeTask: TaskItem | null;
}

export class TasksPageModalState {
  static resolveEditTask({
    isOpen,
    activeTask,
    requestedTaskId,
    visibleTaskById,
  }: ResolveEditTaskParams): TaskItem | null {
    if (!isOpen) {
      return null;
    }

    const normalizedRequestedTaskId = String(requestedTaskId || "").trim();
    const normalizedActiveTaskId = String(activeTask?.id || "").trim();
    if (activeTask && (!normalizedRequestedTaskId || normalizedRequestedTaskId === normalizedActiveTaskId)) {
      return activeTask;
    }

    if (!normalizedRequestedTaskId) {
      return null;
    }

    return visibleTaskById.get(normalizedRequestedTaskId) || null;
  }

  static getCreateParentTaskId({ action, activeTask }: GetCreateParentTaskIdParams): string {
    if (action !== "create-subtask") {
      return "";
    }

    return String(activeTask?.id || "").trim();
  }
}
