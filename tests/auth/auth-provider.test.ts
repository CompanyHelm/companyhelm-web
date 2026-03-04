import assert from "node:assert/strict";
import test from "node:test";
import { createAuthProvider } from "../../src/auth/provider.ts";
import { setActiveCompanyId } from "../../src/utils/company-context.ts";

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
});

test("signIn sends active company context header to GraphQL API", async () => {
  const localStorageMap = new Map<any, any>();
  global.window = {
    localStorage: {
      getItem(key: any) {
        return localStorageMap.has(key) ? localStorageMap.get(key) : null;
      },
      setItem(key: any, value: any) {
        localStorageMap.set(key, String(value));
      },
      removeItem(key: any) {
        localStorageMap.delete(key);
      },
    },
  } as any;

  setActiveCompanyId("company-123");

  const fetchCalls: any[] = [];
  global.fetch = (async (url: any, options: any) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      async json() {
        return {
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
        };
      },
    };
  }) as any;

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
  assert.equal(fetchCalls[0].options?.headers?.["x-company-id"], "company-123");
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
  const originalWindow = global.window;
  const originalFetch = global.fetch;
  const localStorageMap = new Map<any, any>();
  try {
    global.window = {
      localStorage: {
        getItem(key: any) {
          return localStorageMap.has(key) ? localStorageMap.get(key) : null;
        },
        setItem(key: any, value: any) {
          localStorageMap.set(key, String(value));
        },
        removeItem(key: any) {
          localStorageMap.delete(key);
        },
      },
    } as any;

    global.fetch = (async () => ({
      ok: true,
      async json() {
        return {
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
        };
      },
    })) as any;

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

    const authStateUpdates: any[] = [];
    const unsubscribe = provider.subscribeAuthStateChange((hasSession: any) => {
      authStateUpdates.push(Boolean(hasSession));
    });

    await provider.signIn({ email: "user@example.com", password: "password-123" });
    provider.signOut();
    unsubscribe();

    assert.deepEqual(authStateUpdates, [true, false]);
  } finally {
    if (typeof originalWindow === "undefined") {
      Reflect.deleteProperty(global as any, "window");
    } else {
      global.window = originalWindow;
    }
    if (typeof originalFetch === "undefined") {
      Reflect.deleteProperty(global as any, "fetch");
    } else {
      global.fetch = originalFetch;
    }
  }
});
