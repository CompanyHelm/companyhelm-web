import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { AgentEditModal } from "../components/AgentEditModal.jsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.jsx";
import { isChatSessionRunning } from "../utils/chat.js";
import { formatTimestamp } from "../utils/formatting.js";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

export function AgentChatsPage({
  selectedCompanyId,
  agent,
  agents,
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
  agentRunners,
  roles,
  mcpServers,
  roleMcpServerIdsByRoleId,
  runnerCodexModelEntriesById,
  agentDrafts,
  savingAgentId,
  deletingAgentId,
  initializingAgentId,
  onAgentDraftChange,
  onSaveAgent,
  onEnsureAgentEditorData,
}) {
  const resolvedCreateChatDisabledReason = String(createChatDisabledReason || "").trim();
  const isCreateChatDisabled = !agent || isCreatingChatSession || Boolean(resolvedCreateChatDisabledReason);
  const [isCreateSettingsOpen, setIsCreateSettingsOpen] = useState(false);
  const [isEditAgentModalOpen, setIsEditAgentModalOpen] = useState(false);

  async function handleNewChat() {
    const createdSessionId = await onCreateChatSession({
      title: chatSessionTitleDraft || null,
      additionalModelInstructions: chatSessionAdditionalModelInstructionsDraft || null,
    });
    if (createdSessionId) {
      onOpenChat(createdSessionId);
    }
  }

  const pageActions = useMemo(() => (
    <>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        onClick={() => setIsEditAgentModalOpen(true)}
        aria-label="Edit agent settings"
        title="Edit agent settings"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </>
  ), []);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel list-panel">
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && isLoadingChatSessions ? <p className="empty-hint">Loading chats...</p> : null}
        {agent && !isLoadingChatSessions && chatSessions.length === 0 ? (
          <p className="empty-hint">No chats yet. Use the "New chat" card to start one.</p>
        ) : null}
        {agent ? (
          <ul className="chat-card-list">
            <li
              className="chat-card chat-card-new"
              onClick={() => !isCreateChatDisabled && handleNewChat()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isCreateChatDisabled) {
                  handleNewChat();
                }
              }}
            >
              <div className="chat-card-main">
                <p className="chat-card-title">
                  <svg viewBox="0 0 24 24" className="chat-card-new-icon" aria-hidden="true" focusable="false">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <strong>New chat</strong>
                </p>
              </div>
              <div className="chat-card-actions">
                <button
                  type="button"
                  className="chat-card-icon-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsCreateSettingsOpen(true);
                  }}
                  disabled={isCreateChatDisabled}
                  aria-label="Chat settings"
                  title="Chat settings"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </li>
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
                  <div className="chat-card-status">
                    {isRunning ? <ChatSessionRunningBadge /> : null}
                  </div>
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{session.title || "Untitled chat"}</strong>
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
              placeholder={agent?.defaultAdditionalModelInstructions || "Optional. Leave blank for agent defaults."}
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

      <AgentEditModal
        agents={agents || []}
        agentRunners={agentRunners || []}
        roles={roles || []}
        mcpServers={mcpServers || []}
        roleMcpServerIdsByRoleId={roleMcpServerIdsByRoleId || {}}
        runnerCodexModelEntriesById={runnerCodexModelEntriesById || {}}
        agentDrafts={agentDrafts || {}}
        savingAgentId={savingAgentId}
        deletingAgentId={deletingAgentId}
        initializingAgentId={initializingAgentId}
        onAgentDraftChange={onAgentDraftChange}
        onSaveAgent={onSaveAgent}
        onEnsureAgentEditorData={onEnsureAgentEditorData}
        editingAgentId={isEditAgentModalOpen && agent ? agent.id : ""}
        onClose={() => setIsEditAgentModalOpen(false)}
      />
    </div></Page>
  );
}
