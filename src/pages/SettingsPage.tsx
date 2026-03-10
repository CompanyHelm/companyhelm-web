import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type { Company } from "../types/domain.ts";

interface SettingsPageProps {
  hasCompanies: boolean;
  selectedCompany: Company | null;
  companyError: string;
  newCompanyName: string;
  isCreatingCompany: boolean;
  isDeletingCompany: boolean;
  onNewCompanyNameChange: (name: string) => void;
  onCreateCompany: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onDeleteCompany: () => void;
}

export function SettingsPage({
  hasCompanies,
  selectedCompany,
  companyError,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
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
