import { useMemo } from "react";
import { Page } from "../components/Page.jsx";
import { useSetPageActions } from "../components/PageActionsContext.jsx";
import { formatTimestamp } from "../utils/formatting.js";

export function ReposPage({
  selectedCompanyId,
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

  const pageActions = useMemo(() => (
    <>
      <button
        type="button"
        className="secondary-btn"
        onClick={() => window.location.assign(githubAppInstallUrl)}
        disabled={!selectedCompanyId || isLoadingGithubAppConfig}
      >
        {isLoadingGithubAppConfig ? "Loading..." : "Install GitHub App"}
      </button>
    </>
  ), [githubAppInstallUrl, selectedCompanyId, isLoadingGithubAppConfig]);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <h2>GitHub installations</h2>
        </header>
        <p className="subcopy">
          Link this company to one or more GitHub App installations.
        </p>
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
          <ul className="chat-card-list">
            {githubInstallations.map((installation) => {
              const isBusy =
                refreshingGithubInstallationId === installation.installationId ||
                deletingGithubInstallationId === installation.installationId;
              return (
                <li key={`github-installation-${installation.installationId}`} className="chat-card">
                  <div className="chat-card-content">
                    <strong>{installation.accountLogin || `Installation ${installation.installationId}`}</strong>
                    <span className="chat-card-meta">
                      ID: {installation.installationId} &middot; Linked {formatTimestamp(installation.createdAt)}
                    </span>
                  </div>
                  <div className="chat-card-actions">
                    <button
                      type="button"
                      className="chat-card-icon-btn"
                      aria-label="Sync repos"
                      title={refreshingGithubInstallationId === installation.installationId ? "Syncing..." : "Sync repos from GitHub"}
                      disabled={isBusy}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRefreshGithubInstallationRepositories(installation.installationId);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      aria-label="Delete installation"
                      title={deletingGithubInstallationId === installation.installationId ? "Deleting..." : "Delete installation"}
                      disabled={isBusy}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteGithubInstallation(installation.installationId);
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2>Repositories</h2>
        </header>
        <p className="subcopy">Repositories linked through this company's GitHub installations.</p>
        {isLoadingGithubRepositories ? (
          <p className="empty-hint">Loading repositories...</p>
        ) : null}
        {!isLoadingGithubRepositories && githubRepositories.length === 0 ? (
          <p className="empty-hint">No repositories imported yet. Sync an installation above.</p>
        ) : null}
        {githubInstallations.length > 0 ? (
          <ul className="chat-card-list">
            {githubInstallations.map((installation) => {
              const installationRepositories =
                repositoriesByInstallationId[installation.installationId] || [];
              return (
                <li
                  key={`repo-installation-${installation.installationId}`}
                  className="chat-card"
                >
                  <div className="chat-card-content">
                    <strong>{installation.accountLogin || `Installation ${installation.installationId}`}</strong>
                    <span className="chat-card-meta">{installationRepositories.length} repos</span>
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
    </div></Page>
  );
}
