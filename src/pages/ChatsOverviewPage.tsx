import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.tsx";
import { ThreadTaskSummary } from "../components/ThreadTaskSummary.tsx";
import { isChatSessionRunning, compareTurnsByTimestamp } from "../utils/chat.ts";
import { formatTimestamp } from "../utils/formatting.ts";

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
}: any) {
  const sortedAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent: any, rightAgent: any) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        {chatIndexError ? <p className="error-banner">Chat error: {chatIndexError}</p> : null}
        {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
        {!isLoadingChatIndex && sortedAgents.length === 0 ? (
          <p className="empty-hint">No agents available yet.</p>
        ) : null}
        {sortedAgents.length > 0 ? (
          <ul className="chat-card-list">
            {sortedAgents.map((agent: any) => {
              const agentChats = Array.isArray(chatSessionsByAgent?.[agent.id])
                ? chatSessionsByAgent[agent.id]
                : [];
              const createChatDisabledReason = String(getCreateChatDisabledReason?.(agent.id) || "").trim();
              const isCreateChatDisabled = isCreatingChatSession || Boolean(createChatDisabledReason);
              const sortedChats = [...agentChats].sort((leftChat: any, rightChat: any) =>
                compareTurnsByTimestamp(
                  { createdAt: leftChat?.updatedAt, id: leftChat?.id },
                  { createdAt: rightChat?.updatedAt, id: rightChat?.id },
                ),
              );
              const hasChats = sortedChats.length > 0;
              const modelLabel = String(agent.model || "").trim() || "n/a";
              return (
                <li key={`chat-agent-${agent.id}`} className="chat-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title"><strong>{agent.name}</strong></p>
                    <p className="chat-card-meta">
                      {agent.agentSdk} · {modelLabel}
                    </p>
                  </div>
                  {createChatDisabledReason ? <p className="empty-hint">{createChatDisabledReason}</p> : null}
                  <ul className="chat-card-list">
                    <li
                      className="chat-card chat-card-new"
                      onClick={() => !isCreateChatDisabled && onCreateChatForAgent(agent.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event: any) => {
                        if (event.key === "Enter" && !isCreateChatDisabled) {
                          onCreateChatForAgent(agent.id);
                        }
                      }}
                    >
                      <div className="chat-card-main">
                        <p className="chat-card-title">
                          <svg viewBox="0 0 24 24" className="chat-card-new-icon" aria-hidden="true" focusable="false">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <strong>{isCreatingChatSession ? "Creating..." : "New chat"}</strong>
                        </p>
                      </div>
                    </li>
                    {sortedChats.map((chatSession: any) => {
                        const isRunning = isChatSessionRunning(chatSession, chatSessionRunningById);
                        const sessionStatus = String(chatSession?.status || "").trim().toLowerCase();
                        const isError = sessionStatus === "error";
                        const isDeletingSession = sessionStatus === "deleting";
                        const threadErrorMessage = String(chatSession?.errorMessage || "").trim();
                        const chatSessionKey = `${agent.id}:${chatSession.id}`;
                        const isDeletingChat = deletingChatSessionKey === chatSessionKey || isDeletingSession;
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
                            onKeyDown={(event: any) => {
                              if (event.key === "Enter" && !isDeletingChat) {
                                onOpenChat({
                                  agentId: agent.id,
                                  sessionId: chatSession.id,
                                  sessionsForAgent: sortedChats,
                                });
                              }
                            }}
                          >
                            <div className="chat-card-status">
                              {isRunning ? <ChatSessionRunningBadge /> : null}
                              {!isRunning && isDeletingSession ? (
                                <span className="chat-thread-status chat-thread-status-deleting">deleting</span>
                              ) : null}
                              {!isRunning && isError ? <span className="chat-thread-status chat-thread-status-error">error</span> : null}
                            </div>
                            <div className="chat-card-main">
                              <p className="chat-card-title">
                                <strong>{chatSession.title || "Untitled chat"}</strong>
                              </p>
                              <p className="chat-card-meta">
                                {formatTimestamp(chatSession.updatedAt)} · {sessionModelLabel} · {reasoningLabel}
                              </p>
                              <ThreadTaskSummary
                                tasks={chatSession?.tasks}
                                threadTitle={chatSession?.title}
                                modalId={`chats-overview-${agent.id}-${chatSession.id}`}
                              />
                              {isError && threadErrorMessage ? (
                                <p className="chat-thread-error-text">{threadErrorMessage}</p>
                              ) : null}
                            </div>
                            <div className="chat-card-actions">
                              <button
                                type="button"
                                className="chat-card-icon-btn chat-card-icon-btn-danger"
                                onClick={(event: any) => {
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
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div></Page>
  );
}
