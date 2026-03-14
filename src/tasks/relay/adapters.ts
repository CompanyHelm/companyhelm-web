import { createRelationshipDrafts } from "../../utils/drafts.ts";
import type {
  Agent,
  Actor,
  TaskComment,
  TaskItem,
  TaskRelationshipDraftById,
} from "../../types/domain.ts";

type LooseRecord = Record<string, unknown>;

interface TaskRouteViewModel {
  agents: Agent[];
  actors: Actor[];
  relationshipDrafts: TaskRelationshipDraftById;
  taskOptions: TaskItem[];
  tasks: TaskItem[];
}

function toRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as LooseRecord;
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

function toTaskItem(value: unknown): TaskItem | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
  const name = String(record.name || "").trim();
  if (!id || !name) {
    return null;
  }
  const assigneeActor = toActor(record.assigneeActor);
  return {
    id,
    companyId: String(toRecord(record.company).id || "").trim() || undefined,
    name,
    description: String(record.description || "").trim() || "",
    acceptanceCriteria: String(record.acceptanceCriteria || "").trim() || "",
    assigneeActorId: String(record.assigneeActorId || "").trim() || null,
    assigneeActor,
    assigneeAgentId: assigneeActor?.agentId || null,
    threadId: String(record.threadId || "").trim() || null,
    parentTaskId: String(record.parentTaskId || "").trim() || null,
    status: String(record.status || "").trim() || "draft",
    createdAt: String(record.createdAt || "").trim() || null,
    updatedAt: String(record.updatedAt || "").trim() || null,
    dependencyTaskIds: Array.isArray(record.dependencyTaskIds)
      ? record.dependencyTaskIds.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [],
    comments: Array.isArray(record.comments)
      ? record.comments.map((entry) => toTaskComment(entry)).filter((entry): entry is TaskComment => Boolean(entry))
      : [],
  };
}

function toTaskOption(value: unknown): TaskItem | null {
  const record = toRecord(value);
  const id = String(record.id || "").trim();
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
    return false;
  }
  return Array.isArray(params.deletedTaskIds)
    && params.deletedTaskIds.some((taskId) => String(taskId || "").trim() === normalizedActiveTaskId);
}
