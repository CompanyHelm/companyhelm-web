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
}) {
  const resolvedCreateChatDisabledReason = String(createChatDisabledReason || "").trim();
  const isCreateChatDisabled = !agent || isCreatingChatSession || Boolean(resolvedCreateChatDisabledReason);

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Agent Runtime</p>
        <h1>Agent chats</h1>
        <p className="subcopy">Browse, create, and open chats for a single agent.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
        <p className="context-pill">
          Agent: {agent ? `${agent.name} (${agent.id.slice(0, 8)})` : "Unknown agent"}
        </p>
        <div className="hero-actions">
          <button type="button" className="secondary-btn" onClick={onBackToAgents}>
            Back to agents
          </button>
        </div>
      </section>

      <section className="panel list-panel">
        <header className="panel-header">
          <h2>Chats</h2>
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && isLoadingChatSessions ? <p className="empty-hint">Loading chats...</p> : null}
        {agent && !isLoadingChatSessions && chatSessions.length === 0 ? (
          <p className="empty-hint">No chats yet. Create one below.</p>
        ) : null}
        {agent && chatSessions.length > 0 ? (
          <ul className="task-list">
            {chatSessions.map((session) => {
              const isRunning = isChatSessionRunning(session, chatSessionRunningById);
              const chatSessionKey = `${agent.id}:${session.id}`;
              const isDeletingChat = deletingChatSessionKey === chatSessionKey;
              const modelLabel = String(session?.currentModelName || session?.currentModelId || "").trim() || "n/a";
              const reasoningLabel = String(session?.currentReasoningLevel || "").trim() || "n/a";
              return (
                <li key={`agent-session-${session.id}`} className="task-card">
                  <div className="task-card-top">
                    <p className="chat-session-title-row">
                      <strong>{session.title || "Untitled chat"}</strong>
                      {isRunning ? <ChatSessionRunningBadge /> : null}
                    </p>
                    <code className="runner-id">{session.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    Updated: <strong>{formatTimestamp(session.updatedAt)}</strong>
                  </p>
                  <p className="agent-subcopy">
                    Model: <strong>{modelLabel}</strong> • Reasoning: <strong>{reasoningLabel}</strong>
                  </p>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => onOpenChat(session.id)}
                      disabled={isDeletingChat}
                    >
                      Open chat
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() =>
                        onDeleteChat({
                          agentId: agent.id,
                          sessionId: session.id,
                          title: session.title,
                        })
                      }
                      disabled={isDeletingChat}
                    >
                      {isDeletingChat ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="panel codex-auth-panel">
        <header className="panel-header">
          <h2>Create chat</h2>
        </header>
        {resolvedCreateChatDisabledReason ? (
          <p className="empty-hint">{resolvedCreateChatDisabledReason}</p>
        ) : null}
        <form
          className="task-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const createdSessionId = await onCreateChatSession({
              title: chatSessionTitleDraft,
              additionalModelInstructions: chatSessionAdditionalModelInstructionsDraft,
            });
            if (createdSessionId) {
              onOpenChat(createdSessionId);
            }
          }}
        >
          <label htmlFor="chat-session-title">Title (optional)</label>
          <input
            id="chat-session-title"
            value={chatSessionTitleDraft}
            onChange={(event) => onChatSessionTitleDraftChange(event.target.value)}
            placeholder="e.g. Release planning"
            disabled={isCreateChatDisabled}
          />
          <label htmlFor="chat-session-additional-model-instructions">
            Additional model instructions (optional)
          </label>
          <textarea
            id="chat-session-additional-model-instructions"
            value={chatSessionAdditionalModelInstructionsDraft}
            onChange={(event) =>
              onChatSessionAdditionalModelInstructionsDraftChange(event.target.value)
            }
            placeholder="Optional. Leave blank to use this agent's default instructions."
            rows={4}
            disabled={isCreateChatDisabled}
          />
          <button type="submit" disabled={isCreateChatDisabled}>
            {isCreatingChatSession ? "Creating..." : "Create chat"}
          </button>
        </form>
      </section>
    </div>
  );
}
