type TaskRecord = {
  id?: string;
  assigneeActor?: {
    userId?: string | null;
  } | null;
};

type TaskOptionRecord = {
  id?: string;
  taskId?: string;
  parentTaskId?: string | null;
};

interface FilterTasksForAssigneeUserIdInput<TTask extends TaskRecord, TTaskOption extends TaskOptionRecord> {
  tasks: TTask[];
  taskOptions: TTaskOption[];
  assigneeUserId: string;
}

export function filterTasksForAssigneeUserId<TTask extends TaskRecord, TTaskOption extends TaskOptionRecord>({
  tasks,
  taskOptions,
  assigneeUserId,
}: FilterTasksForAssigneeUserIdInput<TTask, TTaskOption>) {
  const normalizedAssigneeUserId = String(assigneeUserId || "").trim();
  if (!normalizedAssigneeUserId) {
    return { tasks, taskOptions };
  }

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter((task) => {
    return String(task?.assigneeActor?.userId || "").trim() === normalizedAssigneeUserId;
  });
  const visibleTaskIds = new Set(
    filteredTasks.map((task) => String(task?.id || "").trim()).filter(Boolean),
  );
  const filteredTaskOptions = (Array.isArray(taskOptions) ? taskOptions : [])
    .filter((task) => visibleTaskIds.has(String(task?.taskId || task?.id || "").trim()))
    .map((task) => {
      const parentTaskId = String(task?.parentTaskId || "").trim();
      if (!parentTaskId || visibleTaskIds.has(parentTaskId)) {
        return {
          ...task,
          id: String(task?.taskId || task?.id || "").trim(),
        };
      }
      return {
        ...task,
        id: String(task?.taskId || task?.id || "").trim(),
        parentTaskId: null,
      };
    });

  return {
    tasks: filteredTasks,
    taskOptions: filteredTaskOptions,
  };
}
