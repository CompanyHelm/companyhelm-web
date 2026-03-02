import assert from "node:assert/strict";
import test from "node:test";
import { createAuthProvider } from "../../src/auth/provider.js";

test("createAuthProvider returns companyhelm provider", () => {
  const provider = createAuthProvider({
    authProvider: "companyhelm",
    auth: {
      companyhelm: {
        tokenStorageKey: "companyhelm.auth.token",
      },
      supabase: {
        tokenStorageKey: "supabase.access.token",
        url: "https://example.supabase.co",
        anonKey: "anon-key",
      },
    },
    api: {
      graphqlApiUrl: "http://127.0.0.1:4000/graphql",
    },
  });

  assert.equal(provider.name, "companyhelm");
});
