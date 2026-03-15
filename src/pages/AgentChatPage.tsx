import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CreationModal } from "../components/CreationModal.tsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.tsx";
import { ThreadTaskSummary } from "../components/ThreadTaskSummary.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { formatTimestamp } from "../utils/formatting.ts";
import { matchesMediaQuery } from "../utils/media.ts";
import {
  compareTurnsByTimestamp,
  getLatestRunningChatTurn,
  isChatSessionRunning,
  selectVisibleTurnsByMessageCount,
} from "../utils/chat.ts";
import {
  CHAT_MESSAGE_BATCH_SIZE,
  THREAD_TITLE_MAX_LENGTH,
  TRANSCRIPT_TOP_LOAD_THRESHOLD_PX,
  TRANSCRIPT_BOTTOM_STICKY_THRESHOLD_PX,
} from "../utils/constants.ts";

const MOBILE_MEDIA_QUERY = "(max-width: 1080px)";

const CHAT_COMPOSER_MIN_LINES = 2;
const CHAT_COMPOSER_MAX_LINES = 50;
const CHAT_SIDEBAR_MIN_WIDTH_PX = 176;
const CHAT_SIDEBAR_MAX_WIDTH_PX = 480;
const CHAT_SIDEBAR_DEFAULT_WIDTH_PX = 224;
const CHAT_TRANSCRIPT_COLLAPSE_LINE_THRESHOLD = 30;
const CHAT_TRANSCRIPT_APPROX_CHARS_PER_LINE = 72;
const CHAT_SIDEBAR_WIDTH_STORAGE_KEY = "agent-chat-sidebar-width-px";
const CHAT_MESSAGE_META_TOGGLE_IGNORE_SELECTOR = "button, a, input, textarea, select, summary";
export const CHAT_EMPTY_STATE_PROMPTS = [
  "Summarize this repository",
  "Find the most likely bug in this codebase",
  "Write an implementation plan for the next feature",
  "Explain how this project is structured",
];

export function applyChatPromptSuggestion({
  prompt,
  onChatDraftMessageChange,
  inputRef,
}: any) {
  const normalizedPrompt = String(prompt || "").trim();
  if (!normalizedPrompt || typeof onChatDraftMessageChange !== "function") {
    return;
  }

  onChatDraftMessageChange(normalizedPrompt);
  const inputNode = inputRef?.current;
  if (inputNode && typeof inputNode.focus === "function") {
    inputNode.focus();
    if (typeof inputNode.setSelectionRange === "function") {
      inputNode.setSelectionRange(normalizedPrompt.length, normalizedPrompt.length);
    }
  }
}

function hasVisibleText(value: any) {
  return String(value || "").trim().length > 0;
}

function clampChatSidebarWidth(value: any) {
  if (!Number.isFinite(value)) {
    return CHAT_SIDEBAR_DEFAULT_WIDTH_PX;
  }
  return Math.min(CHAT_SIDEBAR_MAX_WIDTH_PX, Math.max(CHAT_SIDEBAR_MIN_WIDTH_PX, value));
}

