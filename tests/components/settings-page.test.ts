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
      companies: [
        {
          id: "company-1",
          name: "Acme Labs",
        },
        {
          id: "company-2",
          name: "Beta Works",
        },
      ],
      hasCompanies: true,
      selectedCompany: {
        id: "company-1",
        name: "Acme Labs",
      },
      companyError: "",
      newCompanyName: "",
      isCreatingCompany: false,
      isDeletingCompany: false,
      taskCategories: [
        {
          id: "task-category-1",
          name: "Backlog",
        },
        {
          id: "task-category-2",
          name: "Shipping",
        },
      ],
      newTaskCategoryName: "",
      isCreatingTaskCategory: false,
      deletingTaskCategoryId: null,
      editingTaskCategoryId: null,
      taskCategoryDraftName: "",
      selectedExportSections: SETTINGS_EXPORT_PRESETS.sharable,
      isExportingCompanyData: false,
      exportError: "",
      onNewCompanyNameChange: () => {},
      onCreateCompany: () => true,
      onDeleteCompany: () => false,
      onNewTaskCategoryNameChange: () => {},
      onCreateTaskCategory: () => true,
      onDeleteTaskCategory: () => false,
      onStartTaskCategoryRename: () => {},
      onTaskCategoryDraftNameChange: () => {},
      onSaveTaskCategoryRename: () => true,
      onCancelTaskCategoryRename: () => {},
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

  assert.match(markup, />General</);
  assert.match(markup, />Tasks</);
  assert.match(markup, />Companies</);
  assert.doesNotMatch(markup, /aria-label="Create company"/);
  assert.match(markup, />Export company data</);
  assert.match(markup, />Export data</);
  assert.doesNotMatch(markup, />Sharable</);
  assert.doesNotMatch(markup, />Full dump</);
  assert.doesNotMatch(markup, /name="export-section-skills"/);
  assert.doesNotMatch(markup, /name="export-section-threadData"/);
  assert.doesNotMatch(markup, />Delete company</);
});

test("SettingsPage renders export controls inside the export modal", () => {
  const markup = renderSettingsPageMarkup({
    initialExportModalOpen: true,
    selectedExportSections: [],
    exportError: "Select at least one section to export.",
  });

  assert.match(markup, /role="dialog"/);
  assert.match(markup, />Export company data</);
  assert.match(markup, />Sharable</);
  assert.match(markup, />Full dump</);
  assert.match(markup, /Select at least one section to export\./);
  assert.match(markup, /name="export-section-skills"/);
  assert.match(markup, /name="export-section-threadData"/);
});

test("SettingsPage disables export while a request is pending", () => {
  const markup = renderSettingsPageMarkup({
    initialExportModalOpen: true,
    isExportingCompanyData: true,
  });

  assert.match(markup, /Exporting\.\.\./);
  assert.match(markup, /button[^>]+disabled[^>]*>Exporting\.\.\./);
});

test("SettingsPage renders company management inside the Companies tab", () => {
  const markup = renderSettingsPageMarkup({
    initialActiveTab: "companies",
  });

  assert.match(markup, />Create company</);
  assert.match(markup, />Acme Labs</);
  assert.match(markup, />Beta Works</);
  assert.match(markup, />Delete company</);
  assert.doesNotMatch(markup, />Export company data</);
});

test("SettingsPage renders task category management inside the Tasks tab", () => {
  const markup = renderSettingsPageMarkup({
    initialActiveTab: "tasks",
  });

  assert.match(markup, />Task categories</);
  assert.match(markup, />Backlog</);
  assert.match(markup, />Shipping</);
  assert.match(markup, />Add category</);
  assert.match(markup, />Delete category</);
  assert.doesNotMatch(markup, />Export company data</);
});

test("SettingsPage renders task category rename controls inside the Tasks tab", () => {
  const markup = renderSettingsPageMarkup({
    initialActiveTab: "tasks",
    editingTaskCategoryId: "task-category-1",
    taskCategoryDraftName: "Planned",
  });

  assert.match(markup, /value="Planned"/);
  assert.match(markup, />Save rename</);
  assert.match(markup, />Cancel</);
});

test("SettingsPage requires typing the company name before delete can proceed", () => {
  const unmatchedMarkup = renderSettingsPageMarkup({
    initialActiveTab: "companies",
    initialDeleteCompanyId: "company-2",
  });

  assert.match(unmatchedMarkup, /Delete company &quot;Beta Works&quot;\?/);
  assert.match(unmatchedMarkup, /Type the company name to confirm deletion\./);
  assert.match(unmatchedMarkup, /placeholder="Beta Works"/);
  assert.match(unmatchedMarkup, /button[^>]+disabled[^>]*>Delete company</);

  const matchedMarkup = renderSettingsPageMarkup({
    initialActiveTab: "companies",
    initialDeleteCompanyId: "company-2",
    initialDeleteConfirmationValue: "Beta Works",
  });

  assert.doesNotMatch(matchedMarkup, /button[^>]+disabled[^>]*>Delete company</);
});
