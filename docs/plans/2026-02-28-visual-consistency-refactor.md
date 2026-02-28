# Visual Consistency Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring all 8 remaining pages to the minimal UI style (chat-minimal-header, chat-card, modal editing) and remove dead CSS.

**Architecture:** Each page gets the same treatment: replace hero-panel with chat-minimal-header, replace task-card/task-list with chat-card/chat-card-list, move inline editing into CreationModal dialogs, replace text buttons with icon buttons. No new components needed — reuse existing CSS classes and CreationModal.

**Tech Stack:** React (JSX), vanilla CSS, CreationModal component

---

### Task 1: ChatsOverviewPage — unify agent cards

**Files:**
- Modify: `src/pages/ChatsOverviewPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 29-34 (hero-panel section) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">Chats</h1>
  </div>
  <div className="chat-minimal-header-actions">
    <button type="button" className="secondary-btn" onClick={onRefreshChatLists}>
      Refresh
    </button>
  </div>
</header>
```

**Step 2: Replace agent task-card with chat-card**

Replace the agent `<li>` (currently `className="task-card"`) with a `chat-card` style card. Each agent row becomes:
```jsx
<li key={`chat-agent-${agent.id}`} className="chat-card">
  <div className="chat-card-main">
    <p className="chat-card-title">
      <strong>{agent.name}</strong>
    </p>
    <p className="chat-card-meta">
      {agent.agentSdk} · {modelLabel}
    </p>
  </div>
  <div className="chat-card-actions">
    <button
      type="button"
      className="chat-card-icon-btn"
      onClick={() => onCreateChatForAgent(agent.id)}
      disabled={isCreateChatDisabled}
      title={createChatDisabledReason || "New chat"}
      aria-label={isCreatingChatSession ? "Creating..." : "New chat"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</li>
```

Move the nested `chat-card-list` of sessions below the agent card (still inside the same parent `<li>`, after the agent info).

Change parent list from `className="task-list"` to `className="chat-card-list"`.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```
git add src/pages/ChatsOverviewPage.jsx
git commit -m "refactor(chats-overview): replace hero panel and task cards with minimal UI"
```

---

### Task 2: DashboardPage — minimal header and clean layout

**Files:**
- Modify: `src/pages/DashboardPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 35-47 (hero-panel + hero-actions) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">Dashboard</h1>
  </div>
</header>
```

**Step 2: Replace text link buttons with secondary-btn style**

Replace `className="inline-link"` buttons with `className="secondary-btn"` for consistency. These are the "Open task page" and "Open runner page" links in stat panels.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```
git add src/pages/DashboardPage.jsx
git commit -m "refactor(dashboard): replace hero panel with minimal header"
```

---

### Task 3: ProfilePage — minimal header

**Files:**
- Modify: `src/pages/ProfilePage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 4-12 (hero-panel) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompany ? selectedCompany.name : "No company"}</p>
    <h1 className="chat-minimal-header-title">Profile</h1>
  </div>
</header>
```

Keep stat panels unchanged — they're already clean.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```
git add src/pages/ProfilePage.jsx
git commit -m "refactor(profile): replace hero panel with minimal header"
```

---

### Task 4: TasksPage — minimal header, chat-card list, modal editing

**Files:**
- Modify: `src/pages/TasksPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 39-46 (hero-panel) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">Tasks</h1>
  </div>
  <div className="chat-minimal-header-actions">
    <span className="chat-card-meta">{taskCountLabel}</span>
    <button
      type="button"
      className="chat-minimal-header-icon-btn"
      aria-label="Create task"
      title="Create task"
      onClick={() => setIsCreateModalOpen(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</header>
```

**Step 2: Replace task-card list with chat-card list**

Change `className="task-list"` to `className="chat-card-list"`.

Replace each task `<li className="task-card">` with a clickable `chat-card`:
```jsx
<li
  key={task.id}
  className="chat-card"
  onClick={() => !isBusy && openEditTaskModal(task.id)}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === "Enter" && !isBusy) {
      openEditTaskModal(task.id);
    }
  }}
>
  <div className="chat-card-main">
    <p className="chat-card-title">
      <strong>{task.name}</strong>
    </p>
    <p className="chat-card-meta">
      {task.description || "No description"}
      {task.parentTask ? ` · parent: ${renderTaskLink(task.parentTask)}` : ""}
      {task.dependsOnTask ? ` · depends: ${renderTaskLink(task.dependsOnTask)}` : ""}
    </p>
  </div>
  <div className="chat-card-actions">
    <button
      type="button"
      className="chat-card-icon-btn chat-card-icon-btn-danger"
      onClick={(event) => {
        event.stopPropagation();
        onDeleteTask(task.id, task.name);
      }}
      disabled={isBusy}
      aria-label="Delete task"
      title="Delete task"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  </div>
