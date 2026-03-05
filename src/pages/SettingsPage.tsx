import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import { formatTimestamp } from "../utils/formatting.ts";
import type {
  Company,
  GithubInstallCallback,
  GithubInstallation,
} from "../types/domain.ts";

interface SettingsPageProps {
  hasCompanies: boolean;
  selectedCompanyId: string;
  selectedCompany: Company | null;
  companyError: string;
  newCompanyName: string;
  isCreatingCompany: boolean;
  isDeletingCompany: boolean;
  onNewCompanyNameChange: (name: string) => void;
  onCreateCompany: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onDeleteCompany: () => void;
  githubAppInstallUrl: string;
  isLoadingGithubAppConfig: boolean;
  githubAppConfigError: string;
  githubInstallations: GithubInstallation[];
  isLoadingGithubInstallations: boolean;
  githubInstallationError: string;
  githubInstallationNotice: string;
  isAddingGithubInstallationFromCallback: boolean;
  pendingGithubInstallCallback: GithubInstallCallback | null;
  deletingGithubInstallationId: string;
  onDeleteGithubInstallation: (installationId: string) => void;
}

export function SettingsPage({
  hasCompanies,
  selectedCompanyId,
  selectedCompany,
  companyError,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
  githubAppInstallUrl,
  isLoadingGithubAppConfig,
  githubAppConfigError,
  githubInstallations,
  isLoadingGithubInstallations,
  githubInstallationError,
  githubInstallationNotice,
  isAddingGithubInstallationFromCallback,
  pendingGithubInstallCallback,
  deletingGithubInstallationId,
  onDeleteGithubInstallation,
}: SettingsPageProps) {
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

  async function handleCreateCompanySubmit(event: FormEvent<HTMLFormElement>) {
    const didCreate = await onCreateCompany(event);
    if (didCreate) {
      setIsCreateCompanyModalOpen(false);
    }
  }

  const pageActions = useMemo(() => (
    <>
      <button
        type="button"
        className="chat-minimal-header-icon-btn"
        aria-label="Create company"
        title="Create company"
        onClick={() => setIsCreateCompanyModalOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  ), []);
  useSetPageActions(pageActions);

  return (
    <Page><div className="page-stack">
      <CreationModal
        modalId="create-company"
        title="Create company"
        description={hasCompanies ? undefined : "Create your first company to get started."}
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
      >
        <form className="chat-settings-form" onSubmit={handleCreateCompanySubmit}>
          <div className="chat-settings-field">
            <label className="chat-settings-label" htmlFor="settings-company-name">
              {hasCompanies ? "Company name" : "Create your first company"}
            </label>
            <input
              className="chat-settings-input"
              id="settings-company-name"
              value={newCompanyName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onNewCompanyNameChange(event.target.value)}
              placeholder="e.g. Acme Labs"
              disabled={isCreatingCompany}
            />
          </div>
          <button type="submit" disabled={isCreatingCompany}>
            {isCreatingCompany ? "Creating..." : "Create company"}
          </button>
        </form>
      </CreationModal>

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
            <ul className="chat-card-list">
              {githubInstallations.map((installation) => {
                const isBusy = deletingGithubInstallationId === installation.installationId;
                return (
                  <li key={`github-installation-${installation.installationId}`} className="chat-card">
                    <div className="chat-card-content">
                      <strong>{installation.accountLogin || `Installation ${installation.installationId}`}</strong>
                      <span className="chat-card-meta">
                        ID: {installation.installationId} &middot; Linked {formatTimestamp(installation.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="chat-card-icon-btn chat-card-icon-btn-danger"
                      aria-label="Delete installation"
                      title={deletingGithubInstallationId === installation.installationId ? "Deleting..." : "Delete installation"}
                      disabled={isBusy}
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
    </div></Page>
  );
}
