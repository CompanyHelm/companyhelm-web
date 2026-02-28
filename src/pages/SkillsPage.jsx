import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CreationModal } from "../components/CreationModal.jsx";

export function SkillsPage({
  selectedCompanyId,
  skills,
  skillGroups,
  activeSkill,
  isLoadingSkills,
  isLoadingSkillGroups,
  skillError,
  onOpenSkill,
  onBackToSkills,
  onCreateSkillGroup,
  onUpdateSkillGroup,
  onDeleteSkillGroup,
  onAddSkillToGroup,
  onRemoveSkillFromGroup,
  onOpenGitSkillPackage,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParentId, setNewGroupParentId] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState("");
  const [groupDrafts, setGroupDrafts] = useState({});
  const [localError, setLocalError] = useState("");
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState("");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const groupedSkillIds = useMemo(() => {
    const ids = new Set();
    for (const group of skillGroups) {
      for (const skill of group.skills || []) {
        if (skill?.id) {
          ids.add(skill.id);
        }
      }
    }
    return ids;
  }, [skillGroups]);

  const ungroupedSkills = useMemo(() => {
    return skills.filter((skill) => !groupedSkillIds.has(skill.id));
  }, [groupedSkillIds, skills]);

  const editingGroup = skillGroups.find((group) => group.id === editingGroupId) || null;

  async function handleCreateGroup(event) {
    event.preventDefault();
    try {
      setIsCreatingGroup(true);
      setLocalError("");
      await onCreateSkillGroup({
        name: newGroupName,
        parentSkillGroupId: newGroupParentId || null,
      });
      setNewGroupName("");
      setNewGroupParentId("");
      setIsCreateGroupModalOpen(false);
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleAddSkillToGroup(skillGroupId, skillId) {
    try {
      setLocalError("");
      await onAddSkillToGroup(skillGroupId, skillId);
    } catch (error) {
      setLocalError(error.message);
    }
  }

  async function handleRemoveSkillFromGroup(skillGroupId, skillId) {
    try {
      setLocalError("");
      await onRemoveSkillFromGroup(skillGroupId, skillId);
    } catch (error) {
      setLocalError(error.message);
    }
  }

  function getGroupDraft(group) {
    const existingDraft = groupDrafts[group.id];
    if (existingDraft) {
      return existingDraft;
    }
    return {
      name: group.name || "",
      parentSkillGroupId: group.parentSkillGroup?.id || "",
    };
  }

  function updateGroupDraft(groupId, nextDraft) {
    setGroupDrafts((current) => ({
      ...current,
      [groupId]: {
        ...current[groupId],
        ...nextDraft,
      },
    }));
  }

  async function handleUpdateGroup(groupId) {
    try {
      const draft = groupDrafts[groupId];
      if (!draft) {
        return;
      }
      setSavingGroupId(groupId);
      setLocalError("");
      await onUpdateSkillGroup({
        id: groupId,
        name: draft.name,
        parentSkillGroupId: draft.parentSkillGroupId || null,
      });
      setEditingGroupId("");
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setSavingGroupId("");
    }
  }

  function openEditGroupModal(group) {
    setGroupDrafts((current) => ({
      ...current,
      [group.id]: {
        name: group.name || "",
        parentSkillGroupId: group.parentSkillGroup?.id || "",
      },
    }));
    setEditingGroupId(group.id);
  }

  if (activeSkill) {
    const gitSkillPackage = activeSkill.gitSkillPackage || null;

    return (
      <div className="page-stack">
        <header className="chat-minimal-header">
          <div className="chat-minimal-header-info">
            <p className="chat-minimal-header-agent">Skill</p>
            <h1 className="chat-minimal-header-title">{activeSkill.name}</h1>
          </div>
          <div className="chat-minimal-header-actions">
            <button type="button" className="secondary-btn" onClick={onBackToSkills}>
              Back
            </button>
          </div>
        </header>

        <section className="panel list-panel">
          {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}

          <p className="chat-card-meta" style={{ padding: "0.2rem 0" }}>
            {activeSkill.description || "No description provided."}
          </p>

          <div className="skill-detail-info">
            <p className="chat-card-meta">
              Groups: {(activeSkill.groups || []).map((group) => group.name).join(", ") || "none"}
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
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="chat-minimal-header">
        <div className="chat-minimal-header-info">
          <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
          <h1 className="chat-minimal-header-title">Skills</h1>
        </div>
        <div className="chat-minimal-header-actions">
          <button
            type="button"
            className="chat-minimal-header-icon-btn"
            aria-label="Create skill group"
            title="Create skill group"
            onClick={() => setIsCreateGroupModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}
      {isLoadingSkills || isLoadingSkillGroups ? <p className="empty-hint">Loading skills...</p> : null}

      {skillGroups.length > 0 ? (
        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Skill groups</h2>
            <span className="chat-card-meta">{skillGroups.length} groups</span>
          </header>

          <ul className="chat-card-list">
            {skillGroups.map((group) => {
              const skillCount = (group.skills || []).length;
              const parentLabel = group.parentSkillGroup?.name || null;
              return (
                <li
                  key={group.id}
                  className="chat-card"
                  onClick={() => openEditGroupModal(group)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      openEditGroupModal(group);
                    }
                  }}
                >
                  <div className="chat-card-main">
                    <p className="chat-card-title">
                      <strong>{group.name}</strong>
                    </p>
                    <p className="chat-card-meta">
                      {skillCount} {skillCount === 1 ? "skill" : "skills"}
                      {parentLabel ? ` · parent: ${parentLabel}` : ""}
                    </p>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteSkillGroup(group.id, group.name);
                      }}
                      aria-label="Delete group"
                      title="Delete group"
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
      ) : !isLoadingSkillGroups ? (
        <section className="panel list-panel">
          <p className="empty-hint">No skill groups yet.</p>
        </section>
      ) : null}

      {ungroupedSkills.length > 0 ? (
        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Ungrouped skills</h2>
            <span className="chat-card-meta">{ungroupedSkills.length} skills</span>
          </header>
          <ul className="chat-card-list">
            {ungroupedSkills.map((skill) => (
              <li
                key={`ungrouped-skill-${skill.id}`}
                className="chat-card"
                onClick={() => onOpenSkill(skill.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
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
        modalId="create-skill-group-modal"
        title="Create skill group"
        description="Add a new group to organize skills."
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      >
        <form className="chat-settings-modal-form" onSubmit={handleCreateGroup}>
          <div className="chat-settings-field">
            <label htmlFor="new-skill-group-name" className="chat-settings-label">Group name</label>
            <input
              id="new-skill-group-name"
              className="chat-settings-input"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="e.g. obra/superpowers"
              required
              autoFocus
            />
          </div>
          <div className="chat-settings-field">
            <label htmlFor="new-skill-group-parent" className="chat-settings-label">Parent group (optional)</label>
            <select
              id="new-skill-group-parent"
              className="chat-settings-input"
              value={newGroupParentId}
              onChange={(event) => setNewGroupParentId(event.target.value)}
            >
              <option value="">None</option>
              {skillGroups.map((group) => (
                <option key={`parent-group-${group.id}`} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="chat-settings-actions">
            <button type="submit" disabled={isCreatingGroup}>
              {isCreatingGroup ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </CreationModal>

      <CreationModal
        modalId="edit-skill-group-modal"
        title={editingGroup ? `Edit "${editingGroup.name}"` : "Edit group"}
        description="Update group settings and manage skills."
        isOpen={Boolean(editingGroup)}
        onClose={() => setEditingGroupId("")}
        cardClassName="modal-card-wide"
      >
        {editingGroup ? (() => {
          const groupDraft = getGroupDraft(editingGroup);
          const parentOptions = skillGroups.filter((entry) => entry.id !== editingGroup.id);
          const groupSkillIds = new Set((editingGroup.skills || []).map((skill) => skill.id));
          const availableSkills = skills.filter((skill) => !groupSkillIds.has(skill.id));

          return (
            <div className="chat-settings-modal-form">
              <div className="chat-settings-field">
                <label htmlFor={`group-name-${editingGroup.id}`} className="chat-settings-label">Name</label>
                <input
                  id={`group-name-${editingGroup.id}`}
                  className="chat-settings-input"
                  value={groupDraft.name}
                  onChange={(event) =>
                    updateGroupDraft(editingGroup.id, { name: event.target.value })
                  }
                />
              </div>
              <div className="chat-settings-field">
                <label htmlFor={`group-parent-${editingGroup.id}`} className="chat-settings-label">Parent group</label>
                <select
                  id={`group-parent-${editingGroup.id}`}
                  className="chat-settings-input"
                  value={groupDraft.parentSkillGroupId || ""}
                  onChange={(event) =>
                    updateGroupDraft(editingGroup.id, { parentSkillGroupId: event.target.value })
                  }
                >
                  <option value="">None</option>
                  {parentOptions.map((parentGroup) => (
                    <option key={`group-parent-option-${editingGroup.id}-${parentGroup.id}`} value={parentGroup.id}>
                      {parentGroup.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="chat-settings-actions">
                <button
                  type="button"
                  onClick={() => void handleUpdateGroup(editingGroup.id)}
                  disabled={savingGroupId === editingGroup.id}
                >
                  {savingGroupId === editingGroup.id ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="chat-settings-field">
                <label className="chat-settings-label">Skills in group</label>
                {(editingGroup.skills || []).length === 0 ? (
                  <p className="empty-hint">No skills in this group.</p>
                ) : (
                  <ul className="chat-card-list">
                    {editingGroup.skills.map((skill) => (
                      <li key={`${editingGroup.id}-${skill.id}`} className="chat-card">
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
                              setEditingGroupId("");
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
                            onClick={() => void handleRemoveSkillFromGroup(editingGroup.id, skill.id)}
                            aria-label="Remove from group"
                            title="Remove from group"
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
                  <label htmlFor={`group-add-skill-${editingGroup.id}`} className="chat-settings-label">
                    Add skill
                  </label>
                  <select
                    id={`group-add-skill-${editingGroup.id}`}
                    className="chat-settings-input"
                    value=""
                    onChange={(event) => {
                      const nextSkillId = String(event.target.value || "").trim();
                      if (!nextSkillId) {
                        return;
                      }
                      void handleAddSkillToGroup(editingGroup.id, nextSkillId);
                    }}
                  >
                    <option value="">Select skill to add</option>
                    {availableSkills.map((skill) => (
                      <option key={`group-skill-option-${editingGroup.id}-${skill.id}`} value={skill.id}>
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
    </div>
  );
}
