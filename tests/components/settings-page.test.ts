import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SettingsPage,
  SETTINGS_EXPORT_PRESETS,
  SETTINGS_EXPORT_SECTIONS,
  applySettingsExportPreset,
} from "../../src/pages/SettingsPage.tsx";

function renderSettingsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(SettingsPage, {
      hasCompanies: true,
      selectedCompany: {
        id: "company-1",
        name: "Acme Labs",
      },
      companyError: "",
      newCompanyName: "",
      isCreatingCompany: false,
      isDeletingCompany: false,
      selectedExportSections: SETTINGS_EXPORT_PRESETS.sharable,
      isExportingCompanyData: false,
      exportError: "",
      onNewCompanyNameChange: () => {},
      onCreateCompany: () => true,
      onDeleteCompany: () => {},
      onExportSectionsChange: () => {},
      onApplyExportPreset: () => {},
      onExportCompanyData: () => {},
      ...overrides,
    }),
  );
}

test("SettingsPage export presets map to the expected section ids", () => {
  assert.deepEqual(SETTINGS_EXPORT_PRESETS.sharable, [
    "skills",
    "skillGroups",
    "roles",
    "mcpServers",
    "agents",
  ]);
  assert.deepEqual(
    SETTINGS_EXPORT_PRESETS.fullDump,
    SETTINGS_EXPORT_SECTIONS.map((section) => section.id),
  );
});

test("applySettingsExportPreset returns a stable deduplicated section list", () => {
  assert.deepEqual(applySettingsExportPreset(["roles"], ["skills", "roles", "skills"]), [
    "skills",
    "roles",
  ]);
});

test("SettingsPage renders export controls and inline validation state", () => {
  const markup = renderSettingsPageMarkup({
    selectedExportSections: [],
    exportError: "Select at least one section to export.",
  });

  assert.match(markup, />Export company data</);
  assert.match(markup, />Sharable</);
  assert.match(markup, />Full dump</);
  assert.match(markup, /Select at least one section to export\./);
  assert.match(markup, /name="export-section-skills"/);
  assert.match(markup, /name="export-section-threadData"/);
});

test("SettingsPage disables export while a request is pending", () => {
  const markup = renderSettingsPageMarkup({
    isExportingCompanyData: true,
  });

  assert.match(markup, /Exporting\.\.\./);
  assert.match(markup, /button[^>]+disabled[^>]*>Exporting\.\.\./);
});
