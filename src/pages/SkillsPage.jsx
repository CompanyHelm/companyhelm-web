import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setSavingGroupId("");
    }
  }

  if (activeSkill) {
    const gitSkillPackage = activeSkill.gitSkillPackage || null;

    return (
      <div className="page-stack">
        <section className="panel hero-panel">
          <p className="eyebrow">Skill</p>
          <h1>{activeSkill.name}</h1>
          <p className="subcopy">{activeSkill.description || "No description provided."}</p>
          <p className="context-pill">Company: {selectedCompanyId}</p>
        </section>

        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Skill details</h2>
            <div className="task-meta">
              <button type="button" className="secondary-btn" onClick={onBackToSkills}>
                Back to skills
              </button>
            </div>
          </header>

          {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}

          <p className="agent-subcopy">
            Groups: <strong>{(activeSkill.groups || []).map((group) => group.name).join(", ") || "none"}</strong>
          </p>
          <p className="agent-subcopy">
            Files: <strong>{activeSkill.fileList?.length || 0}</strong>
          </p>

          {gitSkillPackage ? (
            <section className="subpanel">
              <h3>Git skill package</h3>
              <p className="agent-subcopy">
                Package: <strong>{gitSkillPackage.packageName}</strong>
              </p>
              <p className="agent-subcopy">
                Skill path: <strong>{activeSkill.gitSkillPackagePath || "-"}</strong>
              </p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
              >
                Open package
              </button>
            </section>
          ) : null}

          <section className="subpanel">
            <h3>Content</h3>
            <div className="task-card-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowRawMarkdown((current) => !current)}
              >
                {showRawMarkdown ? "Show rendered" : "Show raw"}
              </button>
            </div>
            {showRawMarkdown ? (
              <pre className="agent-install-logs">{activeSkill.content || ""}</pre>
            ) : (
              <div className="chat-message-content chat-message-content-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSkill.content || ""}</ReactMarkdown>
              </div>
            )}
          </section>

          <section className="subpanel">
            <h3>File list</h3>
            {Array.isArray(activeSkill.fileList) && activeSkill.fileList.length > 0 ? (
              <ul className="task-list">
                {activeSkill.fileList.map((filePath) => (
                  <li key={filePath} className="task-card">
                    <code>{filePath}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-hint">No files found.</p>
            )}
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Skill Library</p>
        <h1>Skills</h1>
        <p className="subcopy">Browse skills grouped by skill groups and manage group memberships.</p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Skill groups</h2>
          <div className="task-meta">
            <span>{skillGroups.length} groups</span>
          </div>
        </header>

        {skillError || localError ? <p className="error-banner">{skillError || localError}</p> : null}
        {isLoadingSkills || isLoadingSkillGroups ? <p className="empty-hint">Loading skills...</p> : null}

        <form className="task-form" onSubmit={handleCreateGroup}>
          <label htmlFor="new-skill-group-name">New group name</label>
          <input
            id="new-skill-group-name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="e.g. obra/superpowers"
            required
          />

          <label htmlFor="new-skill-group-parent">Parent group (optional)</label>
          <select
            id="new-skill-group-parent"
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

          <button type="submit" disabled={isCreatingGroup}>
            {isCreatingGroup ? "Creating..." : "Create group"}
          </button>
        </form>

        {skillGroups.length === 0 ? <p className="empty-hint">No skill groups yet.</p> : null}

        {skillGroups.map((group) => {
          const groupDraft = getGroupDraft(group);
          const parentOptions = skillGroups.filter((entry) => entry.id !== group.id);
          const groupSkillIds = new Set((group.skills || []).map((skill) => skill.id));
          const availableSkills = skills.filter((skill) => !groupSkillIds.has(skill.id));

          return (
            <article key={group.id} className="task-card">
              <div className="task-card-top">
                <strong>{group.name}</strong>
                <div className="task-card-actions">
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => onDeleteSkillGroup(group.id, group.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="agent-subcopy">
                Parent: <strong>{group.parentSkillGroup?.name || "none"}</strong>
              </p>

              <label htmlFor={`group-name-${group.id}`}>Group name</label>
              <input
                id={`group-name-${group.id}`}
                value={groupDraft.name}
                onChange={(event) =>
                  updateGroupDraft(group.id, {
                    name: event.target.value,
                  })}
              />

              <label htmlFor={`group-parent-${group.id}`}>Parent group</label>
              <select
                id={`group-parent-${group.id}`}
                value={groupDraft.parentSkillGroupId || ""}
                onChange={(event) =>
                  updateGroupDraft(group.id, {
                    parentSkillGroupId: event.target.value,
                  })}
              >
                <option value="">None</option>
                {parentOptions.map((parentGroup) => (
                  <option key={`group-parent-option-${group.id}-${parentGroup.id}`} value={parentGroup.id}>
                    {parentGroup.name}
                  </option>
                ))}
              </select>
              <div className="task-card-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => void handleUpdateGroup(group.id)}
                  disabled={savingGroupId === group.id}
                >
                  {savingGroupId === group.id ? "Saving..." : "Save group"}
                </button>
              </div>

              <label htmlFor={`group-add-skill-${group.id}`}>Add skill to group</label>
              <select
                id={`group-add-skill-${group.id}`}
                value=""
                onChange={(event) => {
                  const nextSkillId = String(event.target.value || "").trim();
                  if (!nextSkillId) {
                    return;
                  }
                  void handleAddSkillToGroup(group.id, nextSkillId);
                }}
                disabled={availableSkills.length === 0}
              >
                <option value="">
                  {availableSkills.length === 0 ? "All skills assigned" : "Select skill"}
                </option>
                {availableSkills.map((skill) => (
                  <option key={`group-skill-option-${group.id}-${skill.id}`} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>

              {(group.skills || []).length === 0 ? (
                <p className="empty-hint">No skills in this group.</p>
              ) : (
                <ul className="task-list">
                  {group.skills.map((skill) => (
                    <li key={`${group.id}-${skill.id}`} className="task-card">
                      <div className="task-card-top">
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => onOpenSkill(skill.id)}
                        >
                          {skill.name}
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => void handleRemoveSkillFromGroup(group.id, skill.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}

        <section className="subpanel">
          <h3>Ungrouped skills</h3>
          {ungroupedSkills.length === 0 ? (
            <p className="empty-hint">All skills are assigned to at least one group.</p>
          ) : (
            <ul className="task-list">
              {ungroupedSkills.map((skill) => (
                <li key={`ungrouped-skill-${skill.id}`} className="task-card">
                  <button type="button" className="secondary-btn" onClick={() => onOpenSkill(skill.id)}>
                    {skill.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}
