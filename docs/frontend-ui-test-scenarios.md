# Frontend UI Test Scenarios

**Purpose:** This document is a shared QA reference for manually testing the frontend UI. It describes user scenarios, test steps, and expected results so testers can reuse the same coverage over time.

**Audience:** QA testers, frontend engineers, and reviewers validating UI behavior before merge or release.

**Scope:** High-value frontend user flows, especially navigation, forms, modals, agents, chats, configuration pages, and common regression points.

**Preconditions:**
- Frontend boots successfully in the target environment.
- A test user can sign in.
- At least one company is available.
- Seed data exists for agents, runners, roles, chats, secrets, and tasks where relevant.
- Test data should remain stable enough that expected outcomes are predictable.

---

## 1. App Load and Navigation

### Scenario 1.1: Initial app load succeeds

**Steps:**
1. Open the frontend in a fresh browser session.
2. Sign in if authentication is required.
3. Wait for the default landing page to finish loading.

**Expected Results:**
- The app renders without a blank screen.
- No blocking error banner appears on first load.
- Core navigation is visible.
- The selected company context is visible if a company is already chosen.

### Scenario 1.2: Navigate between main pages

**Steps:**
1. Open the main navigation.
2. Visit the major pages used by the product:
   - dashboard
   - agents
   - chats
   - roles / skills
   - secrets
   - tasks
3. Return back to the starting page.

**Expected Results:**
- Each page loads successfully.
- The URL and visible page content stay in sync.
- No page gets stuck in a loading state.
- No navigation action leaves stale overlays or broken layout behind.

---

## 2. Agents

### Scenario 2.1: Open create agent modal

**Steps:**
1. Go to the Agents page.
2. Click `Create agent`.

**Expected Results:**
- The create-agent modal opens.
- Required fields are visible.
- Runner-dependent fields behave correctly if no runner is selected yet.

### Scenario 2.2: Validate create agent required states

**Steps:**
1. Open the create-agent modal.
2. Leave required fields empty.
3. Try to submit.
4. Select a runner and re-check model and reasoning fields.

**Expected Results:**
- Required fields cannot be submitted empty.
- Model selection is blocked until a runner is selected.
- Reasoning selection is blocked until both runner and model are selected.
- Validation behavior is clear and does not silently fail.

### Scenario 2.3: Create agent successfully

**Steps:**
1. Open the create-agent modal.
2. Fill in a valid name.
3. Select a valid runner.
4. Select SDK, model, and reasoning level.
5. Optionally add one or more roles.
6. Submit the form.

**Expected Results:**
- The save action completes successfully.
- The modal closes.
- The new agent appears in the agents list.
- The saved agent shows the expected name, runner, and model details.

### Scenario 2.4: Edit agent successfully

**Steps:**
1. From the Agents page, open an existing agent’s edit modal.
2. Change one or more fields:
   - name
   - model
   - reasoning
   - roles
   - default additional model instructions
3. Click `Save changes`.

**Expected Results:**
- The save action completes successfully.
- The edit modal closes after save.
- The updated values appear in the list or detail view.
- Old values are no longer displayed after the page refreshes its state.

### Scenario 2.5: Cancel agent edit

**Steps:**
1. Open the edit modal for an existing agent.
2. Change one or more fields.
3. Click `Cancel` or close the modal.

**Expected Results:**
- The modal closes.
- Unsaved changes are not applied to the visible agent data.

---

## 3. Agent Chats

### Scenario 3.1: Open agent chats page

**Steps:**
1. Open an existing agent from the Agents page.
2. Navigate into that agent’s chats view.

**Expected Results:**
- The agent detail or chats page loads.
- Agent summary information is visible.
- Existing chat sessions render if present.

### Scenario 3.2: Open new chat settings modal

**Steps:**
1. On the agent chats page, click the chat settings button.

**Expected Results:**
- The `New Chat Settings` modal opens.
- Title and additional instructions inputs are visible.
- The modal can be closed cleanly.

### Scenario 3.3: Start a new chat

**Steps:**
1. On the agent chats page, click `New chat`.
2. If settings are needed, provide title and or additional instructions.
3. Complete chat creation.

**Expected Results:**
- A new chat is created.
- The app navigates to the new chat or shows it in the list immediately.
- The composer is visible and usable.

