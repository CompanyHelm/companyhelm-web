import { useMemo } from "react";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.jsx";
import { isChatSessionRunning, compareTurnsByTimestamp } from "../utils/chat.js";
import { formatTimestamp } from "../utils/formatting.js";

export function ChatsOverviewPage({
  selectedCompanyId,
  agents,
  chatSessionsByAgent,
  chatSessionRunningById,
  isLoadingChatIndex,
  chatIndexError,
  isCreatingChatSession,
  deletingChatSessionKey,
  onRefreshChatLists,
  onCreateChatForAgent,
  getCreateChatDisabledReason,
  onOpenChat,
  onDeleteChat,
}) {
  const sortedAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent, rightAgent) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Chats</h1>
        <p className="subcopy">Browse all agents and open chats from a single page.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Agent chats</h2>
          <button type="button" className="secondary-btn" onClick={onRefreshChatLists}>
            Refresh
          </button>
        </header>
        {chatIndexError ? <p className="error-banner">Chat error: {chatIndexError}</p> : null}
        {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
        {!isLoadingChatIndex && sortedAgents.length === 0 ? (
          <p className="empty-hint">No agents available yet.</p>
        ) : null}
        {sortedAgents.length > 0 ? (
          <ul className="task-list">
            {sortedAgents.map((agent) => {
              const agentChats = Array.isArray(chatSessionsByAgent?.[agent.id])
                ? chatSessionsByAgent[agent.id]
                : [];
              const createChatDisabledReason = String(getCreateChatDisabledReason?.(agent.id) || "").trim();
              const isCreateChatDisabled = isCreatingChatSession || Boolean(createChatDisabledReason);
              const sortedChats = [...agentChats].sort((leftChat, rightChat) =>
                compareTurnsByTimestamp(
                  { createdAt: leftChat?.updatedAt, id: leftChat?.id },
                  { createdAt: rightChat?.updatedAt, id: rightChat?.id },
                ),
              );
              const hasChats = sortedChats.length > 0;
              const modelLabel = String(agent.model || "").trim() || "n/a";
              return (
                <li key={`chat-agent-${agent.id}`} className="task-card">
                  <div className="task-card-top">
                    <strong>{agent.name}</strong>
                    <code className="runner-id">{agent.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    SDK: <strong>{agent.agentSdk}</strong> · model: <strong>{modelLabel}</strong>
                  </p>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onCreateChatForAgent(agent.id)}
                      disabled={isCreateChatDisabled}
                      title={createChatDisabledReason || undefined}
                    >
                      {isCreatingChatSession ? "Creating..." : "New chat"}
                    </button>
                  </div>
                  {createChatDisabledReason ? <p className="empty-hint">{createChatDisabledReason}</p> : null}
                  {!hasChats ? <p className="empty-hint">No chats yet for this agent.</p> : null}
                  {hasChats ? (
                    <ul className="chat-card-list">
                      {sortedChats.map((chatSession) => {
                        const isRunning = isChatSessionRunning(chatSession, chatSessionRunningById);
                        const chatSessionKey = `${agent.id}:${chatSession.id}`;
                        const isDeletingChat = deletingChatSessionKey === chatSessionKey;
                        const sessionModelLabel =
                          String(chatSession?.currentModelName || chatSession?.currentModelId || "").trim() || "n/a";
                        const reasoningLabel = String(chatSession?.currentReasoningLevel || "").trim() || "n/a";
                        return (
                          <li
                            key={`chat-session-${agent.id}-${chatSession.id}`}
                            className="chat-card"
                            onClick={() =>
                              !isDeletingChat && onOpenChat({
                                agentId: agent.id,
                                sessionId: chatSession.id,
                                sessionsForAgent: sortedChats,
                              })
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !isDeletingChat) {
                                onOpenChat({
                                  agentId: agent.id,
                                  sessionId: chatSession.id,
                                  sessionsForAgent: sortedChats,
                                });
                              }
                            }}
                          >
                            <div className="chat-card-main">
                              <p className="chat-card-title">
                                <strong>{chatSession.title || "Untitled chat"}</strong>
                                {isRunning ? <ChatSessionRunningBadge /> : null}
                              </p>
                              <p className="chat-card-meta">
                                {formatTimestamp(chatSession.updatedAt)} · {sessionModelLabel} · {reasoningLabel}
                              </p>
                            </div>
                            <div className="chat-card-actions">
                              <button
                                type="button"
                                className="chat-card-icon-btn chat-card-icon-btn-danger"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeleteChat({
                                    agentId: agent.id,
                                    sessionId: chatSession.id,
                                    title: chatSession.title,
                                  });
                                }}
                                disabled={isDeletingChat}
                                aria-label={isDeletingChat ? "Deleting..." : "Delete chat"}
                                title={isDeletingChat ? "Deleting..." : "Delete chat"}
                              >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
