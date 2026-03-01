import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

export function SkillGroupsPage({
  skillGroups,
  skills,
  isLoadingSkillGroups,
  isLoadingSkills,
  skillError,
  onCreateSkillGroup,
  onUpdateSkillGroup,
  onDeleteSkillGroup,
  onAddSkillToGroup,
  onRemoveSkillFromGroup,
  onOpenSkill,
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupParentId, setNewGroupParentId] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [parentGroupIdDraft, setParentGroupIdDraft] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [localError, setLocalError] = useState("");

  const activeSkillGroup = useMemo(() => {
    const resolvedGroupId = String(editingGroupId || "").trim();
    if (!resolvedGroupId) {
      return null;
    }
    return skillGroups.find((group) => group.id === resolvedGroupId) || null;
  }, [editingGroupId, skillGroups]);

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

  const parentGroupOptions = useMemo(() => {
    if (!activeSkillGroup) {
      return [];
    }
    return skillGroups.filter((group) => group.id !== activeSkillGroup.id);
  }, [activeSkillGroup, skillGroups]);

  const activeGroupSkills = useMemo(() => {
    return activeSkillGroup?.skills || [];
  }, [activeSkillGroup]);

  const availableSkills = useMemo(() => {
    const activeSkillIds = new Set(activeGroupSkills.map((skill) => skill.id));
    return skills.filter((skill) => !activeSkillIds.has(skill.id));
  }, [activeGroupSkills, skills]);

  const pageActions = useMemo(() => (
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
  ), []);
  useSetPageActions(pageActions);

  function openSkillGroup(group) {
    setEditingGroupId(group.id);
    setNameDraft(group.name || "");
    setParentGroupIdDraft(group.parentSkillGroup?.id || "");
  }

  async function handleCreateSkillGroup(event) {
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

  async function handleSaveSkillGroup() {
    if (!activeSkillGroup) {
      return;
    }
    try {
      setIsSavingGroup(true);
      setLocalError("");
      await onUpdateSkillGroup({
        id: activeSkillGroup.id,
        name: nameDraft || activeSkillGroup.name,
        parentSkillGroupId: parentGroupIdDraft || null,
      });
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsSavingGroup(false);
    }
  }

  return (
    <Page><div className="page-stack">
      {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}
      {isLoadingSkillGroups || isLoadingSkills ? <p className="empty-hint">Loading skill groups...</p> : null}

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Skill groups</h2>
          <span className="chat-card-meta">{skillGroups.length} groups</span>
        </header>

        {skillGroups.length === 0 ? (
          <p className="empty-hint">No skill groups yet.</p>
        ) : (
          <ul className="chat-card-list">
            {skillGroups.map((group) => {
              const skillCount = (group.skills || []).length;
              const parentLabel = group.parentSkillGroup?.name || null;
              return (
                <li
                  key={group.id}
                  className="chat-card"
                  onClick={() => openSkillGroup(group)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      openSkillGroup(group);
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
                      aria-label="Delete skill group"
                      title="Delete skill group"
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
        )}
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Ungrouped skills</h2>
          <span className="chat-card-meta">{ungroupedSkills.length} skills</span>
        </header>
        {ungroupedSkills.length === 0 ? (
          <p className="empty-hint">All skills are assigned to at least one group.</p>
        ) : (
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
        )}
      </section>

      <CreationModal
        modalId="create-skill-group-modal"
        title="Create skill group"
        description="Create a skill group and optionally assign a parent group."
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      >
        <form className="chat-settings-modal-form" onSubmit={handleCreateSkillGroup}>
          <div className="chat-settings-field">
            <label htmlFor="new-skill-group-name" className="chat-settings-label">Skill group name</label>
            <input
              id="new-skill-group-name"
              className="chat-settings-input"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
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
                <option key={`new-parent-group-${group.id}`} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="chat-settings-actions">
            <button type="submit" disabled={isCreatingGroup}>
              {isCreatingGroup ? "Creating..." : "Create skill group"}
            </button>
          </div>
        </form>
      </CreationModal>

      <CreationModal
        modalId="edit-skill-group-modal"
        title={activeSkillGroup ? `Edit skill group "${activeSkillGroup.name}"` : "Edit skill group"}
        description="Update skill group settings and memberships."
        isOpen={Boolean(activeSkillGroup)}
        onClose={() => setEditingGroupId("")}
        cardClassName="modal-card-wide"
      >
        {activeSkillGroup ? (
          <div className="chat-settings-modal-form">
            <div className="chat-settings-field">
              <label htmlFor={`skill-group-name-${activeSkillGroup.id}`} className="chat-settings-label">
                Skill group name
              </label>
              <input
                id={`skill-group-name-${activeSkillGroup.id}`}
                className="chat-settings-input"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
              />
            </div>
            <div className="chat-settings-field">
              <label htmlFor={`skill-group-parent-${activeSkillGroup.id}`} className="chat-settings-label">
                Parent group
              </label>
              <select
                id={`skill-group-parent-${activeSkillGroup.id}`}
                className="chat-settings-input"
                value={parentGroupIdDraft}
                onChange={(event) => setParentGroupIdDraft(event.target.value)}
              >
                <option value="">None</option>
                {parentGroupOptions.map((group) => (
                  <option key={`parent-group-option-${activeSkillGroup.id}-${group.id}`} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="chat-settings-actions">
              <button type="button" onClick={() => void handleSaveSkillGroup()} disabled={isSavingGroup}>
                {isSavingGroup ? "Saving..." : "Save skill group"}
              </button>
            </div>

            <div className="chat-settings-field">
              <label className="chat-settings-label">Skills in group</label>
              {activeGroupSkills.length === 0 ? (
                <p className="empty-hint">No skills in this group.</p>
              ) : (
                <ul className="chat-card-list">
                  {activeGroupSkills.map((skill) => (
                    <li key={`group-skill-${activeSkillGroup.id}-${skill.id}`} className="chat-card">
                      <div className="chat-card-main">
                        <p className="chat-card-title">
                          <strong>{skill.name}</strong>
                        </p>
                      </div>
                      <div className="chat-card-actions">
                        <button
                          type="button"
                          className="chat-card-icon-btn"
                          onClick={() => onOpenSkill(skill.id)}
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
                          onClick={() => void onRemoveSkillFromGroup(activeSkillGroup.id, skill.id)}
                          aria-label="Remove from skill group"
                          title="Remove from skill group"
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

            <div className="chat-settings-field">
              <label htmlFor={`skill-group-add-skill-${activeSkillGroup.id}`} className="chat-settings-label">
                Add skill
              </label>
              <select
                id={`skill-group-add-skill-${activeSkillGroup.id}`}
                className="chat-settings-input"
                value=""
                onChange={(event) => {
                  const skillId = String(event.target.value || "").trim();
                  if (!skillId) {
                    return;
                  }
                  void onAddSkillToGroup(activeSkillGroup.id, skillId);
                }}
                disabled={availableSkills.length === 0}
              >
                <option value="">
                  {availableSkills.length === 0 ? "All skills already assigned" : "Select skill"}
                </option>
                {availableSkills.map((skill) => (
                  <option key={`group-skill-option-${activeSkillGroup.id}-${skill.id}`} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </CreationModal>
    </div></Page>
  );
}
