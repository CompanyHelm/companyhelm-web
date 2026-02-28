import { useState } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.jsx";
import { isChatSessionRunning } from "../utils/chat.js";
import { formatTimestamp } from "../utils/formatting.js";

export function AgentChatsPage({
  selectedCompanyId,
  agent,
  chatSessions,
  chatSessionRunningById,
  isLoadingChatSessions,
  isCreatingChatSession,
  deletingChatSessionKey,
  chatError,
  createChatDisabledReason,
  chatSessionTitleDraft,
  chatSessionAdditionalModelInstructionsDraft,
  onChatSessionTitleDraftChange,
  onChatSessionAdditionalModelInstructionsDraftChange,
  onCreateChatSession,
  onOpenChat,
  onDeleteChat,
  onBackToAgents,
  onSetChatDraftMessage,
}) {
  const resolvedCreateChatDisabledReason = String(createChatDisabledReason || "").trim();
  const isCreateChatDisabled = !agent || isCreatingChatSession || Boolean(resolvedCreateChatDisabledReason);
  const [firstMessageDraft, setFirstMessageDraft] = useState("");
  const [isCreateSettingsOpen, setIsCreateSettingsOpen] = useState(false);

  async function handleCreateAndOpen(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    const messageText = firstMessageDraft.trim();
    const createdSessionId = await onCreateChatSession({
      title: chatSessionTitleDraft || null,
      additionalModelInstructions: chatSessionAdditionalModelInstructionsDraft || null,
    });
    if (createdSessionId) {
      if (messageText && typeof onSetChatDraftMessage === "function") {
        onSetChatDraftMessage(messageText);
      }
      setFirstMessageDraft("");
      onOpenChat(createdSessionId);
    }
  }

  function handleFirstMessageKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    if (isCreateChatDisabled || !firstMessageDraft.trim()) {
      return;
    }
    event.preventDefault();
    handleCreateAndOpen(event);
  }

  return (
    <div className="page-stack">
      <header className="chat-minimal-header">
        <div className="chat-minimal-header-info">
          <p className="chat-minimal-header-agent">
            {agent ? agent.name : "Unknown agent"}
          </p>
          <h1 className="chat-minimal-header-title">Agent Chats</h1>
        </div>
        <div className="chat-minimal-header-actions">
          <button type="button" className="secondary-btn" onClick={onBackToAgents}>
            Back to agents
          </button>
        </div>
      </header>

      <section className="panel list-panel">
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && isLoadingChatSessions ? <p className="empty-hint">Loading chats...</p> : null}
        {agent && !isLoadingChatSessions && chatSessions.length === 0 ? (
          <p className="empty-hint">No chats yet. Start one below.</p>
        ) : null}
        {agent && chatSessions.length > 0 ? (
          <ul className="chat-card-list">
            {chatSessions.map((session) => {
              const isRunning = isChatSessionRunning(session, chatSessionRunningById);
              const chatSessionKey = `${agent.id}:${session.id}`;
              const isDeletingChat = deletingChatSessionKey === chatSessionKey;
              const modelLabel = String(session?.currentModelName || session?.currentModelId || "").trim() || "n/a";
              const reasoningLabel = String(session?.currentReasoningLevel || "").trim() || "n/a";
              return (
                <li
                  key={`agent-session-${session.id}`}
                  className="chat-card"
                  onClick={() => !isDeletingChat && onOpenChat(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isDeletingChat) {
                      onOpenChat(session.id);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{session.title || "Untitled chat"}</strong>
                      {isRunning ? <ChatSessionRunningBadge /> : null}
                    </p>
                    <p className="chat-card-meta">
                      {formatTimestamp(session.updatedAt)} · {modelLabel} · {reasoningLabel}
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
                          sessionId: session.id,
                          title: session.title,
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
      </section>

      <section className="panel create-chat-composer-panel">
        {resolvedCreateChatDisabledReason ? (
          <p className="empty-hint">{resolvedCreateChatDisabledReason}</p>
        ) : null}
        <form className="create-chat-composer" onSubmit={handleCreateAndOpen}>
          <input
            className="create-chat-composer-input"
            value={firstMessageDraft}
            onChange={(event) => setFirstMessageDraft(event.target.value)}
            onKeyDown={handleFirstMessageKeyDown}
            placeholder="Send first message to start a chat..."
            disabled={isCreateChatDisabled}
          />
          <button
            type="button"
            className="create-chat-composer-icon-btn"
            onClick={() => setIsCreateSettingsOpen(true)}
            disabled={isCreateChatDisabled}
            aria-label="Chat settings"
            title="Chat settings"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            type="submit"
            className="create-chat-composer-send-btn"
            disabled={isCreateChatDisabled || !firstMessageDraft.trim()}
            aria-label={isCreatingChatSession ? "Creating..." : "Create and send"}
            title={isCreatingChatSession ? "Creating..." : "Create and send"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 11 21 3 13 21 11 13 3 11z" />
              <path d="m11 13 10-10" />
            </svg>
          </button>
        </form>
      </section>

      <CreationModal
        modalId="create-chat-settings-modal"
        title="New Chat Settings"
        description="Set optional title and instructions before starting."
        isOpen={isCreateSettingsOpen}
        onClose={() => setIsCreateSettingsOpen(false)}
      >
        <div className="chat-settings-modal-form">
          <div className="chat-settings-field">
            <label htmlFor="create-chat-title" className="chat-settings-label">Title</label>
            <input
              id="create-chat-title"
              className="chat-settings-input"
              value={chatSessionTitleDraft}
              onChange={(event) => onChatSessionTitleDraftChange(event.target.value)}
              placeholder="e.g. Release planning"
              disabled={isCreateChatDisabled}
            />
          </div>
          <div className="chat-settings-field">
            <label htmlFor="create-chat-instructions" className="chat-settings-label">
              Additional instructions
            </label>
            <textarea
              id="create-chat-instructions"
              className="chat-settings-input chat-settings-textarea"
              value={chatSessionAdditionalModelInstructionsDraft}
              onChange={(event) =>
                onChatSessionAdditionalModelInstructionsDraftChange(event.target.value)
              }
              placeholder="Optional. Leave blank for agent defaults."
              rows={4}
              disabled={isCreateChatDisabled}
            />
          </div>
          <div className="chat-settings-actions">
            <button
              type="button"
              onClick={() => setIsCreateSettingsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </CreationModal>
    </div>
  );
}
