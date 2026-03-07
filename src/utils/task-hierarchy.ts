import type { TaskItem } from "../types/domain.ts";

export interface TaskTreeEntry {
  task: TaskItem;
  depth: number;
}

function normalizeMaxDepth(maxDepth?: number): number {
  if (maxDepth == null) {
    return Number.POSITIVE_INFINITY;
  }

  const parsedDepth = Number(maxDepth);
  if (!Number.isFinite(parsedDepth)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, Math.floor(parsedDepth));
}

function toTaskId(value: unknown): string {
  return String(value || "").trim();
}

function buildTaskMaps(tasks: TaskItem[]) {
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const taskById = new Map<string, TaskItem>();
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
    const childTaskIds = childTaskIdsByParentId.get(parentTaskId);
    if (childTaskIds) {
      childTaskIds.push(taskId);
    } else {
      childTaskIdsByParentId.set(parentTaskId, [taskId]);
    }
  }

  return { taskArray, taskById, childTaskIdsByParentId };
}

export function getTopLevelTasks(tasks: TaskItem[]): TaskItem[] {
  const { taskArray, taskById } = buildTaskMaps(tasks);
  return taskArray.filter((task) => {
    const taskId = toTaskId(task?.id);
    const parentTaskId = toTaskId(task?.parentTaskId);
    if (!taskId) {
      return false;
    }
    return !parentTaskId || parentTaskId === taskId || !taskById.has(parentTaskId);
  });
}

export function getDirectChildTasks(tasks: TaskItem[], parentTaskId: string): TaskItem[] {
  const normalizedParentTaskId = toTaskId(parentTaskId);
  if (!normalizedParentTaskId) {
    return [];
  }

  const { taskArray } = buildTaskMaps(tasks);
  return taskArray.filter((task) => toTaskId(task?.parentTaskId) === normalizedParentTaskId);
}

export function getTaskSubtree(tasks: TaskItem[], rootTaskId: string, maxDepth?: number): TaskItem[] {
  const normalizedRootTaskId = toTaskId(rootTaskId);
  if (!normalizedRootTaskId) {
    return [];
  }

  const normalizedMaxDepth = normalizeMaxDepth(maxDepth);
  const { taskById, childTaskIdsByParentId } = buildTaskMaps(tasks);
  if (!taskById.has(normalizedRootTaskId)) {
    return [];
  }

  const visitedTaskIds = new Set<string>();
  const orderedTaskIds: string[] = [];
  const pendingTaskIds = [{ taskId: normalizedRootTaskId, depth: 0 }];

  while (pendingTaskIds.length > 0) {
    const nextNode = pendingTaskIds.shift();
    if (!nextNode || visitedTaskIds.has(nextNode.taskId)) {
      continue;
    }

    visitedTaskIds.add(nextNode.taskId);
    orderedTaskIds.push(nextNode.taskId);
    if (nextNode.depth >= normalizedMaxDepth) {
      continue;
    }
    for (const childTaskId of childTaskIdsByParentId.get(nextNode.taskId) || []) {
      if (!visitedTaskIds.has(childTaskId)) {
        pendingTaskIds.push({ taskId: childTaskId, depth: nextNode.depth + 1 });
      }
    }
  }

  return orderedTaskIds
    .map((taskId) => taskById.get(taskId) || null)
    .filter((task): task is TaskItem => task !== null);
}

export function getDescendantTaskTree(tasks: TaskItem[], rootTaskId: string, maxDepth?: number): TaskTreeEntry[] {
  const normalizedRootTaskId = toTaskId(rootTaskId);
  if (!normalizedRootTaskId) {
    return [];
  }

  const normalizedMaxDepth = normalizeMaxDepth(maxDepth);
  if (normalizedMaxDepth < 1) {
    return [];
  }

  const { taskById, childTaskIdsByParentId } = buildTaskMaps(tasks);
  if (!taskById.has(normalizedRootTaskId)) {
    return [];
  }

  const treeEntries: TaskTreeEntry[] = [];
  const pendingNodes = [...(childTaskIdsByParentId.get(normalizedRootTaskId) || [])]
    .reverse()
    .map((taskId) => ({ taskId, depth: 1 }));
  const visitedTaskIds = new Set<string>();

  while (pendingNodes.length > 0) {
    const nextNode = pendingNodes.pop();
    if (!nextNode || visitedTaskIds.has(nextNode.taskId)) {
      continue;
    }

    const task = taskById.get(nextNode.taskId);
    if (!task) {
      continue;
    }

    visitedTaskIds.add(nextNode.taskId);
    treeEntries.push({ task, depth: nextNode.depth - 1 });
    if (nextNode.depth >= normalizedMaxDepth) {
      continue;
    }

    const childTaskIds = childTaskIdsByParentId.get(nextNode.taskId) || [];
    for (let index = childTaskIds.length - 1; index >= 0; index -= 1) {
      const childTaskId = childTaskIds[index];
      if (!visitedTaskIds.has(childTaskId)) {
        pendingNodes.push({ taskId: childTaskId, depth: nextNode.depth + 1 });
      }
    }
  }

  return treeEntries;
}
