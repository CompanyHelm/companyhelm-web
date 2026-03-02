# Agent Detail Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the agent detail page (`AgentChatsPage.jsx`) from a flat vertical layout to match the role page's dashboard pattern: hero header with stats + two-column grid.

**Architecture:** Rewrite `AgentChatsPage.jsx` render output. Reuse existing `role-detail-*` CSS classes where identical, add `agent-detail-*` variants only where agent-specific styling is needed. All existing props, handlers, and modals remain unchanged. The `AgentsPage.jsx` list view is not modified.

**Tech Stack:** React (plain JS), CSS custom properties, existing design system

---

### Task 1: Add agent-specific CSS

**Files:**
- Modify: `src/index.css` — add after the role detail CSS block

**Step 1: Add agent detail CSS**

Insert after the role detail CSS (after `.role-detail-subrole-link svg`):

```css
/* ── Agent detail ─────────────────────────────────── */

.agent-detail-hero-runner {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--ink-1);
  font-size: 0.82rem;
  margin-bottom: 0.75rem;
}

.agent-detail-hero-runner-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}

.agent-detail-hero-runner-value {
  font-family: "Instrument Sans", sans-serif;
  font-size: 0.82rem;
  color: var(--ink-1);
}

.agent-detail-instructions-pre {
  margin: 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--ink-1);
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(26, 32, 38, 0.03);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(26, 32, 38, 0.06);
}

.agent-detail-chat-new {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px dashed rgba(15, 118, 110, 0.3);
  background: rgba(15, 118, 110, 0.03);
  color: var(--action);
  font-family: "Instrument Sans", sans-serif;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.agent-detail-chat-new:hover {
  background: rgba(15, 118, 110, 0.07);
  border-color: rgba(15, 118, 110, 0.5);
}

.agent-detail-chat-new:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.agent-detail-chat-new svg {
  width: 0.9rem;
  height: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.agent-detail-chat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: "Instrument Sans", sans-serif;
}

.agent-detail-chat-item:hover {
  background: rgba(15, 118, 110, 0.05);
}

.agent-detail-chat-item-main {
  flex: 1;
  min-width: 0;
}

.agent-detail-chat-item-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--ink-0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-detail-chat-item-meta {
  margin: 0;
  font-size: 0.74rem;
  color: var(--ink-2);
  font-family: "IBM Plex Mono", monospace;
}

.agent-detail-chat-item-actions {
  flex-shrink: 0;
  display: flex;
  gap: 0.3rem;
}

.agent-detail-chat-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--ink-2);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.7rem;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.agent-detail-chat-settings-btn:hover {
  color: var(--ink-0);
  background: rgba(26, 32, 38, 0.06);
}

.agent-detail-chat-settings-btn svg {
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: add agent detail page CSS"
```

---

### Task 2: Rewrite AgentChatsPage.jsx with hero + grid layout

**Files:**
- Modify: `src/pages/AgentChatsPage.jsx` — replace the return JSX (lines 222-444)

**Step 1: Replace the return block**

Replace the return statement starting at line 222 through the closing of the component (keeping all the helper functions, state, useMemo, and modals). The new JSX:

```jsx
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

                <button
                  type="button"
                  className="agent-detail-chat-new"
                  onClick={() => !isCreateChatDisabled && handleNewChat()}
                  disabled={isCreateChatDisabled}
                  title={resolvedCreateChatDisabledReason || "Start a new chat"}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  New chat
                  <button
                    type="button"
                    className="agent-detail-chat-settings-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsCreateSettingsOpen(true);
                    }}
                    disabled={isCreateChatDisabled}
                    aria-label="Chat settings"
                    title="Chat settings"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                </button>

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
```

**Step 2: Commit**

```bash
git add src/pages/AgentChatsPage.jsx
git commit -m "feat: redesign agent detail page with hero header and two-column grid"
```

---

### Task 3: Build verification

**Step 1: Build to verify**

```bash
npx vite build
```

Expected: clean build, no errors.

**Step 2: Commit if any fixes needed**
