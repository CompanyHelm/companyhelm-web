import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { AgentEditModal } from "../components/AgentEditModal.jsx";
import { ChatSessionRunningBadge } from "../components/ChatSessionRunningBadge.jsx";
import { isChatSessionRunning } from "../utils/chat.js";
import { formatRunnerLabel, formatTimestamp } from "../utils/formatting.js";
import { normalizeUniqueStringList } from "../utils/normalization.js";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

function collectRoleAndSubroleIds(roleIds, roles) {
  const normalizedRoleIds = normalizeUniqueStringList(roleIds || []);
  if (normalizedRoleIds.length === 0) {
    return [];
  }

  const childRoleIdsByParentId = new Map();
  for (const role of Array.isArray(roles) ? roles : []) {
    const roleId = String(role?.id || "").trim();
    const parentRoleId = String(role?.parentRole?.id || "").trim();
    if (!roleId || !parentRoleId) {
      continue;
    }

    const existingChildRoleIds = childRoleIdsByParentId.get(parentRoleId);
    if (existingChildRoleIds) {
      existingChildRoleIds.push(roleId);
    } else {
      childRoleIdsByParentId.set(parentRoleId, [roleId]);
    }
  }

  const visitedRoleIds = new Set();
  const expandedRoleIds = [];
  const queue = [...normalizedRoleIds];

  while (queue.length > 0) {
    const nextRoleId = String(queue.shift() || "").trim();
    if (!nextRoleId || visitedRoleIds.has(nextRoleId)) {
      continue;
    }

    visitedRoleIds.add(nextRoleId);
    expandedRoleIds.push(nextRoleId);
    const childRoleIds = childRoleIdsByParentId.get(nextRoleId) || [];
    for (const childRoleId of childRoleIds) {
      if (!visitedRoleIds.has(childRoleId)) {
        queue.push(childRoleId);
      }
    }
  }

  return expandedRoleIds;
}

