import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type { Company } from "../types/domain.ts";

type SettingsTabId = "general" | "companies";

export type SettingsExportSectionId =
  | "companyProfile"
  | "agents"
  | "skills"
  | "skillGroups"
  | "roles"
  | "mcpServers"
  | "repositories"
  | "approvals"
  | "agentRunners"
  | "tasks"
  | "threads"
  | "threadData";

export const SETTINGS_EXPORT_SECTIONS: Array<{
  id: SettingsExportSectionId;
  label: string;
  description: string;
}> = [
  {
    id: "companyProfile",
    label: "Company profile",
    description: "Company display information only.",
  },
  {
    id: "agents",
    label: "Agents",
    description: "Agent definitions, models, and custom instructions.",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skill definitions and authored content.",
  },
  {
    id: "skillGroups",
    label: "Skill groups",
    description: "Skill group structure and membership.",
  },
  {
    id: "roles",
    label: "Roles",
    description: "Role definitions and linked capabilities.",
  },
  {
    id: "mcpServers",
    label: "MCP servers",
    description: "Sanitized MCP server configuration.",
  },
  {
    id: "repositories",
    label: "Repositories",
    description: "Connected repository metadata.",
  },
  {
    id: "approvals",
    label: "Approvals",
    description: "Approval history without secrets.",
  },
  {
    id: "agentRunners",
    label: "Agent runners",
    description: "Runner definitions and status.",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task structure and dependencies.",
  },
  {
    id: "threads",
    label: "Threads",
    description: "Thread metadata and model settings.",
  },
  {
    id: "threadData",
    label: "Thread data",
    description: "Turns, transcript items, and queued chat messages.",
  },
];

export const SETTINGS_EXPORT_PRESETS = {
  sharable: ["skills", "skillGroups", "roles", "mcpServers", "agents"] as SettingsExportSectionId[],
  fullDump: SETTINGS_EXPORT_SECTIONS.map((section) => section.id),
};

export function applySettingsExportPreset(
  _currentSections: readonly SettingsExportSectionId[],
  presetSections: readonly SettingsExportSectionId[],
) {
  const presetSet = new Set(presetSections);
  return SETTINGS_EXPORT_SECTIONS
    .map((section) => section.id)
    .filter((sectionId) => presetSet.has(sectionId));
}

interface SettingsPageProps {
  companies: Company[];
  hasCompanies: boolean;
  selectedCompany: Company | null;
  companyError: string;
  newCompanyName: string;
  isCreatingCompany: boolean;
  isDeletingCompany: boolean;
  selectedExportSections: SettingsExportSectionId[];
  isExportingCompanyData: boolean;
  exportError: string;
  onNewCompanyNameChange: (name: string) => void;
  onCreateCompany: (event: FormEvent<HTMLFormElement>) => Promise<boolean> | boolean;
  onDeleteCompany: (company: Company) => Promise<boolean> | boolean;
  onExportSectionsChange: (nextSections: SettingsExportSectionId[]) => void;
  onApplyExportPreset: (presetSections: SettingsExportSectionId[]) => void;
  onExportCompanyData: () => void;
  initialActiveTab?: SettingsTabId;
  initialDeleteCompanyId?: string;
  initialDeleteConfirmationValue?: string;
  initialExportModalOpen?: boolean;
}

