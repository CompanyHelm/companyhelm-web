import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { AgentEditModal } from "../components/AgentEditModal.jsx";
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
      {!agent ? (
        <section className="panel">
          <p className="empty-hint">Agent not found.</p>
          <button type="button" className="secondary-btn" onClick={onBackToAgents} style={{ marginTop: "0.5rem" }}>
            Back to agents
          </button>
        </section>
      ) : null}

      {agent && agentSummary ? (
        <>
          {/* ── Hero header ── */}
          <section className="panel role-detail-hero">
            <div className="role-detail-hero-top">
              <button type="button" className="role-detail-hero-back" onClick={onBackToAgents}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                Back to agents
              </button>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  className="role-detail-hero-edit-btn"
                  onClick={() => setIsEditAgentModalOpen(true)}
                  aria-label="Edit agent settings"
                  title="Edit agent settings"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="role-detail-hero-title-row">
              <h1 className="role-detail-hero-title">{agent.name}</h1>
            </div>

            <div className="agent-detail-hero-runner">
              <span className="agent-detail-hero-runner-label">Runner</span>
              <span className="agent-detail-hero-runner-value">{agentSummary.assignedRunnerLabel}</span>
            </div>

            <div className="role-detail-stats">
              <div className="role-detail-stat">
                <p className="role-detail-stat-value">{agentSummary.modelLabel}</p>
                <p className="role-detail-stat-label">Model</p>
              </div>
              <div className="role-detail-stat">
                <p className="role-detail-stat-value">{agentSummary.reasoningLabel}</p>
                <p className="role-detail-stat-label">Reasoning</p>
              </div>
              <div className="role-detail-stat">
                <p className="role-detail-stat-value">{normalizeUniqueStringList(agent.roleIds || []).length}</p>
                <p className="role-detail-stat-label">Roles</p>
              </div>
              <div className="role-detail-stat">
                <p className="role-detail-stat-value">{chatSessions.length}</p>
                <p className="role-detail-stat-label">Chats</p>
              </div>
            </div>
          </section>

          {/* ── Two-column grid ── */}
          <div className="role-detail-grid">
            {/* ── Left: Agent config (read-only) ── */}
            <div className="role-detail-column">

              {/* Roles */}
              <div className="role-detail-card role-detail-card-muted">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  <h3>Roles</h3>
                  <span className="role-detail-card-count">{normalizeUniqueStringList(agent.roleIds || []).length}</span>
                </div>
                {normalizeUniqueStringList(agent.roleIds || []).length === 0 ? (
                  <div className="role-detail-empty">No roles assigned</div>
                ) : (
                  <div className="role-detail-pills">
                    {normalizeUniqueStringList(agent.roleIds || []).map((roleId) => {
                      const role = roleLookup.get(roleId);
                      return (
                        <span key={`agent-role-${roleId}`} className="tag-pill">
                          {role ? role.name : roleId}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Effective MCP Servers */}
              <div className="role-detail-card role-detail-card-muted">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="6" rx="2" /><rect x="2" y="15" width="20" height="6" rx="2" /><path d="M12 9v6" /></svg>
                  <h3>Effective MCP Servers</h3>
                </div>
                {(() => {
                  const effectiveIds = resolveEffectiveRoleMcpServerIds(
                    normalizeUniqueStringList(agent.roleIds || []),
                    roles,
                    roleMcpServerIdsByRoleId,
                  );
                  return effectiveIds.length === 0 ? (
                    <div className="role-detail-empty">No MCP servers from roles</div>
                  ) : (
                    <div className="role-detail-pills">
                      {effectiveIds.map((mcpServerId) => {
                        const mcpServer = mcpServerLookup.get(mcpServerId);
                        return (
                          <span key={`eff-mcp-${mcpServerId}`} className="tag-pill">
                            {mcpServer ? mcpServer.name : mcpServerId}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SDK */}
              <div className="role-detail-card role-detail-card-muted">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                  <h3>SDK</h3>
                </div>
                <span className="tag-pill">{agent.agentSdk || "n/a"}</span>
              </div>

              {/* Default Instructions */}
              <div className="role-detail-card role-detail-card-muted">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  <h3>Default Instructions</h3>
                </div>
                {agentSummary.instructions ? (
                  <pre className="agent-detail-instructions-pre">{agentSummary.instructions}</pre>
                ) : (
                  <div className="role-detail-empty">No default instructions</div>
                )}
              </div>
            </div>

            {/* ── Right: Chats ── */}
            <div className="role-detail-column">
              <div className="role-detail-card">
                <div className="role-detail-card-header">
                  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <h3>Chats</h3>
                  <span className="role-detail-card-count">{chatCountLabel}</span>
                </div>

                {chatError ? <p className="error-banner" style={{ marginBottom: "0.5rem" }}>Chat error: {chatError}</p> : null}

                <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                  <button
                    type="button"
                    className="agent-detail-chat-new"
                    onClick={() => !isCreateChatDisabled && handleNewChat()}
                    disabled={isCreateChatDisabled}
                    title={resolvedCreateChatDisabledReason || "Start a new chat"}
                    style={{ flex: 1 }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    New chat
                  </button>
                  <button
                    type="button"
                    className="agent-detail-chat-settings-btn"
                    onClick={() => setIsCreateSettingsOpen(true)}
                    disabled={isCreateChatDisabled}
                    aria-label="Chat settings"
                    title="Chat settings"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                </div>

                {isLoadingChatSessions ? <p className="empty-hint" style={{ marginTop: "0.5rem" }}>Loading chats...</p> : null}
                {!isLoadingChatSessions && chatSessions.length === 0 ? (
                  <p className="empty-hint" style={{ marginTop: "0.5rem" }}>No chats yet.</p>
                ) : null}

                {chatSessions.length > 0 ? (
                  <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    {chatSessions.map((session) => {
                      const isRunning = isChatSessionRunning(session, chatSessionRunningById);
                      const chatSessionKey = `${agent.id}:${session.id}`;
                      const isDeletingChat = deletingChatSessionKey === chatSessionKey;
                      const modelLabel = String(session?.currentModelName || session?.currentModelId || "").trim() || "n/a";
                      const reasoningLabel = String(session?.currentReasoningLevel || "").trim() || "n/a";
                      return (
                        <div
                          key={`agent-session-${session.id}`}
                          className="agent-detail-chat-item"
                          onClick={() => !isDeletingChat && onOpenChat(session.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !isDeletingChat) {
                              onOpenChat(session.id);
                            }
                          }}
                        >
                          <div className="agent-detail-chat-item-main">
                            <p className="agent-detail-chat-item-title">
                              {isRunning ? "● " : ""}{session.title || "Untitled chat"}
                            </p>
                            <p className="agent-detail-chat-item-meta">
                              {formatTimestamp(session.updatedAt)} · {modelLabel} · {reasoningLabel}
                            </p>
                          </div>
                          <div className="agent-detail-chat-item-actions">
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
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

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
        </>
      ) : null}
    </div></Page>
  );
}
