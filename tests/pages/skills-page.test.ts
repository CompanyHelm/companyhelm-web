import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SkillsPage } from "../../src/pages/SkillsPage.tsx";

function renderSkillsPageMarkup(overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    React.createElement(SkillsPage, {
      skills: [
        {
          id: "skill-1",
          name: "Brainstorming",
          description: "Explore intent before changes.",
          roles: [{ id: "role-1", name: "Ops" }],
        },
        {
          id: "skill-2",
          name: "Systematic Debugging",
          description: "Debug issues methodically.",
          roles: [{ id: "role-1", name: "Ops" }],
        },
      ],
      activeSkill: null,
      isLoadingSkills: false,
      skillError: "",
      onOpenSkill: () => {},
      onOpenGitSkillPackage: () => {},
      ...overrides,
    }),
  );
}

test("SkillsPage landing view renders skills directly instead of role sections", () => {
  const markup = renderSkillsPageMarkup();

  assert.match(markup, />\s*Brainstorming\s*</);
  assert.match(markup, />\s*Systematic Debugging\s*</);
  assert.doesNotMatch(markup, />\s*Roles\s*</);
  assert.doesNotMatch(markup, />\s*Skills without roles\s*</);
  assert.doesNotMatch(markup, />\s*Ops\s*</);
});

test("SkillsPage empty state is skills-focused", () => {
  const markup = renderSkillsPageMarkup({
    skills: [],
  });

  assert.match(markup, /No skills yet\./);
  assert.doesNotMatch(markup, /No roles yet\./);
});

test("SkillsPage detail view omits role metadata", () => {
  const markup = renderSkillsPageMarkup({
    activeSkill: {
      id: "skill-1",
      name: "Brainstorming",
      description: "Explore intent before changes.",
      content: "## Content",
      fileList: ["SKILL.md"],
      roles: [{ id: "role-1", name: "Ops" }],
    },
  });

  assert.doesNotMatch(markup, /Roles:\s*Ops/);
  assert.match(markup, /Files:\s*1/);
});
