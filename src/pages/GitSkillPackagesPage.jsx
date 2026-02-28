import { useMemo, useState } from "react";

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

  const combinedReferences = useMemo(() => splitGitReferences(preview), [preview]);

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
      <div className="page-stack">
        <section className="panel hero-panel">
          <p className="eyebrow">Git Skill Package</p>
          <h1>{activeGitSkillPackage.packageName}</h1>
          <p className="subcopy">Repository: {activeGitSkillPackage.gitRepositoryUrl}</p>
          <p className="context-pill">Company: {selectedCompanyId}</p>
        </section>

        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Package details</h2>
            <div className="task-meta">
              <button type="button" className="secondary-btn" onClick={onBackToGitSkillPackages}>
                Back to packages
              </button>
            </div>
          </header>

          {skillError ? <p className="error-banner">{skillError}</p> : null}

          <p className="agent-subcopy">
            Hosting provider: <strong>{activeGitSkillPackage.hostingProvider}</strong>
          </p>
          <p className="agent-subcopy">
            Current ref: <strong>{activeGitSkillPackage.currentReference}</strong>
          </p>
          <p className="agent-subcopy">
            Commit: <code>{activeGitSkillPackage.currentCommitHash}</code>
          </p>

          <div className="task-card-actions">
            <button
              type="button"
              className="danger-btn"
              onClick={() =>
                onDeleteGitSkillPackage(activeGitSkillPackage.id, activeGitSkillPackage.packageName)
              }
            >
              Delete package
            </button>
          </div>

          <section className="subpanel">
            <h3>Skills in package</h3>
            {Array.isArray(activeGitSkillPackage.skills) && activeGitSkillPackage.skills.length > 0 ? (
              <ul className="task-list">
                {activeGitSkillPackage.skills.map((skill) => (
                  <li key={`package-skill-${skill.id}`} className="task-card">
                    <button type="button" className="secondary-btn" onClick={() => onOpenSkill(skill.id)}>
                      {skill.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-hint">No skills found in this package.</p>
            )}
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Git Skill Packages</p>
        <h1>Git skill packages</h1>
        <p className="subcopy">
          Import skills from a public HTTPS repository by previewing refs and selecting a branch or tag.
        </p>
        <p className="context-pill">Company: {selectedCompanyId}</p>
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Import package</h2>
        </header>

        {skillError || previewError ? <p className="error-banner">{skillError || previewError}</p> : null}
        {createWarnings.length > 0 ? (
          <div className="panel">
            <h3>Import warnings</h3>
            <ul>
              {createWarnings.map((warning, index) => (
                <li key={`import-warning-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form className="task-form" onSubmit={handlePreview}>
          <label htmlFor="git-skill-package-url">Git repository URL</label>
          <input
            id="git-skill-package-url"
            value={gitRepositoryUrl}
            onChange={(event) => setGitRepositoryUrl(event.target.value)}
            placeholder="https://github.com/obra/superpowers"
            required
          />
          <button type="submit" disabled={isPreviewing}>
            {isPreviewing ? "Previewing..." : "Preview refs"}
          </button>
        </form>

        {preview ? (
          <form className="task-form" onSubmit={handleCreate}>
            <label htmlFor="git-skill-reference">Branch or tag</label>
            <select
              id="git-skill-reference"
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

            <p className="agent-subcopy">
              Package name: <strong>{preview.packageName}</strong>
            </p>

            <button type="submit" disabled={isCreating || !selectedReference}>
              {isCreating ? "Adding package..." : "Add skill package"}
            </button>
          </form>
        ) : null}
      </section>

      <section className="panel list-panel">
        <header className="panel-header panel-header-row">
          <h2>Packages</h2>
          <div className="task-meta">
            <span>{gitSkillPackages.length} packages</span>
          </div>
        </header>

        {isLoadingGitSkillPackages ? <p className="empty-hint">Loading git skill packages...</p> : null}

        {gitSkillPackages.length === 0 ? (
          <p className="empty-hint">No git skill packages imported yet.</p>
        ) : (
          <ul className="task-list">
            {gitSkillPackages.map((gitSkillPackage) => (
              <li key={gitSkillPackage.id} className="task-card">
                <div className="task-card-top">
                  <strong>{gitSkillPackage.packageName}</strong>
                  <code className="runner-id">{gitSkillPackage.id}</code>
                </div>
                <p className="agent-subcopy">{gitSkillPackage.gitRepositoryUrl}</p>
                <p className="agent-subcopy">
                  Ref: <strong>{gitSkillPackage.currentReference}</strong>
                </p>
                <p className="agent-subcopy">
                  Skills: <strong>{gitSkillPackage.skills?.length || 0}</strong>
                </p>
                <div className="task-card-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() =>
                      onDeleteGitSkillPackage(gitSkillPackage.id, gitSkillPackage.packageName)
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
