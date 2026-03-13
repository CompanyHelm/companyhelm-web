import { useEffect, useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.tsx";
import { ThreadTaskSummary } from "../components/ThreadTaskSummary.tsx";
import { ArchivedChatSelection } from "../utils/archivedChatSelection.ts";
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
  chatListStatusFilter = "active",
  onRefreshChatLists,
  onCreateChatForAgent,
  getCreateChatDisabledReason,
  onOpenChat,
  onDeleteChat,
  onBatchDeleteChats,
  isBatchDeletingChats = false,
}: any) {
  const normalizedChatListStatusFilter =
    String(chatListStatusFilter || "").trim().toLowerCase() === "archived" ? "archived" : "active";
  const canShowCreateChatActions = normalizedChatListStatusFilter !== "archived";
  const [selectedArchivedChatKeys, setSelectedArchivedChatKeys] = useState<any>(new Set());
  const sortedAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent: any, rightAgent: any) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);
  const visibleArchivedChats = useMemo(() => {
    if (normalizedChatListStatusFilter !== "archived") {
      return [];
    }
    const archivedChats: any[] = [];
    for (const agent of sortedAgents) {
      const agentChats = Array.isArray(chatSessionsByAgent?.[agent.id]) ? chatSessionsByAgent[agent.id] : [];
      for (const session of agentChats) {
        if (String(session?.status || "").trim().toLowerCase() !== "archived") {
          continue;
        }
        const sessionId = String(session?.id || "").trim();
        if (!sessionId) {
          continue;
        }
        archivedChats.push({
          agentId: agent.id,
          sessionId,
          title: String(session?.title || "").trim(),
        });
      }
    }
    return archivedChats;
  }, [chatSessionsByAgent, normalizedChatListStatusFilter, sortedAgents]);
  const visibleArchivedChatKeys = useMemo(
    () => visibleArchivedChats.map((session: any) => ArchivedChatSelection.getKey(session.agentId, session.sessionId)),
    [visibleArchivedChats],
  );
  const archivedSelectionSummary = useMemo(
    () => ArchivedChatSelection.getSummary(selectedArchivedChatKeys, visibleArchivedChatKeys),
    [selectedArchivedChatKeys, visibleArchivedChatKeys],
  );

  useEffect(() => {
    if (normalizedChatListStatusFilter !== "archived") {
      setSelectedArchivedChatKeys(new Set());
      return;
    }
    const visibleKeySet = new Set(visibleArchivedChatKeys);
    setSelectedArchivedChatKeys((current: Set<string>) => {
      const next = new Set(Array.from(current).filter((key) => visibleKeySet.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [normalizedChatListStatusFilter, visibleArchivedChatKeys.join("|")]);

  async function handleBatchDeleteArchivedChats() {
    if (!onBatchDeleteChats || archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats) {
      return;
    }
    const selectedChats = visibleArchivedChats.filter((session: any) =>
      selectedArchivedChatKeys.has(ArchivedChatSelection.getKey(session.agentId, session.sessionId)),
    );
    const result = await onBatchDeleteChats(selectedChats);
    const deletedKeys = Array.isArray(result?.deletedKeys) ? result.deletedKeys : [];
    if (deletedKeys.length > 0) {
      setSelectedArchivedChatKeys((current: Set<string>) => ArchivedChatSelection.clearKeys(current, deletedKeys));
    }
  }

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        {chatIndexError ? <p className="error-banner">Chat error: {chatIndexError}</p> : null}
        {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
        {!isLoadingChatIndex && sortedAgents.length === 0 ? (
          <p className="empty-hint">No agents available yet.</p>
        ) : null}
        {normalizedChatListStatusFilter === "archived" ? (
          <div className="archived-chat-selection-toolbar">
            <label className="archived-chat-selection-toggle">
              <input
                type="checkbox"
                aria-label="Select all archived chats"
                checked={archivedSelectionSummary.allVisibleSelected}
                onChange={(event: any) =>
                  setSelectedArchivedChatKeys((current: Set<string>) =>
                    ArchivedChatSelection.setAll(current, visibleArchivedChatKeys, event.target.checked),
                  )
                }
                disabled={visibleArchivedChatKeys.length === 0 || isBatchDeletingChats}
              />
              <span>{`${archivedSelectionSummary.selectedCount} selected`}</span>
            </label>
            <div className="archived-chat-selection-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedArchivedChatKeys(new Set())}
                disabled={archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats}
              >
                Deselect all
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={handleBatchDeleteArchivedChats}
                disabled={archivedSelectionSummary.selectedCount === 0 || isBatchDeletingChats}
              >
                Delete selected
              </button>
            </div>
          </div>
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
                    {canShowCreateChatActions ? (
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
                    ) : null}
                    {sortedChats.map((chatSession: any) => {
                      const isRunning = isChatSessionRunning(chatSession, chatSessionRunningById);
                      const sessionStatus = String(chatSession?.status || "").trim().toLowerCase();
                      const isError = sessionStatus === "error";
                      const isDeletingSession = sessionStatus === "deleting";
                      const isPendingSession = sessionStatus === "pending";
                      const isArchivedSession = sessionStatus === "archived";
                      const archivedSelectionKey = ArchivedChatSelection.getKey(agent.id, chatSession.id);
                      const threadErrorMessage = String(chatSession?.errorMessage || "").trim();
                      const chatSessionKey = `${agent.id}:${chatSession.id}`;
                      const isDeletingChat = deletingChatSessionKey === chatSessionKey || isDeletingSession;
                      const sessionModelLabel =
                        String(chatSession?.currentModelName || chatSession?.currentModelId || "").trim() || "n/a";
                      const reasoningLabel = String(chatSession?.currentReasoningLevel || "").trim() || "n/a";
                      const statusBadge = isRunning ? (
                        <ChatSessionRunningBadge />
                      ) : isPendingSession ? (
                        <span className="chat-thread-status chat-thread-status-pending">pending</span>
                      ) : isDeletingSession ? (
                        <span className="chat-thread-status chat-thread-status-deleting">deleting</span>
                      ) : isArchivedSession ? (
                        <span className="chat-thread-status chat-thread-status-archived">archived</span>
                      ) : isError ? (
                        <span className="chat-thread-status chat-thread-status-error">error</span>
                      ) : null;
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
                            {normalizedChatListStatusFilter === "archived" && isArchivedSession ? (
                              <div
                                className="archived-chat-row-checkbox"
                                onClick={(event: any) => event.stopPropagation()}
                                onKeyDown={(event: any) => event.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  aria-label={`Select archived chat ${chatSession.title || "Untitled chat"}`}
                                  checked={selectedArchivedChatKeys.has(archivedSelectionKey)}
                                  onChange={(event: any) =>
                                    setSelectedArchivedChatKeys((current: Set<string>) =>
                                      ArchivedChatSelection.toggle(
                                        current,
                                        archivedSelectionKey,
                                        event.target.checked,
                                      ),
                                    )
                                  }
                                  disabled={isDeletingChat || isBatchDeletingChats}
                                />
                              </div>
                            ) : null}
                            <div className="chat-card-main">
                              <div className="chat-card-title-row">
                                <p className="chat-card-title">
                                  <strong>{chatSession.title || "Untitled chat"}</strong>
                                </p>
                                {statusBadge ? <div className="chat-card-status">{statusBadge}</div> : null}
                              </div>
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
