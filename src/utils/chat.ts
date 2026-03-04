import { toSortableTimestamp, normalizeChatStatus } from "./formatting.ts";

export function hasRunningChatTurns(turns: any) {
  return (Array.isArray(turns) ? turns : []).some((turn: any) => normalizeChatStatus(turn?.status) === "running");
}

export function mergeChatSessionsByAgentSnapshot({
  currentSessionsByAgent,
  snapshotSessionsByAgent,
  knownAgentIds
}: any = {}) {
  const currentByAgent =
    currentSessionsByAgent && typeof currentSessionsByAgent === "object"
      ? currentSessionsByAgent
      : {};
  const snapshotByAgent =
    snapshotSessionsByAgent && typeof snapshotSessionsByAgent === "object"
      ? snapshotSessionsByAgent
      : {};
  const nextByAgent = { ...currentByAgent };

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

export function getLatestRunningChatTurn(turns: any) {
  const runningTurns = (Array.isArray(turns) ? turns : []).filter(
    (turn: any) => normalizeChatStatus(turn?.status) === "running",
  );
  if (runningTurns.length === 0) {
    return null;
  }
  return [...runningTurns].sort(compareTurnsByTimestamp).at(-1) || null;
}

export function isChatSessionRunning(session: any, chatSessionRunningById: any) {
  if (!session) {
    return false;
  }
  const normalizedSessionStatus = String(session.status || "").trim().toLowerCase();
  if (normalizedSessionStatus === "running") {
    return true;
  }
  if (normalizedSessionStatus === "ready") {
    return false;
  }
  const sessionId = String(session.id || "").trim();
  return Boolean(sessionId && chatSessionRunningById?.[sessionId]);
}

const CODEX_STREAM_DEFAULT_TURN_KEY = "__default_turn__";
const CODEX_TURN_COMPLETION_TYPES = new Set([
  "turn.completed",
  "turn.failed",
  "turn.cancelled",
  "turn.error",
]);

export function parseCodexStreamPayload(message: any) {
  if (String(message?.role || "").trim().toLowerCase() !== "llm") {
    return null;
  }
  const rawContent = String(message?.text || "").trim();
  if (!rawContent.startsWith("{") || !rawContent.endsWith("}")) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getCodexStreamEventType(payload: any) {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const topLevelType = String(payload.type || "").trim().toLowerCase();
  if (topLevelType === "item" && payload.item && typeof payload.item === "object") {
    return String(payload.item.type || "").trim().toLowerCase() || topLevelType;
  }
  return topLevelType;
}

export function getCodexStreamTurnKey(payload: any) {
  if (!payload || typeof payload !== "object") {
    return CODEX_STREAM_DEFAULT_TURN_KEY;
  }
  const candidates = [
    payload.turn_id,
    payload.turnId,
    payload.id,
    payload.turn?.id,
    payload.item?.turn_id,
    payload.item?.turnId,
  ];
  for (const candidate of candidates) {
    const cleaned = String(candidate || "").trim();
    if (cleaned) {
      return cleaned;
    }
  }
  return CODEX_STREAM_DEFAULT_TURN_KEY;
}

export function flattenCodexStreamText(value: any): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map((entry: any) => flattenCodexStreamText(entry)).filter(Boolean).join("\n").trim();
  }
  if (!value || typeof value !== "object") {
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
    if (!(fieldName in value)) {
      continue;
    }
    const text = flattenCodexStreamText(value[fieldName]);
    if (text) {
      return text;
    }
  }
  return "";
}

export function getCodexStreamDisplayText(payload: any) {
  const text = flattenCodexStreamText(payload);
  if (text) {
    return text;
  }
  return JSON.stringify(payload, null, 2);
}

export function getActiveCodexTurnKeys(chatMessages: any) {
  const activeTurnKeys = new Set<any>();
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

export function compareTurnsByTimestamp(a: any, b: any) {
  const leftTime = toSortableTimestamp(a?.createdAt || a?.startedAt);
  const rightTime = toSortableTimestamp(b?.createdAt || b?.startedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

export function compareTurnItemsByStartedAt(a: any, b: any) {
  const leftTime = toSortableTimestamp(a?.startedAt || a?.createdAt || a?.endedAt);
  const rightTime = toSortableTimestamp(b?.startedAt || b?.createdAt || b?.endedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

export function getTurnLifecycleSignature(turns: any) {
  const normalizedTurns = Array.isArray(turns) ? turns : [];
  if (normalizedTurns.length === 0) {
    return "";
  }
  return [...normalizedTurns]
    .sort(compareTurnsByTimestamp)
    .map((turn: any) => {
      const turnId = String(turn?.id || "").trim();
      const status = normalizeChatStatus(turn?.status);
      const startedAt = String(turn?.startedAt || "").trim();
      const endedAt = String(turn?.endedAt || "").trim();
      return `${turnId}:${status}:${startedAt}:${endedAt}`;
    })
    .join("|");
}

export function updateQueuedMessagesFromTurnSubscription({
  queuedMessages,
  previousRunningTurnId,
  nextTurns
}: any = {}) {
  const queueSnapshot = Array.isArray(queuedMessages) ? queuedMessages : [];
  const priorRunningTurnId = String(previousRunningTurnId || "").trim();
  const nextRunningTurnId = String(getLatestRunningChatTurn(nextTurns)?.id || "").trim();
  const shouldDequeueOldestMessage =
    queueSnapshot.length > 0
    && Boolean(nextRunningTurnId)
    && nextRunningTurnId !== priorRunningTurnId;

  return {
    nextRunningTurnId,
    nextQueuedMessages: shouldDequeueOldestMessage ? queueSnapshot.slice(1) : queueSnapshot,
  };
}

export function isSameChatSelection({
  currentAgentId = "",
  currentSessionId = "",
  nextAgentId = "",
  nextSessionId = "",
}: any = {}) {
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

export function getSortedTurnItems(turn: any) {
  const turnItems = Array.isArray(turn?.items) ? turn.items : [];
  return [...turnItems].sort(compareTurnItemsByStartedAt);
}

export function selectVisibleTurnsByMessageCount(chatTurns: any, visibleMessageCount: any) {
  const normalizedTurns = Array.isArray(chatTurns) ? chatTurns : [];
  const totalMessageCount = normalizedTurns.reduce((count: any, turn: any) => {
    return count + getSortedTurnItems(turn).length;
  }, 0);
  const startMessageIndex = Math.max(0, totalMessageCount - Math.max(0, visibleMessageCount));

  let itemCursor = 0;
  const visibleTurns: any[] = [];
  for (const turn of normalizedTurns) {
    const turnItems = getSortedTurnItems(turn);
    const visibleItems: any[] = [];
    for (const item of turnItems) {
      if (itemCursor >= startMessageIndex) {
        visibleItems.push(item);
      }
      itemCursor += 1;
    }

    if (visibleItems.length > 0 || (turnItems.length === 0 && itemCursor >= startMessageIndex)) {
      visibleTurns.push({ ...turn, items: visibleItems });
    }
  }

  return {
    visibleTurns,
    totalMessageCount,
  };
}
