import { formatTimestamp } from "../utils/formatting.js";

export function SettingsPage({
  hasCompanies,
  selectedCompanyId,
  selectedCompany,
  companyError,
  githubAppInstallUrl,
  isLoadingGithubAppConfig,
  githubAppConfigError,
  githubInstallations,
  githubRepositories,
  isLoadingGithubInstallations,
  isLoadingGithubRepositories,
  githubInstallationError,
  githubInstallationNotice,
  isAddingGithubInstallationFromCallback,
  pendingGithubInstallCallback,
  deletingGithubInstallationId,
  refreshingGithubInstallationId,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
  onDeleteGithubInstallation,
  onRefreshGithubInstallationRepositories,
}) {
  const repositoriesByInstallationId = githubRepositories.reduce((grouped, repository) => {
    const installationId = String(repository.githubInstallationId || "").trim();
    if (!installationId) {
      return grouped;
    }
    if (!grouped[installationId]) {
      grouped[installationId] = [];
    }
    grouped[installationId].push(repository);
    return grouped;
  }, {});

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Settings</p>
        <h1>Company settings</h1>
        <p className="subcopy">
          Create new companies and manage deletion from a dedicated settings page.
        </p>
        <p className="context-pill">
          Active company: {selectedCompany ? selectedCompany.name : "none"}
        </p>
      </section>

      <section className="panel composer-panel">
        <header className="panel-header">
          <h2>Create company</h2>
        </header>
        <form className="task-form" onSubmit={onCreateCompany}>
          <label htmlFor="settings-company-name">
            {hasCompanies ? "Company name" : "Create your first company"}
          </label>
          <input
            id="settings-company-name"
            value={newCompanyName}
            onChange={(event) => onNewCompanyNameChange(event.target.value)}
            placeholder="e.g. Acme Labs"
            disabled={isCreatingCompany}
          />
          <button type="submit" disabled={isCreatingCompany}>
            {isCreatingCompany ? "Creating..." : "Create company"}
          </button>
        </form>
      </section>

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>GitHub installations</h2>
          </header>
          <p className="subcopy">
            Link this company to one or more GitHub App installations.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => window.location.assign(githubAppInstallUrl)}
              disabled={!selectedCompanyId || isLoadingGithubAppConfig}
            >
              {isLoadingGithubAppConfig ? "Loading GitHub App..." : "Install CompanyHelm GitHub App"}
            </button>
          </div>
          {pendingGithubInstallCallback && !selectedCompanyId ? (
            <p className="error-banner">
              Select a company to finish linking installation{" "}
              <code>{pendingGithubInstallCallback.installationId || "unknown"}</code>.
            </p>
          ) : null}
          {githubAppConfigError ? (
            <p className="error-banner">GitHub App config error: {githubAppConfigError}</p>
          ) : null}
          {isAddingGithubInstallationFromCallback ? (
            <p className="empty-hint">Linking GitHub installation...</p>
          ) : null}
          {githubInstallationNotice ? (
            <p className="success-banner">{githubInstallationNotice}</p>
          ) : null}
          {githubInstallationError ? (
            <p className="error-banner">GitHub installation error: {githubInstallationError}</p>
          ) : null}
          {isLoadingGithubInstallations ? (
            <p className="empty-hint">Loading GitHub installations...</p>
          ) : null}
          {!isLoadingGithubInstallations && githubInstallations.length === 0 ? (
            <p className="empty-hint">No GitHub installations linked to this company yet.</p>
          ) : null}
          {githubInstallations.length > 0 ? (
            <ul className="task-list">
              {githubInstallations.map((installation) => (
                <li key={`github-installation-${installation.installationId}`} className="task-card">
                  <div className="task-card-top">
                    <strong>Installation {installation.installationId}</strong>
                    <code className="runner-id">{installation.installationId}</code>
                  </div>
                  <p className="agent-subcopy">
                    Linked at: <strong>{formatTimestamp(installation.createdAt)}</strong>
                  </p>
                  <div className="task-card-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() =>
                        onRefreshGithubInstallationRepositories(installation.installationId)
                      }
                      disabled={
                        refreshingGithubInstallationId === installation.installationId ||
                        deletingGithubInstallationId === installation.installationId
                      }
                    >
                      {refreshingGithubInstallationId === installation.installationId
                        ? "Refreshing repos..."
                        : "Refresh repos"}
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => onDeleteGithubInstallation(installation.installationId)}
                      disabled={
                        deletingGithubInstallationId === installation.installationId ||
                        refreshingGithubInstallationId === installation.installationId
                      }
                    >
                      {deletingGithubInstallationId === installation.installationId
                        ? "Deleting..."
                        : "Delete installation"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>Repos</h2>
          </header>
          <p className="subcopy">Repositories linked through this company's GitHub installations.</p>
          {isLoadingGithubRepositories ? (
            <p className="empty-hint">Loading repositories...</p>
          ) : null}
          {!isLoadingGithubRepositories && githubRepositories.length === 0 ? (
            <p className="empty-hint">No repositories imported yet. Refresh an installation above.</p>
          ) : null}
          {githubInstallations.length > 0 ? (
            <ul className="task-list">
              {githubInstallations.map((installation) => {
                const installationRepositories =
                  repositoriesByInstallationId[installation.installationId] || [];
                return (
                  <li
                    key={`repo-installation-${installation.installationId}`}
                    className="task-card"
                  >
                    <div className="task-card-top">
                      <strong>Installation {installation.installationId}</strong>
                      <span>{installationRepositories.length} repos</span>
                    </div>
                    {installationRepositories.length === 0 ? (
                      <p className="empty-hint">No repos cached for this installation.</p>
                    ) : (
                      <ul className="repo-list">
                        {installationRepositories.map((repository) => (
                          <li key={repository.id} className="repo-list-item">
                            <a
                              href={repository.htmlUrl || undefined}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {repository.fullName}
                            </a>
                            <code>{repository.defaultBranch || "no-default-branch"}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {hasCompanies ? (
        <section className="panel">
          <header className="panel-header">
            <h2>Danger zone</h2>
          </header>
          <p className="subcopy">
            Delete the currently selected company and all of its tasks, skills, MCP servers,
            agents, and runners.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="danger-btn"
              onClick={onDeleteCompany}
              disabled={!selectedCompany || isDeletingCompany}
            >
              {isDeletingCompany ? "Deleting..." : "Delete active company"}
            </button>
          </div>
        </section>
      ) : null}

      {companyError ? <p className="error-banner">Company error: {companyError}</p> : null}
    </div>
  );
}