function toItemTypePlaceholder(itemType: any) {
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

function resolveChatItemBodyText(item: any, itemType: any) {
  const text = String(item?.text || "");
  if (hasVisibleText(text)) {
    return text;
  }

  const command = String(item?.command || "");
  if (itemType === "command_execution") {
    return hasVisibleText(command) ? command : "(command unavailable)";
  }

  if (hasVisibleText(command)) {
    return command;
  }

  return toItemTypePlaceholder(itemType);
}

function isLongTranscriptItemBodyText(rawText: any) {
  const normalizedText = String(rawText || "").trim();
  if (!normalizedText) {
    return false;
  }

  const estimatedLineCount = normalizedText.split(/\r?\n/).reduce((totalLineCount: number, line: string) => {
    const estimatedWrappedLineCount = Math.max(1, Math.ceil(line.length / CHAT_TRANSCRIPT_APPROX_CHARS_PER_LINE));
    return totalLineCount + estimatedWrappedLineCount;
  }, 0);

  return estimatedLineCount > CHAT_TRANSCRIPT_COLLAPSE_LINE_THRESHOLD;
}

function getQueuedMessagePreview(rawText: any) {
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

function clampThreadTitle(value: any) {
  return String(value || "").slice(0, THREAD_TITLE_MAX_LENGTH);
}

function normalizeChatListStatusFilter(value: any) {
  return String(value || "").trim().toLowerCase() === "archived" ? "archived" : "active";
}

function isArchivedThreadStatus(value: any) {
  const normalizedStatus = String(value || "").trim().toLowerCase();
  return normalizedStatus === "archived" || normalizedStatus === "archiving";
}

function SidebarChatSessionItem({
  agentId,
  session,
  sessionsForAgent,
  isSelected = false,
  chatSessionRunningById,
  archivingChatSessionKey,
  deletingChatSessionKey,
  chatListStatusFilter = "active",
  onOpen,
  onArchive,
  onDelete,
  taskSummaryModalId = "",
  showTaskSummary = true,
  showPendingStatus = true,
}: any) {
  const normalizedAgentId = String(agentId || "").trim();
  const normalizedSessionId = String(session?.id || "").trim();
  if (!normalizedAgentId || !normalizedSessionId) {
    return null;
  }

  const isRunningSession = isChatSessionRunning(session, chatSessionRunningById);
  const sessionStatus = String(session?.status || "").trim().toLowerCase();
  const isErrorSession = sessionStatus === "error";
  const isArchivedSession = sessionStatus === "archived";
  const isArchivingSession = sessionStatus === "archiving";
  const isDeletingSession = sessionStatus === "deleting";
  const isPendingSession = sessionStatus === "pending";
  const normalizedListStatusFilter = normalizeChatListStatusFilter(chatListStatusFilter);
  const chatSessionKey = `${normalizedAgentId}:${normalizedSessionId}`;
  const isArchivingChat = archivingChatSessionKey === chatSessionKey || isArchivingSession;
  const isDeletingChat = deletingChatSessionKey === chatSessionKey || isDeletingSession;
  const showDeleteAction = normalizedListStatusFilter === "archived" || isArchivedSession;
  const actionLabel = showDeleteAction
    ? isDeletingChat
      ? "Deleting permanently..."
      : "Delete permanently"
    : isArchivingChat
      ? "Archiving..."
      : "Archive chat";

  function handleOpen() {
    if (isDeletingChat) {
      return;
    }
    onOpen?.({
      agentId: normalizedAgentId,
      sessionId: normalizedSessionId,
      sessionsForAgent,
    });
  }

  const statusBadge = isRunningSession ? (
    <ChatSessionRunningBadge />
  ) : showPendingStatus && isPendingSession ? (
    <span className="chat-thread-status chat-thread-status-pending">pending</span>
  ) : isDeletingSession ? (
    <span className="chat-thread-status chat-thread-status-deleting">deleting</span>
  ) : isArchivingSession ? (
    <span className="chat-thread-status chat-thread-status-deleting">archiving</span>
  ) : isArchivedSession ? (
    <span className="chat-thread-status chat-thread-status-archived">archived</span>
  ) : isErrorSession ? (
    <span className="chat-thread-status chat-thread-status-error">error</span>
  ) : null;

  return (
    <li
      className={`chat-card${isSelected ? " chat-card-active" : ""}`}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event: any) => {
        if (event.key === "Enter") {
          handleOpen();
        }
      }}
    >
      <div className="chat-card-main">
        <div className="chat-card-title-row">
          <p className="chat-card-title chat-sidebar-chat-title">
            <strong>{session?.title || "Untitled chat"}</strong>
          </p>
          {statusBadge ? <div className="chat-card-status">{statusBadge}</div> : null}
        </div>
        {isArchivedSession || isArchivingSession ? (
          <p className="chat-card-meta">
            {isArchivingSession ? "Releasing runtime resources" : `Archived ${formatTimestamp(session?.archivedAt)}`}
          </p>
        ) : null}
        {showTaskSummary ? (
          <ThreadTaskSummary
            tasks={session?.tasks}
            threadTitle={session?.title}
            modalId={taskSummaryModalId || `chat-sidebar-${normalizedAgentId}-${normalizedSessionId}`}
          />
        ) : null}
      </div>
      <div className="chat-card-actions">
        <button
          type="button"
          className={`chat-card-icon-btn${showDeleteAction ? " chat-card-icon-btn-danger" : ""}`}
          onClick={(event: any) => {
            event.preventDefault();
            event.stopPropagation();
            const payload = {
              agentId: normalizedAgentId,
              sessionId: normalizedSessionId,
              title: session?.title,
            };
            if (showDeleteAction) {
              void onDelete?.(payload);
              return;
            }
            void onArchive?.(payload);
          }}
          disabled={(showDeleteAction ? !onDelete : !onArchive) || isDeletingChat || isArchivingChat}
          aria-label={actionLabel}
          title={actionLabel}
        >
          {showDeleteAction ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 7h18" />
              <path d="M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
              <path d="M9 11h6" />
              <path d="M12 7V4" />
            </svg>
          )}
        </button>
      </div>
    </li>
  );
}

export function resolveChatPageActionVisibility({
  canChat,
  showChatSidebar,
  isMobileViewport,
}: any) {
  return {
    showChatListToggle: Boolean(showChatSidebar && canChat && isMobileViewport),
    showDeleteAction: Boolean(canChat),
    showSettingsAction: Boolean(canChat),
  };
}

