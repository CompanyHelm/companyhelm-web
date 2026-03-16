interface TaskWithParent {
  id: string | number;
  parentTaskId?: string | number | null;
}

export interface TaskTableHierarchyRow<TTask extends TaskWithParent> {
  task: TTask;
  depth: number;
  hasChildren: boolean;
}

function toTaskId(value: unknown): string {
  return String(value || "").trim();
}

export function buildTaskTableHierarchyRows<TTask extends TaskWithParent>(
  tasks: TTask[],
  expandedTaskIds: Set<string>,
): TaskTableHierarchyRow<TTask>[] {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskById = new Map<string, TTask>();
  const childTaskIdsByParentId = new Map<string, string[]>();

  for (const task of taskArray) {
    const taskId = toTaskId(task?.id);
    if (!taskId) {
      continue;
    }
    taskById.set(taskId, task);
  }

  for (const task of taskArray) {
    const taskId = toTaskId(task?.id);
    const parentTaskId = toTaskId(task?.parentTaskId);
    if (!taskId || !parentTaskId || parentTaskId === taskId || !taskById.has(parentTaskId)) {
      continue;
    }
    const existingChildTaskIds = childTaskIdsByParentId.get(parentTaskId);
    if (existingChildTaskIds) {
      existingChildTaskIds.push(taskId);
    } else {
      childTaskIdsByParentId.set(parentTaskId, [taskId]);
    }
  }

  const rows: TaskTableHierarchyRow<TTask>[] = [];
  const visitedTaskIds = new Set<string>();

  function visitTask(taskId: string, depth: number) {
    if (!taskId || visitedTaskIds.has(taskId)) {
      return;
    }
    const task = taskById.get(taskId);
    if (!task) {
      return;
    }

    visitedTaskIds.add(taskId);
    const childTaskIds = childTaskIdsByParentId.get(taskId) || [];
    rows.push({
      task,
      depth,
      hasChildren: childTaskIds.length > 0,
    });

    if (!expandedTaskIds.has(taskId)) {
      return;
    }

    for (const childTaskId of childTaskIds) {
      visitTask(childTaskId, depth + 1);
    }
  }

  for (const task of taskArray) {
    const taskId = toTaskId(task?.id);
    const parentTaskId = toTaskId(task?.parentTaskId);
    if (!taskId) {
      continue;
    }
    if (parentTaskId && parentTaskId !== taskId && taskById.has(parentTaskId)) {
      continue;
    }
    visitTask(taskId, 0);
  }

  return rows;
}
