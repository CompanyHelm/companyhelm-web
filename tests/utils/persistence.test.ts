import assert from "node:assert/strict";
import test from "node:test";
import {
  getPersistedOnboarding,
  getPersistedTaskTableColumnIds,
  persistTaskTableColumnIds,
} from "../../src/utils/persistence.ts";
import {
  ONBOARDING_STORAGE_KEY,
  TASK_TABLE_COLUMNS_STORAGE_KEY,
} from "../../src/utils/constants.ts";

type GlobalWithWindow = typeof global & {
  window?: Window & typeof globalThis;
};

const testGlobal = global as GlobalWithWindow;

function createMockStorage(storageMap: Map<string, string>): Storage {
  return {
    get length() {
      return storageMap.size;
    },
    clear() {
      storageMap.clear();
    },
    key(index: number) {
      return Array.from(storageMap.keys())[index] ?? null;
    },
    getItem(key: string) {
      return storageMap.has(key) ? storageMap.get(key) || null : null;
    },
    setItem(key: string, value: string) {
      storageMap.set(key, String(value));
    },
    removeItem(key: string) {
      storageMap.delete(key);
    },
  };
}

test("getPersistedTaskTableColumnIds returns defaults when browser storage is unavailable", () => {
  const originalWindow = testGlobal.window;

  try {
    Reflect.deleteProperty(testGlobal, "window");

    assert.deepEqual(
      getPersistedTaskTableColumnIds(["status", "description", "created"], ["status", "description"]),
      ["status", "description"],
    );
  } finally {
    if (typeof originalWindow !== "undefined") {
      testGlobal.window = originalWindow;
    }
  }
});

test("getPersistedTaskTableColumnIds keeps only known unique ids", () => {
  const originalWindow = testGlobal.window;
  const storageMap = new Map<string, string>([
    [TASK_TABLE_COLUMNS_STORAGE_KEY, JSON.stringify(["bogus", "created", "created", "status", ""])],
  ]);

  try {
    testGlobal.window = {
      localStorage: createMockStorage(storageMap),
    } as Window & typeof globalThis;

    assert.deepEqual(
      getPersistedTaskTableColumnIds(["status", "description", "created"], ["status", "description"]),
      ["created", "status"],
    );
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});

test("getPersistedTaskTableColumnIds falls back to defaults for invalid stored values", () => {
  const originalWindow = testGlobal.window;
  const storageMap = new Map<string, string>([
    [TASK_TABLE_COLUMNS_STORAGE_KEY, "{invalid json"],
  ]);

  try {
    testGlobal.window = {
      localStorage: createMockStorage(storageMap),
    } as Window & typeof globalThis;

    assert.deepEqual(
      getPersistedTaskTableColumnIds(["status", "description", "created"], ["status", "description"]),
      ["status", "description"],
    );
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});

test("getPersistedOnboarding normalizes unsupported persisted phases to null", () => {
  const originalWindow = testGlobal.window;
  const storageMap = new Map<string, string>([
    [ONBOARDING_STORAGE_KEY, JSON.stringify({ phase: "chat", runnerSecret: "secret-1" })],
  ]);

  try {
    testGlobal.window = {
      localStorage: createMockStorage(storageMap),
    } as Window & typeof globalThis;

    assert.deepEqual(getPersistedOnboarding(), {
      phase: null,
      runnerSecret: "secret-1",
      runnerId: "",
    });
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});

test("persistTaskTableColumnIds stores normalized unique ids", () => {
  const originalWindow = testGlobal.window;
  const storageMap = new Map<string, string>();

  try {
    testGlobal.window = {
      localStorage: createMockStorage(storageMap),
    } as Window & typeof globalThis;

    persistTaskTableColumnIds(["status", "", "status", "created"]);

    assert.equal(
      storageMap.get(TASK_TABLE_COLUMNS_STORAGE_KEY),
      JSON.stringify(["status", "created"]),
    );
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});
