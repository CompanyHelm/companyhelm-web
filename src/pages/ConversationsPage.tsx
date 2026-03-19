import { useEffect, useMemo, useRef, useState } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { ConversationCreateModal } from "../components/ConversationCreateModal.tsx";
import { ConversationParticipantsEditor } from "../components/ConversationParticipantsEditor.tsx";
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
  error,
  onOpenConversation,
  onCreateConversation,
  onAddAgents,
  onSendMessage,
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
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
  }, [selectedConversationId]);

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
    <Page className="page-container-full page-shell-chat-layout conversations-page-shell">
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

      <div className="chat-page-stack chat-page-stack-with-sidebar">
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
                    <div className="chat-card-main">
                      <p className="chat-card-title conversation-sidebar-participants">
                        <strong>{formatConversationListLabel(conversation, currentUserId)}</strong>
                      </p>
                    </div>
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

                <ConversationParticipantsEditor
                  participants={selectedConversation?.participants || []}
                  availableAgents={agents}
                  isSubmitting={isAddingConversationAgents}
                  onSubmit={onAddAgents}
                />

                <div className="chat-transcript-pane">
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
                    <div ref={transcriptScrollRef} className="chat-transcript-scroll">
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
