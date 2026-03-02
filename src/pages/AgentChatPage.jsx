import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CreationModal } from "../components/CreationModal.jsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";
import { formatTimestamp } from "../utils/formatting.js";
import {
  compareTurnsByTimestamp,
  getLatestRunningChatTurn,
  isChatSessionRunning,
  selectVisibleTurnsByMessageCount,
} from "../utils/chat.js";
import {
  CHAT_MESSAGE_BATCH_SIZE,
  THREAD_TITLE_MAX_LENGTH,
  TRANSCRIPT_TOP_LOAD_THRESHOLD_PX,
  TRANSCRIPT_BOTTOM_STICKY_THRESHOLD_PX,
} from "../utils/constants.js";

const CHAT_COMPOSER_MIN_LINES = 2;
const CHAT_COMPOSER_MAX_LINES = 10;

function toItemTypePlaceholder(itemType) {
  switch (itemType) {
    case "plan":
      return "(plan update)";
    case "file_change":
      return "(file change)";
    case "mcp_tool_call":
      return "(MCP tool call)";
    case "collab_agent_tool_call":
      return "(collaboration update)";
    case "web_search":
      return "(web search)";
    case "image_view":
      return "(image view)";
    case "entered_review_mode":
      return "(entered review mode)";
    case "exited_review_mode":
      return "(exited review mode)";
    case "context_compaction":
      return "(context compaction)";
    case "user_message":
      return "(user message)";
    case "agent_message":
      return "(agent message)";
    case "reasoning":
      return "(reasoning update)";
    default:
      return "(item update)";
  }
}

function resolveChatItemBodyText(item, itemType) {
  const text = String(item?.text || "").trim();
  if (text) {
    return text;
  }

  const command = String(item?.command || "").trim();
  if (itemType === "command_execution") {
    return command || "(command unavailable)";
  }

  if (command) {
    return command;
  }

  return toItemTypePlaceholder(itemType);
}

function getQueuedMessagePreview(rawText) {
  const normalizedText = String(rawText || "").trim();
  if (!normalizedText) {
    return {
      fullText: "(no content)",
      firstLine: "(no content)",
      hasAdditionalContent: false,
      hasOriginalContent: false,
    };
  }
  const firstLine = normalizedText.split(/\r?\n/, 1)[0] || normalizedText;
  return {
    fullText: normalizedText,
    firstLine,
    hasAdditionalContent: normalizedText.length > firstLine.length,
    hasOriginalContent: true,
  };
}

function clampThreadTitle(value) {
  return String(value || "").slice(0, THREAD_TITLE_MAX_LENGTH);
}

