import { toSortableTimestamp, normalizeChatStatus } from "./formatting.ts";

type LooseRecord = Record<string, unknown>;
type SessionMap = Record<string, unknown[]>;

interface ChatTurnLike extends LooseRecord {
  id?: string;
  status?: string;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  items?: ChatTurnItemLike[];
}

interface ChatTurnItemLike extends LooseRecord {
  id?: string;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
}

interface ChatMessageLike extends LooseRecord {
  role?: string;
  text?: string;
}

function toRecord(value: unknown): LooseRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as LooseRecord;
}

function toTurn(value: unknown): ChatTurnLike {
  return toRecord(value) as ChatTurnLike;
}

function toTurnItem(value: unknown): ChatTurnItemLike {
  return toRecord(value) as ChatTurnItemLike;
}

export function hasRunningChatTurns(turns: unknown): boolean {
  return (Array.isArray(turns) ? turns : []).some((turn) => normalizeChatStatus(toTurn(turn)?.status) === "running");
}

export function mergeChatSessionsByAgentSnapshot({
  currentSessionsByAgent,
  snapshotSessionsByAgent,
  knownAgentIds,
}: {
  currentSessionsByAgent?: unknown;
  snapshotSessionsByAgent?: unknown;
  knownAgentIds?: unknown;
} = {}): SessionMap {
  const currentByAgent = (
    currentSessionsByAgent && typeof currentSessionsByAgent === "object"
      ? currentSessionsByAgent
      : {}
  ) as SessionMap;
  const snapshotByAgent = (
    snapshotSessionsByAgent && typeof snapshotSessionsByAgent === "object"
      ? snapshotSessionsByAgent
      : {}
  ) as SessionMap;
  const nextByAgent: SessionMap = { ...currentByAgent };

  for (const [rawAgentId, sessions] of Object.entries(snapshotByAgent)) {
    const agentId = String(rawAgentId || "").trim();
    if (!agentId) {
      continue;
    }
    nextByAgent[agentId] = Array.isArray(sessions) ? sessions : [];
  }

  for (const rawKnownAgentId of Array.isArray(knownAgentIds) ? knownAgentIds : []) {
    const knownAgentId = String(rawKnownAgentId || "").trim();
    if (!knownAgentId) {
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(nextByAgent, knownAgentId)) {
      nextByAgent[knownAgentId] = [];
    }
  }

  return nextByAgent;
}

export function getLatestRunningChatTurn(turns: unknown): ChatTurnLike | null {
  const runningTurns = (Array.isArray(turns) ? turns : []).filter(
    (turn) => normalizeChatStatus(toTurn(turn)?.status) === "running",
  );
  if (runningTurns.length === 0) {
    return null;
  }
  return toTurn([...runningTurns].sort(compareTurnsByTimestamp).at(-1));
}

export function getLatestChatTurn(turns: unknown): ChatTurnLike | null {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  if (normalizedTurns.length === 0) {
    return null;
  }
  return toTurn([...normalizedTurns].sort(compareTurnsByTimestamp).at(-1));
}

export function isChatSessionRunning(session: unknown, chatSessionRunningById: Record<string, boolean>): boolean {
  const sessionRecord = toRecord(session);
  if (!sessionRecord || Object.keys(sessionRecord).length === 0) {
    return false;
  }
  const normalizedSessionStatus = String(sessionRecord.status || "").trim().toLowerCase();
  if (normalizedSessionStatus === "running") {
    return true;
  }
  const sessionId = String(sessionRecord.id || "").trim();
  return Boolean(sessionId && chatSessionRunningById?.[sessionId]);
}

const CODEX_STREAM_DEFAULT_TURN_KEY = "__default_turn__";
const CODEX_TURN_COMPLETION_TYPES = new Set([
  "turn.completed",
  "turn.failed",
  "turn.cancelled",
  "turn.error",
]);

