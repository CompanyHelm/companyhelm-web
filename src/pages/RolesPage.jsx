import { useEffect, useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { normalizeUniqueStringList } from "../utils/normalization.js";
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

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>{activeRole.name}</h2>
          <button type="button" className="secondary-btn" onClick={onBackToRoles}>Back to roles</button>
        </header>

        <div className="chat-settings-field">
          <label htmlFor={`role-name-${activeRole.id}`} className="chat-settings-label">Role name</label>
          <input
            id={`role-name-${activeRole.id}`}
            className="chat-settings-input"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
          />
        </div>

        <div className="chat-settings-field">
          <label htmlFor={`role-parent-${activeRole.id}`} className="chat-settings-label">Parent role</label>
          <select
            id={`role-parent-${activeRole.id}`}
            className="chat-settings-input"
            value={parentRoleIdDraft}
            onChange={(event) => setParentRoleIdDraft(event.target.value)}
          >
            <option value="">None</option>
            {parentRoleOptions.map((role) => (
              <option key={`role-parent-option-${role.id}`} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="chat-settings-actions">
          <button type="button" onClick={() => void handleSaveRole()} disabled={isSavingRole}>
            {isSavingRole ? "Saving..." : "Save role"}
          </button>
        </div>

        <section className="skill-detail-section">
          <h3>Sub-roles</h3>
          {(activeRole.subRoles || []).length === 0 ? (
            <p className="empty-hint">No sub-roles.</p>
          ) : (
            <ul className="chat-card-list">
              {(activeRole.subRoles || []).map((subRole) => (
                <li
                  key={`sub-role-${subRole.id}`}
                  className="chat-card"
                  onClick={() => onOpenRole(subRole.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onOpenRole(subRole.id);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title"><strong>{subRole.name}</strong></p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="skill-detail-section">
          <h3>MCP servers</h3>
          <div className="inline-selection-list">
            {assignedMcpServerIds.length === 0 ? (
              <span className="empty-hint">No MCP servers assigned to this role.</span>
            ) : (
              assignedMcpServerIds.map((mcpServerId) => {
                const mcpServer = mcpServers.find((server) => server.id === mcpServerId);
                const label = mcpServer ? mcpServer.name : mcpServerId;
                return (
                  <button
                    key={`remove-role-mcp-${activeRole.id}-${mcpServerId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onRoleMcpServerIdsChange(
                        activeRole.id,
                        assignedMcpServerIds.filter((candidateId) => candidateId !== mcpServerId),
                      )
                    }
                    title={`Remove ${label}`}
                  >
                    {label} ×
                  </button>
                );
              })
            )}
          </div>
          <div className="chat-settings-field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor={`role-add-mcp-${activeRole.id}`} className="chat-settings-label">Add MCP server</label>
            <select
              id={`role-add-mcp-${activeRole.id}`}
              className="chat-settings-input"
              value=""
              onChange={(event) => {
                const mcpServerId = String(event.target.value || "").trim();
                if (!mcpServerId) {
                  return;
                }
                onRoleMcpServerIdsChange(activeRole.id, [...assignedMcpServerIds, mcpServerId]);
              }}
              disabled={availableMcpServers.length === 0}
            >
              <option value="">
                {availableMcpServers.length === 0
                  ? "All MCP servers already assigned"
                  : "Select MCP server to add"}
              </option>
              {availableMcpServers.map((mcpServer) => (
                <option key={`role-mcp-option-${activeRole.id}-${mcpServer.id}`} value={mcpServer.id}>
                  {mcpServer.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="skill-detail-section">
          <h3>Skill groups</h3>
          <div className="inline-selection-list">
            {assignedSkillGroupIds.length === 0 ? (
              <span className="empty-hint">No skill groups assigned to this role.</span>
            ) : (
              assignedSkillGroupIds.map((skillGroupId) => {
                const skillGroup = skillGroups.find((group) => group.id === skillGroupId);
                const label = skillGroup ? skillGroup.name : skillGroupId;
                return (
                  <button
                    key={`remove-role-skill-group-${activeRole.id}-${skillGroupId}`}
                    type="button"
                    className="tag-remove-btn"
                    onClick={() =>
                      onRoleSkillGroupIdsChange(
                        activeRole.id,
                        assignedSkillGroupIds.filter((candidateId) => candidateId !== skillGroupId),
                      )
                    }
                    title={`Remove ${label}`}
                  >
                    {label} ×
                  </button>
                );
              })
            )}
          </div>
          <div className="chat-settings-field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor={`role-add-skill-group-${activeRole.id}`} className="chat-settings-label">
              Add skill group
            </label>
            <select
              id={`role-add-skill-group-${activeRole.id}`}
              className="chat-settings-input"
              value=""
              onChange={(event) => {
                const skillGroupId = String(event.target.value || "").trim();
                if (!skillGroupId) {
                  return;
                }
                onRoleSkillGroupIdsChange(activeRole.id, [...assignedSkillGroupIds, skillGroupId]);
              }}
              disabled={availableSkillGroups.length === 0}
            >
              <option value="">
                {availableSkillGroups.length === 0
                  ? "All skill groups already assigned"
                  : "Select skill group to add"}
              </option>
              {availableSkillGroups.map((skillGroup) => (
                <option key={`role-skill-group-option-${activeRole.id}-${skillGroup.id}`} value={skillGroup.id}>
                  {skillGroup.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="skill-detail-section">
          <h3>Skills</h3>
          {activeRoleSkills.length === 0 ? (
            <p className="empty-hint">No skills in this role.</p>
          ) : (
            <ul className="chat-card-list">
              {activeRoleSkills.map((skill) => (
                <li key={`role-skill-${activeRole.id}-${skill.id}`} className="chat-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title"><strong>{skill.name}</strong></p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={() => void onRemoveSkillFromRole(activeRole.id, skill.id)}
                      aria-label="Remove from role"
                      title="Remove from role"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="chat-settings-field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor={`role-add-skill-${activeRole.id}`} className="chat-settings-label">Add skill</label>
            <select
              id={`role-add-skill-${activeRole.id}`}
              className="chat-settings-input"
              value=""
              onChange={(event) => {
                const skillId = String(event.target.value || "").trim();
                if (!skillId) {
                  return;
                }
                void onAddSkillToRole(activeRole.id, skillId);
              }}
              disabled={availableSkills.length === 0}
            >
              <option value="">
                {availableSkills.length === 0 ? "All skills already assigned" : "Select skill"}
              </option>
              {availableSkills.map((skill) => (
                <option key={`role-skill-option-${activeRole.id}-${skill.id}`} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="skill-detail-section">
          <h3>Effective skills</h3>
          {activeRoleEffectiveSkills.length === 0 ? (
            <p className="empty-hint">No effective skills for this role.</p>
          ) : (
            <ul className="chat-card-list">
              {activeRoleEffectiveSkills.map((skill) => (
                <li key={`role-effective-skill-${activeRole.id}-${skill.id}`} className="chat-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title"><strong>{skill.name}</strong></p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="skill-detail-section">
          <h3>Effective MCP servers</h3>
          {activeRoleEffectiveMcpServers.length === 0 ? (
            <p className="empty-hint">No effective MCP servers for this role.</p>
          ) : (
            <ul className="chat-card-list">
              {activeRoleEffectiveMcpServers.map((mcpServer) => (
                <li key={`role-effective-mcp-${activeRole.id}-${mcpServer.id}`} className="chat-card">
                  <div className="chat-card-main">
                    <p className="chat-card-title"><strong>{mcpServer.name}</strong></p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div></Page>
  );
}