function resolveEffectiveRoleMcpServerIds(roleIds, roles, roleMcpServerIdsByRoleId) {
  const expandedRoleIds = collectRoleAndSubroleIds(roleIds, roles);
  const mcpServerIds = [];
  const seenMcpServerIds = new Set();

  for (const roleId of expandedRoleIds) {
    const assignedMcpServerIds = normalizeUniqueStringList(roleMcpServerIdsByRoleId?.[roleId] || []);
    for (const mcpServerId of assignedMcpServerIds) {
      if (seenMcpServerIds.has(mcpServerId)) {
        continue;
      }
      seenMcpServerIds.add(mcpServerId);
      mcpServerIds.push(mcpServerId);
    }
  }

  return mcpServerIds;
}

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
  const runnerLookup = useMemo(() => {
    return (Array.isArray(agentRunners) ? agentRunners : []).reduce((map, runner) => {
      const runnerId = String(runner?.id || "").trim();
      if (runnerId) {
        map.set(runnerId, runner);
      }
      return map;
    }, new Map());
  }, [agentRunners]);
  const roleLookup = useMemo(() => {
    return (Array.isArray(roles) ? roles : []).reduce((map, role) => {
      const roleId = String(role?.id || "").trim();
      if (roleId) {
        map.set(roleId, role);
      }
      return map;
    }, new Map());
  }, [roles]);
  const mcpServerLookup = useMemo(() => {
    return (Array.isArray(mcpServers) ? mcpServers : []).reduce((map, mcpServer) => {
      const mcpServerId = String(mcpServer?.id || "").trim();
      if (mcpServerId) {
        map.set(mcpServerId, mcpServer);
      }
      return map;
    }, new Map());
  }, [mcpServers]);
  const chatCountLabel = useMemo(() => {
    if (!agent) {
      return "";
    }
    if (chatSessions.length === 0) {
      return "No chats";
    }
    if (chatSessions.length === 1) {
      return "1 chat";
    }
    return `${chatSessions.length} chats`;
  }, [agent, chatSessions.length]);
  const agentSummary = useMemo(() => {
    if (!agent) {
      return null;
    }

    const assignedRunner = agent.agentRunnerId
      ? runnerLookup.get(agent.agentRunnerId) || {
          id: agent.agentRunnerId,
          status: "disconnected",
        }
      : null;
    const assignedRunnerLabel = assignedRunner ? formatRunnerLabel(assignedRunner) : "Unassigned";
    const assignedRoleIds = normalizeUniqueStringList(agent.roleIds || []);
    const assignedRoleLabels = assignedRoleIds.map((roleId) => {
      const role = roleLookup.get(roleId);
      return role ? role.name : roleId;
    });
    const assignedRoleSummary = assignedRoleLabels.length > 0 ? assignedRoleLabels.join(", ") : "none";
    const effectiveMcpServerIds = resolveEffectiveRoleMcpServerIds(
      assignedRoleIds,
      roles,
      roleMcpServerIdsByRoleId,
    );
    const effectiveMcpServerLabels = effectiveMcpServerIds.map((mcpServerId) => {
      const mcpServer = mcpServerLookup.get(mcpServerId);
      return mcpServer ? mcpServer.name : mcpServerId;
    });
    const effectiveMcpServerSummary =
      effectiveMcpServerLabels.length > 0 ? effectiveMcpServerLabels.join(", ") : "none";
    const modelLabel = String(agent.model || "").trim() || "n/a";
    const reasoningLabel = String(agent.modelReasoningLevel || "").trim() || "n/a";
    const instructions = String(agent.defaultAdditionalModelInstructions || "").trim();

    return {
      assignedRunnerLabel,
      assignedRoleSummary,
      effectiveMcpServerSummary,
      modelLabel,
      reasoningLabel,
      instructions,
    };
  }, [agent, mcpServerLookup, roleLookup, roleMcpServerIdsByRoleId, roles, runnerLookup]);

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
        {!agent ? <p className="empty-hint">Agent not found.</p> : null}
        {agent && agentSummary ? (
          <>
            <header className="panel-header panel-header-row">
              <h2>{agent.name}</h2>
              <button type="button" className="secondary-btn" onClick={onBackToAgents}>Back to agents</button>
            </header>
            <section className="skill-detail-section">
              <h3>Read-only</h3>
              <p className="chat-card-meta">Agent ID: {agent.id}</p>
              <div className="skill-detail-info">
                <p className="chat-card-meta">Runner: {agentSummary.assignedRunnerLabel}</p>
                <p className="chat-card-meta">SDK: {agent.agentSdk || "n/a"}</p>
                <p className="chat-card-meta">Model: {agentSummary.modelLabel}</p>
                <p className="chat-card-meta">Reasoning: {agentSummary.reasoningLabel}</p>
              </div>
              <p className="chat-card-meta">Roles: {agentSummary.assignedRoleSummary}</p>
              <p className="chat-card-meta">MCP servers (effective): {agentSummary.effectiveMcpServerSummary}</p>
              <p className="chat-card-meta">Default additional instructions:</p>
              {agentSummary.instructions ? <pre className="skill-content-raw">{agentSummary.instructions}</pre> : (
                <p className="empty-hint">No default additional instructions.</p>
              )}
            </section>
            <section className="skill-detail-section">
              <div className="skill-detail-section-header">
                <h3>Edit</h3>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditAgentModalOpen(true)}
                  aria-label="Edit agent settings"
                >
                  Edit agent settings
                </button>
              </div>
              <p className="chat-card-meta">
                Update runner assignment, model, roles, MCP servers, and default instructions in the editor.
              </p>
            </section>
          </>
        ) : null}
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h3>Chats</h3>
          {agent ? <span className="chat-card-meta">{chatCountLabel}</span> : null}
        </header>
        {chatError ? <p className="error-banner">Chat error: {chatError}</p> : null}
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
