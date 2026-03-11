import assert from "node:assert/strict";
import test from "node:test";
import { createAuthProvider } from "../../src/auth/provider.ts";
import { setActiveCompanyId } from "../../src/utils/company-context.ts";

type GlobalWithWindowAndFetch = typeof global & {
  window?: Window & typeof globalThis;
  fetch?: typeof fetch;
};

const testGlobal = global as GlobalWithWindowAndFetch;

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

function createMockResponse(payload: unknown, status = 200, ok = true): Response {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  } as unknown as Response;
}

function createCompanyhelmToken(): string {
  return "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9."
    + "eyJpc3MiOiJjb21wYW55aGVsbS5kZXYiLCJhdWQiOiJjb21wYW55aGVsbS13ZWIiLCJwcm92aWRlciI6ImNvbXBhbnloZWxtIn0."
    + "signature";
}

test("createAuthProvider returns companyhelm provider", () => {
  const provider = createAuthProvider({
    authProvider: "companyhelm",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  assert.equal(provider.name, "companyhelm");
});

test("createAuthProvider returns supabase provider", () => {
  const provider = createAuthProvider({
    authProvider: "supabase",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
      supabase: {
        url: "https://example.supabase.co",
        anonKey: "test-anon-key",
        tokenStorageKey: "supabase.auth.token",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  assert.equal(provider.name, "supabase");
  assert.equal(provider.requiresProfileOnSignUp, true);
});

test("signIn sends active company context header to GraphQL API", async () => {
  const localStorageMap = new Map<string, string>();
  testGlobal.window = {
    localStorage: createMockStorage(localStorageMap),
  } as unknown as Window & typeof globalThis;

  setActiveCompanyId("company-123");

  const fetchCalls: Array<{ url: RequestInfo | URL; options?: RequestInit }> = [];
  testGlobal.fetch = (async (url: RequestInfo | URL, options?: RequestInit) => {
    fetchCalls.push({ url, options });
    return createMockResponse({
      data: {
        signIn: {
          token: "token-1",
          user: {
            id: "user-1",
            email: "user@example.com",
            firstName: "User",
            lastName: "Example",
          },
        },
      },
    });
  }) as typeof fetch;

  const provider = createAuthProvider({
    authProvider: "companyhelm",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  await provider.signIn({ email: "user@example.com", password: "password-123" });

  assert.equal(fetchCalls.length, 1);
  assert.equal((fetchCalls[0]?.options?.headers as Record<string, string> | undefined)?.["x-company-id"], "company-123");
  setActiveCompanyId("");
});

test("companyhelm signIn requires password", async () => {
  const provider = createAuthProvider({
    authProvider: "companyhelm",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  await assert.rejects(
    provider.signIn({ email: "user@example.com" }),
    /Email and password are required\./,
  );
});

test("companyhelm signUp requires password", async () => {
  const provider = createAuthProvider({
    authProvider: "companyhelm",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  await assert.rejects(
    provider.signUp({
      firstName: "User",
      email: "user@example.com",
    }),
    /First name, email, and password are required\./,
  );
});

test("companyhelm provider emits auth state updates on sign in and sign out", async () => {
  const originalWindow = testGlobal.window;
  const originalFetch = testGlobal.fetch;
  const localStorageMap = new Map<string, string>();
  try {
    testGlobal.window = {
      localStorage: createMockStorage(localStorageMap),
    } as unknown as Window & typeof globalThis;

    testGlobal.fetch = (async () => createMockResponse({
      data: {
        signIn: {
          token: createCompanyhelmToken(),
          user: {
            id: "user-1",
            email: "user@example.com",
            firstName: "User",
            lastName: "Example",
          },
        },
      },
    })) as typeof fetch;

    const provider = createAuthProvider({
      authProvider: "companyhelm",
      auth: {
        companyhelm: {
          tokenStorageKey: "companyhelm.auth.token",
        },
      },
      api: {
        graphqlApiUrl: "http://127.0.0.1:4000/graphql",
      },
    });

    const authStateUpdates: boolean[] = [];
    const unsubscribe = provider.subscribeAuthStateChange((hasSession: boolean) => {
      authStateUpdates.push(Boolean(hasSession));
    });

    await provider.signIn({ email: "user@example.com", password: "password-123" });
    provider.signOut();
    unsubscribe();

    assert.deepEqual(authStateUpdates, [true, false]);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(testGlobal, "fetch");
    } else {
      testGlobal.fetch = originalFetch;
    }
  }
});

test("companyhelm provider clears persisted non-companyhelm jwt sessions", () => {
  const originalWindow = testGlobal.window;
  const localStorageMap = new Map<string, string>();
  localStorageMap.set(
    "companyhelm.auth.token",
    "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9."
      + "eyJpc3MiOiJodHRwczovL2V4YW1wbGUuc3VwYWJhc2UuY28vYXV0aC92MSIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJwcm92aWRlciI6InN1cGFiYXNlIn0."
      + "signature",
  );

  try {
    testGlobal.window = {
      localStorage: createMockStorage(localStorageMap),
    } as unknown as Window & typeof globalThis;

    const provider = createAuthProvider({
      authProvider: "companyhelm",
      auth: {
        companyhelm: {
          tokenStorageKey: "companyhelm.auth.token",
        },
      },
      api: {
        graphqlApiUrl: "http://127.0.0.1:4000/graphql",
      },
    });

    assert.equal(provider.hasSession(), false);
    assert.equal(provider.getAuthorizationHeaderValue(), null);
    assert.equal(localStorageMap.has("companyhelm.auth.token"), false);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(testGlobal, "window");
    } else {
      testGlobal.window = originalWindow;
    }
  }
});