export function SettingsPage({
  companies,
  hasCompanies,
  selectedCompany,
  companyError,
  newCompanyName,
  isCreatingCompany,
  isDeletingCompany,
  selectedExportSections,
  isExportingCompanyData,
  exportError,
  onNewCompanyNameChange,
  onCreateCompany,
  onDeleteCompany,
  onExportSectionsChange,
  onApplyExportPreset,
  onExportCompanyData,
  initialActiveTab = "general",
  initialDeleteCompanyId = "",
  initialDeleteConfirmationValue = "",
  initialExportModalOpen = false,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialActiveTab);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [deleteTargetCompanyId, setDeleteTargetCompanyId] = useState(initialDeleteCompanyId);
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState(initialDeleteConfirmationValue);
  const [isExportModalOpen, setIsExportModalOpen] = useState(initialExportModalOpen);
  const selectedExportSectionSet = useMemo(
    () => new Set(selectedExportSections),
    [selectedExportSections],
  );
  const deleteTargetCompany = useMemo(
    () => companies.find((company) => company.id === deleteTargetCompanyId) ?? null,
    [companies, deleteTargetCompanyId],
  );
  const isDeleteConfirmationMatched = deleteConfirmationValue === (deleteTargetCompany?.name ?? "");

  async function handleCreateCompanySubmit(event: FormEvent<HTMLFormElement>) {
    const didCreate = await onCreateCompany(event);
    if (didCreate) {
      setIsCreateCompanyModalOpen(false);
    }
  }

  function handleExportSectionToggle(sectionId: SettingsExportSectionId) {
    const nextSelectedSections = new Set(selectedExportSectionSet);
    if (nextSelectedSections.has(sectionId)) {
      nextSelectedSections.delete(sectionId);
    } else {
      nextSelectedSections.add(sectionId);
    }
    onExportSectionsChange(
      SETTINGS_EXPORT_SECTIONS
        .map((section) => section.id)
        .filter((id) => nextSelectedSections.has(id)),
    );
  }

  async function handleDeleteCompanyConfirm() {
    if (!deleteTargetCompany) {
      return;
    }
    const didDelete = await onDeleteCompany(deleteTargetCompany);
    if (didDelete) {
      setDeleteTargetCompanyId("");
      setDeleteConfirmationValue("");
    }
  }

  function openDeleteCompanyModal(company: Company) {
    setDeleteTargetCompanyId(company.id);
    setDeleteConfirmationValue("");
  }

  function closeDeleteCompanyModal() {
    setDeleteTargetCompanyId("");
    setDeleteConfirmationValue("");
  }

  useSetPageActions(null);

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

      <CreationModal
        modalId="delete-company"
        title={deleteTargetCompany ? `Delete company "${deleteTargetCompany.name}"?` : "Delete company"}
        description="This permanently deletes the company and its tasks, skills, secrets, MCP servers, agents, and agent runners."
        isOpen={Boolean(deleteTargetCompany)}
        onClose={isDeletingCompany ? () => {} : closeDeleteCompanyModal}
      >
        <div className="page-stack">
          <div className="chat-settings-field">
            <label className="chat-settings-label" htmlFor="settings-delete-company-confirmation">
              Type the company name to confirm deletion.
            </label>
            <input
              className="chat-settings-input"
              id="settings-delete-company-confirmation"
              value={deleteConfirmationValue}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setDeleteConfirmationValue(event.target.value)}
              placeholder={deleteTargetCompany?.name ?? ""}
              disabled={isDeletingCompany}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              disabled={isDeletingCompany}
              onClick={closeDeleteCompanyModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger-btn"
              disabled={!isDeleteConfirmationMatched || isDeletingCompany}
              onClick={handleDeleteCompanyConfirm}
            >
              {isDeletingCompany ? "Deleting..." : "Delete company"}
            </button>
          </div>
        </div>
      </CreationModal>

      <div className="task-view-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "general"}
          className={`task-view-tab${activeTab === "general" ? " task-view-tab-active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "companies"}
          className={`task-view-tab${activeTab === "companies" ? " task-view-tab-active" : ""}`}
          onClick={() => setActiveTab("companies")}
        >
          Companies
        </button>
      </div>

      {activeTab === "general" && hasCompanies ? (
        <>
          <CreationModal
            modalId="export-company-data"
            title="Export company data"
            description="Select the sections to export. The API always applies final sanitization, so secrets and internal-only ids stay out of the file."
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
          >
            <div className="page-stack">
              <div className="hero-actions">
                <button
                  type="button"
                  onClick={() => onApplyExportPreset(SETTINGS_EXPORT_PRESETS.sharable)}
                  disabled={isExportingCompanyData}
                >
                  Sharable
                </button>
                <button
                  type="button"
                  onClick={() => onApplyExportPreset(SETTINGS_EXPORT_PRESETS.fullDump)}
                  disabled={isExportingCompanyData}
                >
                  Full dump
                </button>
              </div>
              <div className="page-stack">
                {SETTINGS_EXPORT_SECTIONS.map((section) => (
                  <label key={section.id} className="chat-settings-field" htmlFor={`export-section-${section.id}`}>
                    <span>
                      <strong>{section.label}</strong>
                      <span className="subcopy">{section.description}</span>
                    </span>
                    <input
                      id={`export-section-${section.id}`}
                      name={`export-section-${section.id}`}
                      type="checkbox"
                      checked={selectedExportSectionSet.has(section.id)}
                      onChange={() => handleExportSectionToggle(section.id)}
                      disabled={isExportingCompanyData}
                    />
                  </label>
                ))}
              </div>
              {exportError ? <p className="error-banner">{exportError}</p> : null}
              <div className="hero-actions">
                <button
                  type="button"
                  onClick={onExportCompanyData}
                  disabled={!selectedCompany || isExportingCompanyData}
                >
                  {isExportingCompanyData ? "Exporting..." : "Export YAML"}
                </button>
              </div>
            </div>
          </CreationModal>

          <section className="panel">
            <header className="panel-header">
              <h2>Export company data</h2>
            </header>
            <p className="subcopy">
              Open the export modal to choose which sections to include. The API still
              applies final sanitization so secrets and internal-only ids stay out of the file.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                disabled={isExportingCompanyData}
              >
                Export data
              </button>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "companies" ? (
        <section className="panel">
          <header className="panel-header">
            <h2>Companies</h2>
          </header>
          <p className="subcopy">
            View the companies you can access, create a new one, or permanently delete an existing company.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => setIsCreateCompanyModalOpen(true)}>
              Create company
            </button>
          </div>
          {companies.length > 0 ? (
            <div className="page-stack">
              <ul className="chat-card-list">
                {companies.map((company) => (
                  <li
                    key={company.id}
                    className={`chat-card${selectedCompany?.id === company.id ? " chat-card-active" : ""}`}
                  >
                    <div className="chat-card-main">
                      <div className="chat-card-title-row">
                        <span className="chat-card-title">
                          <strong>{company.name}</strong>
                        </span>
                      </div>
                      {selectedCompany?.id === company.id ? (
                        <span className="chat-card-meta">Active in sidebar</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="danger-btn"
                      disabled={isDeletingCompany}
                      onClick={() => openDeleteCompanyModal(company)}
                    >
                      Delete company
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="empty-hint">You do not have access to any companies yet.</p>
          )}
        </section>
      ) : null}

      {activeTab === "general" && hasCompanies ? (
        <>
          <section className="panel">
            <header className="panel-header">
              <h2>Company access</h2>
            </header>
            <p className="subcopy">
              Use the Companies tab to create a company or permanently delete one you can access.
            </p>
          </section>
        </>
      ) : null}

      {companyError ? <p className="error-banner">Company error: {companyError}</p> : null}
    </div></Page>
  );
}
