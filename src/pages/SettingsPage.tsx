import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";
import { CreationModal } from "../components/CreationModal.tsx";
import { useSetPageActions } from "../components/PageActionsContext.tsx";
import type { Company } from "../types/domain.ts";

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
  onDeleteCompany: () => void;
  onExportSectionsChange: (nextSections: SettingsExportSectionId[]) => void;
  onApplyExportPreset: (presetSections: SettingsExportSectionId[]) => void;
  onExportCompanyData: () => void;
  initialExportModalOpen?: boolean;
}

export function SettingsPage({
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
  initialExportModalOpen = false,
}: SettingsPageProps) {
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(initialExportModalOpen);
  const selectedExportSectionSet = useMemo(
    () => new Set(selectedExportSections),
    [selectedExportSections],
  );

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
        </>
      ) : null}

      {companyError ? <p className="error-banner">Company error: {companyError}</p> : null}
    </div></Page>
  );
}
