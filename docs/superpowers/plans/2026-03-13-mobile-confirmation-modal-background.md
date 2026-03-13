# Mobile Confirmation Modal Background Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore an opaque background for mobile confirmation modals rendered from chat pages without changing other mobile chat surface styling.

**Architecture:** Keep the fix in `src/index.css` by overriding the chat layout's transparent mobile `.panel` rule for modal card variants. Add a CSS regression test that reads the stylesheet source so the red-green cycle catches this selector conflict directly.

**Tech Stack:** React, TypeScript, shared CSS, Node test runner (`tsx --test`)

---

## Chunk 1: Regression Coverage

### Task 1: Add the failing CSS regression test

**Files:**
- Modify: `tests/chat/chat-breadcrumb-visibility.test.ts`

- [ ] **Step 1: Write the failing test**

Add a second assertion that the mobile chat layout explicitly assigns `background: #f6f6f2;` to `.modal-card`, `.modal-card-wide`, and `.modal-card-fullscreen`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/chat/chat-breadcrumb-visibility.test.ts
```

Expected: FAIL because the stylesheet does not currently include a chat-layout-specific modal card background override.

- [ ] **Step 3: Write minimal implementation**

Update the mobile chat layout CSS so modal card variants keep the shared opaque modal background while generic chat panels remain transparent.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/chat/chat-breadcrumb-visibility.test.ts
```

Expected: PASS.

## Chunk 2: Targeted Verification

### Task 2: Verify the modal styling change did not regress shared confirmation markup

**Files:**
- Modify: `src/index.css`
- Review: `tests/components/confirmation-modal.test.ts`
- Review: `../companyhelm-common`

- [ ] **Step 1: Run the focused frontend verification**

Run:

```bash
npm test -- tests/chat/chat-breadcrumb-visibility.test.ts tests/components/confirmation-modal.test.ts
```

Expected: PASS.

- [ ] **Step 2: Check shared e2e coverage impact**

Review the `companyhelm-common` frontend/e2e helpers to confirm this CSS-only frontend change does not require test updates outside the frontend repo.