export function AgentChatPage({
  selectedCompanyId,
  agent,
  agents,
  session,
  chatSessionsByAgent,
  chatSessionRunningById,
  isLoadingChatIndex,
  isCreatingChatSession,
  showChatSidebar = false,
  chatSessionRenameDraft,
  chatTurns,
  queuedChatMessages,
  isLoadingChat,
  chatError,
  chatDraftMessage,
  isSendingChatMessage,
  isInterruptingChatTurn,
  isUpdatingChatTitle,
  deletingChatSessionKey,
  steeringQueuedMessageId,
  deletingQueuedMessageId,
  getCreateChatDisabledReason,
  onChatSessionRenameDraftChange,
  onChatDraftMessageChange,
  onBackToChats,
  onDeleteChat,
  onSaveChatSessionTitle,
  onSendChatMessage,
  onInterruptChatTurn,
  onSteerQueuedMessage,
  onDeleteQueuedMessage,
  onCreateChatForAgent,
  onOpenChatFromList,
}) {
  const canChat = Boolean(agent && session);
  const selectedAgentId = String(agent?.id || "").trim();
  const selectedSessionId = String(session?.id || "").trim();
  const sortedSidebarAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent, rightAgent) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);
  const currentChatSessionKey = canChat ? `${agent.id}:${session.id}` : "";
  const isDeletingCurrentChat = Boolean(
    currentChatSessionKey && deletingChatSessionKey === currentChatSessionKey,
  );
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [selectedCommandOutputItem, setSelectedCommandOutputItem] = useState(null);
  const [selectedQueuedMessage, setSelectedQueuedMessage] = useState(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState(CHAT_MESSAGE_BATCH_SIZE);
  const chatMessageInputRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const shouldStickTranscriptToBottomRef = useRef(true);
  const isTranscriptNearTopRef = useRef(false);
  const pendingTranscriptScrollRestoreRef = useRef(null);
  const previousTotalMessageCountRef = useRef(null);
  const queuedMessages = Array.isArray(queuedChatMessages) ? queuedChatMessages : [];
  const orderedTurns = useMemo(
    () => [...(Array.isArray(chatTurns) ? chatTurns : [])].sort(compareTurnsByTimestamp),
    [chatTurns],
  );
  const hasRunningTurn = useMemo(() => Boolean(getLatestRunningChatTurn(orderedTurns)), [orderedTurns]);
  const latestReasoning = useMemo(() => {
    for (let turnIndex = orderedTurns.length - 1; turnIndex >= 0; turnIndex -= 1) {
      const turn = orderedTurns[turnIndex];
      const reasoningText = String(turn?.reasoningText || "").trim();
      if (!reasoningText) {
        continue;
      }
      const normalizedTurnStatus = String(turn?.status || "").trim().toLowerCase();
      const status = normalizedTurnStatus === "running"
        ? "running"
        : normalizedTurnStatus === "pending"
          ? "pending"
          : "completed";
      return {
        text: reasoningText,
        status,
      };
    }
    return null;
  }, [orderedTurns]);
  const { visibleTurns, totalMessageCount } = useMemo(
    () => selectVisibleTurnsByMessageCount(orderedTurns, visibleMessageCount),
    [orderedTurns, visibleMessageCount],
  );
  const visibleMessageTotal = useMemo(() => {
    return visibleTurns.reduce((count, turn) => {
      return count + (Array.isArray(turn?.items) ? turn.items.length : 0);
    }, 0);
  }, [visibleTurns]);
  const isShowingPartialTranscript = visibleMessageCount < totalMessageCount;
  const hasTranscriptContent = orderedTurns.length > 0 || queuedMessages.length > 0;

  useEffect(() => {
    setVisibleMessageCount(CHAT_MESSAGE_BATCH_SIZE);
    shouldStickTranscriptToBottomRef.current = true;
    isTranscriptNearTopRef.current = false;
    pendingTranscriptScrollRestoreRef.current = null;
    previousTotalMessageCountRef.current = null;
  }, [session?.id]);

  useEffect(() => {
    const previousTotalMessageCount = previousTotalMessageCountRef.current;
    previousTotalMessageCountRef.current = totalMessageCount;
    if (!Number.isInteger(previousTotalMessageCount)) {
      return;
    }
    const addedMessageCount = totalMessageCount - previousTotalMessageCount;
    if (addedMessageCount <= 0 || !isTranscriptNearTopRef.current) {
      return;
    }
    setVisibleMessageCount((currentCount) =>
      Math.min(totalMessageCount, Math.max(0, currentCount) + addedMessageCount),
    );
  }, [totalMessageCount]);

  useEffect(() => {
    setIsSettingsModalOpen(false);
    setSelectedQueuedMessage(null);
  }, [session?.id]);

  useLayoutEffect(() => {
    const transcriptNode = transcriptScrollRef.current;
    if (!transcriptNode) {
      return;
    }
    if (pendingTranscriptScrollRestoreRef.current) {
      const { previousScrollHeight, previousScrollTop } = pendingTranscriptScrollRestoreRef.current;
      const scrollHeightDelta = transcriptNode.scrollHeight - previousScrollHeight;
      transcriptNode.scrollTop = previousScrollTop + scrollHeightDelta;
      pendingTranscriptScrollRestoreRef.current = null;
      return;
    }
    if (!shouldStickTranscriptToBottomRef.current) {
      return;
    }
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [session?.id, orderedTurns.length, totalMessageCount, visibleMessageCount, queuedMessages.length]);

  const resizeChatMessageInput = useCallback(() => {
    const chatMessageInputNode = chatMessageInputRef.current;
    if (!chatMessageInputNode || typeof window === "undefined") {
      return;
    }
    const inputStyles = window.getComputedStyle(chatMessageInputNode);
    const resolvedLineHeight = Number.parseFloat(inputStyles.lineHeight);
    const lineHeight = Number.isFinite(resolvedLineHeight) && resolvedLineHeight > 0 ? resolvedLineHeight : 20;
    const resolvedPaddingTop = Number.parseFloat(inputStyles.paddingTop);
    const resolvedPaddingBottom = Number.parseFloat(inputStyles.paddingBottom);
    const resolvedBorderTopWidth = Number.parseFloat(inputStyles.borderTopWidth);
    const resolvedBorderBottomWidth = Number.parseFloat(inputStyles.borderBottomWidth);
    const verticalPadding = (Number.isFinite(resolvedPaddingTop) ? resolvedPaddingTop : 0)
      + (Number.isFinite(resolvedPaddingBottom) ? resolvedPaddingBottom : 0);
    const verticalBorder = (Number.isFinite(resolvedBorderTopWidth) ? resolvedBorderTopWidth : 0)
      + (Number.isFinite(resolvedBorderBottomWidth) ? resolvedBorderBottomWidth : 0);
    const resolvedMinHeight = Number.parseFloat(inputStyles.minHeight);
    const fallbackMinHeight = lineHeight * CHAT_COMPOSER_MIN_LINES + verticalPadding + verticalBorder;
    const minHeight = Number.isFinite(resolvedMinHeight) && resolvedMinHeight > 0
      ? resolvedMinHeight
      : fallbackMinHeight;
    const maxHeight = lineHeight * CHAT_COMPOSER_MAX_LINES + verticalPadding + verticalBorder;

    chatMessageInputNode.style.height = "auto";
    const nextHeight = Math.min(Math.max(chatMessageInputNode.scrollHeight, minHeight), maxHeight);
    chatMessageInputNode.style.height = `${nextHeight}px`;
    chatMessageInputNode.style.overflowY = chatMessageInputNode.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    resizeChatMessageInput();
  }, [chatDraftMessage, resizeChatMessageInput]);

  function handleChatMessageKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    if (!canChat || isSendingChatMessage || !chatDraftMessage.trim()) {
      return;
    }
    event.preventDefault();
    onSendChatMessage(event, "steer");
  }

  function handleTranscriptScroll(event) {
    const transcriptNode = event.currentTarget;
    const isTranscriptNearTop = transcriptNode.scrollTop <= TRANSCRIPT_TOP_LOAD_THRESHOLD_PX;
    isTranscriptNearTopRef.current = isTranscriptNearTop;
    const distanceFromBottom =
      transcriptNode.scrollHeight - transcriptNode.scrollTop - transcriptNode.clientHeight;
    shouldStickTranscriptToBottomRef.current =
      distanceFromBottom <= TRANSCRIPT_BOTTOM_STICKY_THRESHOLD_PX;
    const canLoadMoreMessages = visibleMessageCount < totalMessageCount;
    if (!canLoadMoreMessages || !isTranscriptNearTop) {
      return;
    }
    pendingTranscriptScrollRestoreRef.current = {
      previousScrollHeight: transcriptNode.scrollHeight,
      previousScrollTop: transcriptNode.scrollTop,
    };
    setVisibleMessageCount((currentCount) =>
      Math.min(currentCount + CHAT_MESSAGE_BATCH_SIZE, totalMessageCount),
    );
  }

  async function handleDeleteCurrentChat() {
    if (!canChat || isDeletingCurrentChat) {
      return;
    }
    const deleted = await onDeleteChat({
      agentId: agent.id,
      sessionId: session.id,
      title: session.title,
    });
    if (deleted) {
      onBackToChats();
    }
  }

  function handleOpenSettingsModal() {
    if (!session) {
      return;
    }
    onChatSessionRenameDraftChange(clampThreadTitle(session.title));
    setIsSettingsModalOpen(true);
  }

  function handleCloseSettingsModal() {
    onChatSessionRenameDraftChange(clampThreadTitle(session?.title));
    setIsSettingsModalOpen(false);
  }

  async function handleSaveSettings(event) {
    const updated = await onSaveChatSessionTitle(event);
    if (updated) {
      setIsSettingsModalOpen(false);
    }
  }

  const pageActions = useMemo(() => (
    <>
      {hasRunningTurn ? (
        <span
          className="chat-turn-spinner chat-minimal-header-spinner"
          aria-label="Turn is running"
          title="Turn in progress"
        />
      ) : null}
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        onClick={handleDeleteCurrentChat}
        disabled={!canChat || isDeletingCurrentChat}
        aria-label={isDeletingCurrentChat ? "Deleting chat..." : "Delete chat"}
        title={isDeletingCurrentChat ? "Deleting chat..." : "Delete chat"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        onClick={handleOpenSettingsModal}
        disabled={!session}
        aria-label="Chat settings"
        title="Chat settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </>
  ), [canChat, isDeletingCurrentChat, hasRunningTurn, session]);
  useSetPageActions(pageActions);

  return (
    <div className={`page-stack chat-page-stack${showChatSidebar ? " chat-page-stack-with-sidebar" : ""}`}>
      <div className="chat-page-main-layout">
        {showChatSidebar ? (
          <aside className="panel list-panel chat-sidebar-panel">
            {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
            {!isLoadingChatIndex && sortedSidebarAgents.length === 0 ? (
              <p className="empty-hint">No agents available yet.</p>
            ) : null}
            {!isLoadingChatIndex && sortedSidebarAgents.length > 0 ? (
              <ul className="chat-sidebar-agent-list">
                {sortedSidebarAgents.map((sidebarAgent) => {
                  const sidebarAgentId = String(sidebarAgent?.id || "").trim();
                  const sidebarSessions = Array.isArray(chatSessionsByAgent?.[sidebarAgentId])
                    ? chatSessionsByAgent[sidebarAgentId]
                    : [];
                  const sortedSidebarSessions = [...sidebarSessions].sort((leftSession, rightSession) =>
                    compareTurnsByTimestamp(
                      { createdAt: leftSession?.updatedAt, id: leftSession?.id },
                      { createdAt: rightSession?.updatedAt, id: rightSession?.id },
                    ),
                  );
                  const createChatDisabledReason = String(
                    getCreateChatDisabledReason?.(sidebarAgentId) || "",
                  ).trim();
                  const isCreateChatDisabled =
                    !onCreateChatForAgent || isCreatingChatSession || Boolean(createChatDisabledReason);
                  const isSelectedSidebarAgent = sidebarAgentId === selectedAgentId;
                  const sidebarModelLabel = String(
                    sidebarAgent?.model || sidebarAgent?.defaultModelId || "",
                  ).trim() || "n/a";

                  return (
                    <li
                      key={`chat-sidebar-agent-${sidebarAgentId}`}
                      className={`chat-sidebar-agent-card${isSelectedSidebarAgent ? " chat-sidebar-agent-card-active" : ""}`}
                    >
                      <div className="chat-sidebar-agent-header">
                        <div className="chat-sidebar-agent-main">
                          <p className="chat-sidebar-agent-name">
                            <strong>{sidebarAgent?.name || `Agent ${sidebarAgentId.slice(0, 8)}`}</strong>
                          </p>
                          <p className="chat-sidebar-agent-meta">
                            {sidebarAgent?.agentSdk || "n/a"} · {sidebarModelLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="chat-sidebar-new-chat-btn"
                          disabled={isCreateChatDisabled}
                          onClick={() => {
                            if (!isCreateChatDisabled) {
                              void onCreateChatForAgent(sidebarAgentId);
                            }
                          }}
                          aria-label={isCreatingChatSession ? "Creating chat..." : "Start new chat"}
                          title={createChatDisabledReason || "Start new chat"}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                      {createChatDisabledReason ? (
                        <p className="chat-sidebar-agent-warning">{createChatDisabledReason}</p>
                      ) : null}
                      {sortedSidebarSessions.length > 0 ? (
                        <ul className="chat-card-list chat-sidebar-chat-list">
                          {sortedSidebarSessions.map((sidebarSession) => {
                            const sidebarSessionId = String(sidebarSession?.id || "").trim();
                            const isRunningSession = isChatSessionRunning(sidebarSession, chatSessionRunningById);
                            const isSelectedSession =
                              sidebarAgentId === selectedAgentId && sidebarSessionId === selectedSessionId;
                            return (
                              <li
                                key={`chat-sidebar-session-${sidebarAgentId}-${sidebarSessionId}`}
                                className={`chat-card${isSelectedSession ? " chat-card-active" : ""}`}
                                onClick={() =>
                                  onOpenChatFromList?.({
                                    agentId: sidebarAgentId,
                                    sessionId: sidebarSessionId,
                                    sessionsForAgent: sortedSidebarSessions,
                                  })
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    onOpenChatFromList?.({
                                      agentId: sidebarAgentId,
                                      sessionId: sidebarSessionId,
                                      sessionsForAgent: sortedSidebarSessions,
                                    });
                                  }
                                }}
                              >
                                <div className="chat-card-status">
                                  {isRunningSession ? <ChatSessionRunningBadge /> : null}
                                </div>
                                <div className="chat-card-main">
                                  <p className="chat-card-title">
                                    <strong>{sidebarSession?.title || "Untitled chat"}</strong>
                                  </p>
                                  <p className="chat-card-meta">{formatTimestamp(sidebarSession?.updatedAt)}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="chat-sidebar-empty">No chats yet.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </aside>
        ) : null}

        <section className="panel chat-panel">
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && !session ? <p className="empty-hint">Chat not found.</p> : null}
        {canChat && isLoadingChat ? <p className="empty-hint">Loading chat messages...</p> : null}
        {canChat && !isLoadingChat && !hasTranscriptContent ? (
          <p className="empty-hint">No messages yet. Send the first prompt below.</p>
        ) : null}
        {hasTranscriptContent ? (
          <div
            ref={transcriptScrollRef}
            className="chat-transcript-scroll"
            onScroll={handleTranscriptScroll}
          >
            {isShowingPartialTranscript ? (
              <p className="chat-transcript-hint">
                Showing latest {visibleMessageTotal} of {totalMessageCount} messages. Scroll up to load older
                messages.
              </p>
            ) : null}
            {orderedTurns.length > 0 ? (
              <ul className="chat-message-list">
                {visibleTurns.flatMap((turn) => {
                  const normalizedTurnStatus = String(turn?.status || "").trim().toLowerCase();
                  const turnStatus = normalizedTurnStatus === "running"
                    ? "running"
                    : normalizedTurnStatus === "pending"
                      ? "pending"
                      : "completed";
                  const turnItems = Array.isArray(turn?.items) ? turn.items : [];

                  const elements = [];

                  elements.push(
                    <li key={`sep-${turn.id}`} className="chat-turn-separator">
                      <div className="chat-turn-separator-row">
                        <code className="runner-id">{String(turn.id || "").slice(0, 8)}</code>
                        <span className={`chat-turn-status chat-turn-status-${turnStatus}`}>{turnStatus}</span>
                        {turnStatus === "running" ? (
                          <span
                            className="chat-turn-spinner"
                            aria-label="Turn is running"
                            title="Turn in progress"
                          />
                        ) : null}
                        <span>{formatTimestamp(turn.createdAt)}</span>
                      </div>
                    </li>,
                  );

                  if (turnItems.length === 0) {
                    elements.push(
                      <li key={`empty-${turn.id}`} className="chat-message chat-message-llm">
                        <div className="chat-message-body">
                          <p className="empty-hint">No items yet for this turn.</p>
                        </div>
                      </li>,
                    );
                  }

                  for (const item of turnItems) {
                    const itemRole = String(item?.role || "").toLowerCase();
                    const roleLabel = itemRole === "user" || itemRole === "human" ? "human" : "llm";
                    const itemType = String(item?.itemType || item?.type || "").trim().toLowerCase() || "unknown";
                    const normalizedItemStatus = String(item?.status || "").trim().toLowerCase();
                    const itemStatus = normalizedItemStatus === "running"
                      ? "running"
                      : normalizedItemStatus === "pending"
                        ? "pending"
                        : "completed";
                    const isCommandExecution = itemType === "command_execution";
                    const bodyText = resolveChatItemBodyText(item, itemType);

                    elements.push(
                      <li
                        key={item.id}
                        className={`chat-message chat-message-${roleLabel}${itemStatus === "running" ? " chat-message-running" : ""}`}
                      >
                        <div className="chat-message-body">
                          {isCommandExecution ? (
                            <p className="chat-message-content chat-message-content-command">
                              <code>{bodyText}</code>
                            </p>
                          ) : (
                            <div className="chat-message-content chat-message-content-markdown">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyText}</ReactMarkdown>
                            </div>
                          )}

                          {isCommandExecution ? (
                            <div className="chat-message-actions">
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => setSelectedCommandOutputItem(item)}
                              >
                                View output
                              </button>
                            </div>
                          ) : null}

                          {item.error ? <p className="chat-message-error">{item.error}</p> : null}
                        </div>
                        <div className="chat-message-footer">
                          <span className="chat-message-kind">{itemType}</span>
                          {itemStatus === "running" ? (
                            <span
                              className="chat-turn-spinner chat-item-spinner"
                              aria-label="Item is running"
                              title="Item in progress"
                            />
                          ) : null}
                          <span>{formatTimestamp(item.startedAt || item.createdAt)}</span>
                        </div>
                      </li>,
                    );
                  }

                  return elements;
                })}
              </ul>
            ) : null}
          </div>
        ) : null}
        {queuedMessages.length > 0 ? (
          <div className="chat-queued-block">
            <h3 className="chat-queued-title">Queued messages</h3>
            <ul className="chat-queued-list">
              {queuedMessages.map((queuedMessage) => {
                const queuedMessageId = String(queuedMessage?.id || "").trim();
                const isSteerMode = Boolean(queuedMessage?.allowSteer);
                const isSteeringThisMessage = steeringQueuedMessageId === queuedMessageId;
                const isDeletingThisMessage = deletingQueuedMessageId === queuedMessageId;
                const queuedMessagePreview = getQueuedMessagePreview(queuedMessage?.text);

                return (
                  <li key={queuedMessageId} className="chat-queued-item">
                    <div className="chat-queued-header">
                      <div className="chat-queued-meta">
                        <span className="chat-message-kind">queued</span>
                        <span className={`chat-turn-status ${isSteerMode ? "chat-turn-status-running" : "chat-turn-status-idle"}`}>
                          {isSteerMode ? "steer" : "queue"}
                        </span>
                        <code className="runner-id">{queuedMessageId.slice(0, 8)}</code>
                      </div>
                      <button
                        type="button"
                        className="chat-queued-delete-btn"
                        disabled={
                          !canChat
                          || isSendingChatMessage
                          || isInterruptingChatTurn
                          || isSteeringThisMessage
                          || isDeletingThisMessage
                        }
                        onClick={() => onDeleteQueuedMessage(queuedMessageId)}
                        aria-label="Delete queued message"
                        title="Delete queued message"
                      >
                        {isDeletingThisMessage ? "..." : "x"}
                      </button>
                    </div>
                    <div className="chat-queued-message-row">
                      <p
                        className="chat-message-content chat-queued-message-preview"
                        title={queuedMessagePreview.fullText}
                      >
                        {queuedMessagePreview.firstLine}
                        {queuedMessagePreview.hasAdditionalContent ? "..." : null}
                      </p>
                      {queuedMessagePreview.hasOriginalContent ? (
                        <button
                          type="button"
                          className="chat-queued-show-all-btn"
                          onClick={() =>
                            setSelectedQueuedMessage({
                              id: queuedMessageId,
                              text: queuedMessagePreview.fullText,
                            })
                          }
                        >
                          Show all
                        </button>
                      ) : null}
                    </div>
                    {!isSteerMode ? (
                      <div className="task-card-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={
                            !canChat
                            || isSendingChatMessage
                            || isInterruptingChatTurn
                            || isSteeringThisMessage
                            || isDeletingThisMessage
                          }
                          onClick={() => onSteerQueuedMessage(queuedMessageId)}
                        >
                          {isSteeringThisMessage ? "Changing..." : "Change to steer"}
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        </section>
      </div>

      <CreationModal
        modalId="chat-settings-modal"
        title="Chat Settings"
        description="View and edit chat details."
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
      >
        <form className="chat-settings-modal-form" onSubmit={handleSaveSettings}>
          <div className="chat-settings-field">
            <label htmlFor="chat-settings-title" className="chat-settings-label">Title</label>
            <input
              id="chat-settings-title"
              className="chat-settings-input"
              value={chatSessionRenameDraft}
              onChange={(event) => onChatSessionRenameDraftChange(clampThreadTitle(event.target.value))}
              placeholder="e.g. Release planning"
              disabled={isUpdatingChatTitle}
              maxLength={THREAD_TITLE_MAX_LENGTH}
            />
          </div>
          <div className="chat-settings-field">
            <label className="chat-settings-label">Additional instructions</label>
            {session?.additionalModelInstructions ? (
              <>
                <div className="chat-settings-readonly chat-settings-readonly-clamped chat-message-content chat-message-content-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {session.additionalModelInstructions}
                  </ReactMarkdown>
                </div>
                <button
                  type="button"
                  className="chat-settings-show-all-btn"
                  onClick={() => setIsInstructionsExpanded(true)}
                >
                  Show all
                </button>
              </>
            ) : (
              <p className="chat-settings-readonly">none</p>
            )}
          </div>
          <div className="chat-settings-info">
            <p className="chat-settings-info-row">
              <span className="chat-settings-info-label">Thread ID</span>
              <code className="runner-id">{session?.id || "n/a"}</code>
            </p>
            <p className="chat-settings-info-row">
              <span className="chat-settings-info-label">Model</span>
              <span>{session?.currentModelName || session?.currentModelId || "n/a"}</span>
            </p>
            <p className="chat-settings-info-row">
              <span className="chat-settings-info-label">Reasoning</span>
              <span>{session?.currentReasoningLevel || "n/a"}</span>
            </p>
          </div>
          <div className="chat-settings-actions">
            <button type="submit" disabled={isUpdatingChatTitle}>
              {isUpdatingChatTitle ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </CreationModal>

      <CreationModal
        modalId="chat-instructions-modal"
        title="Additional Instructions"
        isOpen={isInstructionsExpanded}
        onClose={() => setIsInstructionsExpanded(false)}
        cardClassName="modal-card-fullscreen"
      >
        <div className="chat-instructions-modal-body chat-message-content chat-message-content-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {session?.additionalModelInstructions || ""}
          </ReactMarkdown>
        </div>
      </CreationModal>

      <CreationModal
        modalId="chat-command-output-modal"
        title="Command Output"
        description="Hidden command output for the selected command execution item."
        isOpen={Boolean(selectedCommandOutputItem)}
        onClose={() => setSelectedCommandOutputItem(null)}
      >
        <div className="chat-command-output-modal">
          <p>
            <strong>Command</strong>
          </p>
          <pre className="runner-command runner-command-inline">
            <code>{selectedCommandOutputItem?.command || "(command unavailable)"}</code>
          </pre>
          <p>
            <strong>Output</strong>
          </p>
          <pre className="chat-command-output-pre">
            <code>{selectedCommandOutputItem?.output || "(no output captured)"}</code>
          </pre>
        </div>
      </CreationModal>

      <CreationModal
        modalId="chat-queued-message-modal"
        title="Queued Message"
        description="Full text for the selected queued message."
        isOpen={Boolean(selectedQueuedMessage)}
        onClose={() => setSelectedQueuedMessage(null)}
      >
        <div className="chat-queued-message-modal">
          <p>
            <strong>Message</strong>
          </p>
          <pre className="chat-queued-message-pre">
            <code>{selectedQueuedMessage?.text || "(no content)"}</code>
          </pre>
        </div>
      </CreationModal>

      <section className="panel composer-panel chat-composer-panel">
        {latestReasoning ? (
          <p className={`chat-turn-reasoning chat-turn-reasoning-${latestReasoning.status} chat-composer-reasoning`}>
            {latestReasoning.text}
          </p>
        ) : null}
        <form className="chat-composer-form" onSubmit={onSendChatMessage}>
          <div className="chat-composer-input-row">
            <textarea
              id="chat-message-input"
              ref={chatMessageInputRef}
              className="chat-composer-input"
              rows={CHAT_COMPOSER_MIN_LINES}
              placeholder="Ask the agent to plan, debug, or implement something..."
              value={chatDraftMessage}
              onChange={(event) => onChatDraftMessageChange(event.target.value)}
              onKeyDown={handleChatMessageKeyDown}
              disabled={!canChat || isSendingChatMessage || isInterruptingChatTurn}
            />
            <div className="chat-composer-toolbar">
              {hasRunningTurn ? (
                <span className="chat-composer-status">
                  <span className="chat-turn-spinner chat-item-spinner" aria-hidden="true" />
                  Turn running
                </span>
              ) : null}
              <div className={`chat-composer-actions${hasRunningTurn ? " chat-composer-actions-running" : ""}`}>
                {hasRunningTurn ? (
                  <>
                    <button
                      type="button"
                      className="secondary-btn chat-action-btn"
                      disabled={!canChat || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={(event) => onSendChatMessage(event, "queue")}
                    >
                      <span className="chat-action-btn-content">
                        <svg
                          className="chat-action-icon"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M3 11 21 3 13 21 11 13 3 11z" />
                          <path d="m11 13 10-10" />
                        </svg>
                        <span>{isSendingChatMessage ? "queueing..." : "queue"}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="secondary-btn chat-action-btn"
                      disabled={!canChat || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={(event) => onSendChatMessage(event, "steer")}
                      title="Steer the active turn"
                    >
                      <span className="chat-action-btn-content">
                        <svg
                          className="chat-action-icon"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <circle cx="6" cy="5" r="2" />
                          <circle cx="6" cy="19" r="2" />
                          <circle cx="18" cy="12" r="2" />
                          <path d="M8 6v4a2 2 0 0 0 2 2h6" />
                          <path d="M8 18v-4a2 2 0 0 1 2-2h6" />
                        </svg>
                        <span>{isSendingChatMessage ? "steering..." : "steer"}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="chat-stop-btn"
                      disabled={!canChat || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={onInterruptChatTurn}
                      aria-label={isInterruptingChatTurn ? "Stopping turn..." : "Stop running turn"}
                      title={isInterruptingChatTurn ? "Stopping turn..." : "Stop running turn"}
                    >
                      <span className="chat-stop-icon" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={!canChat || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                  >
                    {isSendingChatMessage ? "Sending..." : "Send message"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
