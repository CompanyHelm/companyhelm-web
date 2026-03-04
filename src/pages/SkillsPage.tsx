import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { normalizeUniqueStringList } from "../utils/normalization.ts";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type {
  McpServer,
  Role,
  RoleDraft,
  RoleDraftById,
  Skill,
  StringArrayById,
} from "../types/domain.ts";

interface SkillsPageProps {
  selectedCompanyId: string;
  skills: Skill[];
  roles: Role[];
  mcpServers: McpServer[];
  roleMcpServerIdsByRoleId: StringArrayById;
  activeSkill: Skill | null;
  isLoadingSkills: boolean;
  isLoadingRoles: boolean;
  skillError: string;
  onOpenSkill: (skillId: string) => void;
  onBackToSkills: () => void;
  onCreateRole: (input: { name: string; parentRoleId: string | null }) => Promise<void> | void;
  onUpdateRole: (input: { id: string; name: string; parentRoleId: string | null }) => Promise<void> | void;
  onDeleteRole: (roleId: string, roleName: string) => void;
  onAddSkillToRole: (roleId: string, skillId: string) => Promise<void> | void;
  onRemoveSkillFromRole: (roleId: string, skillId: string) => Promise<void> | void;
  onRoleMcpServerIdsChange: (roleId: string, mcpServerIds: string[]) => void;
  onOpenGitSkillPackage: (packageId: string) => void;
}

