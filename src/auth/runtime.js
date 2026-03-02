import {
  AUTH_PROVIDER,
  COMPANYHELM_AUTH_TOKEN_STORAGE_KEY,
  GRAPHQL_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_AUTH_TOKEN_STORAGE_KEY,
  SUPABASE_URL,
} from "../utils/constants.js";
import { createAuthProvider } from "./provider.js";

export const authProvider = createAuthProvider({
  authProvider: AUTH_PROVIDER,
  api: {
    graphqlApiUrl: GRAPHQL_URL,
  },
  auth: {
    companyhelm: {
      tokenStorageKey: COMPANYHELM_AUTH_TOKEN_STORAGE_KEY,
    },
    supabase: {
      tokenStorageKey: SUPABASE_AUTH_TOKEN_STORAGE_KEY,
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY,
    },
  },
});
