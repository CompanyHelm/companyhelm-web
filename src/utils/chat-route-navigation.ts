import { compareTurnsByTimestamp } from "./chat.ts";
import { getChatsPath } from "./path.ts";

interface ChatAgentLike {
  id?: string;
  name?: string;
}

interface ChatSessionLike {
  id?: string;
  updatedAt?: string;
}

type SessionsByAgent = Record<string, ChatSessionLike[]>;

function normalizeId(value: unknown): string {
  return String(value || "").trim();
}

function sortAgentsForChatNavigation(agentList: unknown): ChatAgentLike[] {
  return [...(Array.isArray(agentList) ? agentList : [])].sort((leftAgent: ChatAgentLike, rightAgent: ChatAgentLike) => {
    const leftName = String(leftAgent?.name || "");
    const rightName = String(rightAgent?.name || "");
    const byName = leftName.localeCompare(rightName);
    if (byName !== 0) {
      return byName;
    }
    return normalizeId(leftAgent?.id).localeCompare(normalizeId(rightAgent?.id));
  });
}

function sortChatSessionsForChatNavigation(sessionList: unknown): ChatSessionLike[] {
  return [...(Array.isArray(sessionList) ? sessionList : [])].sort((leftChat: ChatSessionLike, rightChat: ChatSessionLike) =>
    compareTurnsByTimestamp(
      { createdAt: leftChat?.updatedAt, id: leftChat?.id },
      { createdAt: rightChat?.updatedAt, id: rightChat?.id },
    ),
  );
}

export function buildImmediateChatsPath({
  agentId = "",
  threadId = "",
}: {
  agentId?: unknown;
  threadId?: unknown;
} = {}): string {
  return getChatsPath({
    agentId: normalizeId(agentId),
    threadId: normalizeId(threadId),
  });
}

export function findAgentIdForChatThread({
  threadId = "",
  sessionsByAgent = {},
}: {
  threadId?: unknown;
  sessionsByAgent?: unknown;
} = {}): string {
  const resolvedThreadId = normalizeId(threadId);
  if (!resolvedThreadId || !sessionsByAgent || typeof sessionsByAgent !== "object") {
    return "";
  }

  for (const [agentId, sessions] of Object.entries(sessionsByAgent as SessionsByAgent)) {
    const resolvedAgentId = normalizeId(agentId);
    if (!resolvedAgentId) {
      continue;
    }
    const hasThread = (Array.isArray(sessions) ? sessions : []).some(
      (session) => normalizeId(session?.id) === resolvedThreadId,
    );
    if (hasThread) {
      return resolvedAgentId;
    }
  }

  return "";
}

export function resolveLoadedChatsRoute({
  requestedAgentId = "",
  requestedThreadId = "",
  availableAgents = [],
  sessionsByAgent = {},
  openFirstThread = false,
  forceList = false,
}: {
  requestedAgentId?: unknown;
  requestedThreadId?: unknown;
  availableAgents?: unknown;
  sessionsByAgent?: unknown;
  openFirstThread?: unknown;
  forceList?: unknown;
} = {}) {
  const resolvedRequestedAgentId = normalizeId(requestedAgentId);
  const resolvedRequestedThreadId = normalizeId(requestedThreadId);
  const resolvedSessionsByAgent = (
    sessionsByAgent && typeof sessionsByAgent === "object" ? sessionsByAgent : {}
  ) as SessionsByAgent;
  const agentIdFromThread = findAgentIdForChatThread({
    threadId: resolvedRequestedThreadId,
    sessionsByAgent: resolvedSessionsByAgent,
  });
  const sortedAgents = sortAgentsForChatNavigation(availableAgents);

  let targetAgentId = resolvedRequestedAgentId || agentIdFromThread || normalizeId(sortedAgents[0]?.id);
  if (!targetAgentId) {
    return {
      agentId: "",
      threadId: "",
      path: "/agents",
    };
  }

  let sessionsForAgent = sortChatSessionsForChatNavigation(resolvedSessionsByAgent[targetAgentId]);
  const requestedThreadExists = resolvedRequestedThreadId
    && sessionsForAgent.some((session) => normalizeId(session?.id) === resolvedRequestedThreadId);

  if (!requestedThreadExists && agentIdFromThread && agentIdFromThread !== targetAgentId) {
    targetAgentId = agentIdFromThread;
    sessionsForAgent = sortChatSessionsForChatNavigation(resolvedSessionsByAgent[targetAgentId]);
  }

  if (resolvedRequestedThreadId) {
    const hasRequestedSession = sessionsForAgent.some(
      (session) => normalizeId(session?.id) === resolvedRequestedThreadId,
    );
    if (hasRequestedSession) {
      return {
        agentId: targetAgentId,
        threadId: resolvedRequestedThreadId,
        path: getChatsPath({ agentId: targetAgentId, threadId: resolvedRequestedThreadId }),
      };
    }
  }

  if (Boolean(forceList) || !Boolean(openFirstThread)) {
    return {
      agentId: targetAgentId,
      threadId: "",
      path: getChatsPath({ agentId: targetAgentId }),
    };
  }

  const firstSessionId = normalizeId(sessionsForAgent[0]?.id);
  if (firstSessionId) {
    return {
      agentId: targetAgentId,
      threadId: firstSessionId,
      path: getChatsPath({ agentId: targetAgentId, threadId: firstSessionId }),
    };
  }

  return {
    agentId: targetAgentId,
    threadId: "",
    path: getChatsPath({ agentId: targetAgentId }),
  };
}
