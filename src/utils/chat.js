import { toSortableTimestamp, normalizeChatStatus } from "./formatting.js";

export function hasRunningChatTurns(turns) {
  return (Array.isArray(turns) ? turns : []).some((turn) => normalizeChatStatus(turn?.status) === "running");
}

export function getLatestRunningChatTurn(turns) {
  const runningTurns = (Array.isArray(turns) ? turns : []).filter(
    (turn) => normalizeChatStatus(turn?.status) === "running",
  );
  if (runningTurns.length === 0) {
    return null;
  }
  return [...runningTurns].sort(compareTurnsByTimestamp).at(-1) || null;
}

export function isChatSessionRunning(session, chatSessionRunningById) {
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

export function parseCodexStreamPayload(message) {
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

export function getCodexStreamEventType(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const topLevelType = String(payload.type || "").trim().toLowerCase();
  if (topLevelType === "item" && payload.item && typeof payload.item === "object") {
    return String(payload.item.type || "").trim().toLowerCase() || topLevelType;
  }
  return topLevelType;
}

export function getCodexStreamTurnKey(payload) {
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

export function flattenCodexStreamText(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map((entry) => flattenCodexStreamText(entry)).filter(Boolean).join("\n").trim();
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

export function getCodexStreamDisplayText(payload) {
  const text = flattenCodexStreamText(payload);
  if (text) {
    return text;
  }
  return JSON.stringify(payload, null, 2);
}

export function getActiveCodexTurnKeys(chatMessages) {
  const activeTurnKeys = new Set();
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

export function compareTurnsByTimestamp(a, b) {
  const leftTime = toSortableTimestamp(a?.createdAt || a?.startedAt);
  const rightTime = toSortableTimestamp(b?.createdAt || b?.startedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

export function compareTurnItemsByStartedAt(a, b) {
  const leftTime = toSortableTimestamp(a?.startedAt || a?.createdAt || a?.endedAt);
  const rightTime = toSortableTimestamp(b?.startedAt || b?.createdAt || b?.endedAt);
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

export function isSameChatSelection({
  currentAgentId = "",
  currentSessionId = "",
  nextAgentId = "",
  nextSessionId = "",
} = {}) {
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

export function getSortedTurnItems(turn) {
  const turnItems = Array.isArray(turn?.items) ? turn.items : [];
  return [...turnItems].sort(compareTurnItemsByStartedAt);
}

export function selectVisibleTurnsByMessageCount(chatTurns, visibleMessageCount) {
  const normalizedTurns = Array.isArray(chatTurns) ? chatTurns : [];
  const totalMessageCount = normalizedTurns.reduce((count, turn) => {
    return count + getSortedTurnItems(turn).length;
  }, 0);
  const startMessageIndex = Math.max(0, totalMessageCount - Math.max(0, visibleMessageCount));

  let itemCursor = 0;
  const visibleTurns = [];
  for (const turn of normalizedTurns) {
    const turnItems = getSortedTurnItems(turn);
    const visibleItems = [];
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
