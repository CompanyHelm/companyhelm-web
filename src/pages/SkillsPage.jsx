import { useState } from "react";
import { CreationModal } from "../components/CreationModal.jsx";
import { SKILL_TYPE_TEXT, SKILL_TYPE_SKILLSMP, SKILL_TYPE_OPTIONS } from "../utils/constants.js";
import { normalizeSkillType } from "../utils/normalization.js";

export function SkillsPage({
  selectedCompanyId,
  skills,
  isLoadingSkills,
  skillError,
  isCreatingSkill,
  savingSkillId,
  deletingSkillId,
  skillName,
  skillType,
  skillSkillsMpPackageName,
  skillDescription,
  skillInstructions,
  skillDrafts,
  skillCountLabel,
  onSkillNameChange,
  onSkillTypeChange,
  onSkillSkillsMpPackageNameChange,
  onSkillDescriptionChange,
  onSkillInstructionsChange,
  onCreateSkill,
  onSkillDraftChange,
  onSaveSkill,
  onDeleteSkill,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function handleCreateSkillSubmit(event) {
    const didCreate = await onCreateSkill(event);
    if (didCreate) {
      setIsCreateModalOpen(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Skill Library</p>
        <h1>Skills page</h1>
        <p className="subcopy">
          Capture reusable skills with clear descriptions and detailed instructions.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Skills</h2>
          <div className="task-meta">
            <span>{skillCountLabel}</span>
            <button
              type="button"
              className="icon-create-btn"
              aria-label="Create skill"
              title="Create skill"
              onClick={() => setIsCreateModalOpen(true)}
            >
              +
            </button>
          </div>
        </header>

        {skillError ? <p className="error-banner">{skillError}</p> : null}
        {isLoadingSkills ? <p className="empty-hint">Loading skills...</p> : null}
        {!isLoadingSkills && skills.length === 0 ? (
          <div className="empty-state">
            <p className="empty-hint">No skills created for this company yet.</p>
            <button
              type="button"
              className="secondary-btn empty-create-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create skill
            </button>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <ul className="task-list">
            {skills.map((skill) => {
              const draft = skillDrafts[skill.id] || {
                name: "",
                skillType: SKILL_TYPE_TEXT,
                skillsMpPackageName: "",
                description: "",
                instructions: "",
              };
              const resolvedSkillType = normalizeSkillType(draft.skillType);
              const isSavingOrDeleting =
                savingSkillId === skill.id || deletingSkillId === skill.id;
              return (
                <li key={skill.id} className="task-card">
                  <div className="task-card-top">
                    <strong>{skill.name}</strong>
                    <code className="runner-id">{skill.id}</code>
                  </div>
                  <p className="agent-subcopy">
                    Type: <strong>{resolvedSkillType === SKILL_TYPE_SKILLSMP ? "SkillsMP" : "Text"}</strong>
                  </p>
                  {resolvedSkillType === SKILL_TYPE_SKILLSMP ? (
                    <p className="agent-subcopy">
                      Package: <strong>{draft.skillsMpPackageName || "-"}</strong>
                    </p>
                  ) : (
                    <p className="agent-subcopy">{draft.description}</p>
                  )}
                  <div className="relationship-editor">
                    <div className="skill-edit-grid">
                      <label className="relationship-field" htmlFor={`skill-name-${skill.id}`}>
                        Name
                      </label>
                      <input
                        id={`skill-name-${skill.id}`}
                        value={draft.name}
                        onChange={(event) =>
                          onSkillDraftChange(skill.id, "name", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      />

                      <label className="relationship-field" htmlFor={`skill-type-${skill.id}`}>
                        Type
                      </label>
                      <select
                        id={`skill-type-${skill.id}`}
                        value={resolvedSkillType}
                        onChange={(event) =>
                          onSkillDraftChange(skill.id, "skillType", event.target.value)
                        }
                        disabled={isSavingOrDeleting}
                      >
                        {SKILL_TYPE_OPTIONS.map((option) => (
                          <option key={`${skill.id}-skill-type-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {resolvedSkillType === SKILL_TYPE_SKILLSMP ? (
                        <>
                          <label
                            className="relationship-field"
                            htmlFor={`skill-package-${skill.id}`}
                          >
                            SkillsMP package
                          </label>
                          <input
                            id={`skill-package-${skill.id}`}
                            value={draft.skillsMpPackageName}
                            onChange={(event) =>
                              onSkillDraftChange(
                                skill.id,
                                "skillsMpPackageName",
                                event.target.value,
                              )
                            }
                            placeholder="upstash/context7 or npx skills add upstash/context7"
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      ) : (
                        <>
                          <label
                            className="relationship-field"
                            htmlFor={`skill-description-${skill.id}`}
                          >
                            Description
                          </label>
                          <textarea
                            id={`skill-description-${skill.id}`}
                            rows={2}
                            value={draft.description}
                            onChange={(event) =>
                              onSkillDraftChange(skill.id, "description", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />

                          <label
                            className="relationship-field"
                            htmlFor={`skill-instructions-${skill.id}`}
                          >
                            Instructions
                          </label>
                          <textarea
                            id={`skill-instructions-${skill.id}`}
                            rows={4}
                            value={draft.instructions}
                            onChange={(event) =>
                              onSkillDraftChange(skill.id, "instructions", event.target.value)
                            }
                            disabled={isSavingOrDeleting}
                          />
                        </>
                      )}
                    </div>
                    <div className="task-card-actions">
                      <button
                        type="button"
                        className="secondary-btn relationship-save-btn"
                        onClick={() => onSaveSkill(skill.id)}
                        disabled={isSavingOrDeleting}
                      >
                        {savingSkillId === skill.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => onDeleteSkill(skill.id, skill.name)}
                        disabled={isSavingOrDeleting}
                      >
                        {deletingSkillId === skill.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <CreationModal
        modalId="create-skill-modal"
        title="Create skill"
        description="Add a reusable skill for the active company."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <form className="task-form" onSubmit={handleCreateSkillSubmit}>
          <label htmlFor="skill-name">Name</label>
          <input
            id="skill-name"
            name="name"
            placeholder="e.g. Sprint Planning"
            value={skillName}
            onChange={(event) => onSkillNameChange(event.target.value)}
            required
            autoFocus
          />

          <label htmlFor="skill-type">Type</label>
          <select
            id="skill-type"
            name="skillType"
            value={skillType}
            onChange={(event) => onSkillTypeChange(event.target.value)}
          >
            {SKILL_TYPE_OPTIONS.map((option) => (
              <option key={`create-skill-type-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {normalizeSkillType(skillType) === SKILL_TYPE_SKILLSMP ? (
            <>
              <label htmlFor="skill-package-name">SkillsMP package</label>
              <input
                id="skill-package-name"
                name="skillsMpPackageName"
                placeholder="upstash/context7 or npx skills add upstash/context7"
                value={skillSkillsMpPackageName}
                onChange={(event) => onSkillSkillsMpPackageNameChange(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="skill-description">Description</label>
              <textarea
                id="skill-description"
                name="description"
                rows={2}
                placeholder="One sentence summary..."
                value={skillDescription}
                onChange={(event) => onSkillDescriptionChange(event.target.value)}
                required
              />

              <label htmlFor="skill-instructions">Instructions</label>
              <textarea
                id="skill-instructions"
                name="instructions"
                rows={5}
                placeholder="Detailed instructions..."
                value={skillInstructions}
                onChange={(event) => onSkillInstructionsChange(event.target.value)}
                required
              />
            </>
          )}

          <button type="submit" disabled={isCreatingSkill}>
            {isCreatingSkill ? "Creating..." : "Create skill"}
          </button>
        </form>
      </CreationModal>
    </div>
  );
}
