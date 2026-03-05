type ThreadTaskLike = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ThreadTaskSummary = {
  id: string;
  name: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

function toSortableTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeString(value: unknown): string {
  return String(value || "").trim();
}

export function normalizeThreadTaskStatus(value: unknown): string {
  const normalizedStatus = normalizeString(value).toLowerCase();
  if (normalizedStatus === "in_progress") {
    return "in_progress";
  }
  if (normalizedStatus === "pending") {
    return "pending";
  }
  if (normalizedStatus === "draft") {
    return "draft";
  }
  if (normalizedStatus === "completed") {
    return "completed";
  }
  return "draft";
}

function toTaskStatusRank(status: string): number {
  if (status === "in_progress") {
    return 0;
  }
  if (status === "pending") {
    return 1;
  }
  if (status === "draft") {
    return 2;
  }
  if (status === "completed") {
    return 3;
  }
  return 4;
}

export function toThreadTaskStatusLabel(value: unknown): string {
  return normalizeThreadTaskStatus(value).replaceAll("_", " ");
}

function toThreadTaskSummary(task: ThreadTaskLike): ThreadTaskSummary | null {
  const taskId = normalizeString(task?.id);
  const taskName = normalizeString(task?.name);
  if (!taskId && !taskName) {
    return null;
  }

  const createdAt = normalizeString(task?.createdAt) || null;
  const updatedAt = normalizeString(task?.updatedAt) || null;
  return {
    id: taskId || taskName,
    name: taskName || `Task ${taskId.slice(0, 8)}`,
    status: normalizeThreadTaskStatus(task?.status),
    createdAt,
    updatedAt,
  };
}

export function normalizeThreadTaskList(tasks: unknown): ThreadTaskSummary[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const normalizedTasks = tasks
    .map((task) => toThreadTaskSummary(task as ThreadTaskLike))
    .filter((task): task is ThreadTaskSummary => Boolean(task));
  normalizedTasks.sort((leftTask, rightTask) => {
    const byStatus = toTaskStatusRank(leftTask.status) - toTaskStatusRank(rightTask.status);
    if (byStatus !== 0) {
      return byStatus;
    }

    const byUpdatedAt = toSortableTimestamp(rightTask.updatedAt) - toSortableTimestamp(leftTask.updatedAt);
    if (byUpdatedAt !== 0) {
      return byUpdatedAt;
    }

    const byCreatedAt = toSortableTimestamp(rightTask.createdAt) - toSortableTimestamp(leftTask.createdAt);
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }

    return leftTask.id.localeCompare(rightTask.id);
  });
  return normalizedTasks;
}
