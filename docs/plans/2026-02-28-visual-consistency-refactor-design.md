# Visual Consistency Refactor Design

## Goal

Bring all pages to the same minimal UI style established on AgentsPage, AgentChatsPage, AgentChatPage, and SkillsPage. Eliminate old hero-panel, task-card, and inline-form patterns.

## Target Pattern

Every page follows this structure:

1. **Minimal header** (`chat-minimal-header`) — small muted context label + bold title + icon action buttons
2. **Card lists** (`chat-card-list` / `chat-card`) — clickable cards opening edit modals. Single meta line. Icon-only actions
3. **Modal editing** — all editing in `CreationModal` dialogs, not inline
4. **No hero panels** — remove eyebrow, subcopy, context-pill patterns

## Pages to Refactor

### 1. ChatsOverviewPage (quick fix)

Agent list items: change from `task-card` to `chat-card`. Clickable, agent name + meta (SDK, model). "New chat" as icon button.

### 2. DashboardPage

Replace hero with minimal header (company + "Dashboard"). Recent tasks: `chat-card` style, clickable. Runner status: `chat-card` with status indicator. Keep stat counters as-is.

### 3. TasksPage

Replace hero with minimal header (company + "Tasks" + create icon button). Task cards: `chat-card` style, title + status/description meta, click to edit in modal. Move relationship editing (parent, dependencies) into edit modal. Delete: icon button.

### 4. McpServersPage

Replace hero with minimal header (company + "MCP Servers" + create icon button). Server cards: `chat-card` style, name + type/URL meta, click to edit in modal. Move all config fields into edit modal. Delete: icon button.

### 5. AgentRunnerPage

Replace hero with minimal header (company + "Runners" + register icon button). Runner cards: `chat-card` style, label + status badge + meta (ID, heartbeat), click for details modal. Move CLI/secret/key display into modal. Delete: icon button.

### 6. GitSkillPackagesPage

Replace hero with minimal header (company + "Git Skill Packages" + create icon button). Package cards: `chat-card` style, package name + repo URL meta, click for details. Detail view: minimal header. Delete: icon button.

### 7. SettingsPage

Replace hero with minimal header (company + "Settings"). Company list: `chat-card` style, click to select. GitHub installations: `chat-card` with icon actions. Create company: modal via header icon button.

### 8. ProfilePage

Replace hero with minimal header ("Profile"). Keep stat panels as-is.

## CSS Cleanup

Remove dead CSS for patterns no longer used: `.hero-panel`, `.eyebrow`, `.context-pill`, old `.task-card-top`, `.task-card-actions`, old relationship editor styles. Keep only if still referenced.

## Files to Modify

- `src/pages/ChatsOverviewPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/TasksPage.jsx`
- `src/pages/McpServersPage.jsx`
- `src/pages/AgentRunnerPage.jsx`
- `src/pages/GitSkillPackagesPage.jsx`
- `src/pages/SettingsPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/index.css`
