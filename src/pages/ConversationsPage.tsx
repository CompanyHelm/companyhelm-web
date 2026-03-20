import { useEffect, useMemo, useRef, useState } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { ConversationCreateModal } from "../components/ConversationCreateModal.tsx";
import { ConversationParticipantsModal } from "../components/ConversationParticipantsModal.tsx";
import { formatTimestamp, toSortableTimestamp } from "../utils/formatting.ts";

function formatParticipantLabel(participant: any, currentUserId: string) {
  const participantUserId = String(participant?.userId || "").trim();
  if (participantUserId && participantUserId === currentUserId) {
    return "You";
  }
  return String(participant?.displayName || "").trim() || "Unknown participant";
}

function formatConversationListLabel(conversation: any, currentUserId: string) {
  const labels = (Array.isArray(conversation?.participants) ? conversation.participants : [])
    .map((participant: any) => formatParticipantLabel(participant, currentUserId))
    .filter(Boolean);
  return labels.join(", ") || "Untitled conversation";
}

function resolveSenderParticipant(message: any, participants: any[]) {
  const senderActorInstanceId = String(message?.senderActorInstanceId || "").trim();
  return (Array.isArray(participants) ? participants : []).find(
    (participant: any) => String(participant?.actorInstanceId || "").trim() === senderActorInstanceId,
  ) || null;
}

function formatSenderLabel(message: any, participants: any[], currentUserId: string) {
  const matchedParticipant = resolveSenderParticipant(message, participants);
  return formatParticipantLabel(matchedParticipant, currentUserId);
}

function isCurrentUserMessage(message: any, participants: any[], currentUserId: string) {
  const matchedParticipant = resolveSenderParticipant(message, participants);
  return String(matchedParticipant?.userId || "").trim() === currentUserId;
}

