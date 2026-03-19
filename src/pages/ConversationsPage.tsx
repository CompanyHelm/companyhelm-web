import { useMemo, useState } from "react";
import { Page } from "../components/Page.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { ConversationCreateModal } from "../components/ConversationCreateModal.tsx";
import { ConversationParticipantsEditor } from "../components/ConversationParticipantsEditor.tsx";

function formatParticipantLabel(participant: any, currentUserId: string) {
  const participantUserId = String(participant?.userId || "").trim();
  if (participantUserId && participantUserId === currentUserId) {
    return "You";
  }
  return String(participant?.displayName || "").trim() || "Unknown participant";
}

function formatSenderLabel(message: any, participants: any[], currentUserId: string) {
  const senderActorInstanceId = String(message?.senderActorInstanceId || "").trim();
  const matchedParticipant = (Array.isArray(participants) ? participants : []).find(
    (participant: any) => String(participant?.actorInstanceId || "").trim() === senderActorInstanceId,
  );
  return formatParticipantLabel(matchedParticipant, currentUserId);
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
  const currentUserId = String(currentUser?.id || "").trim();
  const currentUserLabel = String(currentUser?.firstName || "").trim()
    || String(currentUser?.email || "").trim()
    || "Signed-in user";
  const selectedConversation = useMemo(() =>
    (Array.isArray(conversations) ? conversations : []).find(
      (conversation: any) => String(conversation?.id || "").trim() === String(selectedConversationId || "").trim(),
    ) || null,
  [conversations, selectedConversationId]);
  const pageActions = useMemo(() => (
    <button type="button" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
      New conversation
    </button>
  ), []);
  useSetPageActions(pageActions);

  return (
    <Page className="conversations-page">
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

      <div className="conversations-layout">
        <section className="panel conversations-sidebar">
          <div className="panel-header panel-header-row">
            <div>
              <h2>Conversations</h2>
              <p className="subcopy">Canonical multi-agent transcripts.</p>
            </div>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
          {isLoadingConversations ? <p className="empty-hint">Loading conversations...</p> : null}
          {!isLoadingConversations && (!Array.isArray(conversations) || conversations.length === 0) ? (
            <p className="empty-hint">No conversations yet.</p>
          ) : null}
          <div className="conversation-list" role="list" aria-label="Conversation list">
            {(Array.isArray(conversations) ? conversations : []).map((conversation: any) => {
              const conversationId = String(conversation?.id || "").trim();
              const isSelected = conversationId === String(selectedConversationId || "").trim();
              return (
                <button
                  key={conversationId}
                  type="button"
                  className={`conversation-list-item${isSelected ? " conversation-list-item-active" : ""}`}
                  onClick={() => onOpenConversation(conversationId)}
                >
                  <span className="conversation-list-title">
                    {(Array.isArray(conversation?.participants) ? conversation.participants : [])
                      .map((participant: any) => formatParticipantLabel(participant, currentUserId))
                      .join(", ")}
                  </span>
                  <span className="conversation-list-preview">
                    {String(conversation?.latestMessagePreview || "").trim() || "No messages yet."}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="conversations-main">
          {!selectedConversation ? (
            <section className="panel conversation-empty-state">
              <h2>Select a conversation</h2>
              <p className="subcopy">Choose a conversation from the list or start a new one.</p>
            </section>
          ) : (
            <>
              <section className="panel conversation-header-panel">
                <div className="panel-header panel-header-row">
                  <div>
                    <h2>Participants</h2>
                    <p className="subcopy">Your user participant is included by default.</p>
                  </div>
                </div>
                <div className="conversation-participant-list">
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
              </section>

              <ConversationParticipantsEditor
                participants={selectedConversation?.participants || []}
                availableAgents={agents}
                isSubmitting={isAddingConversationAgents}
                onSubmit={onAddAgents}
              />

              <section className="panel conversation-transcript-panel">
                <div className="panel-header panel-header-row">
                  <div>
                    <h2>Transcript</h2>
                    <p className="subcopy">Newest-first canonical message history.</p>
                  </div>
                </div>
                {isLoadingMessages ? <p className="empty-hint">Loading messages...</p> : null}
                {!isLoadingMessages && (!Array.isArray(messages) || messages.length === 0) ? (
                  <p className="empty-hint">No messages yet.</p>
                ) : null}
                <div className="conversation-message-list" role="list" aria-label="Conversation transcript">
                  {(Array.isArray(messages) ? messages : []).map((message: any) => (
                    <article key={String(message?.id || "").trim()} className="conversation-message-card">
                      <header className="conversation-message-meta">
                        <strong>{formatSenderLabel(message, selectedConversation?.participants || [], currentUserId)}</strong>
                        <span>{String(message?.createdAt || "").trim()}</span>
                      </header>
                      <p className="conversation-message-text">{String(message?.text || "").trim()}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel conversation-composer-panel">
                <div className="panel-header panel-header-row">
                  <div>
                    <h2>Send message</h2>
                    <p className="subcopy">Messages are stored canonically, then fan out to the other agents.</p>
                  </div>
                </div>
                <div className="conversation-composer">
                  <textarea
                    className="conversation-composer-input"
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="Write a message to the conversation."
                    rows={4}
                    disabled={isSendingConversationMessage}
                  />
                  <div className="conversation-modal-actions">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isSendingConversationMessage || !String(messageDraft || "").trim()}
                      onClick={async () => {
                        await onSendMessage(messageDraft);
                        setMessageDraft("");
                      }}
                    >
                      {isSendingConversationMessage ? "Sending..." : "Send message"}
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </Page>
  );
}
