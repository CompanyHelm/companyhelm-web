import { createRelationshipDrafts } from "../../utils/drafts.ts";
import type {
  Agent,
  Actor,
  TaskCategory,
  TaskComment,
  TaskItem,
  TaskRun,
  TaskRelationshipDraftById,
} from "../../types/domain.ts";

type LooseRecord = Record<string, unknown>;

interface TaskRouteViewModel {
  agents: Agent[];
  actors: Actor[];
  relationshipDrafts: TaskRelationshipDraftById;
  taskCategories: TaskCategory[];
  taskOptions: TaskItem[];
  tasks: TaskItem[];
}

function toRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as LooseRecord;
}

function toTokenUsageBreakdown(value: unknown) {
  const record = toRecord(value);
  return {
    inputTokens: Number(record.inputTokens) || 0,
    cachedInputTokens: Number(record.cachedInputTokens) || 0,
    outputTokens: Number(record.outputTokens) || 0,
    reasoningOutputTokens: Number(record.reasoningOutputTokens) || 0,
    totalTokens: Number(record.totalTokens) || 0,
  };
}

function toActor(value: unknown): Actor | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const kind = String(record.kind || "").trim();
  const displayName = String(record.displayName || "").trim();
  if (!id || (kind !== "agent" && kind !== "user") || !displayName) {
    return null;
  }
  return {
    id,
    kind,
    displayName,
    agentId: String(record.agentId || "").trim() || null,
    userId: String(record.userId || "").trim() || null,
    email: String(record.email || "").trim() || null,
  };
}

function toTaskComment(value: unknown): TaskComment | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  if (!id) {
    return null;
  }
  return {
    id,
    taskId: String(record.taskId || "").trim() || null,
    comment: String(record.comment || "").trim(),
    authorActorId: String(record.authorActorId || "").trim() || null,
    authorActor: toActor(record.authorActor),
    createdAt: String(record.createdAt || "").trim() || null,
    updatedAt: String(record.updatedAt || "").trim() || null,
  };
}

function toTaskRun(value: unknown): TaskRun | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const taskId = String(record.taskId || "").trim();
  const status = String(record.status || "").trim();
  if (!id || !taskId || !status) {
    return null;
  }
  return {
    id,
    taskId,
    status,
    threadId: String(record.threadId || "").trim() || null,
    agentId: String(record.agentId || "").trim() || null,
    triggeredByActorId: String(record.triggeredByActorId || "").trim() || null,
    failureMessage: String(record.failureMessage || "").trim() || null,
    startedAt: String(record.startedAt || "").trim() || null,
    finishedAt: String(record.finishedAt || "").trim() || null,
    createdAt: String(record.createdAt || "").trim() || null,
    updatedAt: String(record.updatedAt || "").trim() || null,
    tokenUsage: toTokenUsageBreakdown(record.tokenUsage),
  };
}