</li>
```

Remove the inline relationship-editor forms from inside the cards.

**Step 3: Add edit task modal**

Add a new CreationModal for editing task relationships. Add state: `const [editingTaskId, setEditingTaskId] = useState("")`. The modal contains:
- Read-only task name and description
- Parent task select (using `relationshipDrafts`)
- Depends-on task select
- Save and Cancel buttons

Use existing `onDraftChange`, `onSaveRelationships` handlers.

**Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```
git add src/pages/TasksPage.jsx
git commit -m "refactor(tasks): minimal header, chat-card list, modal-based relationship editing"
```

---

### Task 5: GitSkillPackagesPage — minimal headers, chat-card list

**Files:**
- Modify: `src/pages/GitSkillPackagesPage.jsx`

**Step 1: Replace hero panels in both views**

Main list view — replace hero panel (lines 141-148) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">Git Skill Packages</h1>
  </div>
  <div className="chat-minimal-header-actions">
    {/* create form stays in a panel below, or move to modal */}
  </div>
</header>
```

Detail view — replace hero panel (lines 77-82) with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">Git Skill Package</p>
    <h1 className="chat-minimal-header-title">{activeGitSkillPackage.packageName}</h1>
  </div>
  <div className="chat-minimal-header-actions">
    <button type="button" className="secondary-btn" onClick={onBackToGitSkillPackages}>
      Back
    </button>
  </div>
</header>
```

**Step 2: Replace task-card list with chat-card list**

Package cards become clickable `chat-card`:
```jsx
<li
  key={gitSkillPackage.id}
  className="chat-card"
  onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === "Enter") onOpenGitSkillPackage(gitSkillPackage.id);
  }}
>
  <div className="chat-card-main">
    <p className="chat-card-title">
      <strong>{gitSkillPackage.packageName}</strong>
    </p>
    <p className="chat-card-meta">
      {gitSkillPackage.gitRepositoryUrl} · {gitSkillPackage.gitReference}
    </p>
  </div>
  <div className="chat-card-actions">
    <button
      type="button"
      className="chat-card-icon-btn chat-card-icon-btn-danger"
      onClick={(event) => {
        event.stopPropagation();
        onDeleteGitSkillPackage(gitSkillPackage.id, gitSkillPackage.packageName);
      }}
      aria-label="Delete package"
      title="Delete package"
    >
      {/* trash SVG */}
    </button>
  </div>
