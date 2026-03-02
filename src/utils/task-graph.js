import { normalizeUniqueStringList } from "./normalization.js";

function toTaskId(value) {
  return String(value || "").trim();
}

function sortTaskNodesByName(a, b) {
  const aName = String(a?.name || "").trim().toLowerCase();
  const bName = String(b?.name || "").trim().toLowerCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

export function buildTaskDependencyLanes(tasks) {
  const taskById = new Map();
  for (const rawTask of Array.isArray(tasks) ? tasks : []) {
    const taskId = toTaskId(rawTask?.id);
    if (!taskId) {
      continue;
    }
    taskById.set(taskId, rawTask);
  }

  const dependencyTaskIdsByTaskId = new Map();
  const dependentTaskIdsByTaskId = new Map();
  const inDegreeByTaskId = new Map();
  for (const taskId of taskById.keys()) {
    dependencyTaskIdsByTaskId.set(taskId, []);
    dependentTaskIdsByTaskId.set(taskId, []);
    inDegreeByTaskId.set(taskId, 0);
  }

  for (const [taskId, task] of taskById.entries()) {
    const dependencyTaskIds = normalizeUniqueStringList(task?.dependencyTaskIds || [])
      .filter((dependencyTaskId) => dependencyTaskId !== taskId && taskById.has(dependencyTaskId));
    dependencyTaskIdsByTaskId.set(taskId, dependencyTaskIds);
    inDegreeByTaskId.set(taskId, dependencyTaskIds.length);
    for (const dependencyTaskId of dependencyTaskIds) {
      const currentDependents = dependentTaskIdsByTaskId.get(dependencyTaskId);
      if (Array.isArray(currentDependents)) {
        currentDependents.push(taskId);
      } else {
        dependentTaskIdsByTaskId.set(dependencyTaskId, [taskId]);
      }
    }
  }

  const orderedTaskIds = [...taskById.keys()].sort((a, b) => {
    const taskA = taskById.get(a);
    const taskB = taskById.get(b);
    return sortTaskNodesByName(taskA, taskB);
  });
  const queue = orderedTaskIds.filter((taskId) => (inDegreeByTaskId.get(taskId) || 0) === 0);
  const levelByTaskId = new Map();
  const processedTaskIds = new Set();
  for (const taskId of queue) {
    levelByTaskId.set(taskId, 0);
  }

  while (queue.length > 0) {
    const taskId = queue.shift();
    if (!taskId) {
      continue;
    }
    processedTaskIds.add(taskId);
    const currentLevel = levelByTaskId.get(taskId) || 0;
    const dependentTaskIds = dependentTaskIdsByTaskId.get(taskId) || [];
    for (const dependentTaskId of dependentTaskIds) {
      const nextLevel = Math.max(levelByTaskId.get(dependentTaskId) || 0, currentLevel + 1);
      levelByTaskId.set(dependentTaskId, nextLevel);
      const nextInDegree = (inDegreeByTaskId.get(dependentTaskId) || 0) - 1;
      inDegreeByTaskId.set(dependentTaskId, nextInDegree);
      if (nextInDegree === 0) {
        queue.push(dependentTaskId);
      }
    }
  }

  // Defensive fallback for malformed data; acyclic validation should prevent this.
  for (const taskId of taskById.keys()) {
    if (!processedTaskIds.has(taskId) && !levelByTaskId.has(taskId)) {
      levelByTaskId.set(taskId, 0);
    }
  }

  const tasksByLevel = new Map();
  for (const [taskId, task] of taskById.entries()) {
    const level = levelByTaskId.get(taskId) || 0;
    const laneTask = {
      id: taskId,
      name: String(task?.name || "").trim() || `Task ${taskId}`,
      status: String(task?.status || "draft").trim() || "draft",
      dependencyTaskIds: dependencyTaskIdsByTaskId.get(taskId) || [],
      dependentTaskIds: dependentTaskIdsByTaskId.get(taskId) || [],
      commentCount: Array.isArray(task?.comments) ? task.comments.length : 0,
    };
    const laneTasks = tasksByLevel.get(level);
    if (Array.isArray(laneTasks)) {
      laneTasks.push(laneTask);
    } else {
      tasksByLevel.set(level, [laneTask]);
    }
  }

  return [...tasksByLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, laneTasks]) => ({
      level,
      title: level === 0 ? "Foundations" : `Layer ${level + 1}`,
      tasks: [...laneTasks].sort(sortTaskNodesByName),
    }));
}
