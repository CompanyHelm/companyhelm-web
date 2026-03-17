import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GitSkillPackagesPage } from "../../src/pages/GitSkillPackagesPage.tsx";

function renderGitSkillPackagesPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(GitSkillPackagesPage, {
      selectedCompanyId: "company-1",
      gitSkillPackages: [],
      activeGitSkillPackage: {
        id: "package-1",
        packageName: "obra/superpowers",
        gitRepositoryUrl: "https://github.com/obra/superpowers.git",
        hostingProvider: "github",
        currentCommitHash: "0123456789abcdef0123456789abcdef01234567",
        currentReference: "refs/heads/main",
        skills: [
          {
            id: "skill-1",
            name: "Brainstorming",
          },
        ],
      },
      isLoadingGitSkillPackages: false,
      skillError: "",
      onOpenGitSkillPackage: () => {},
      onBackToGitSkillPackages: () => {},
      onPreviewGitSkillPackage: async () => ({ packageName: "obra/superpowers", branches: [], tags: [] }),
      onCreateGitSkillPackage: async () => ({ packageId: "package-1", warnings: [] }),
      onUpdateGitSkillPackage: async () => ({ packageId: "package-1", warnings: [] }),
      onDeleteGitSkillPackage: () => {},
      onOpenSkill: () => {},
      ...overrides,
    }),
  );
}

test("GitSkillPackagesPage detail view renders an update action for imported packages", () => {
  const markup = renderGitSkillPackagesPageMarkup();

  assert.match(markup, /aria-label="Update package"/);
  assert.match(markup, /title="Update package"/);
  assert.match(markup, /Ref:\s*refs\/heads\/main/);
  assert.match(markup, /Commit:\s*0123456789abcdef0123456789abcdef01234567/);
});