export function parseCodexStreamPayload(message: unknown): LooseRecord | null {
  const messageRecord = toRecord(message) as ChatMessageLike;
  if (String(messageRecord.role || "").trim().toLowerCase() !== "llm") {
    return null;
  }
  const rawContent = String(messageRecord.text || "").trim();
  if (!rawContent.startsWith("{") || !rawContent.endsWith("}")) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as LooseRecord;
  } catch {
    return null;
  }
}

export function getCodexStreamEventType(payload: unknown): string {
  const payloadRecord = toRecord(payload);
  if (!payloadRecord || Object.keys(payloadRecord).length === 0) {
    return "";
  }
  const topLevelType = String(payloadRecord.type || "").trim().toLowerCase();
  const itemRecord = toRecord(payloadRecord.item);
  if (topLevelType === "item" && Object.keys(itemRecord).length > 0) {
    return String(itemRecord.type || "").trim().toLowerCase() || topLevelType;
  }
  return topLevelType;
}

export function getCodexStreamTurnKey(payload: unknown): string {
  const payloadRecord = toRecord(payload);
  if (!payloadRecord || Object.keys(payloadRecord).length === 0) {
    return CODEX_STREAM_DEFAULT_TURN_KEY;
  }
  const payloadTurn = toRecord(payloadRecord.turn);
  const payloadItem = toRecord(payloadRecord.item);
  const candidates = [
    payloadRecord.turn_id,
    payloadRecord.turnId,
    payloadRecord.id,
    payloadTurn.id,
    payloadItem.turn_id,
    payloadItem.turnId,
  ];
  for (const candidate of candidates) {
    const cleaned = String(candidate || "").trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return CODEX_STREAM_DEFAULT_TURN_KEY;
}

export function flattenCodexStreamText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => flattenCodexStreamText(entry)).filter(Boolean).join("\n").trim();
  }
  const valueRecord = toRecord(value);
  if (!valueRecord || Object.keys(valueRecord).length === 0) {
    return "";
  }

  const directFields = [
    "text",
    "message",
    "output_text",
    "content",
    "delta",
    "summary",
    "reasoning",
  ];
  for (const fieldName of directFields) {
    if (!(fieldName in valueRecord)) {
      continue;
    }
    const text = flattenCodexStreamText(valueRecord[fieldName]);
    if (text) {
      return text;
    }
  }
  return "";
}

export function getCodexStreamDisplayText(payload: unknown): string {
  const text = flattenCodexStreamText(payload);
  if (text) {
    return text;
  }
  return JSON.stringify(payload, null, 2);
}

export function getActiveCodexTurnKeys(chatMessages: unknown): Set<string> {
  const activeTurnKeys = new Set<string>();
  for (const message of Array.isArray(chatMessages) ? chatMessages : []) {
    const payload = parseCodexStreamPayload(message);
    if (!payload) {
      continue;
    }
    const eventType = getCodexStreamEventType(payload);
    if (!eventType) {
      continue;
    }
    const turnKey = getCodexStreamTurnKey(payload);
    if (eventType === "turn.started") {
      activeTurnKeys.add(turnKey);
      continue;
    }
    if (CODEX_TURN_COMPLETION_TYPES.has(eventType)) {
      activeTurnKeys.delete(turnKey);
    }
  }
  return activeTurnKeys;
}

