# Task Table Column Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the shared task table horizontally scroll within its panel and add a persistent multi-select column picker for optional columns.

**Architecture:** Keep the change local to the shared `TaskTableView` and a small persistence helper so both root-task and subtask tables inherit the same behavior. Use a column definition list to drive rendering, persist optional column ids in local storage, and adjust the table wrapper CSS so overflow is handled by the table region instead of the page.

**Tech Stack:** React 18, TypeScript, Vite, node:test, react-dom/server

---

### Task 1: Add storage-backed column visibility helpers

**Files:**
- Modify: `src/utils/constants.ts`
- Modify: `src/utils/persistence.ts`
- Create: `tests/utils/persistence.test.ts`

**Step 1: Write the failing tests**

```ts
test("getPersistedTaskTableColumnIds returns defaults when storage is unavailable", () => {
  assert.deepEqual(
    getPersistedTaskTableColumnIds(["status", "description"], ["status"]),
    ["status"],
  );
});

test("getPersistedTaskTableColumnIds filters unknown ids and falls back when empty", () => {
  // localStorage contains ["bogus", "created"]
  assert.deepEqual(
    getPersistedTaskTableColumnIds(["status", "created"], ["status"]),
    ["created"],
  );
});

test("persistTaskTableColumnIds writes the normalized ids", () => {
  persistTaskTableColumnIds(["status", "status", "created"]);
  assert.equal(localStorageMap.get(TASK_TABLE_COLUMNS_STORAGE_KEY), "[\"status\",\"created\"]");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/persistence.test.ts`
Expected: FAIL because the task-table persistence helpers and storage key do not exist yet.

**Step 3: Write minimal implementation**

```ts
export const TASK_TABLE_COLUMNS_STORAGE_KEY = "companyhelm.taskTable.visibleColumns";

export function getPersistedTaskTableColumnIds(allowedIds: string[], defaultIds: string[]) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TASK_TABLE_COLUMNS_STORAGE_KEY) || "[]");
    const allowedIdSet = new Set(allowedIds);
    const normalized = Array.isArray(parsed)
      ? parsed
        .map((value) => String(value || "").trim())
        .filter((value, index, values) => value && allowedIdSet.has(value) && values.indexOf(value) === index)
      : [];
    return normalized.length > 0 ? normalized : defaultIds;
  } catch {
    return defaultIds;
  }
}

export function persistTaskTableColumnIds(columnIds: string[]) {
  try {
    const normalized = [...new Set(columnIds.map((value) => String(value || "").trim()).filter(Boolean))];
    window.localStorage.setItem(TASK_TABLE_COLUMNS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore local storage write failures.
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/constants.ts src/utils/persistence.ts tests/utils/persistence.test.ts
git commit -m "test: add task table column persistence helpers"
```

### Task 2: Render toggleable columns from shared definitions

**Files:**
- Modify: `src/components/TaskTableView.tsx`
- Create: `tests/components/task-table-view.test.ts`

**Step 1: Write the failing tests**

```ts
test("TaskTableView hides optional columns that are not visible", () => {
  // storage contains ["status", "created"]
  assert.match(markup, />Status</);
  assert.doesNotMatch(markup, />Description</);
  assert.match(markup, />Created</);
});

test("TaskTableView renders a columns trigger in the toolbar", () => {
  assert.match(markup, />Columns</);
});

test("TaskTableView falls back to default optional columns when storage is invalid", () => {
  // storage contains invalid json
  assert.match(markup, />Description</);
  assert.match(markup, />Blocked by</);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/task-table-view.test.ts`
Expected: FAIL because the component still renders a fixed column list and has no column picker trigger.

**Step 3: Write minimal implementation**

```tsx
const OPTIONAL_COLUMNS = [
  { id: "status", label: "Status", defaultVisible: true, renderCell: ... },
  { id: "description", label: "Description", defaultVisible: true, renderCell: ... },
  // ...
];

const defaultOptionalColumnIds = OPTIONAL_COLUMNS
  .filter((column) => column.defaultVisible)
  .map((column) => column.id);

const [visibleOptionalColumnIds, setVisibleOptionalColumnIds] = useState(() =>
  getPersistedTaskTableColumnIds(
    OPTIONAL_COLUMNS.map((column) => column.id),
    defaultOptionalColumnIds,
  )
);

useEffect(() => {
  persistTaskTableColumnIds(visibleOptionalColumnIds);
}, [visibleOptionalColumnIds]);

const visibleOptionalColumnIdSet = new Set(visibleOptionalColumnIds);
const visibleColumns = OPTIONAL_COLUMNS.filter((column) => visibleOptionalColumnIdSet.has(column.id));
```

Add a toolbar `Columns` button and a small checkbox menu that updates `visibleOptionalColumnIds` immediately. Keep the selection checkbox, `Name`, and action columns always rendered.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/task-table-view.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/TaskTableView.tsx tests/components/task-table-view.test.ts
git commit -m "feat: add task table column selector"
```

### Task 3: Make the table region own horizontal overflow and verify

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/TaskTableView.tsx`

**Step 1: Write the failing test or check**

There is no reliable layout assertion in the current test stack for scroll overflow, so use the existing component tests as regression coverage and verify the layout manually in the app after the CSS change.

**Step 2: Run existing tests before CSS changes**

Run: `npm test -- tests/components/task-table-view.test.ts tests/utils/persistence.test.ts`
Expected: PASS

**Step 3: Write minimal implementation**

```css
.task-table-scroll {
  min-width: 0;
  overflow-x: auto;
}

.task-table {
  width: max-content;
  min-width: 100%;
}

.task-view-container,
.task-detail-panel,
.task-list-panel {
  min-width: 0;
}
```

Refine toolbar and menu styles so the popover remains usable on narrow widths and the sticky table header still behaves correctly while scrolling.

**Step 4: Run full frontend verification**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

Manual check:
- Start dev server with `npm run dev`
- Open the root tasks page and confirm the table scrolls horizontally inside the panel
- Open a task, switch to the `Table` tab, and confirm the same behavior for subtasks
- Toggle columns from the toolbar menu and refresh to verify persistence

**Step 5: Commit**

```bash
git add src/index.css src/components/TaskTableView.tsx
git commit -m "fix: constrain task table overflow"
```