export function SkillsPage({
  selectedCompanyId,
  skills,
  roles,
  mcpServers,
  roleMcpServerIdsByRoleId,
  activeSkill,
  isLoadingSkills,
  isLoadingRoles,
  skillError,
  onOpenSkill,
  onBackToSkills,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onAddSkillToRole,
  onRemoveSkillFromRole,
  onRoleMcpServerIdsChange,
  onOpenGitSkillPackage,
}: SkillsPageProps) {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleParentId, setNewRoleParentId] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<RoleDraftById>({});
  const [localError, setLocalError] = useState("");
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState("");
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

  const assignedSkillIds = useMemo(() => {
    const ids = new Set<string>();
    for (const role of roles) {
      for (const skill of role.skills || []) {
        if (skill?.id) {
          ids.add(skill.id);
        }
      }
    }
    return ids;
  }, [roles]);

  const unassignedSkills = useMemo(() => {
    return skills.filter((skill) => !assignedSkillIds.has(skill.id));
  }, [assignedSkillIds, skills]);

  const editingRole = roles.find((role) => role.id === editingRoleId) || null;

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
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
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : "Failed to create role.");
    } finally {
      setIsCreatingRole(false);
    }
  }

  async function handleAddSkillToRole(roleId: string, skillId: string) {
    try {
      setLocalError("");
      await onAddSkillToRole(roleId, skillId);
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : "Failed to assign skill to role.");
    }
  }

  async function handleRemoveSkillFromRole(roleId: string, skillId: string) {
    try {
      setLocalError("");
      await onRemoveSkillFromRole(roleId, skillId);
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : "Failed to remove skill from role.");
    }
  }

  function getRoleDraft(role: Role): RoleDraft {
    const existingDraft = roleDrafts[role.id];
    if (existingDraft) {
      return existingDraft;
    }
    return {
      name: role.name || "",
      parentRoleId: role.parentRole?.id || "",
    };
  }

  function updateRoleDraft(roleId: string, nextDraft: Partial<RoleDraft>) {
    setRoleDrafts((current) => ({
      ...current,
      [roleId]: {
        ...current[roleId],
        ...nextDraft,
      },
    }));
  }

  async function handleUpdateRole(roleId: string) {
    try {
      const draft = roleDrafts[roleId];
      if (!draft) {
        return;
      }
      setSavingRoleId(roleId);
      setLocalError("");
      await onUpdateRole({
        id: roleId,
        name: draft.name,
        parentRoleId: draft.parentRoleId || null,
      });
      setEditingRoleId("");
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setSavingRoleId("");
    }
  }

  function openEditRoleModal(role: Role) {
    setRoleDrafts((current) => ({
      ...current,
      [role.id]: {
        name: role.name || "",
        parentRoleId: role.parentRole?.id || "",
      },
    }));
    setEditingRoleId(role.id);
  }

  const pageActions = useMemo(() => (
    <>
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
    </>
  ), []);
  useSetPageActions(pageActions);

  if (activeSkill) {
    const gitSkillPackage = activeSkill.gitSkillPackage || null;

    return (
      <Page><div className="page-stack">
        <section className="panel list-panel">
          {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}

          <p className="chat-card-meta" style={{ padding: "0.2rem 0" }}>
            {activeSkill.description || "No description provided."}
          </p>

          <div className="skill-detail-info">
            <p className="chat-card-meta">
              Roles: {(activeSkill.roles || []).map((role) => role.name).join(", ") || "none"}
              {" · "}Files: {activeSkill.fileList?.length || 0}
            </p>
          </div>

          {gitSkillPackage ? (
            <div className="skill-detail-info">
              <p className="chat-card-meta">
                Package: {gitSkillPackage.packageName}
                {" · "}Path: {activeSkill.gitSkillPackagePath || "-"}
              </p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
              >
                Open package
              </button>
            </div>
          ) : null}

          <section className="skill-detail-section">
            <div className="skill-detail-section-header">
              <h3>Content</h3>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowRawMarkdown((current) => !current)}
              >
                {showRawMarkdown ? "Rendered" : "Raw"}
              </button>
            </div>
            {showRawMarkdown ? (
              <pre className="skill-content-raw">{activeSkill.content || ""}</pre>
            ) : (
              <div className="chat-message-content chat-message-content-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSkill.content || ""}</ReactMarkdown>
              </div>
            )}
          </section>

          {Array.isArray(activeSkill.fileList) && activeSkill.fileList.length > 0 ? (
            <section className="skill-detail-section">
              <h3>Files</h3>
              <ul className="skill-file-list">
                {activeSkill.fileList.map((filePath) => (
                  <li key={filePath}>
                    <code>{filePath}</code>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div></Page>
    );
  }

  return (
    <Page><div className="page-stack">
      {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}
      {isLoadingSkills || isLoadingRoles ? <p className="empty-hint">Loading skills...</p> : null}

      {roles.length > 0 ? (
        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Roles</h2>
            <span className="chat-card-meta">{roles.length} roles</span>
          </header>

          <ul className="chat-card-list">
            {roles.map((role) => {
              const skillCount = (role.skills || []).length;
              const parentLabel = role.parentRole?.name || null;
              return (
                <li
                  key={role.id}
                  className="chat-card"
                  onClick={() => openEditRoleModal(role)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                    if (event.key === "Enter") {
                      openEditRoleModal(role);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{role.name}</strong>
                    </p>
                    <p className="chat-card-meta">
                      {skillCount} {skillCount === 1 ? "skill" : "skills"}
                      {parentLabel ? ` · parent role: ${parentLabel}` : ""}
                    </p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
      ) : !isLoadingRoles ? (
        <section className="panel list-panel">
          <p className="empty-hint">No roles yet.</p>
        </section>
      ) : null}

      {unassignedSkills.length > 0 ? (
        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Skills without roles</h2>
            <span className="chat-card-meta">{unassignedSkills.length} skills</span>
          </header>
          <ul className="chat-card-list">
            {unassignedSkills.map((skill) => (
              <li
                key={`unassigned-skill-${skill.id}`}
                className="chat-card"
                onClick={() => onOpenSkill(skill.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                  if (event.key === "Enter") {
                    onOpenSkill(skill.id);
                  }
                }}
              >
                <div className="chat-card-main">
                  <p className="chat-card-title">
                    <strong>{skill.name}</strong>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CreationModal
        modalId="create-skill-role-modal"
        title="Create role"
        description="Add a new role to organize skills and assigned MCP servers."
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
      >
        <form className="chat-settings-modal-form" onSubmit={handleCreateRole}>
          <div className="chat-settings-field">
            <label htmlFor="new-skill-role-name" className="chat-settings-label">Role name</label>
            <input
              id="new-skill-role-name"
              className="chat-settings-input"
              value={newRoleName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setNewRoleName(event.target.value)}
              placeholder="e.g. obra/superpowers"
              required
              autoFocus
            />
          </div>
          <div className="chat-settings-field">
            <label htmlFor="new-skill-role-parent" className="chat-settings-label">Parent role (optional)</label>
            <select
              id="new-skill-role-parent"
              className="chat-settings-input"
              value={newRoleParentId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setNewRoleParentId(event.target.value)}
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

      <CreationModal
        modalId="edit-skill-role-modal"
        title={editingRole ? `Edit role "${editingRole.name}"` : "Edit role"}
        description="Update role settings, skills, and role MCP assignments."
        isOpen={Boolean(editingRole)}
        onClose={() => setEditingRoleId("")}
        cardClassName="modal-card-wide"
      >
        {editingRole ? (() => {
          const roleDraft = getRoleDraft(editingRole);
          const parentOptions = roles.filter((entry) => entry.id !== editingRole.id);
          const roleSkillIds = new Set((editingRole.skills || []).map((skill) => skill.id));
          const availableSkills = skills.filter((skill) => !roleSkillIds.has(skill.id));
          const assignedRoleMcpServerIds = normalizeUniqueStringList(
            roleMcpServerIdsByRoleId?.[editingRole.id] || [],
          );
          const availableRoleMcpServers = mcpServers.filter(
            (mcpServer) => !assignedRoleMcpServerIds.includes(mcpServer.id),
          );

          return (
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <label htmlFor={`role-name-${editingRole.id}`} className="chat-settings-label">Role name</label>
                <input
                  id={`role-name-${editingRole.id}`}
                  className="chat-settings-input"
                  value={roleDraft.name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateRoleDraft(editingRole.id, { name: event.target.value })
                  }
                />
              </div>
              <div className="chat-settings-field">
                <label htmlFor={`role-parent-${editingRole.id}`} className="chat-settings-label">Parent role</label>
                <select
                  id={`role-parent-${editingRole.id}`}
                  className="chat-settings-input"
                  value={roleDraft.parentRoleId || ""}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    updateRoleDraft(editingRole.id, { parentRoleId: event.target.value })
                  }
                >
                  <option value="">None</option>
                  {parentOptions.map((parentRole) => (
                    <option key={`role-parent-option-${editingRole.id}-${parentRole.id}`} value={parentRole.id}>
                      {parentRole.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chat-settings-actions">
                <button
                  type="button"
                  onClick={() => void handleUpdateRole(editingRole.id)}
                  disabled={savingRoleId === editingRole.id}
                >
                  {savingRoleId === editingRole.id ? "Saving..." : "Save role"}
                </button>
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`role-mcp-assigned-${editingRole.id}`} className="chat-settings-label">
                  Assigned MCP servers
                </label>
                <div id={`role-mcp-assigned-${editingRole.id}`} className="inline-selection-list">
                  {assignedRoleMcpServerIds.length === 0 ? (
                    <span className="empty-hint">No MCP servers assigned to this role.</span>
                  ) : (
                    assignedRoleMcpServerIds.map((mcpServerId) => {
                      const mcpServer = mcpServers.find((server) => server.id === mcpServerId);
                      const mcpServerLabel = mcpServer ? mcpServer.name : mcpServerId;
                      return (
                        <button
                          key={`role-remove-mcp-${editingRole.id}-${mcpServerId}`}
                          type="button"
                          className="tag-remove-btn"
                          onClick={() =>
                            onRoleMcpServerIdsChange(
                              editingRole.id,
                              assignedRoleMcpServerIds.filter(
                                (candidateId) => candidateId !== mcpServerId,
                              ),
                            )
                          }
                          title={`Remove ${mcpServerLabel}`}
                        >
                          {mcpServerLabel} ×
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="chat-settings-field">
                <label htmlFor={`role-add-mcp-${editingRole.id}`} className="chat-settings-label">
                  Add MCP server
                </label>
                <select
                  id={`role-add-mcp-${editingRole.id}`}
                  className="chat-settings-input"
                  value=""
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                    const nextMcpServerId = String(event.target.value || "").trim();
                    if (!nextMcpServerId) {
                      return;
                    }
                    onRoleMcpServerIdsChange(editingRole.id, [
                      ...assignedRoleMcpServerIds,
                      nextMcpServerId,
                    ]);
                  }}
                  disabled={availableRoleMcpServers.length === 0}
                >
                  <option value="">
                    {availableRoleMcpServers.length === 0
                      ? "All MCP servers already assigned"
                      : "Select MCP server to add"}
                  </option>
                  {availableRoleMcpServers.map((mcpServer) => (
                    <option
                      key={`role-mcp-option-${editingRole.id}-${mcpServer.id}`}
                      value={mcpServer.id}
                    >
                      {mcpServer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="chat-settings-field">
                <label className="chat-settings-label">Skills in role</label>
                {(editingRole.skills || []).length === 0 ? (
                  <p className="empty-hint">No skills in this role.</p>
                ) : (
                  <ul className="chat-card-list">
                    {(editingRole.skills || []).map((skill) => (
                      <li key={`${editingRole.id}-${skill.id}`} className="chat-card">
                        <div className="chat-card-main">
                          <p className="chat-card-title">
                            <strong>{skill.name}</strong>
                          </p>
                        </div>
                        <div className="chat-card-actions">
                          <button
                            type="button"
                            className="chat-card-icon-btn"
                            onClick={() => {
                              setEditingRoleId("");
                              onOpenSkill(skill.id);
                            }}
                            aria-label="View skill"
                            title="View skill"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="chat-card-icon-btn chat-card-icon-btn-danger"
                            onClick={() => void handleRemoveSkillFromRole(editingRole.id, skill.id)}
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
              </div>

              {availableSkills.length > 0 ? (
                <div className="chat-settings-field">
                  <label htmlFor={`role-add-skill-${editingRole.id}`} className="chat-settings-label">
                    Add skill to role
                  </label>
                  <select
                    id={`role-add-skill-${editingRole.id}`}
                    className="chat-settings-input"
                    value=""
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                      const nextSkillId = String(event.target.value || "").trim();
                      if (!nextSkillId) {
                        return;
                      }
                      void handleAddSkillToRole(editingRole.id, nextSkillId);
                    }}
                  >
                    <option value="">Select skill</option>
                    {availableSkills.map((skill) => (
                      <option key={`role-skill-option-${editingRole.id}-${skill.id}`} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          );
        })() : null}
      </CreationModal>
    </div></Page>
  );
}