export function compareTurnsByTimestamp(a: unknown, b: unknown): number {
  const leftTurn = toTurn(a);
  const rightTurn = toTurn(b);
  const leftTime = toSortableTimestamp(leftTurn.createdAt || leftTurn.startedAt);
  const rightTime = toSortableTimestamp(rightTurn.createdAt || rightTurn.startedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(leftTurn.id || "").localeCompare(String(rightTurn.id || ""));
}

export function compareTurnItemsByStartedAt(a: unknown, b: unknown): number {
  const leftItem = toTurnItem(a);
  const rightItem = toTurnItem(b);
  const leftTime = toSortableTimestamp(leftItem.startedAt || leftItem.createdAt || leftItem.endedAt);
  const rightTime = toSortableTimestamp(rightItem.startedAt || rightItem.createdAt || rightItem.endedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(leftItem.id || "").localeCompare(String(rightItem.id || ""));
}

export function getTurnLifecycleSignature(turns: unknown): string {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  if (normalizedTurns.length === 0) {
    return "";
  }
  return [...normalizedTurns]
    .sort(compareTurnsByTimestamp)
    .map((turn) => {
      const turnRecord = toTurn(turn);
      const turnId = String(turnRecord.id || "").trim();
      const status = normalizeChatStatus(turnRecord.status);
      const startedAt = String(turnRecord.startedAt || "").trim();
      const endedAt = String(turnRecord.endedAt || "").trim();
      return `${turnId}:${status}:${startedAt}:${endedAt}`;
    })
    .join("|");
}

export function updateQueuedMessagesFromTurnSubscription({
  queuedMessages,
  previousLatestTurnId,
  nextTurns,
}: {
  queuedMessages?: unknown;
  previousLatestTurnId?: unknown;
  nextTurns?: unknown;
} = {}) {
  const queueSnapshot = Array.isArray(queuedMessages) ? queuedMessages : [];
  const priorLatestTurnId = String(previousLatestTurnId || "").trim();
  const nextLatestTurnId = String(getLatestChatTurn(nextTurns)?.id || "").trim();
  const shouldDequeueOldestMessage =
    queueSnapshot.length > 0
    && Boolean(nextLatestTurnId)
    && nextLatestTurnId !== priorLatestTurnId;

  return {
    nextLatestTurnId,
    nextQueuedMessages: shouldDequeueOldestMessage ? queueSnapshot.slice(1) : queueSnapshot,
  };
}

export function isSameChatSelection({
  currentAgentId = "",
  currentSessionId = "",
  nextAgentId = "",
  nextSessionId = "",
}: {
  currentAgentId?: unknown;
  currentSessionId?: unknown;
  nextAgentId?: unknown;
  nextSessionId?: unknown;
} = {}): boolean {
  const resolvedCurrentAgentId = String(currentAgentId || "").trim();
  const resolvedCurrentSessionId = String(currentSessionId || "").trim();
  const resolvedNextAgentId = String(nextAgentId || "").trim();
  const resolvedNextSessionId = String(nextSessionId || "").trim();

  if (
    !resolvedCurrentAgentId
    || !resolvedCurrentSessionId
    || !resolvedNextAgentId
    || !resolvedNextSessionId
  ) {
    return false;
  }

  return (
    resolvedCurrentAgentId === resolvedNextAgentId
    && resolvedCurrentSessionId === resolvedNextSessionId
  );
}

export function getSortedTurnItems(turn: unknown): ChatTurnItemLike[] {
  const turnRecord = toTurn(turn);
  const turnItems = Array.isArray(turnRecord.items) ? turnRecord.items : [];
  return [...turnItems].sort(compareTurnItemsByStartedAt);
}

export function selectVisibleTurnsByMessageCount(chatTurns: unknown, visibleMessageCount: number) {
  const normalizedTurns = Array.isArray(chatTurns) ? chatTurns : [];
  const totalMessageCount = normalizedTurns.reduce((count, turn) => {
    return count + getSortedTurnItems(turn).length;
  }, 0);
  const startMessageIndex = Math.max(0, totalMessageCount - Math.max(0, visibleMessageCount));

  let itemCursor = 0;
  const visibleTurns: Array<ChatTurnLike & { items: ChatTurnItemLike[] }> = [];
  for (const turn of normalizedTurns) {
    const turnItems = getSortedTurnItems(turn);
    const visibleItems: ChatTurnItemLike[] = [];
    for (const item of turnItems) {
      if (itemCursor >= startMessageIndex) {
        visibleItems.push(item);
      }
      itemCursor += 1;
    }

    if (visibleItems.length > 0 || (turnItems.length === 0 && itemCursor >= startMessageIndex)) {
      visibleTurns.push({ ...toTurn(turn), items: visibleItems });
    }
  }

  return {
    visibleTurns,
    totalMessageCount,
  };
}