### Scenario 3.4: Open existing chat

**Steps:**
1. From the agent chats list, open an existing chat.

**Expected Results:**
- The chat transcript view loads.
- Chat title and metadata are visible.
- No broken loading or empty-state flicker appears once data resolves.

---

## 4. Modal Behavior

### Scenario 4.1: Save in modal closes the modal

**Steps:**
1. Open a modal that performs a save action, such as:
   - create agent
   - edit agent
   - create role
   - create secret
2. Complete a valid save.

**Expected Results:**
- The modal closes on successful save.
- The overlay is removed.
- Background page content becomes interactive again.

### Scenario 4.2: Failed save keeps modal open

**Steps:**
1. Open a modal with a save action.
2. Trigger a known invalid submission or backend failure case.

**Expected Results:**
- The modal remains open.
- An error message is shown if the UI supports it.
- Entered data is not unexpectedly lost.

### Scenario 4.3: Modal dismissal works from all supported paths

**Steps:**
1. Open a modal.
2. Close it using:
   - close button
   - cancel button if available
   - clicking outside the modal if supported
   - `Escape` key

**Expected Results:**
- Every supported dismissal path closes the modal.
- The page returns to a usable state.
- No duplicate overlays remain on screen.

---

## 5. Roles, Skills, and Related Configuration

### Scenario 5.1: Roles page renders correctly

**Steps:**
1. Navigate to Roles or Skills-related pages.
2. Open a role detail view if available.

**Expected Results:**
- Lists and detail sections render correctly.
- Counts, labels, and inherited relationships are readable.

### Scenario 5.2: Create or edit a role or group

**Steps:**
1. Open the create or edit flow for a role or skill group.
2. Modify fields and save.

**Expected Results:**
- The save succeeds.
- The modal closes if the flow is modal-based.
- Updated data appears in the corresponding list or detail view.

---

## 6. Secrets and MCP-Related Flows

### Scenario 6.1: Secrets page renders and supports create flow

**Steps:**
1. Navigate to Secrets.
2. Open the create-secret modal.
3. Fill in valid test data and save.

**Expected Results:**
- The modal opens correctly.
- The save succeeds.
- The modal closes after save.
- The new secret appears in the list if secrets are displayed after creation.

### Scenario 6.2: MCP-linked flows navigate correctly

**Steps:**
1. Open any MCP server page or edit flow that links to secrets.
2. Use the link or action that should take the user to secrets or related configuration.

**Expected Results:**
- Navigation goes to the intended page.
- The target page loads correctly.

---

## 7. Tasks

### Scenario 7.1: Tasks page renders

**Steps:**
1. Navigate to Tasks.
2. Verify both list and detail views if task data exists.

**Expected Results:**
- The tasks page loads without errors.
- List data appears when tasks exist.
- Empty states are shown when tasks do not exist.

### Scenario 7.2: Task execution fallback modal behaves correctly

**Steps:**
1. Trigger a task execution path that opens the fallback modal.
2. Select a fallback agent if required.
3. Confirm or cancel the action.

**Expected Results:**
- The modal opens with the expected controls.
- Confirm performs the intended action.
- Cancel closes the modal without changing task state.

---

## 8. Visual and Interaction Quality

### Scenario 8.1: No layout breakage on standard desktop size

**Steps:**
1. Repeat the main flows on a standard desktop viewport.

**Expected Results:**
- No overlapping controls.
- No clipped modal content.
- No unreadable text or broken spacing.

### Scenario 8.2: No layout breakage on mobile-width viewport

**Steps:**
1. Repeat the highest-value flows on a narrow viewport.
2. Focus on:
   - navigation
   - modal actions
   - forms
   - chat composer

**Expected Results:**
- Content remains usable without horizontal overflow.
- Buttons and inputs remain reachable.
- Modal actions remain visible and tappable.

---

## 9. Regression Checklist for Any UI Bug Fix

Use this checklist whenever a frontend bug is fixed:

1. Reproduce the original bug first.
2. Verify the exact fix path works.
3. Verify cancel and close behavior still works.
4. Verify the success path updates visible page state.
5. Refresh the page and confirm persisted data still matches.
6. Check one adjacent flow that could have regressed.
