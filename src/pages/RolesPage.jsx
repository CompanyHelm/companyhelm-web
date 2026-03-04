import { useEffect, useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { normalizeUniqueStringList } from "../utils/normalization.ts";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

export function RolesPage({
  roles,
  skills,
  skillGroups,
  mcpServers,
  roleSkillGroupIdsByRoleId,
  roleMcpServerIdsByRoleId,
  activeRole,
  isLoadingRoles,
  roleError,
  onOpenRole,
  onBackToRoles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onAddSkillToRole,
  onRemoveSkillFromRole,
  onRoleSkillGroupIdsChange,
  onRoleMcpServerIdsChange,
}) {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleParentId, setNewRoleParentId] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [parentRoleIdDraft, setParentRoleIdDraft] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const assignedMcpServerIds = useMemo(() => {
    if (!activeRole) {
      return [];
    }
    return normalizeUniqueStringList(roleMcpServerIdsByRoleId?.[activeRole.id] || []);
  }, [activeRole, roleMcpServerIdsByRoleId]);

  const availableMcpServers = useMemo(() => {
    return mcpServers.filter((mcpServer) => !assignedMcpServerIds.includes(mcpServer.id));
  }, [assignedMcpServerIds, mcpServers]);

  const assignedSkillGroupIds = useMemo(() => {
    if (!activeRole) {
      return [];
    }
    return normalizeUniqueStringList(roleSkillGroupIdsByRoleId?.[activeRole.id] || []);
  }, [activeRole, roleSkillGroupIdsByRoleId]);

  const availableSkillGroups = useMemo(() => {
    return skillGroups.filter((skillGroup) => !assignedSkillGroupIds.includes(skillGroup.id));
  }, [assignedSkillGroupIds, skillGroups]);

  const activeRoleSkills = useMemo(() => {
    return activeRole?.skills || [];
  }, [activeRole]);

  const activeRoleEffectiveSkills = useMemo(() => {
    return activeRole?.effectiveSkills || [];
  }, [activeRole]);

  const activeRoleEffectiveMcpServers = useMemo(() => {
    return activeRole?.effectiveMcpServers || [];
  }, [activeRole]);

  const availableSkills = useMemo(() => {
    const activeSkillIds = new Set(activeRoleSkills.map((skill) => skill.id));
    return skills.filter((skill) => !activeSkillIds.has(skill.id));
  }, [activeRoleSkills, skills]);

  const parentRoleOptions = useMemo(() => {
    if (!activeRole) {
      return [];
    }
    return roles.filter((role) => role.id !== activeRole.id);
  }, [activeRole, roles]);

  const pageActions = useMemo(() => (
    <button
      type="button"
      className="chat-minimal-header-icon-btn"
      aria-label="Create role"
      title="Create role"
      onClick={() => setIsCreateRoleModalOpen(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  ), []);
  useSetPageActions(pageActions);

  useEffect(() => {
    if (!activeRole) {
      return;
    }
    setNameDraft(activeRole.name || "");
    setParentRoleIdDraft(activeRole.parentRole?.id || "");
  }, [activeRole]);

  async function handleCreateRole(event) {
    event.preventDefault();
    try {
      setIsCreatingRole(true);
      setLocalError("");
      await onCreateRole({
        name: newRoleName,
        parentRoleId: newRoleParentId || null,
      });
      setNewRoleName("");
      setNewRoleParentId("");
      setIsCreateRoleModalOpen(false);
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsCreatingRole(false);
    }
  }

  async function handleSaveRole() {
    if (!activeRole) {
      return;
    }
    try {
      setIsSavingRole(true);
      setLocalError("");
      await onUpdateRole({
        id: activeRole.id,
        name: nameDraft || activeRole.name,
        parentRoleId: parentRoleIdDraft || null,
      });
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsSavingRole(false);
    }
  }

  if (!activeRole) {
    return (
      <Page><div className="page-stack">
        {roleError || localError ? <p className="error-banner">{roleError || localError}</p> : null}
        {isLoadingRoles ? <p className="empty-hint">Loading roles...</p> : null}

        {roles.length > 0 ? (
          <section className="panel list-panel">
            <header className="panel-header panel-header-row">
              <h2>Roles</h2>
              <span className="chat-card-meta">{roles.length} roles</span>
            </header>
            <ul className="chat-card-list">
              {roles.map((role) => {
                const skillCount = (role.skills || []).length;
                const skillGroupCount = (role.skillGroups || []).length;
                const subRoleCount = (role.subRoles || []).length;
                const parentName = role.parentRole?.name || null;
                return (
                  <li
                    key={role.id}
                    className="chat-card"
                    onClick={() => onOpenRole(role.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onOpenRole(role.id);
                      }
                    }}
                  >
                    <div className="chat-card-main">
                      <p className="chat-card-title">
                        <strong>{role.name}</strong>
                      </p>
                      <p className="chat-card-meta">
                        {skillCount} {skillCount === 1 ? "skill" : "skills"} · {skillGroupCount} {skillGroupCount === 1 ? "group" : "groups"} · {subRoleCount} sub-roles
                        {parentName ? ` · parent: ${parentName}` : ""}
                      </p>
                    </div>
                    <div className="chat-card-actions">
                      <button
                        type="button"
                        className="chat-card-icon-btn chat-card-icon-btn-danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteRole(role.id, role.name);
                        }}
                        aria-label="Delete role"
                        title="Delete role"
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
          </section>
        ) : (
          <section className="panel list-panel">
            <p className="empty-hint">No roles yet.</p>
          </section>
        )}

        <CreationModal
          modalId="create-role-modal"
          title="Create role"
          description="Add a new role and assign skills/MCP servers."
          isOpen={isCreateRoleModalOpen}
          onClose={() => setIsCreateRoleModalOpen(false)}
        >
          <form className="chat-settings-modal-form" onSubmit={handleCreateRole}>
            <div className="chat-settings-field">
              <label htmlFor="new-role-name" className="chat-settings-label">Role name</label>
              <input
                id="new-role-name"
                className="chat-settings-input"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="chat-settings-field">
              <label htmlFor="new-role-parent" className="chat-settings-label">Parent role (optional)</label>
              <select
                id="new-role-parent"
                className="chat-settings-input"
                value={newRoleParentId}
                onChange={(event) => setNewRoleParentId(event.target.value)}
              >
                <option value="">None</option>
                {roles.map((role) => (
                  <option key={`parent-role-${role.id}`} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="chat-settings-actions">
              <button type="submit" disabled={isCreatingRole}>
                {isCreatingRole ? "Creating..." : "Create role"}
              </button>
            </div>
          </form>
        </CreationModal>
      </div></Page>
    );
  }

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
                    Includes {activeRoleEffectiveSkills.length - activeRoleSkills.length} inherited from &quot;{activeRole.parentRole.name}&quot;
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
                    Includes {activeRoleEffectiveMcpServers.length - assignedMcpServerIds.length} inherited from &quot;{activeRole.parentRole.name}&quot;
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
}
