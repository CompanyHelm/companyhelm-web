# Role Detail Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the role detail page from a flat vertical layout into a dashboard-style page with hero header (stats badges, inline editing) and a two-column grid separating editable direct assignments from read-only inherited/resolved content.

**Architecture:** Replace the detail view portion of `RolesPage.jsx` (lines 261-538) with a new structure: hero header panel + two-column grid of section cards. All existing props and handlers remain unchanged. New CSS classes added to `index.css`. No changes to list view, routing, or data model.

**Tech Stack:** React (plain JS, no TS), CSS custom properties, existing design system (`--action`, `--ink-*`, `--panel`, Syne + Instrument Sans + IBM Plex Mono fonts)

---

### Task 1: Add CSS for the role detail hero header

**Files:**
- Modify: `src/index.css` — add new classes after the existing `.skill-detail-section-header h3` block (around line 2265)

**Step 1: Add the hero header CSS**

Add these classes to `src/index.css` before the media query section. Insert them after approximately line 2265 (after `.skill-detail-section-header h3`):

```css
/* ── Role detail hero ─────────────────────────────── */

.role-detail-hero {
  position: relative;
  border-left: 3px solid var(--action);
}

.role-detail-hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.role-detail-hero-back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--ink-1);
  font-size: 0.82rem;
  font-family: "Instrument Sans", sans-serif;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.role-detail-hero-back:hover {
  color: var(--ink-0);
  background: rgba(26, 32, 38, 0.06);
}

.role-detail-hero-back svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.role-detail-hero-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.15rem;
}

.role-detail-hero-title {
  margin: 0;
  font-size: clamp(1.35rem, 2.4vw, 1.8rem);
  line-height: 1.1;
}

.role-detail-hero-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-2);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.role-detail-hero-edit-btn:hover {
  color: var(--action);
  background: rgba(15, 118, 110, 0.08);
}

.role-detail-hero-edit-btn svg {
  width: 0.95rem;
  height: 0.95rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.role-detail-hero-edit-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.role-detail-hero-edit-input {
  font-family: "Syne", sans-serif;
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  background: white;
  color: var(--ink-0);
  outline: none;
  min-width: 12rem;
}

.role-detail-hero-edit-input:focus {
  border-color: var(--action);
  box-shadow: 0 0 0 2px var(--ring);
}

.role-detail-hero-parent {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--ink-1);
  font-size: 0.82rem;
  margin-bottom: 0.75rem;
}

.role-detail-hero-parent-label {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-2);
}

.role-detail-hero-parent-select {
  font-family: "Instrument Sans", sans-serif;
  font-size: 0.82rem;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  background: transparent;
  color: var(--ink-1);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.role-detail-hero-parent-select:hover,
.role-detail-hero-parent-select:focus {
  border-color: var(--panel-border);
  background: rgba(255, 255, 255, 0.6);
  outline: none;
}

.role-detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}

.role-detail-stat {
  background: rgba(15, 118, 110, 0.04);
  border: 1px solid rgba(15, 118, 110, 0.1);
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.role-detail-stat-value {
  margin: 0;
  font-family: "Syne", sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink-0);
}

.role-detail-stat-label {
  margin: 0;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-2);
}
```

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: add role detail hero header CSS"
```

---

### Task 2: Add CSS for the two-column content grid and section cards

**Files:**
- Modify: `src/index.css` — append after the hero CSS from Task 1

**Step 1: Add the grid and card CSS**

Append directly after the hero CSS:

```css
/* ── Role detail grid ─────────────────────────────── */

.role-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  align-items: start;
}

.role-detail-column {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.role-detail-card {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 0.85rem 1rem;
  backdrop-filter: blur(6px);
  box-shadow: var(--shadow);
}

.role-detail-card-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
}

.role-detail-card-header svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: var(--action);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.role-detail-card-header h3 {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink-0);
}

.role-detail-card-count {
  margin-left: auto;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.7rem;
  color: var(--ink-2);
}

.role-detail-card-muted {
  background: rgba(238, 242, 243, 0.5);
  border-color: rgba(26, 32, 38, 0.06);
  box-shadow: none;
}

.role-detail-card-muted .role-detail-card-header svg {
  stroke: var(--ink-2);
}

.role-detail-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.role-detail-pill-inherited {
  border-radius: 999px;
  border: 1px dashed rgba(26, 32, 38, 0.18);
  background: rgba(238, 242, 243, 0.5);
  color: var(--ink-1);
  padding: 0.22rem 0.6rem;
  font-size: 0.76rem;
  font-family: "IBM Plex Mono", monospace;
}

