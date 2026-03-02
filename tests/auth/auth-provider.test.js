import assert from "node:assert/strict";
import test from "node:test";
import { createAuthProvider } from "../../src/auth/provider.js";
import { setActiveCompanyId } from "../../src/utils/company-context.js";

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
  const localStorageMap = new Map();
  global.window = {
    localStorage: {
      getItem(key) {
        return localStorageMap.has(key) ? localStorageMap.get(key) : null;
      },
      setItem(key, value) {
        localStorageMap.set(key, String(value));
      },
      removeItem(key) {
        localStorageMap.delete(key);
      },
    },
  };

  setActiveCompanyId("company-123");

  const fetchCalls = [];
  global.fetch = async (url, options) => {
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
  };

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

  await provider.signIn({ email: "user@example.com" });

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].options?.headers?.["x-company-id"], "company-123");
});
