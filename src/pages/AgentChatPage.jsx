import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CreationModal } from "../components/CreationModal.jsx";
import { matchesMediaQuery } from "../utils/media.js";
import { formatTimestamp } from "../utils/formatting.js";
import {
  compareTurnsByTimestamp,
  getLatestRunningChatTurn,
  selectVisibleTurnsByMessageCount,
} from "../utils/chat.js";
import {
  COMPACT_CHAT_MEDIA_QUERY,
  CHAT_MESSAGE_BATCH_SIZE,
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

export function AgentChatPage({
  selectedCompanyId,
  agent,
  session,
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
  onChatSessionRenameDraftChange,
  onChatDraftMessageChange,
  onBackToChats,
  onDeleteChat,
  onSaveChatSessionTitle,
  onSendChatMessage,
  onInterruptChatTurn,
  onSteerQueuedMessage,
  onDeleteQueuedMessage,
}) {
  const canChat = Boolean(agent && session);
  const currentChatSessionKey = canChat ? `${agent.id}:${session.id}` : "";
  const isDeletingCurrentChat = Boolean(
    currentChatSessionKey && deletingChatSessionKey === currentChatSessionKey,
  );
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [isContextPanelCollapsed, setIsContextPanelCollapsed] = useState(() =>
    matchesMediaQuery(COMPACT_CHAT_MEDIA_QUERY),
  );
  const [isSessionPanelCollapsed, setIsSessionPanelCollapsed] = useState(true);
  const [isCompactChatViewport, setIsCompactChatViewport] = useState(() =>
    matchesMediaQuery(COMPACT_CHAT_MEDIA_QUERY),
  );
  const [selectedCommandOutputItem, setSelectedCommandOutputItem] = useState(null);
  const [selectedQueuedMessage, setSelectedQueuedMessage] = useState(null);
  const [visibleMessageCount, setVisibleMessageCount] = useState(CHAT_MESSAGE_BATCH_SIZE);
  const chatTitleInputRef = useRef(null);
  const chatMessageInputRef = useRef(null);
  const transcriptScrollRef = useRef(null);
  const shouldStickTranscriptToBottomRef = useRef(true);
  const pendingTranscriptScrollRestoreRef = useRef(null);
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
    pendingTranscriptScrollRestoreRef.current = null;
  }, [session?.id]);

  useEffect(() => {
    setIsEditingChatTitle(false);
    setSelectedQueuedMessage(null);
  }, [session?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const mediaQueryList = window.matchMedia(COMPACT_CHAT_MEDIA_QUERY);
    const handleMediaQueryChange = (event) => {
      setIsCompactChatViewport(Boolean(event.matches));
    };
    setIsCompactChatViewport(mediaQueryList.matches);
    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleMediaQueryChange);
      return () => mediaQueryList.removeEventListener("change", handleMediaQueryChange);
    }
    mediaQueryList.addListener(handleMediaQueryChange);
    return () => mediaQueryList.removeListener(handleMediaQueryChange);
  }, []);

  useEffect(() => {
    if (isCompactChatViewport) {
      setIsContextPanelCollapsed(true);
      setIsSessionPanelCollapsed(true);
      return;
    }
    setIsContextPanelCollapsed(false);
  }, [isCompactChatViewport]);

  useEffect(() => {
    if (!isEditingChatTitle || !chatTitleInputRef.current) {
      return;
    }
    chatTitleInputRef.current.focus();
    chatTitleInputRef.current.select();
  }, [isEditingChatTitle]);

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
    onSendChatMessage(event, "queue");
  }

  function handleTranscriptScroll(event) {
    const transcriptNode = event.currentTarget;
    const distanceFromBottom =
      transcriptNode.scrollHeight - transcriptNode.scrollTop - transcriptNode.clientHeight;
    shouldStickTranscriptToBottomRef.current =
      distanceFromBottom <= TRANSCRIPT_BOTTOM_STICKY_THRESHOLD_PX;
    const canLoadMoreMessages = visibleMessageCount < totalMessageCount;
    if (!canLoadMoreMessages || transcriptNode.scrollTop > TRANSCRIPT_TOP_LOAD_THRESHOLD_PX) {
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

  function handleStartChatTitleEdit() {
    if (!session || isUpdatingChatTitle) {
      return;
    }
    onChatSessionRenameDraftChange(String(session.title || ""));
    setIsSessionPanelCollapsed(false);
    setIsEditingChatTitle(true);
  }

  function handleCancelChatTitleEdit() {
    onChatSessionRenameDraftChange(String(session?.title || ""));
    setIsEditingChatTitle(false);
  }

  function handleChatTitleInputKeyDown(event) {
    if (event.key !== "Escape" || event.isComposing) {
      return;
    }
    event.preventDefault();
    handleCancelChatTitleEdit();
  }

  async function handleSubmitChatTitle(event) {
    const updated = await onSaveChatSessionTitle(event);
    if (updated) {
      setIsEditingChatTitle(false);
    }
  }

  function toggleContextPanelVisibility() {
    setIsContextPanelCollapsed((currentValue) => !currentValue);
  }

  function toggleSessionPanelVisibility() {
    setIsSessionPanelCollapsed((currentValue) => !currentValue);
  }

  return (
    <div className="page-stack chat-page-stack">
      <section
        className={`panel hero-panel chat-context-panel${
          isContextPanelCollapsed ? " chat-context-panel-collapsed" : ""
        }${isCompactChatViewport ? " chat-context-panel-compact" : ""}`}
      >
        <div className="chat-context-header">
          <div>
            {isCompactChatViewport ? (
              <h1 className="chat-context-compact-title">
                {agent ? agent.name : "Agent chat"}
              </h1>
            ) : (
              <>
                <p className="eyebrow">Agent Runtime</p>
                <h1>Agent chat</h1>
              </>
            )}
          </div>
          <div className="hero-actions chat-context-actions">
            <button type="button" className="secondary-btn" onClick={onBackToChats}>
              Back to chats
            </button>
            <button
              type="button"
              className="danger-btn"
              onClick={handleDeleteCurrentChat}
              disabled={!canChat || isDeletingCurrentChat}
            >
              {isDeletingCurrentChat ? "Deleting..." : "Delete chat"}
            </button>
            {!isCompactChatViewport ? (
              <button
                type="button"
                className="secondary-btn chat-collapse-toggle-btn"
                onClick={toggleContextPanelVisibility}
                aria-expanded={!isContextPanelCollapsed}
              >
                {isContextPanelCollapsed ? "Show context" : "Hide context"}
              </button>
            ) : null}
          </div>
        </div>
        {!isContextPanelCollapsed && !isCompactChatViewport ? (
          <>
            <p className="subcopy">Send new messages to the selected agent chat.</p>
            <div className="chat-context-pills">
              <p className="context-pill">Company: {selectedCompanyId}</p>
              <p className="context-pill">
                Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
              </p>
            </div>
          </>
        ) : null}
      </section>

      <section
        className={`panel composer-panel chat-session-panel${
          isSessionPanelCollapsed ? " chat-session-panel-collapsed" : ""
        }`}
      >
        <header className="panel-header panel-header-row chat-panel-header">
          <h2>Chat</h2>
          <div className="chat-panel-header-controls">
            {session ? (
              isEditingChatTitle ? (
                <form className="task-form chat-title-inline-form" onSubmit={handleSubmitChatTitle}>
                  <input
                    id="chat-session-rename"
                    ref={chatTitleInputRef}
                    value={chatSessionRenameDraft}
                    onChange={(event) => onChatSessionRenameDraftChange(event.target.value)}
                    onKeyDown={handleChatTitleInputKeyDown}
                    placeholder="e.g. Release planning"
                    disabled={isUpdatingChatTitle}
                    aria-label="Chat title"
                  />
                  <p className="chat-title-inline-hint">
                    {isUpdatingChatTitle ? "Saving..." : "Press Enter to save, Esc to cancel"}
                  </p>
                </form>
              ) : (
                <p className="chat-session-title-row chat-title-inline-display">
                  <strong>{session.title || "Untitled chat"}</strong>
                  <button
                    type="button"
                    className="chat-title-edit-btn"
                    onClick={handleStartChatTitleEdit}
                    disabled={isUpdatingChatTitle}
                    aria-label="Edit chat title"
                    title="Edit chat title"
                  >
                    <svg
                      className="chat-title-edit-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M4 20h4l10-10-4-4L4 16v4z" />
                      <path d="m13 7 4 4" />
                    </svg>
                  </button>
                </p>
              )
            ) : null}
            <button
              type="button"
              className="secondary-btn chat-collapse-toggle-btn"
              onClick={toggleSessionPanelVisibility}
              aria-expanded={!isSessionPanelCollapsed}
            >
              {isSessionPanelCollapsed ? "Show settings" : "Hide settings"}
            </button>
          </div>
        </header>
        {!isSessionPanelCollapsed || !session ? (
          session ? (
            <div className="codex-auth-state">
              {!isCompactChatViewport ? (
                <p className="codex-auth-row">
                  <strong>Thread ID:</strong> <code className="runner-id">{session.id}</code>
                </p>
              ) : null}
              <p className="codex-auth-row">
                <strong>Model:</strong> {session.currentModelName || session.currentModelId || "n/a"}
              </p>
              <p className="codex-auth-row">
                <strong>Reasoning:</strong> {session.currentReasoningLevel || "n/a"}
              </p>
              {!isCompactChatViewport ? (
                <p className="codex-auth-row codex-auth-row-additional-instructions">
                  <strong>Additional instructions:</strong>{" "}
                  {session.additionalModelInstructions || "none"}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="empty-hint">Chat not found.</p>
          )
        ) : null}
      </section>

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