function toTaskItem(value: unknown): TaskItem | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const name = String(record.name || "").trim();
  if (!id || !name) {
    return null;
  }
  const assigneeActor = toActor(record.assigneeActor);
  const runs = Array.isArray(record.runs)
    ? record.runs.map((entry) => toTaskRun(entry)).filter((entry): entry is TaskRun => Boolean(entry))
    : [];
  const latestRun = toTaskRun(record.latestRun);
  const activeRun = toTaskRun(record.activeRun);
  const runningThreadId = String(record.runningThreadId || "").trim() || null;
  const effectiveThreadId = String(activeRun?.threadId || latestRun?.threadId || record.threadId || "").trim() || null;
  return {
    id,
    companyId: String(toRecord(record.company).id || "").trim() || undefined,
    name,
    category: String(record.category || "").trim() || null,
    description: String(record.description || "").trim() || "",
    acceptanceCriteria: String(record.acceptanceCriteria || "").trim() || "",
    assigneeActorId: String(record.assigneeActorId || "").trim() || null,
    assigneeActor,
    assigneeAgentId: assigneeActor?.agentId || null,
    runningThreadId,
    threadId: effectiveThreadId,
    parentTaskId: String(record.parentTaskId || "").trim() || null,
    status: String(record.status || "").trim() || "draft",
    createdAt: String(record.createdAt || "").trim() || null,
    updatedAt: String(record.updatedAt || "").trim() || null,
    runs,
    latestRun,
    activeRun,
    hasRunningThreads: Boolean(record.has_running_threads),
    attemptCount: Number.isInteger(record.attemptCount) ? Number(record.attemptCount) : runs.length,
    lastRunStatus: String(record.lastRunStatus || "").trim() || latestRun?.status || null,
    tokenUsage: toTokenUsageBreakdown(record.tokenUsage),
    aggregateTokenUsage: toTokenUsageBreakdown(record.aggregateTokenUsage),
    dependencyTaskIds: Array.isArray(record.dependencyTaskIds)
      ? record.dependencyTaskIds.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [],
    comments: Array.isArray(record.comments)
      ? record.comments.map((entry) => toTaskComment(entry)).filter((entry): entry is TaskComment => Boolean(entry))
      : [],
  };
}

function toTaskCategory(value: unknown): TaskCategory | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const name = String(record.name || "").trim();
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    createdAt: String(record.createdAt || "").trim() || null,
    updatedAt: String(record.updatedAt || "").trim() || null,
  };
}

function toTaskOption(value: unknown): TaskItem | null {
  const record = toRecord(value);
  const id = String(record.taskId || record.id || "").trim();
  const name = String(record.name || "").trim();
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    parentTaskId: String(record.parentTaskId || "").trim() || null,
  };
}

function toAgent(value: unknown): Agent | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const name = String(record.name || "").trim();
  if (!id || !name) {
    return null;
  }
  return { id, name };
}

export function toTaskRouteViewModel(value: unknown): TaskRouteViewModel {
  const record = toRecord(value);
  const tasks = Array.isArray(record.tasks)
    ? record.tasks.map((entry) => toTaskItem(entry)).filter((entry): entry is TaskItem => Boolean(entry))
    : [];
  const taskOptions = Array.isArray(record.taskOptions)
    ? record.taskOptions.map((entry) => toTaskOption(entry)).filter((entry): entry is TaskItem => Boolean(entry))
    : [];
  const taskCategories = Array.isArray(record.taskCategories)
    ? record.taskCategories
      .map((entry) => toTaskCategory(entry))
      .filter((entry): entry is TaskCategory => Boolean(entry))
    : [];
  const actors = Array.isArray(record.taskAssignableActors)
    ? record.taskAssignableActors
      .map((entry) => toActor(entry))
      .filter((entry): entry is Actor => Boolean(entry))
    : [];
  const agentEdges = Array.isArray(toRecord(record.agents).edges) ? toRecord(record.agents).edges as unknown[] : [];
  const agents = agentEdges
    .map((entry) => toAgent(toRecord(entry).node))
    .filter((entry): entry is Agent => Boolean(entry));

  return {
    tasks,
    taskOptions,
    taskCategories,
    actors,
    agents,
    relationshipDrafts: createRelationshipDrafts(tasks, taskOptions) as TaskRelationshipDraftById,
  };
}

export function shouldRefetchTaskRoute(params: {
  membershipChanged?: boolean | null;
  deletedTaskIds?: string[] | null;
  activeTaskId?: string | null;
}) {
  if (params.membershipChanged) {
    return true;
  }
  const normalizedActiveTaskId = String(params.activeTaskId || "").trim();
  if (!normalizedActiveTaskId) {
    return true;
  }
  if (Array.isArray(params.deletedTaskIds)
    && params.deletedTaskIds.some((taskId) => String(taskId || "").trim() === normalizedActiveTaskId)) {
    return true;
  }
  return true;
}
