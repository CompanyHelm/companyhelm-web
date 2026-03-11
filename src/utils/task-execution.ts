import { normalizeUniqueStringList } from "./normalization.ts";

interface TaskExecutionPlanTask {
  id: string | number;
  assigneeAgentId?: string | null;
}

interface BuildTaskExecutionPlanInput {
  taskIds: Array<string | number>;
  tasks: TaskExecutionPlanTask[];
  fallbackAgentId?: string | null;
}

interface TaskExecutionGroup {
  agentId: string;
  taskIds: string[];
}

interface TaskExecutionPlan {
  groups: TaskExecutionGroup[];
  missingTaskIds: string[];
}

export function buildTaskExecutionPlan({
  taskIds,
  tasks,
  fallbackAgentId,
}: BuildTaskExecutionPlanInput): TaskExecutionPlan {
  const normalizedTaskIds = normalizeUniqueStringList(taskIds || []);
  const normalizedFallbackAgentId = String(fallbackAgentId || "").trim();
  const taskById = new Map<string, TaskExecutionPlanTask>();

  for (const task of tasks || []) {
    const taskId = String(task?.id || "").trim();
    if (!taskId) {
      continue;
    }
    taskById.set(taskId, task);
  }

  const groupTaskIdsByAgentId = new Map<string, string[]>();
  const missingTaskIds: string[] = [];

  for (const taskId of normalizedTaskIds) {
    const task = taskById.get(taskId);
    if (!task) {
      if (!normalizedFallbackAgentId) {
        missingTaskIds.push(taskId);
        continue;
      }

      if (groupTaskIdsByAgentId.has(normalizedFallbackAgentId)) {
        groupTaskIdsByAgentId.get(normalizedFallbackAgentId)?.push(taskId);
        continue;
      }

      groupTaskIdsByAgentId.set(normalizedFallbackAgentId, [taskId]);
      continue;
    }
    const assignedAgentId = String(task?.assigneeAgentId || "").trim();
    const effectiveAgentId = assignedAgentId || normalizedFallbackAgentId;
    if (!effectiveAgentId) {
      missingTaskIds.push(taskId);
      continue;
    }
    if (groupTaskIdsByAgentId.has(effectiveAgentId)) {
      groupTaskIdsByAgentId.get(effectiveAgentId)?.push(taskId);
      continue;
    }
    groupTaskIdsByAgentId.set(effectiveAgentId, [taskId]);
  }

  return {
    missingTaskIds,
    groups: Array.from(groupTaskIdsByAgentId.entries()).map(([agentId, groupedTaskIds]) => ({
      agentId,
      taskIds: groupedTaskIds,
    })),
  };
}