</li>
```

**Step 3: Move preview/create forms into a CreationModal**

Add a create modal triggered by `+` icon button in header. Move the preview URL input + ref select form into the modal.

**Step 4: Clean up detail view**

Use `skill-detail-section` pattern (already exists in CSS) for the detail view's skills list and delete action.

**Step 5: Build and verify**

Run: `npm run build`

**Step 6: Commit**

```
git add src/pages/GitSkillPackagesPage.jsx
git commit -m "refactor(git-packages): minimal headers, chat-card list, modal-based creation"
```

---

### Task 6: McpServersPage — minimal header, chat-card list, modal editing

**Files:**
- Modify: `src/pages/McpServersPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 59-66 with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">MCP Servers</h1>
  </div>
  <div className="chat-minimal-header-actions">
    <span className="chat-card-meta">{mcpServerCountLabel}</span>
    <button
      type="button"
      className="chat-minimal-header-icon-btn"
      aria-label="Create MCP server"
      title="Create MCP server"
      onClick={() => setIsCreateModalOpen(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</header>
```

**Step 2: Replace task-card with chat-card**

Each MCP server becomes a clickable `chat-card`:
- Title: server name
- Meta: transport type + URL/command + enabled/disabled status
- Click opens edit modal
- Trash icon button for delete

Remove the entire inline `mcp-edit-grid` / `relationship-editor` section from inside the cards.

**Step 3: Add edit MCP server modal**

Add a new `CreationModal` for editing. Contains all the fields currently inline in the card: name, transport type, URL/command/args/env/auth fields, enabled checkbox. Use `onMcpServerDraftChange` and `onSaveMcpServer` handlers.

Add state: `const [editingMcpServerId, setEditingMcpServerId] = useState("")`.

Use `chat-settings-modal-form` / `chat-settings-field` / `chat-settings-label` / `chat-settings-input` CSS classes for consistent styling.

**Step 4: Build and verify**

Run: `npm run build`

**Step 5: Commit**

```
git add src/pages/McpServersPage.jsx
git commit -m "refactor(mcp-servers): minimal header, chat-card list, modal-based editing"
```

---

### Task 7: AgentRunnerPage — minimal header, chat-card list, modal details

**Files:**
- Modify: `src/pages/AgentRunnerPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 66-73 with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompanyId}</p>
    <h1 className="chat-minimal-header-title">Runners</h1>
  </div>
  <div className="chat-minimal-header-actions">
    <span className="chat-card-meta">{runnerCountLabel}</span>
    <button
      type="button"
      className="chat-minimal-header-icon-btn"
      aria-label="Register runner"
      title="Register runner"
      onClick={() => setIsCreateModalOpen(true)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</header>
```

**Step 2: Replace runner-card with chat-card**

Each runner becomes a clickable `chat-card`:
- Title: runner label
- Status badge inline (use existing `runner-status` classes)
- Meta: last heartbeat timestamp + runner ID
- Click opens details modal
- Trash icon button for delete

Remove the inline `runner-cli-block`, secret input, and models list from inside cards.

**Step 3: Add runner details modal**

Add a `CreationModal` for runner details. Contains:
- Read-only runner info (ID, status, gRPC target)
- CLI command display (the `runner-command` block)
- Secret input for API key
- Regenerate key button
- Models list (read-only)

Add state: `const [detailsRunnerId, setDetailsRunnerId] = useState("")`.

**Step 4: Keep stat panels**

The stat panels (`dashboard-grid` / `stat-panel`) above the list are already clean — keep them.

**Step 5: Build and verify**

Run: `npm run build`

**Step 6: Commit**

```
git add src/pages/AgentRunnerPage.jsx
git commit -m "refactor(runners): minimal header, chat-card list, modal-based details"
```

---

### Task 8: SettingsPage — minimal header, chat-card list, modal creation

**Files:**
- Modify: `src/pages/SettingsPage.jsx`

**Step 1: Replace hero panel with minimal header**

Replace lines 44-53 with:
```jsx
<header className="chat-minimal-header">
  <div className="chat-minimal-header-info">
    <p className="chat-minimal-header-agent">{selectedCompany ? selectedCompany.name : "No company"}</p>
    <h1 className="chat-minimal-header-title">Settings</h1>
  </div>
  <div className="chat-minimal-header-actions">
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
  </div>
</header>
```

**Step 2: Move create-company form into modal**

Replace inline `composer-panel` form with a `CreationModal`.

**Step 3: GitHub installations as chat-card**

Change `task-list`/`task-card` to `chat-card-list`/`chat-card`:
- Title: installation account login
- Meta: installation ID + repo count
- Icon buttons: refresh (sync icon), delete (trash icon)

**Step 4: Danger zone — keep as panel with button**

The "Delete active company" section stays as a simple panel with a danger button. No card needed.

**Step 5: Build and verify**

Run: `npm run build`

**Step 6: Commit**

```
git add src/pages/SettingsPage.jsx
git commit -m "refactor(settings): minimal header, chat-card list, modal-based company creation"
```

---

### Task 9: CSS cleanup — remove dead patterns

**Files:**
- Modify: `src/index.css`

**Step 1: Search for orphaned class references**

After all pages are refactored, grep for these classes across all `.jsx` files:
- `.hero-panel`, `.eyebrow`, `.context-pill`, `.subcopy` (hero patterns)
- `.task-card-top`, `.task-card-title-group`, `.task-card-top-actions` (old card patterns)
- `.relationship-editor`, `.relationship-grid`, `.relationship-field`, `.relationship-save-btn` (inline editing)
- `.runner-card`, `.runner-card-top`, `.runner-cli-block` (runner-specific)
- `.mcp-edit-grid` (MCP inline editing)
- `.icon-edit-btn`, `.icon-create-btn` (old icon button patterns)
- `.composer-panel` (settings create form)

**Step 2: Remove CSS for classes no longer referenced**

Delete all CSS rules for classes that have zero remaining references in `.jsx` files.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds, no visual regressions.

**Step 4: Commit**

```
git add src/index.css
git commit -m "refactor(css): remove dead styles from old UI patterns"
```
