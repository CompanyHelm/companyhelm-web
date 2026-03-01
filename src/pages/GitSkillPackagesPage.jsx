import { useMemo, useState } from "react";
import { Page } from "../components/Page.jsx";
import { CreationModal } from "../components/CreationModal.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";

function splitGitReferences(preview) {
  if (!preview) {
    return [];
  }
  return [
    ...(Array.isArray(preview.branches) ? preview.branches : []),
    ...(Array.isArray(preview.tags) ? preview.tags : []),
  ];
}

export function GitSkillPackagesPage({
  selectedCompanyId,
  gitSkillPackages,
  activeGitSkillPackage,
  isLoadingGitSkillPackages,
  skillError,
  onOpenGitSkillPackage,
  onBackToGitSkillPackages,
  onPreviewGitSkillPackage,
  onCreateGitSkillPackage,
  onDeleteGitSkillPackage,
  onOpenSkill,
}) {
  const [gitRepositoryUrl, setGitRepositoryUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedReference, setSelectedReference] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [createWarnings, setCreateWarnings] = useState([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const combinedReferences = useMemo(() => splitGitReferences(preview), [preview]);

  const pageActions = useMemo(() => (
    <>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Add package"
        title="Add package"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), []);
  useSetPageActions(pageActions);

  async function handlePreview(event) {
    event.preventDefault();
    try {
      setIsPreviewing(true);
      setPreviewError("");
      setCreateWarnings([]);
      const payload = await onPreviewGitSkillPackage(gitRepositoryUrl);
      setPreview(payload);
      setSelectedReference("");
    } catch (error) {
      setPreview(null);
      setSelectedReference("");
      setPreviewError(error.message);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    try {
      setIsCreating(true);
      setPreviewError("");
      const payload = await onCreateGitSkillPackage({
        gitRepositoryUrl,
        gitReference: selectedReference,
      });
      setCreateWarnings(Array.isArray(payload?.warnings) ? payload.warnings : []);
      if (payload?.packageId) {
        onOpenGitSkillPackage(payload.packageId);
      }
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setIsCreating(false);
    }
  }

  if (activeGitSkillPackage) {
    return (
      <Page><div className="page-stack">
        <section className="panel list-panel">
          {skillError ? <p className="error-banner">{skillError}</p> : null}

          <p className="chat-card-meta" style={{ padding: "0.2rem 0" }}>
            {activeGitSkillPackage.gitRepositoryUrl}
          </p>

          <div className="skill-detail-info">
            <p className="chat-card-meta">
              Hosting provider: {activeGitSkillPackage.hostingProvider}
              {" · "}Ref: {activeGitSkillPackage.currentReference}
              {" · "}Commit: {activeGitSkillPackage.currentCommitHash}
            </p>
            <button
              type="button"
              className="chat-card-icon-btn chat-card-icon-btn-danger"
              onClick={() =>
                onDeleteGitSkillPackage(activeGitSkillPackage.id, activeGitSkillPackage.packageName)
              }
              aria-label="Delete package"
              title="Delete package"
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

          <section className="skill-detail-section">
            <h3>Skills in package</h3>
            {Array.isArray(activeGitSkillPackage.skills) && activeGitSkillPackage.skills.length > 0 ? (
              <ul className="chat-card-list">
                {activeGitSkillPackage.skills.map((skill) => (
                  <li
                    key={`package-skill-${skill.id}`}
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
            ) : (
              <p className="empty-hint">No skills found in this package.</p>
            )}
          </section>
        </section>
      </div></Page>
    );
  }

  return (
    <Page><div className="page-stack">
      {skillError || previewError ? <p className="error-banner">{skillError || previewError}</p> : null}
      {isLoadingGitSkillPackages ? <p className="empty-hint">Loading git skill packages...</p> : null}

      {gitSkillPackages.length === 0 ? (
        <section className="panel list-panel">
          <p className="empty-hint">No git skill packages imported yet.</p>
        </section>
      ) : (
        <section className="panel list-panel">
          <ul className="chat-card-list">
            {gitSkillPackages.map((gitSkillPackage) => (
              <li
                key={gitSkillPackage.id}
                className="chat-card"
                onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onOpenGitSkillPackage(gitSkillPackage.id);
                  }
                }}
              >
                <div className="chat-card-main">
                  <p className="chat-card-title">
                    <strong>{gitSkillPackage.packageName}</strong>
                  </p>
                  <p className="chat-card-meta">
                    {gitSkillPackage.gitRepositoryUrl} · {gitSkillPackage.currentReference}
                  </p>
                </div>
                <div className="chat-card-actions">
                  <button
                    type="button"
                    className="chat-card-icon-btn chat-card-icon-btn-danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteGitSkillPackage(gitSkillPackage.id, gitSkillPackage.packageName);
                    }}
                    aria-label="Delete package"
                    title="Delete package"
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
            ))}
          </ul>
        </section>
      )}

      <CreationModal
        modalId="create-git-skill-package-modal"
        title="Import git skill package"
        description="Import skills from a public HTTPS repository by previewing refs and selecting a branch or tag."
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        {createWarnings.length > 0 ? (
          <div className="chat-settings-modal-form">
            <div className="chat-settings-field">
              <label className="chat-settings-label">Import warnings</label>
              <ul>
                {createWarnings.map((warning, index) => (
                  <li key={`import-warning-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <form className="chat-settings-modal-form" onSubmit={handlePreview}>
          <div className="chat-settings-field">
            <label htmlFor="git-skill-package-url" className="chat-settings-label">Git repository URL</label>
            <input
              id="git-skill-package-url"
              className="chat-settings-input"
              value={gitRepositoryUrl}
              onChange={(event) => setGitRepositoryUrl(event.target.value)}
              placeholder="https://github.com/obra/superpowers"
              required
              autoFocus
            />
          </div>
          <div className="chat-settings-actions">
            <button type="submit" disabled={isPreviewing}>
              {isPreviewing ? "Previewing..." : "Preview refs"}
            </button>
          </div>
        </form>

        {preview ? (
          <form className="chat-settings-modal-form" onSubmit={handleCreate}>
            <div className="chat-settings-field">
              <label htmlFor="git-skill-reference" className="chat-settings-label">Branch or tag</label>
              <select
                id="git-skill-reference"
                className="chat-settings-input"
                value={selectedReference}
                onChange={(event) => setSelectedReference(event.target.value)}
                required
              >
                <option value="">Select branch or tag</option>
                {combinedReferences.map((reference) => (
                  <option key={`${reference.kind}:${reference.fullRef}`} value={reference.fullRef}>
                    {reference.name} ({reference.kind})
                  </option>
                ))}
              </select>
            </div>
            <p className="chat-card-meta" style={{ padding: "0.2rem 0" }}>
              Package name: <strong>{preview.packageName}</strong>
            </p>
            <div className="chat-settings-actions">
              <button type="submit" disabled={isCreating || !selectedReference}>
                {isCreating ? "Adding package..." : "Add skill package"}
              </button>
            </div>
          </form>
        ) : null}
      </CreationModal>
    </div></Page>
  );
}
