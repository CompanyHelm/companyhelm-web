# Runner Start Command Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy runner helper command with `companyhelm runner start --secret ...` everywhere it is user-facing in the frontend.

**Architecture:** Keep `src/utils/shell.ts` as the single command builder and continue rendering that helper output from the runner detail page. Drive the change with a failing test first, then update the helper with the minimal token change, and verify no stale references remain across the checked-out CompanyHelm repos.

**Tech Stack:** TypeScript, React, Node test runner, ripgrep, git, GitHub CLI

---

## Chunk 1: Frontend Command Update

### Task 1: Update the regression test first

**Files:**
- Modify: `tests/utils/shell.test.ts`
- Test: `tests/utils/shell.test.ts`

- [ ] **Step 1: Write the failing test**

Change the expected command string in `tests/utils/shell.test.ts` to:

```ts
"companyhelm runner start --secret secret-123"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/utils/shell.test.ts
```

Expected: FAIL because `buildRunnerStartCommand` still returns the legacy command.

### Task 2: Update the shared command helper

**Files:**
- Modify: `src/utils/shell.ts`
- Verify consumer: `src/pages/AgentRunnerDetailPage.tsx`
- Test: `tests/utils/shell.test.ts`

- [ ] **Step 1: Write minimal implementation**

Update `buildRunnerStartCommand` so it returns tokens in this order:

```ts
[
  "companyhelm",
  "runner",
  "start",
  "--secret",
  quoteShellArg(runnerSecret),
].join(" ");
```

- [ ] **Step 2: Run test to verify it passes**

Run:

```bash
npm test -- tests/utils/shell.test.ts
```

Expected: PASS

### Task 3: Verify no stale command references remain

**Files:**
- Search only: repository working tree

- [ ] **Step 1: Run repo-wide verification search**

Run:

```bash
LEGACY_PATTERN='companyhelm --'"secret"
rg -n "$LEGACY_PATTERN" /workspace/frontend /workspace/companyhelm-cli /workspace/companyhelm-agent-cli /workspace/companyhelm-api /workspace/companyhelm-common
```

Expected: no matches

- [ ] **Step 2: Check git diff**

Run:

```bash
git diff -- docs/superpowers/specs/2026-03-10-runner-start-command-design.md docs/superpowers/plans/2026-03-10-runner-start-command.md src/utils/shell.ts tests/utils/shell.test.ts
```

Expected: only the planned doc/test/helper changes

### Task 4: Finalize integration

**Files:**
- Modify: none

- [ ] **Step 1: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-03-10-runner-start-command-design.md docs/superpowers/plans/2026-03-10-runner-start-command.md src/utils/shell.ts tests/utils/shell.test.ts
git commit -m "fix: update runner start helper command"
```

- [ ] **Step 2: Rebase on latest main and create PR**

Run:

```bash
git fetch origin main
git rebase origin/main
git push -u origin <branch-name>
gh pr create --body-file <prepared-body-file>
```

Expected: clean branch and open PR ready for checks
