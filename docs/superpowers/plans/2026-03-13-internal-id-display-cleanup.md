# Internal ID Display Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove internal ID-derived labels from normal frontend UI and replace them with neutral fallback text.

**Architecture:** Clean up shared label/title helpers first, then update normal product surfaces to consume neutral fallbacks instead of raw IDs. Keep explicit IDs only in clearly debug-oriented surfaces.

**Tech Stack:** React, TypeScript, tsx test runner

---

## Chunk 1: Shared helpers and adapters

### Task 1: Lock fallback policy in tests

**Files:**
- Modify: `tests/utils/formatting.test.ts`
- Modify: `tests/utils/adapters.test.ts`
- Modify: `tests/utils/thread-tasks.test.ts`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run targeted tests and confirm they fail for the old ID-derived behavior**
- [ ] **Step 3: Update helper and adapter expectations to neutral fallbacks**
- [ ] **Step 4: Run targeted tests and confirm they pass**

### Task 2: Implement shared fallback cleanup

**Files:**
- Modify: `src/utils/formatting.ts`
- Modify: `src/utils/adapters.ts`
- Modify: `src/utils/thread-tasks.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update runner label formatting to prefer names and neutral fallback text**
- [ ] **Step 2: Remove thread title synthesis from internal IDs**
- [ ] **Step 3: Remove thread-task name synthesis from internal IDs**
- [ ] **Step 4: Stop adapter-level name/title normalization from substituting internal IDs**
- [ ] **Step 5: Run helper and adapter tests**

## Chunk 2: Product UI surfaces

### Task 3: Add failing UI tests for representative surfaces

**Files:**
- Modify: `tests/components/agent-create-modal.test.ts`
- Modify: `tests/components/tasks-page.test.ts`
- Modify: `tests/chat/chats-overview-page-actions.test.ts`

- [ ] **Step 1: Add a runner-label test proving normal UI does not show runner IDs**
- [ ] **Step 2: Add a task/chat label test proving neutral fallback text is used**
- [ ] **Step 3: Run the targeted tests and confirm they fail**

### Task 4: Update normal UI renderers

**Files:**
- Modify: `src/pages/OnboardingPage.tsx`
- Modify: `src/pages/ApprovalsPage.tsx`
- Modify: `src/components/AgentCreateModal.tsx`
- Modify: `src/components/AgentEditModal.tsx`
- Modify: `src/pages/AgentsPage.tsx`
- Modify: `src/pages/AgentChatsPage.tsx`
- Modify: `src/pages/SkillsPage.tsx`
- Modify: `src/pages/RolesPage.tsx`
- Modify: `src/components/TaskTableView.tsx`
- Modify: `src/components/TaskGraphView.tsx`
- Modify: `src/components/TaskEditModal.tsx`
- Modify: `src/pages/TasksPage.tsx`
- Modify: `src/pages/SecretsPage.tsx`
- Modify: `src/pages/AgentChatPage.tsx`
- Modify: `src/pages/ChatsOverviewPage.tsx`

- [ ] **Step 1: Replace name-to-ID fallbacks with neutral text**
- [ ] **Step 2: Remove explicit internal ID display from normal runner/chat/task surfaces**
- [ ] **Step 3: Keep debug-oriented ID surfaces unchanged**
- [ ] **Step 4: Run targeted UI tests**

## Chunk 3: Verification and delivery

### Task 5: Final verification

**Files:**
- Test: `tests/**/*.test.ts`

- [ ] **Step 1: Search the modified surfaces for remaining internal-ID fallbacks**
- [ ] **Step 2: Run the full frontend test suite**
- [ ] **Step 3: Review the resulting UI-facing strings for consistency**

### Task 6: Branch and PR

**Files:**
- None

- [ ] **Step 1: Create a branch for the cleanup**
- [ ] **Step 2: Commit the docs, tests, and implementation**
- [ ] **Step 3: Fetch and rebase onto `origin/main`**
- [ ] **Step 4: Push branch and create PR**
- [ ] **Step 5: Check PR status and address any failures**