.role-detail-inherit-note {
  margin: 0.5rem 0 0;
  font-size: 0.74rem;
  color: var(--ink-2);
  font-style: italic;
}

.role-detail-empty {
  border: 1px dashed rgba(26, 32, 38, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--ink-2);
  font-size: 0.82rem;
  text-align: center;
}

.role-detail-add-row {
  margin-top: 0.55rem;
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.role-detail-add-select {
  flex: 1;
  font-family: "Instrument Sans", sans-serif;
  font-size: 0.8rem;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  background: white;
  color: var(--ink-0);
  cursor: pointer;
}

.role-detail-add-select:focus {
  border-color: var(--action);
  outline: none;
  box-shadow: 0 0 0 2px var(--ring);
}

.role-detail-add-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-detail-subrole-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.86rem;
  color: var(--ink-0);
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: "Instrument Sans", sans-serif;
}

.role-detail-subrole-link:hover {
  background: rgba(15, 118, 110, 0.06);
}

.role-detail-subrole-link svg {
  width: 0.85rem;
  height: 0.85rem;
  fill: none;
  stroke: var(--ink-2);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
```

**Step 2: Add responsive overrides for role detail grid**

Find the existing media query `@media (max-width: 600px)` and add inside it:

```css
  .role-detail-grid {
    grid-template-columns: 1fr;
  }

  .role-detail-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .role-detail-hero-edit-form {
    flex-direction: column;
    align-items: stretch;
  }
```

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add role detail grid and section card CSS"
```

---

### Task 3: Rewrite the role detail view — hero header

**Files:**
- Modify: `src/pages/RolesPage.jsx` — replace lines 261-538 (the `return` block when `activeRole` exists)

**Step 1: Add `isEditingName` state**

At the top of the component, after line 34 (`const [isSavingRole, setIsSavingRole] = useState(false);`), add:

```javascript
const [isEditingName, setIsEditingName] = useState(false);
```

**Step 2: Replace the detail view return block**

Replace everything from line 261 (`return (`) through line 538 (the closing `);`) with the new hero header + grid layout. The full replacement JSX:

```jsx
  return (
    <Page><div className="page-stack">
      {roleError || localError ? <p className="error-banner">{roleError || localError}</p> : null}

      {/* ── Hero header ── */}
      <section className="panel role-detail-hero">
        <div className="role-detail-hero-top">
          <button type="button" className="role-detail-hero-back" onClick={onBackToRoles}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            Back to roles
          </button>
          <button
            type="button"
            className="chat-card-icon-btn chat-card-icon-btn-danger"
            onClick={() => onDeleteRole(activeRole.id, activeRole.name)}
            aria-label="Delete role"
            title="Delete role"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>

        {isEditingName ? (
          <div className="role-detail-hero-edit-form">
            <input
              className="role-detail-hero-edit-input"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSaveRole();
                  setIsEditingName(false);
                }
                if (event.key === "Escape") {
                  setNameDraft(activeRole.name || "");
                  setIsEditingName(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => { void handleSaveRole(); setIsEditingName(false); }}
              disabled={isSavingRole}
            >
              {isSavingRole ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => { setNameDraft(activeRole.name || ""); setIsEditingName(false); }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="role-detail-hero-title-row">
            <h1 className="role-detail-hero-title">{activeRole.name}</h1>
            <button
              type="button"
              className="role-detail-hero-edit-btn"
              onClick={() => setIsEditingName(true)}
              aria-label="Edit name"
              title="Edit name"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        )}

        <div className="role-detail-hero-parent">
          <span className="role-detail-hero-parent-label">Parent</span>
          <select
            className="role-detail-hero-parent-select"
            value={parentRoleIdDraft}
            onChange={(event) => {
              setParentRoleIdDraft(event.target.value);
              void onUpdateRole({
                id: activeRole.id,
                name: nameDraft || activeRole.name,
                parentRoleId: event.target.value || null,
              });
            }}
          >
            <option value="">None</option>
            {parentRoleOptions.map((role) => (
              <option key={`role-parent-option-${role.id}`} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        <div className="role-detail-stats">
          <div className="role-detail-stat">
            <p className="role-detail-stat-value">{activeRoleSkills.length}</p>
            <p className="role-detail-stat-label">Skills</p>
          </div>
          <div className="role-detail-stat">
            <p className="role-detail-stat-value">{assignedSkillGroupIds.length}</p>
            <p className="role-detail-stat-label">Groups</p>
          </div>
          <div className="role-detail-stat">
            <p className="role-detail-stat-value">{assignedMcpServerIds.length}</p>
            <p className="role-detail-stat-label">MCP Servers</p>
          </div>
          <div className="role-detail-stat">
            <p className="role-detail-stat-value">{(activeRole.subRoles || []).length}</p>
            <p className="role-detail-stat-label">Sub-roles</p>
          </div>
        </div>
      </section>

      {/* ── Two-column grid ── */}
      <div className="role-detail-grid">
        {/* ── Left: Configuration (editable) ── */}
        <div className="role-detail-column">

          {/* MCP Servers */}
          <div className="role-detail-card">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="6" rx="2" /><rect x="2" y="15" width="20" height="6" rx="2" /><path d="M12 9v6" /></svg>
              <h3>MCP Servers</h3>
              <span className="role-detail-card-count">{assignedMcpServerIds.length}</span>
            </div>
            {assignedMcpServerIds.length === 0 ? (
              <div className="role-detail-empty">No MCP servers assigned yet</div>
            ) : (
              <div className="role-detail-pills">
                {assignedMcpServerIds.map((mcpServerId) => {
                  const mcpServer = mcpServers.find((s) => s.id === mcpServerId);
                  const label = mcpServer ? mcpServer.name : mcpServerId;
                  return (
                    <button
                      key={`rm-mcp-${mcpServerId}`}
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => onRoleMcpServerIdsChange(activeRole.id, assignedMcpServerIds.filter((id) => id !== mcpServerId))}
                      title={`Remove ${label}`}
                    >
                      {label} ×
                    </button>
                  );
                })}
              </div>
            )}
            <div className="role-detail-add-row">
              <select
                className="role-detail-add-select"
                value=""
                onChange={(event) => {
                  const id = String(event.target.value || "").trim();
                  if (id) onRoleMcpServerIdsChange(activeRole.id, [...assignedMcpServerIds, id]);
                }}
                disabled={availableMcpServers.length === 0}
              >
                <option value="">{availableMcpServers.length === 0 ? "All assigned" : "+ Add server"}</option>
                {availableMcpServers.map((s) => (
                  <option key={`add-mcp-${s.id}`} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Groups */}
          <div className="role-detail-card">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <h3>Skill Groups</h3>
              <span className="role-detail-card-count">{assignedSkillGroupIds.length}</span>
            </div>
            {assignedSkillGroupIds.length === 0 ? (
              <div className="role-detail-empty">No skill groups assigned yet</div>
            ) : (
              <div className="role-detail-pills">
                {assignedSkillGroupIds.map((groupId) => {
                  const group = skillGroups.find((g) => g.id === groupId);
                  const label = group ? group.name : groupId;
                  return (
                    <button
                      key={`rm-sg-${groupId}`}
                      type="button"
                      className="tag-remove-btn"
                      onClick={() => onRoleSkillGroupIdsChange(activeRole.id, assignedSkillGroupIds.filter((id) => id !== groupId))}
                      title={`Remove ${label}`}
                    >
                      {label} ×
                    </button>
                  );
                })}
              </div>
            )}
            <div className="role-detail-add-row">
              <select
                className="role-detail-add-select"
                value=""
                onChange={(event) => {
                  const id = String(event.target.value || "").trim();
                  if (id) onRoleSkillGroupIdsChange(activeRole.id, [...assignedSkillGroupIds, id]);
                }}
                disabled={availableSkillGroups.length === 0}
              >
                <option value="">{availableSkillGroups.length === 0 ? "All assigned" : "+ Add group"}</option>
                {availableSkillGroups.map((g) => (
                  <option key={`add-sg-${g.id}`} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="role-detail-card">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
              <h3>Skills</h3>
              <span className="role-detail-card-count">{activeRoleSkills.length}</span>
            </div>
            {activeRoleSkills.length === 0 ? (
              <div className="role-detail-empty">No skills assigned yet</div>
            ) : (
              <div className="role-detail-pills">
                {activeRoleSkills.map((skill) => (
                  <button
                    key={`rm-skill-${skill.id}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() => void onRemoveSkillFromRole(activeRole.id, skill.id)}
                    title={`Remove ${skill.name}`}
                  >
                    {skill.name} ×
                  </button>
                ))}
              </div>
            )}
            <div className="role-detail-add-row">
              <select
                className="role-detail-add-select"
                value=""
                onChange={(event) => {
                  const id = String(event.target.value || "").trim();
                  if (id) void onAddSkillToRole(activeRole.id, id);
                }}
                disabled={availableSkills.length === 0}
              >
                <option value="">{availableSkills.length === 0 ? "All assigned" : "+ Add skill"}</option>
                {availableSkills.map((s) => (
                  <option key={`add-skill-${s.id}`} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Right: Resolved (read-only) ── */}
        <div className="role-detail-column">

          {/* Effective Skills */}
          <div className="role-detail-card role-detail-card-muted">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
              <h3>Effective Skills</h3>
              <span className="role-detail-card-count">{activeRoleEffectiveSkills.length}</span>
            </div>
            {activeRoleEffectiveSkills.length === 0 ? (
              <div className="role-detail-empty">No effective skills</div>
            ) : (
              <>
                <div className="role-detail-pills">
                  {activeRoleEffectiveSkills.map((skill) => {
                    const isDirect = activeRoleSkills.some((s) => s.id === skill.id);
                    return (
                      <span key={`eff-skill-${skill.id}`} className={isDirect ? "tag-pill" : "role-detail-pill-inherited"}>
                        {skill.name}
                      </span>
                    );
                  })}
                </div>
                {activeRoleEffectiveSkills.length > activeRoleSkills.length && activeRole.parentRole ? (
                  <p className="role-detail-inherit-note">
                    Includes {activeRoleEffectiveSkills.length - activeRoleSkills.length} inherited from "{activeRole.parentRole.name}"
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Effective MCP Servers */}
          <div className="role-detail-card role-detail-card-muted">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="6" rx="2" /><rect x="2" y="15" width="20" height="6" rx="2" /><path d="M12 9v6" /></svg>
              <h3>Effective MCP Servers</h3>
              <span className="role-detail-card-count">{activeRoleEffectiveMcpServers.length}</span>
            </div>
            {activeRoleEffectiveMcpServers.length === 0 ? (
              <div className="role-detail-empty">No effective MCP servers</div>
            ) : (
              <>
                <div className="role-detail-pills">
                  {activeRoleEffectiveMcpServers.map((server) => {
                    const isDirect = assignedMcpServerIds.includes(server.id);
                    return (
                      <span key={`eff-mcp-${server.id}`} className={isDirect ? "tag-pill" : "role-detail-pill-inherited"}>
                        {server.name}
                      </span>
                    );
                  })}
                </div>
                {activeRoleEffectiveMcpServers.length > assignedMcpServerIds.length && activeRole.parentRole ? (
                  <p className="role-detail-inherit-note">
                    Includes {activeRoleEffectiveMcpServers.length - assignedMcpServerIds.length} inherited from "{activeRole.parentRole.name}"
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Sub-roles */}
          <div className="role-detail-card role-detail-card-muted">
            <div className="role-detail-card-header">
              <svg viewBox="0 0 24 24"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 0 0 9 9" /></svg>
              <h3>Sub-roles</h3>
              <span className="role-detail-card-count">{(activeRole.subRoles || []).length}</span>
            </div>
            {(activeRole.subRoles || []).length === 0 ? (
              <div className="role-detail-empty">No sub-roles</div>
            ) : (
              <div>
                {(activeRole.subRoles || []).map((subRole) => (
                  <button
                    key={`sub-${subRole.id}`}
                    type="button"
                    className="role-detail-subrole-link"
                    onClick={() => onOpenRole(subRole.id)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                    {subRole.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div></Page>
  );
```

**Step 3: Commit**

```bash
git add src/pages/RolesPage.jsx
git commit -m "feat: redesign role detail page with hero header and two-column grid"
```

---

### Task 4: Visual verification and cleanup

**Step 1: Start the dev server and verify**

```bash
cd /Users/andrea/repos/company-helm/frontend && npm run dev
```

Open `http://localhost:5173/roles/<any-role-id>` and verify:
- Hero header renders with role name, edit icon, parent dropdown, stat badges
- Two-column grid renders with left (editable) and right (read-only) cards
- Back button works
- Edit name inline toggle works (click pencil, type, press Enter or Save)
- Parent dropdown auto-saves on change
- All add/remove operations for MCP servers, skill groups, skills work
- Effective pills show direct vs inherited distinction
- Responsive collapse works below 600px

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: role detail page cleanup after visual verification"
```