export function ConversationsPage({
  currentUser,
  agents,
  conversations,
  selectedConversationId,
  messages,
  isLoadingConversations,
  isLoadingMessages,
  isCreatingConversation,
  isAddingConversationAgents,
  isSendingConversationMessage,
  isDeletingConversation,
  error,
  onOpenConversation,
  onCreateConversation,
  onAddAgents,
  onSendMessage,
  onDeleteConversation,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const conversationOptionsRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = String(currentUser?.id || "").trim();
  const currentUserLabel = String(currentUser?.firstName || "").trim()
    || String(currentUser?.email || "").trim()
    || "Signed-in user";
  const selectedConversation = useMemo(() =>
    (Array.isArray(conversations) ? conversations : []).find(
      (conversation: any) => String(conversation?.id || "").trim() === String(selectedConversationId || "").trim(),
    ) || null,
  [conversations, selectedConversationId]);
  const orderedMessages = useMemo(() =>
    [...(Array.isArray(messages) ? messages : [])].sort((left: any, right: any) => {
      const timestampDifference = toSortableTimestamp(left?.createdAt) - toSortableTimestamp(right?.createdAt);
      if (timestampDifference !== 0) {
        return timestampDifference;
      }
      return String(left?.id || "").localeCompare(String(right?.id || ""));
    }),
  [messages]);
  const pageActions = useMemo(() => (
    <button type="button" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
      New conversation
    </button>
  ), []);
  useSetPageActions(pageActions);

  useEffect(() => {
    setMessageDraft("");
    setIsParticipantsModalOpen(false);
    setIsOptionsMenuOpen(false);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isOptionsMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!conversationOptionsRef.current?.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOptionsMenuOpen]);

  useEffect(() => {
    const transcriptNode = transcriptScrollRef.current;
    if (!transcriptNode) {
      return;
    }
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [selectedConversationId, orderedMessages.length]);

  async function handleSendMessage() {
    const normalizedDraft = String(messageDraft || "").trim();
    if (!normalizedDraft) {
      return;
    }
    await onSendMessage(normalizedDraft);
    setMessageDraft("");
  }

  return (
    <Page className="page-container-full conversations-page-shell">
      <ConversationCreateModal
        isOpen={isCreateModalOpen}
        currentUserLabel={currentUserLabel}
        agents={agents}
        isSubmitting={isCreatingConversation}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (agentIds) => {
          await onCreateConversation(agentIds);
          setIsCreateModalOpen(false);
        }}
      />
      <ConversationParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        participants={selectedConversation?.participants || []}
        availableAgents={agents}
        isSubmitting={isAddingConversationAgents}
        onSubmit={async (agentIds) => {
          await onAddAgents(agentIds);
          setIsParticipantsModalOpen(false);
        }}
      />

      <div className="chat-page-stack chat-page-stack-with-sidebar conversations-workspace">
        <div className="chat-page-main-layout">
          <aside className="panel list-panel chat-sidebar-panel conversations-sidebar">
            <div className="chat-sidebar-toolbar">
              <h2 className="chat-sidebar-title">Conversations</h2>
            </div>
            {error ? <p className="error-banner">{error}</p> : null}
            {isLoadingConversations ? <p className="empty-hint">Loading conversations...</p> : null}
            {!isLoadingConversations && (!Array.isArray(conversations) || conversations.length === 0) ? (
              <p className="empty-hint">No conversations yet.</p>
            ) : null}
            <ul className="chat-sidebar-agent-list chat-sidebar-chat-list" role="list" aria-label="Conversation list">
              {(Array.isArray(conversations) ? conversations : []).map((conversation: any) => {
                const conversationId = String(conversation?.id || "").trim();
                const isSelected = conversationId === String(selectedConversationId || "").trim();
                return (
                  <li
                    key={conversationId}
                    className={`chat-card${isSelected ? " chat-card-active" : ""}`}
                    onClick={() => onOpenConversation(conversationId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event: any) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenConversation(conversationId);
                      }
                    }}
                  >
                    <div className="chat-card-main conversation-sidebar-card-main">
                      <p className="chat-card-title conversation-sidebar-participants">
                        <strong>{formatConversationListLabel(conversation, currentUserId)}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="conversation-list-delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteConversation(conversationId);
                      }}
                      disabled={isDeletingConversation}
                      aria-label="Delete conversation from list"
                      title="Delete conversation"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5v.75h3a.75.75 0 0 1 0 1.5h-1.06l-.72 11.42A2.25 2.25 0 0 1 15.47 21H8.53a2.25 2.25 0 0 1-2.25-2.08L5.56 7.5H4.5a.75.75 0 0 1 0-1.5h3v-.75A1.5 1.5 0 0 1 9 3.75Zm6 2.25v-.75h-6V6h6Zm-6.72 1.5.71 11.33a.75.75 0 0 0 .75.67h5.52a.75.75 0 0 0 .75-.67l.71-11.33H8.28Zm2.47 2.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="panel chat-panel conversation-chat-panel">
            {!selectedConversation ? (
              <div className="chat-transcript-state chat-transcript-state-empty">
                <p className="chat-transcript-state-title">Select a conversation or start a new one.</p>
              </div>
            ) : (
              <>
                <header className="chat-minimal-header conversation-minimal-header">
                  <div className="chat-minimal-header-info">
                    <p className="chat-minimal-header-agent">Conversation</p>
                    <h2 className="chat-minimal-header-title">
                      {formatConversationListLabel(selectedConversation, currentUserId)}
                    </h2>
                  </div>
                  <div className="chat-minimal-header-actions">
                    <div className="conversation-options-anchor" ref={conversationOptionsRef}>
                      <button
                        type="button"
                        className="chat-minimal-header-icon-btn"
                        onClick={() => setIsOptionsMenuOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={isOptionsMenuOpen}
                        aria-label="Conversation options"
                        title="Conversation options"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
                          />
                          <path d="M12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z" />
                        </svg>
                      </button>
                      {isOptionsMenuOpen ? (
                        <div className="conversation-options-menu" role="menu" aria-label="Conversation options menu">
                          <button
                            type="button"
                            className="conversation-options-item"
                            onClick={() => {
                              setIsOptionsMenuOpen(false);
                              setIsParticipantsModalOpen(true);
                            }}
                          >
                            Add participants
                          </button>
                          <button
                            type="button"
                            className="conversation-options-item conversation-options-item-danger"
                            onClick={() => {
                              setIsOptionsMenuOpen(false);
                              void onDeleteConversation();
                            }}
                            disabled={isDeletingConversation}
                          >
                            {isDeletingConversation ? "Deleting..." : "Delete conversation"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </header>

                <div className="conversation-chat-participant-strip">
                  {(Array.isArray(selectedConversation?.participants) ? selectedConversation.participants : []).map((participant: any) => (
                    <span
                      key={String(participant?.id || "").trim()}
                      className={`conversation-participant-pill${
                        String(participant?.userId || "").trim() === currentUserId
                          ? " conversation-participant-pill-user"
                          : ""
                      }`}
                    >
                      {formatParticipantLabel(participant, currentUserId)}
                    </span>
                  ))}
                </div>

                <div className="chat-transcript-pane conversation-transcript-pane">
                  {isLoadingMessages ? (
                    <div className="chat-transcript-state chat-transcript-state-loading" role="status" aria-live="polite">
                      <p className="chat-transcript-state-title">Loading messages...</p>
                    </div>
                  ) : null}
                  {!isLoadingMessages && orderedMessages.length === 0 ? (
                    <div className="chat-transcript-state chat-transcript-state-empty">
                      <p className="chat-transcript-state-title">
                        No messages yet. The newest message will appear at the bottom.
                      </p>
                    </div>
                  ) : null}
                  {orderedMessages.length > 0 ? (
                    <div ref={transcriptScrollRef} className="chat-transcript-scroll conversation-transcript-scroll">
                      <ul className="chat-message-list conversation-chat-message-list" role="list" aria-label="Conversation transcript">
                        {orderedMessages.map((message: any) => {
                          const isUserMessage = isCurrentUserMessage(
                            message,
                            selectedConversation?.participants || [],
                            currentUserId,
                          );
                          return (
                            <li
                              key={String(message?.id || "").trim()}
                              className={`chat-message ${isUserMessage ? "chat-message-human" : "chat-message-llm"}`}
                            >
                              <div className="chat-message-body">
                                <p className="chat-message-content conversation-chat-message-text">
                                  {String(message?.text || "").trim()}
                                </p>
                                <div className="chat-message-footer">
                                  <span className="chat-message-kind">
                                    {formatSenderLabel(message, selectedConversation?.participants || [], currentUserId)}
                                  </span>
                                  <span>{formatTimestamp(message?.createdAt)}</span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>

        {selectedConversation ? (
          <section className="panel composer-panel chat-composer-panel conversation-composer-panel">
            <p className="conversation-composer-note">
              Messages are stored canonically, then delivered to the other participants.
            </p>
            <form
              className="chat-composer-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendMessage();
              }}
            >
              <div className="chat-composer-input-row chat-composer-input-row-idle">
                <div className="chat-composer-input-wrapper">
                  <textarea
                    className="chat-composer-input"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="Message the conversation..."
                    rows={3}
                    disabled={isSendingConversationMessage}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="chat-composer-toolbar">
                  <button
                    type="submit"
                    className="chat-composer-send-btn"
                    disabled={isSendingConversationMessage || !String(messageDraft || "").trim()}
                    aria-label={isSendingConversationMessage ? "Sending message" : "Send message"}
                    title={isSendingConversationMessage ? "Sending..." : "Send message"}
                  >
                    <svg className="chat-composer-send-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </Page>
  );
}