export function getChatSettingsModalCardClassName(isMobileViewport: any) {
  return isMobileViewport ? "chat-settings-modal-card-mobile" : "";
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
  routeNotFoundMessage = "",
  chatDraftMessage,
  chatListStatusFilter = "active",
  isSendingChatMessage,
  isInterruptingChatTurn,
  isUpdatingChatTitle,
  archivingChatSessionKey,
  deletingChatSessionKey,
  steeringQueuedMessageId,
  retryingQueuedMessageId,
  deletingQueuedMessageId,
  getCreateChatDisabledReason,
  sendDisabledReason = "",
  onChatSessionRenameDraftChange,
  onChatDraftMessageChange,
  onChatListStatusFilterChange,
  onBackToChats,
  onArchiveChat,
  onDeleteChat,
  onBatchDeleteChats,
  isBatchDeletingChats = false,
  onSaveChatSessionTitle,
  onSendChatMessage,
  onInterruptChatTurn,
  onSteerQueuedMessage,
  onRetryQueuedMessage,
  onDeleteQueuedMessage,
  onCreateChatForAgent,
  onOpenChatFromList,
  allowArchivedMode = true,
}: any) {
  const normalizedRouteNotFoundMessage = String(routeNotFoundMessage || "").trim();
  const hasRouteNotFoundMessage = Boolean(normalizedRouteNotFoundMessage);
  const canChat = Boolean(agent && session) && !hasRouteNotFoundMessage;
  const selectedAgentId = String(agent?.id || "").trim();
  const selectedSessionId = String(session?.id || "").trim();
  const normalizedChatListStatusFilter = allowArchivedMode
    ? normalizeChatListStatusFilter(chatListStatusFilter)
    : "active";
  const canShowCreateChatActions = normalizedChatListStatusFilter !== "archived";
  const sessionStatus = String(session?.status || "").trim().toLowerCase();
  const isSessionArchived = canChat && sessionStatus === "archived";
  const isSessionArchiving = canChat && sessionStatus === "archiving";
  const isSessionReadOnly = canChat && isArchivedThreadStatus(sessionStatus);
  const isSessionError = canChat && sessionStatus === "error";
  const isSessionDeleting = canChat && sessionStatus === "deleting";
  const isSessionPending = canChat && sessionStatus === "pending";
  const sessionErrorMessage = String(session?.errorMessage || "").trim();
  const normalizedSendDisabledReason = String(sendDisabledReason || "").trim();
  const sortedSidebarAgents = useMemo(() => {
    return [...(Array.isArray(agents) ? agents : [])].sort((leftAgent: any, rightAgent: any) =>
      String(leftAgent?.name || "").localeCompare(String(rightAgent?.name || "")),
    );
  }, [agents]);
  const selectedAgentSessions = useMemo(() => {
    if (!selectedAgentId) {
      return [];
    }
    const sessionsForAgent = chatSessionsByAgent?.[selectedAgentId];
    return Array.isArray(sessionsForAgent) ? sessionsForAgent : [];
  }, [chatSessionsByAgent, selectedAgentId]);
  const hasKnownChatsForAgent = selectedAgentSessions.length > 0;
  const canInteractWithSession = canChat && !isSessionDeleting && !isSessionReadOnly;
  const canSendMessages = canInteractWithSession && !normalizedSendDisabledReason;
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<any>(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState<any>(false);
  const [selectedCommandOutputItem, setSelectedCommandOutputItem] = useState<any>(null);
  const [selectedQueuedMessage, setSelectedQueuedMessage] = useState<any>(null);
  const [isComposerExpanded, setIsComposerExpanded] = useState<any>(false);
  const [isMobileChatListOpen, setIsMobileChatListOpen] = useState<any>(false);
  const [expandedMessageMetaId, setExpandedMessageMetaId] = useState<any>("");
  const [expandedTranscriptItemIds, setExpandedTranscriptItemIds] = useState<any>({});
  const expandedTextareaRef = useRef<any>(null);
  const [chatSidebarWidth, setChatSidebarWidth] = useState<any>(() => {
    if (typeof window === "undefined") {
      return CHAT_SIDEBAR_DEFAULT_WIDTH_PX;
    }
    const storedWidth = Number.parseFloat(window.localStorage.getItem(CHAT_SIDEBAR_WIDTH_STORAGE_KEY) || "");
    return clampChatSidebarWidth(storedWidth);
  });
  const [isResizingChatSidebar, setIsResizingChatSidebar] = useState<any>(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState<any>(CHAT_MESSAGE_BATCH_SIZE);
  const chatMessageInputRef = useRef<any>(null);
  const transcriptScrollRef = useRef<any>(null);
  const chatSidebarResizeStartRef = useRef<any>(null);
  const shouldStickTranscriptToBottomRef = useRef<any>(true);
  const isTranscriptNearTopRef = useRef<any>(false);
  const pendingTranscriptScrollRestoreRef = useRef<any>(null);
  const previousTotalMessageCountRef = useRef<any>(null);
  const queuedMessages = Array.isArray(queuedChatMessages) ? queuedChatMessages : [];
  const orderedTurns = useMemo(
    () => [...(Array.isArray(chatTurns) ? chatTurns : [])].sort(compareTurnsByTimestamp),
    [chatTurns],
  );
  const hasRunningTurn = useMemo(
    () => Boolean(getLatestRunningChatTurn(orderedTurns)) || isChatSessionRunning(session, chatSessionRunningById),
    [orderedTurns, session, chatSessionRunningById],
  );
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
    return visibleTurns.reduce((count: any, turn: any) => {
      return count + (Array.isArray(turn?.items) ? turn.items.length : 0);
    }, 0);
  }, [visibleTurns]);
  const isShowingPartialTranscript = visibleMessageCount < totalMessageCount;
  const hasTranscriptContent = orderedTurns.length > 0 || queuedMessages.length > 0;
  const showTranscriptLoadingState =
    canChat
    && !hasRouteNotFoundMessage
    && isLoadingChat
    && !hasTranscriptContent
    && !isSessionDeleting
    && !isSessionReadOnly;
  const showTranscriptEmptyState =
    canChat
    && !hasRouteNotFoundMessage
    && !isLoadingChat
    && !hasTranscriptContent
    && !isSessionDeleting
    && !isSessionReadOnly;

  const isMobileViewport = useMemo(() => matchesMediaQuery(MOBILE_MEDIA_QUERY), []);
  const pageActionVisibility = useMemo(
    () => resolveChatPageActionVisibility({ canChat, showChatSidebar, isMobileViewport }),
    [canChat, isMobileViewport, showChatSidebar],
  );

  useEffect(() => {
    if (session?.id) {
      setIsMobileChatListOpen(false);
    }
  }, [session?.id]);

  useEffect(() => {
    setVisibleMessageCount(CHAT_MESSAGE_BATCH_SIZE);
    shouldStickTranscriptToBottomRef.current = true;
    isTranscriptNearTopRef.current = false;
    pendingTranscriptScrollRestoreRef.current = null;
    previousTotalMessageCountRef.current = null;
    setExpandedMessageMetaId("");
    setExpandedTranscriptItemIds({});
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
    setVisibleMessageCount((currentCount: any) =>
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
    const hasScrollbar = chatMessageInputNode.scrollHeight > maxHeight;
    chatMessageInputNode.style.overflowY = hasScrollbar ? "auto" : "hidden";
    const expandBtn = chatMessageInputNode.parentElement?.querySelector(".chat-composer-expand-btn") as HTMLElement | null;
    if (expandBtn) {
      expandBtn.style.right = hasScrollbar ? "1.1rem" : "0.35rem";
    }
  }, []);

  useLayoutEffect(() => {
    resizeChatMessageInput();
  }, [chatDraftMessage, resizeChatMessageInput]);

  function handleChatMessageKeyDown(event: any) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    if (!canInteractWithSession || isSendingChatMessage || !chatDraftMessage.trim()) {
      return;
    }
    event.preventDefault();
    onSendChatMessage(event, "steer");
  }

  function handleTranscriptScroll(event: any) {
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
    setVisibleMessageCount((currentCount: any) =>
      Math.min(currentCount + CHAT_MESSAGE_BATCH_SIZE, totalMessageCount),
    );
  }

  const handleOpenSettingsModal = useCallback(() => {
    if (!session) {
      return;
    }
    onChatSessionRenameDraftChange(clampThreadTitle(session.title));
    setIsSettingsModalOpen(true);
  }, [onChatSessionRenameDraftChange, session]);

  const handleCloseSettingsModal = useCallback(() => {
    onChatSessionRenameDraftChange(clampThreadTitle(session?.title));
    setIsSettingsModalOpen(false);
  }, [onChatSessionRenameDraftChange, session?.title]);

  const handleSaveSettings = useCallback(async (event: any) => {
    const updated = await onSaveChatSessionTitle(event);
    if (updated) {
      setIsSettingsModalOpen(false);
    }
  }, [onSaveChatSessionTitle]);

  const handleSidebarResizeStart = useCallback((event: any) => {
    if (event.button !== 0) {
      return;
    }
    chatSidebarResizeStartRef.current = {
      startX: event.clientX,
      startWidth: chatSidebarWidth,
    };
    setIsResizingChatSidebar(true);
    if (typeof document !== "undefined") {
      document.body.classList.add("chat-sidebar-resizing");
    }
    event.preventDefault();
  }, [chatSidebarWidth]);

  useEffect(() => {
    if (!isResizingChatSidebar) {
      return undefined;
    }

    const handleMouseMove = (event: any) => {
      const resizeStart = chatSidebarResizeStartRef.current;
      if (!resizeStart) {
        return;
      }
      const deltaX = event.clientX - resizeStart.startX;
      setChatSidebarWidth(clampChatSidebarWidth(resizeStart.startWidth + deltaX));
    };

    const stopResizing = () => {
      setIsResizingChatSidebar(false);
      chatSidebarResizeStartRef.current = null;
      if (typeof document !== "undefined") {
        document.body.classList.remove("chat-sidebar-resizing");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("mouseleave", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("mouseleave", stopResizing);
      if (typeof document !== "undefined") {
        document.body.classList.remove("chat-sidebar-resizing");
      }
    };
  }, [isResizingChatSidebar]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CHAT_SIDEBAR_WIDTH_STORAGE_KEY, String(chatSidebarWidth));
  }, [chatSidebarWidth]);

  useEffect(() => {
    if (showChatSidebar) {
      return;
    }
    setIsResizingChatSidebar(false);
    chatSidebarResizeStartRef.current = null;
    if (typeof document !== "undefined") {
      document.body.classList.remove("chat-sidebar-resizing");
    }
  }, [showChatSidebar]);

  const chatMainLayoutStyle: any = showChatSidebar
    ? { "--chat-sidebar-width": `${clampChatSidebarWidth(chatSidebarWidth)}px` }
    : undefined;

  const hasPageActions =
    pageActionVisibility.showChatListToggle
    || pageActionVisibility.showSettingsAction
    || hasRunningTurn;
  const pageActions = useMemo(() => {
    if (!hasPageActions) {
      return null;
    }
    return (
      <>
        {pageActionVisibility.showChatListToggle ? (
          <button
            type="button"
            className="chat-minimal-header-icon-btn chat-mobile-chatlist-toggle-btn"
            onClick={() => setIsMobileChatListOpen((open: any) => !open)}
            aria-label="Toggle chat list"
            title="Toggle chat list"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        ) : null}
        {hasRunningTurn ? (
          <span
            className="chat-turn-spinner chat-minimal-header-spinner"
            aria-label="Turn is running"
            title="Turn in progress"
          />
        ) : null}
        {pageActionVisibility.showSettingsAction ? (
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            onClick={handleOpenSettingsModal}
            aria-label="Chat settings"
            title="Chat settings"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        ) : null}
      </>
    );
  }, [
    handleOpenSettingsModal,
    hasPageActions,
    hasRunningTurn,
    pageActionVisibility.showChatListToggle,
    pageActionVisibility.showSettingsAction,
  ]);
  useSetPageActions(pageActions);

  const showMobileNoSession = showChatSidebar && isMobileViewport && !session;
  const showMobileChatListOverlay = showChatSidebar && isMobileChatListOpen && !showMobileNoSession;

  const handleMobileChatOpen = useCallback((payload: any) => {
    setIsMobileChatListOpen(false);
    onOpenChatFromList?.(payload);
  }, [onOpenChatFromList]);

  const handleMobileCreateChat = useCallback(async (agentId: any) => {
    setIsMobileChatListOpen(false);
    return onCreateChatForAgent?.(agentId);
  }, [onCreateChatForAgent]);

  return (
    <div className={`page-stack chat-page-stack${showChatSidebar ? " chat-page-stack-with-sidebar" : ""}`}>
      {showMobileNoSession ? (
        <aside className="panel list-panel chat-sidebar-panel chat-sidebar-panel-mobile-full">
          <div className="chat-sidebar-toolbar">
            <h2 className="chat-mobile-full-title">Chats</h2>
          </div>
          {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
          {!isLoadingChatIndex && sortedSidebarAgents.length === 0 ? (
            <p className="empty-hint">No agents available yet.</p>
          ) : null}
          {sortedSidebarAgents.length > 0 ? (
            <ul className="chat-sidebar-agent-list">
              {sortedSidebarAgents.map((sidebarAgent: any) => {
                const sidebarAgentId = String(sidebarAgent?.id || "").trim();
                const sidebarSessions = Array.isArray(chatSessionsByAgent?.[sidebarAgentId])
                  ? chatSessionsByAgent[sidebarAgentId]
                  : [];
                const sortedSidebarSessions = [...sidebarSessions].sort((leftSession: any, rightSession: any) =>
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

                return (
                  <li key={`mobile-agent-${sidebarAgentId}`} className="chat-sidebar-agent-card">
                    <div className="chat-sidebar-agent-header">
                      <div className="chat-sidebar-agent-main">
                        <p className="chat-sidebar-agent-name">
                          <strong>{String(sidebarAgent?.name || "").trim() || "Unnamed agent"}</strong>
                        </p>
                        <p className="chat-sidebar-agent-meta">
                          {sidebarAgent?.agentSdk || "n/a"} · {String(sidebarAgent?.model || sidebarAgent?.defaultModelId || "").trim() || "n/a"}
                        </p>
                      </div>
                      {canShowCreateChatActions ? (
                        <button
                          type="button"
                          className="chat-sidebar-new-chat-btn"
                          disabled={isCreateChatDisabled}
                          onClick={() => {
                            if (!isCreateChatDisabled) {
                              void onCreateChatForAgent(sidebarAgentId);
                            }
                          }}
                          aria-label={isCreatingChatSession ? "Creating..." : "New chat"}
                          title={createChatDisabledReason || "New chat"}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                    {createChatDisabledReason ? (
                      <p className="chat-sidebar-agent-warning">{createChatDisabledReason}</p>
                    ) : null}
                    {sortedSidebarSessions.length > 0 ? (
                      <ul className="chat-card-list chat-sidebar-chat-list">
                        {sortedSidebarSessions.map((sidebarSession: any) => {
                          const sidebarSessionId = String(sidebarSession?.id || "").trim();
                          return (
                            <SidebarChatSessionItem
                              key={`mobile-session-${sidebarAgentId}-${sidebarSessionId}`}
                              agentId={sidebarAgentId}
                              session={sidebarSession}
                              sessionsForAgent={sortedSidebarSessions}
                              chatSessionRunningById={chatSessionRunningById}
                              archivingChatSessionKey={archivingChatSessionKey}
                              deletingChatSessionKey={deletingChatSessionKey}
                              chatListStatusFilter={normalizedChatListStatusFilter}
                              onOpen={onOpenChatFromList}
                              onArchive={onArchiveChat}
                              onDelete={onDeleteChat}
                              taskSummaryModalId={`mobile-sidebar-${sidebarAgentId}-${sidebarSessionId}`}
                              showPendingStatus={false}
                            />
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

      {showMobileChatListOverlay ? (
        <div
          className="chat-mobile-chatlist-overlay"
          role="presentation"
          onClick={() => setIsMobileChatListOpen(false)}
        >
          <aside
            className="panel list-panel chat-sidebar-panel chat-sidebar-panel-mobile-overlay"
            onClick={(event: any) => event.stopPropagation()}
          >
            <div className="chat-mobile-overlay-header chat-mobile-overlay-header-stacked">
              <h3 className="chat-mobile-full-title">Chats</h3>
              <div className="chat-mobile-overlay-actions">
                <button
                  type="button"
                  className="secondary-btn chat-mobile-overlay-close"
                  onClick={() => setIsMobileChatListOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
            {!isLoadingChatIndex && sortedSidebarAgents.length === 0 ? (
              <p className="empty-hint">No agents available yet.</p>
            ) : null}
            {sortedSidebarAgents.length > 0 ? (
              <ul className="chat-sidebar-agent-list">
                {sortedSidebarAgents.map((sidebarAgent: any) => {
                  const sidebarAgentId = String(sidebarAgent?.id || "").trim();
                  const sidebarSessions = Array.isArray(chatSessionsByAgent?.[sidebarAgentId])
                    ? chatSessionsByAgent[sidebarAgentId]
                    : [];
                  const sortedSidebarSessions = [...sidebarSessions].sort((leftSession: any, rightSession: any) =>
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

                  return (
                    <li key={`overlay-agent-${sidebarAgentId}`} className="chat-sidebar-agent-card">
                      <div className="chat-sidebar-agent-header">
                        <div className="chat-sidebar-agent-main">
                          <p className="chat-sidebar-agent-name">
                            <strong>{String(sidebarAgent?.name || "").trim() || "Unnamed agent"}</strong>
                          </p>
                          <p className="chat-sidebar-agent-meta">
                            {sidebarAgent?.agentSdk || "n/a"} · {String(sidebarAgent?.model || sidebarAgent?.defaultModelId || "").trim() || "n/a"}
                          </p>
                        </div>
                        {canShowCreateChatActions ? (
                          <button
                            type="button"
                            className="chat-sidebar-new-chat-btn"
                            disabled={isCreateChatDisabled}
                            onClick={() => {
                              if (!isCreateChatDisabled) {
                                void handleMobileCreateChat(sidebarAgentId);
                              }
                            }}
                            aria-label={isCreatingChatSession ? "Creating..." : "New chat"}
                            title={createChatDisabledReason || "New chat"}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                      {sortedSidebarSessions.length > 0 ? (
                        <ul className="chat-card-list chat-sidebar-chat-list">
                          {sortedSidebarSessions.map((sidebarSession: any) => {
                            const sidebarSessionId = String(sidebarSession?.id || "").trim();
                            const isSelectedSession =
                              sidebarAgentId === selectedAgentId && sidebarSessionId === selectedSessionId;
                            return (
                              <SidebarChatSessionItem
                                key={`overlay-session-${sidebarAgentId}-${sidebarSessionId}`}
                                agentId={sidebarAgentId}
                                session={sidebarSession}
                                sessionsForAgent={sortedSidebarSessions}
                                isSelected={isSelectedSession}
                                chatSessionRunningById={chatSessionRunningById}
                                archivingChatSessionKey={archivingChatSessionKey}
                                deletingChatSessionKey={deletingChatSessionKey}
                                chatListStatusFilter={normalizedChatListStatusFilter}
                                onOpen={handleMobileChatOpen}
                                onArchive={onArchiveChat}
                                onDelete={onDeleteChat}
                                showTaskSummary={false}
                                showPendingStatus={false}
                              />
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
        </div>
      ) : null}

      {showMobileNoSession ? null : (
      <>
      <div className="chat-page-main-layout" style={chatMainLayoutStyle}>
        {showChatSidebar ? (
          <aside className="panel list-panel chat-sidebar-panel">
            <div className="chat-sidebar-toolbar">
              <p className="chat-sidebar-title">Chats</p>
            </div>
            {isLoadingChatIndex ? <p className="empty-hint">Loading chats...</p> : null}
            {!isLoadingChatIndex && sortedSidebarAgents.length === 0 ? (
              <p className="empty-hint">No agents available yet.</p>
            ) : null}
            {sortedSidebarAgents.length > 0 ? (
              <ul className="chat-sidebar-agent-list">
                {sortedSidebarAgents.map((sidebarAgent: any) => {
                  const sidebarAgentId = String(sidebarAgent?.id || "").trim();
                  const sidebarSessions = Array.isArray(chatSessionsByAgent?.[sidebarAgentId])
                    ? chatSessionsByAgent[sidebarAgentId]
                    : [];
                  const sortedSidebarSessions = [...sidebarSessions].sort((leftSession: any, rightSession: any) =>
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
                  const sidebarModelLabel = String(
                    sidebarAgent?.model || sidebarAgent?.defaultModelId || "",
                  ).trim() || "n/a";

                  return (
                    <li
                      key={`chat-sidebar-agent-${sidebarAgentId}`}
                      className="chat-sidebar-agent-card"
                    >
                      <div className="chat-sidebar-agent-header">
                        <div className="chat-sidebar-agent-main">
                          <p className="chat-sidebar-agent-name">
                            <strong>{String(sidebarAgent?.name || "").trim() || "Unnamed agent"}</strong>
                          </p>
                          <p className="chat-sidebar-agent-meta">
                            {sidebarAgent?.agentSdk || "n/a"} · {sidebarModelLabel}
                          </p>
                        </div>
                        {canShowCreateChatActions ? (
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
                        ) : null}
                      </div>
                      {createChatDisabledReason ? (
                        <p className="chat-sidebar-agent-warning">{createChatDisabledReason}</p>
                      ) : null}
                      {sortedSidebarSessions.length > 0 ? (
                        <ul className="chat-card-list chat-sidebar-chat-list">
                          {sortedSidebarSessions.map((sidebarSession: any) => {
                            const sidebarSessionId = String(sidebarSession?.id || "").trim();
                            const isSelectedSession =
                              sidebarAgentId === selectedAgentId && sidebarSessionId === selectedSessionId;
                            return (
                              <SidebarChatSessionItem
                                key={`chat-sidebar-session-${sidebarAgentId}-${sidebarSessionId}`}
                                agentId={sidebarAgentId}
                                session={sidebarSession}
                                sessionsForAgent={sortedSidebarSessions}
                                isSelected={isSelectedSession}
                                chatSessionRunningById={chatSessionRunningById}
                                archivingChatSessionKey={archivingChatSessionKey}
                                deletingChatSessionKey={deletingChatSessionKey}
                                chatListStatusFilter={normalizedChatListStatusFilter}
                                onOpen={onOpenChatFromList}
                                onArchive={onArchiveChat}
                                onDelete={onDeleteChat}
                                taskSummaryModalId={`chat-sidebar-${sidebarAgentId}-${sidebarSessionId}`}
                              />
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
        {showChatSidebar ? (
          <div
            className={`chat-sidebar-resizer${isResizingChatSidebar ? " chat-sidebar-resizer-active" : ""}`}
            role="separator"
            aria-label="Resize chat list"
            aria-orientation="vertical"
            onMouseDown={handleSidebarResizeStart}
          />
        ) : null}

        <section className="panel chat-panel">
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {isSessionArchived ? (
          <div className="chat-archived-banner">
            <p className="chat-archived-banner-title">Archived</p>
            <p className="chat-archived-banner-copy">
              Runtime resources were released. This chat is preserved for reference only.
            </p>
          </div>
        ) : null}
        {isSessionError ? (
          <p className="error-banner">
            Thread status is error.
            {sessionErrorMessage ? ` ${sessionErrorMessage}` : ""}
          </p>
        ) : null}
        {isSessionArchiving ? (
          <p className="empty-hint">Thread is archiving. Releasing runtime resources.</p>
        ) : null}
        {isSessionDeleting ? (
          <p className="empty-hint">Thread is deleting. Waiting for runner confirmation.</p>
        ) : null}
        {isSessionPending ? (
          <p className="empty-hint">Thread is pending. Messages sent now will queue until it is ready.</p>
        ) : null}
        {hasRouteNotFoundMessage ? <p className="empty-hint">{normalizedRouteNotFoundMessage}</p> : null}
        {!hasRouteNotFoundMessage && !agent ? <p className="empty-hint">Agent not found.</p> : null}
        {!hasRouteNotFoundMessage && agent && !session && hasKnownChatsForAgent ? (
          <p className="empty-hint">Chat not found.</p>
        ) : null}
        {showTranscriptLoadingState ? (
          <div className="chat-transcript-state chat-transcript-state-loading" role="status" aria-live="polite">
            <span className="chat-turn-spinner chat-transcript-state-spinner" aria-hidden="true" />
            <p className="chat-transcript-state-title">Loading messages...</p>
          </div>
        ) : null}
        {showTranscriptEmptyState ? (
          <div className="chat-transcript-state chat-transcript-state-empty">
            <p className="chat-transcript-state-title">No messages yet. Start with one of these prompts.</p>
            <div className="chat-empty-prompt-list">
              {CHAT_EMPTY_STATE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="secondary-btn chat-empty-prompt-btn"
                  onClick={() =>
                    applyChatPromptSuggestion({
                      prompt,
                      onChatDraftMessageChange,
                      inputRef: chatMessageInputRef,
                    })}
                  disabled={!canInteractWithSession}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {isSessionArchived && !hasTranscriptContent ? (
          <p className="empty-hint">No transcript history was preserved for this archived chat.</p>
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
                {visibleTurns.flatMap((turn: any) => {
                  const normalizedTurnStatus = String(turn?.status || "").trim().toLowerCase();
                  const turnStatus = normalizedTurnStatus === "running"
                    ? "running"
                    : normalizedTurnStatus === "pending"
                      ? "pending"
                      : "completed";
                  const turnItems = Array.isArray(turn?.items) ? turn.items : [];

                  const elements: any[] = [];

                  elements.push(
                    <li key={`sep-${turn.id}`} className="chat-turn-separator">
                      <div className="chat-turn-separator-row">
                        <span className="chat-message-kind">Turn</span>
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
                    const itemId = String(item?.id || "").trim();
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
                    const isLongTranscriptItem = isLongTranscriptItemBodyText(bodyText);
                    const isTranscriptItemExpanded = Boolean(itemId) && Boolean(expandedTranscriptItemIds[itemId]);
                    const shouldClampTranscriptItem = isLongTranscriptItem && !isTranscriptItemExpanded;

                    elements.push(
                      <li
                        key={item.id}
                        className={`chat-message chat-message-${roleLabel}${itemStatus === "running" ? " chat-message-running" : ""}${expandedMessageMetaId === item.id ? " chat-message-meta-expanded" : ""}`}
                        onClick={(event: any) => {
                          if (event.target instanceof Element && event.target.closest(CHAT_MESSAGE_META_TOGGLE_IGNORE_SELECTOR)) {
                            return;
                          }
                          setExpandedMessageMetaId((currentId: any) => currentId === item.id ? "" : item.id);
                        }}
                      >
                        <div className="chat-message-body">
                          {isCommandExecution ? (
                            shouldClampTranscriptItem ? (
                              <p className="chat-message-content chat-message-content-command chat-message-content-clamped">
                                <code>{bodyText}</code>
                              </p>
                            ) : (
                              <p className="chat-message-content chat-message-content-command">
                                <code>{bodyText}</code>
                              </p>
                            )
                          ) : shouldClampTranscriptItem ? (
                            <div className="chat-message-content chat-message-content-markdown chat-message-content-clamped">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyText}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="chat-message-content chat-message-content-markdown">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyText}</ReactMarkdown>
                            </div>
                          )}

                          {isLongTranscriptItem && itemId ? (
                            <button
                              type="button"
                              className="chat-inline-toggle-btn chat-message-show-all-btn"
                              onClick={() =>
                                setExpandedTranscriptItemIds((currentState: any) => {
                                  const nextState = { ...(currentState || {}) };
                                  if (nextState[itemId]) {
                                    delete nextState[itemId];
                                  } else {
                                    nextState[itemId] = true;
                                  }
                                  return nextState;
                                })}
                            >
                              {isTranscriptItemExpanded ? "Show less" : "Show all"}
                            </button>
                          ) : null}

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
              {queuedMessages.map((queuedMessage: any) => {
                const queuedMessageId = String(queuedMessage?.id || "").trim();
                const normalizedQueuedMessageStatus = String(queuedMessage?.status || "").trim().toLowerCase();
                const queuedMessageStatus = normalizedQueuedMessageStatus === "submitted"
                  ? "submitted"
                  : normalizedQueuedMessageStatus === "processed"
                    ? "processed"
                    : normalizedQueuedMessageStatus === "failed"
                      ? "failed"
                      : "queued";
                const queuedMessageError = String(queuedMessage?.errorMessage || "").trim();
                const queuedMessageSdkTurnId = String(queuedMessage?.sdkTurnId || "").trim();
                const isLockedMessage = queuedMessageStatus === "processed";
                const isSteerMode = Boolean(queuedMessage?.allowSteer);
                const isSteeringThisMessage = steeringQueuedMessageId === queuedMessageId;
                const isRetryingThisMessage = retryingQueuedMessageId === queuedMessageId;
                const isDeletingThisMessage = deletingQueuedMessageId === queuedMessageId;
                const queuedMessagePreview = getQueuedMessagePreview(queuedMessage?.text);

                return (
                  <li key={queuedMessageId} className="chat-queued-item">
                    <div className="chat-queued-header">
                      <div className="chat-queued-meta">
                        <span className="chat-message-kind">{queuedMessageStatus}</span>
                        <span className={`chat-turn-status ${isSteerMode ? "chat-turn-status-running" : "chat-turn-status-idle"}`}>
                          {isSteerMode ? "steer" : "queue"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="chat-queued-delete-btn"
                        disabled={
                          !canChat
                          || isSendingChatMessage
                          || isInterruptingChatTurn
                          || isSteeringThisMessage
                          || isRetryingThisMessage
                          || isDeletingThisMessage
                          || isLockedMessage
                        }
                        onClick={() => onDeleteQueuedMessage(queuedMessageId)}
                        aria-label="Delete queued message"
                        title={isLockedMessage ? "Processed queued messages cannot be deleted." : "Delete queued message"}
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
                    {queuedMessageStatus === "failed" ? (
                      <p className="chat-message-error">
                        {queuedMessageError || "Message dispatch failed. Retry or delete this queued message."}
                      </p>
                    ) : null}
                    {queuedMessageStatus === "failed" ? (
                      <div className="task-card-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={
                            !canChat
                            || isSendingChatMessage
                            || isInterruptingChatTurn
                            || isSteeringThisMessage
                            || isRetryingThisMessage
                            || isDeletingThisMessage
                          }
                          onClick={() => onRetryQueuedMessage(queuedMessageId)}
                        >
                          {isRetryingThisMessage ? "Retrying..." : "Retry"}
                        </button>
                      </div>
                    ) : !isSteerMode ? (
                      <div className="task-card-actions">
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={
                            !canChat
                            || isSendingChatMessage
                            || isInterruptingChatTurn
                            || isSteeringThisMessage
                            || isRetryingThisMessage
                            || isDeletingThisMessage
                            || isLockedMessage
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
        cardClassName={getChatSettingsModalCardClassName(isMobileViewport)}
      >
        <form className="chat-settings-modal-form" onSubmit={handleSaveSettings}>
          <div className="chat-settings-field">
            <label htmlFor="chat-settings-title" className="chat-settings-label">Title</label>
            <input
              id="chat-settings-title"
              className="chat-settings-input"
              value={chatSessionRenameDraft}
              onChange={(event: any) => onChatSessionRenameDraftChange(clampThreadTitle(event.target.value))}
              placeholder="e.g. Release planning"
              disabled={isUpdatingChatTitle || isSessionReadOnly}
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
              <span className="chat-settings-info-label">Model</span>
              <span>{session?.currentModelName || session?.currentModelId || "n/a"}</span>
            </p>
            <p className="chat-settings-info-row">
              <span className="chat-settings-info-label">Reasoning</span>
              <span>{session?.currentReasoningLevel || "n/a"}</span>
            </p>
            <p className="chat-settings-info-row">
              <span className="chat-settings-info-label">Status</span>
              <span>{session?.status || "n/a"}</span>
            </p>
            {session?.archivedAt ? (
              <p className="chat-settings-info-row">
                <span className="chat-settings-info-label">Archived</span>
                <span>{formatTimestamp(session.archivedAt)}</span>
              </p>
            ) : null}
            {sessionErrorMessage ? (
              <p className="chat-settings-info-row">
                <span className="chat-settings-info-label">Error</span>
                <span>{sessionErrorMessage}</span>
              </p>
            ) : null}
          </div>
          <div className="chat-settings-lifecycle">
            {!isSessionArchived ? (
              <button
                type="button"
                className="secondary-btn"
                disabled={!session || isSessionArchiving}
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  void onArchiveChat?.({
                    agentId: selectedAgentId,
                    sessionId: selectedSessionId,
                    title: session?.title,
                  });
                }}
              >
                {isSessionArchiving ? "Archiving..." : "Archive chat"}
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-btn chat-settings-danger-btn"
              disabled={!session || isSessionDeleting}
              onClick={() => {
                setIsSettingsModalOpen(false);
                void onDeleteChat?.({
                  agentId: selectedAgentId,
                  sessionId: selectedSessionId,
                  title: session?.title,
                });
              }}
            >
              {isSessionDeleting ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
          <div className="chat-settings-actions">
            {!isSessionReadOnly ? (
              <button type="submit" disabled={isUpdatingChatTitle}>
                {isUpdatingChatTitle ? "Saving..." : "Save"}
              </button>
            ) : null}
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

      {isComposerExpanded ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsComposerExpanded(false)}>
          <section
            className="panel modal-card chat-composer-fullscreen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Expanded message editor"
            onClick={(event: any) => event.stopPropagation()}
          >
            <header className="panel-header panel-header-row modal-header">
              <h2>Compose message</h2>
              <button
                type="button"
                className="secondary-btn modal-close-btn"
                onClick={() => setIsComposerExpanded(false)}
              >
                Close
              </button>
            </header>
            <div className="chat-composer-fullscreen-body">
              <textarea
                ref={expandedTextareaRef}
                className="chat-composer-fullscreen-input"
                placeholder="Ask the agent to plan, debug, or implement something..."
                value={chatDraftMessage}
                onChange={(event: any) => onChatDraftMessageChange(event.target.value)}
                onKeyDown={(event: any) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setIsComposerExpanded(false);
                  }
                }}
                autoFocus
                disabled={!canSendMessages || isSendingChatMessage || isInterruptingChatTurn}
              />
              <div className="chat-composer-fullscreen-footer">
                <span className="subcopy">Esc to close</span>
                <button
                  type="button"
                  disabled={!canSendMessages || !chatDraftMessage.trim() || isSendingChatMessage}
                  onClick={(event: any) => {
                    setIsComposerExpanded(false);
                    onSendChatMessage(event, "steer");
                  }}
                >
                  {isSendingChatMessage ? "Sending..." : "Send message"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {!isSessionReadOnly ? (
      <section className="panel composer-panel chat-composer-panel">
        {latestReasoning ? (
          <p className={`chat-turn-reasoning chat-turn-reasoning-${latestReasoning.status} chat-composer-reasoning`}>
            {latestReasoning.text}
          </p>
        ) : null}
        {normalizedSendDisabledReason ? <p className="empty-hint">{normalizedSendDisabledReason}</p> : null}
        <form className="chat-composer-form" onSubmit={onSendChatMessage}>
          <div className={`chat-composer-input-row${hasRunningTurn ? " chat-composer-input-row-running" : " chat-composer-input-row-idle"}`}>
            <div className="chat-composer-input-wrapper">
              <textarea
                id="chat-message-input"
                ref={chatMessageInputRef}
                className="chat-composer-input"
                rows={CHAT_COMPOSER_MIN_LINES}
                placeholder="Ask the agent to plan, debug, or implement something..."
                value={chatDraftMessage}
                onChange={(event: any) => onChatDraftMessageChange(event.target.value)}
                onKeyDown={handleChatMessageKeyDown}
                disabled={!canSendMessages || isSendingChatMessage || isInterruptingChatTurn}
              />
              <button
                type="button"
                className="chat-composer-expand-btn"
                onClick={() => setIsComposerExpanded(true)}
                disabled={!canSendMessages}
                title="Expand editor"
                aria-label="Expand editor to fullscreen"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>
            <div className="chat-composer-toolbar">
              {hasRunningTurn ? (
                <span className="chat-composer-status">
                  <span className="chat-turn-spinner chat-item-spinner" aria-hidden="true" />
                  <span className="chat-composer-status-label">Running</span>
                </span>
              ) : null}
              <div className={`chat-composer-actions${hasRunningTurn ? " chat-composer-actions-running" : ""}`}>
                {hasRunningTurn ? (
                  <>
                    <button
                      type="button"
                      className="secondary-btn chat-action-btn"
                      disabled={!canSendMessages || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={(event: any) => onSendChatMessage(event, "queue")}
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
                        <span className="chat-action-btn-label">{isSendingChatMessage ? "..." : "Queue"}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="secondary-btn chat-action-btn"
                      disabled={!canSendMessages || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={(event: any) => onSendChatMessage(event, "steer")}
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
                        <span className="chat-action-btn-label">{isSendingChatMessage ? "..." : "Steer"}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="chat-stop-btn"
                      disabled={!canInteractWithSession || isSendingChatMessage || isInterruptingChatTurn}
                      onClick={onInterruptChatTurn}
                      aria-label={isInterruptingChatTurn ? "Stopping..." : "Stop"}
                      title={isInterruptingChatTurn ? "Stopping..." : "Stop"}
                    >
                      <span className="chat-stop-icon" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="chat-composer-send-btn"
                    disabled={!canSendMessages || !chatDraftMessage.trim() || isSendingChatMessage || isInterruptingChatTurn}
                    aria-label={isSendingChatMessage ? "Sending message..." : "Send message"}
                    title={isSendingChatMessage ? "Sending message..." : "Send message"}
                  >
                    {isSendingChatMessage ? (
                      <span className="chat-turn-spinner chat-item-spinner" aria-hidden="true" />
                    ) : (
                      <svg
                        className="chat-composer-send-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M3 11 21 3 13 21 11 13 3 11z" />
                        <path d="m11 13 10-10" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </section>
      ) : null}
      </>
      )}
    </div>
  );
}
