import { createClient } from "@supabase/supabase-js";
import { GRAPHQL_URL } from "../utils/constants.js";
import { getActiveCompanyId } from "../utils/company-context.js";

function getBrowserStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function getStoredToken(storageKey) {
  const storage = getBrowserStorage();
  if (!storage) {
    return "";
  }

  return String(storage.getItem(storageKey) || "").trim();
}

function setStoredToken(storageKey, token) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    storage.removeItem(storageKey);
    return;
  }
  storage.setItem(storageKey, normalizedToken);
}

function clearStoredToken(storageKey) {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(storageKey);
}

async function executeGraphQLAuthMutation(query, variables) {
  const headers = {
    "content-type": "application/json",
  };
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) {
    headers["x-company-id"] = activeCompanyId;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.errors?.[0]?.message || `GraphQL request failed with status ${response.status}.`;
    throw new Error(message);
  }
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message || "GraphQL auth mutation failed.");
  }

  return payload?.data || {};
}

class AuthProviderBase {
  constructor() {
    this.authStateListeners = new Set();
  }

  subscribeAuthStateChange(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }
    this.authStateListeners.add(listener);
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  notifyAuthStateChange() {
    const hasSession = this.hasSession();
    for (const listener of this.authStateListeners) {
      try {
        listener(hasSession);
      } catch {
        // Ignore listener errors to avoid breaking auth flows.
      }
    }
  }
}

class CompanyhelmAuthProvider extends AuthProviderBase {
  constructor(config) {
    super();
    this.name = "companyhelm";
    this.requiresPassword = true;
    this.requiresProfileOnSignUp = true;
    this.config = config;
  }

  getToken() {
    return getStoredToken(this.config.tokenStorageKey);
  }

  hasSession() {
    return Boolean(this.getToken());
  }

  getAuthorizationHeaderValue() {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return `Bearer ${token}`;
  }

  async signIn(input) {
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "");
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const data = await executeGraphQLAuthMutation(
      `mutation SignIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
          token
          user {
            id
            email
            firstName
            lastName
          }
        }
      }`,
      {
        email,
        password,
      },
    );

    const token = String(data?.signIn?.token || "").trim();
    if (!token) {
      throw new Error("signIn did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return data.signIn.user;
  }

  async signUp(input) {
    const firstName = String(input?.firstName || "").trim();
    const lastName = String(input?.lastName || "").trim();
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "");
    if (!firstName || !email || !password) {
      throw new Error("First name, email, and password are required.");
    }

    const data = await executeGraphQLAuthMutation(
      `mutation SignUp($firstName: String!, $lastName: String, $email: String!, $password: String!) {
        signUp(firstName: $firstName, lastName: $lastName, email: $email, password: $password) {
          token
          user {
            id
            email
            firstName
            lastName
          }
        }
      }`,
      {
        firstName,
        lastName: lastName || null,
        email,
        password,
      },
    );

    const token = String(data?.signUp?.token || "").trim();
    if (!token) {
      throw new Error("signUp did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return data.signUp.user;
  }

  signOut() {
    clearStoredToken(this.config.tokenStorageKey);
    this.notifyAuthStateChange();
  }
}

class SupabaseAuthProvider extends AuthProviderBase {
  constructor(config) {
    super();
    const url = String(config?.url || "").trim();
    const anonKey = String(config?.anonKey || "").trim();
    const tokenStorageKey = String(config?.tokenStorageKey || "").trim();

    if (!url) {
      throw new Error("Supabase auth requires a configured url.");
    }
    if (!anonKey) {
      throw new Error("Supabase auth requires a configured anonKey.");
    }
    if (!tokenStorageKey) {
      throw new Error("Supabase auth requires a configured tokenStorageKey.");
    }

    this.name = "supabase";
    this.requiresPassword = true;
    this.requiresProfileOnSignUp = false;
    this.config = {
      url,
      anonKey,
      tokenStorageKey,
    };
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      setStoredToken(this.config.tokenStorageKey, session?.access_token || "");
      this.notifyAuthStateChange();
    });
    void this.syncTokenFromSession();
  }

  async syncTokenFromSession() {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        throw error;
      }
      setStoredToken(this.config.tokenStorageKey, data?.session?.access_token || "");
      this.notifyAuthStateChange();
    } catch {
      clearStoredToken(this.config.tokenStorageKey);
      this.notifyAuthStateChange();
    }
  }

  getToken() {
    return getStoredToken(this.config.tokenStorageKey);
  }

  hasSession() {
    return Boolean(this.getToken());
  }

  getAuthorizationHeaderValue() {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return `Bearer ${token}`;
  }

  async signIn(input) {
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "");
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message || "Sign in failed.");
    }

    const token = String(data?.session?.access_token || "").trim();
    if (!token) {
      throw new Error("signIn did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return data?.user || null;
  }

  async signUp(input) {
    const firstName = String(input?.firstName || "").trim();
    const lastName = String(input?.lastName || "").trim();
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "");
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const metadata = {};
    if (firstName) {
      metadata.firstName = firstName;
    }
    if (lastName) {
      metadata.lastName = lastName;
    }

    const signUpInput = {
      email,
      password,
    };
    if (Object.keys(metadata).length > 0) {
      signUpInput.options = {
        data: metadata,
      };
    }

    const { data, error } = await this.client.auth.signUp(signUpInput);
    if (error) {
      throw new Error(error.message || "Sign up failed.");
    }

    const token = String(data?.session?.access_token || "").trim();
    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return {
      user: data?.user || null,
      requiresEmailConfirmation: !token,
    };
  }

  signOut() {
    clearStoredToken(this.config.tokenStorageKey);
    this.notifyAuthStateChange();
    void this.client.auth.signOut();
  }
}

export function createAuthProvider(config) {
  const providerName = String(config?.authProvider || "").trim().toLowerCase();
  if (providerName === "companyhelm") {
    return new CompanyhelmAuthProvider(config.auth.companyhelm);
  }
  if (providerName === "supabase") {
    return new SupabaseAuthProvider(config.auth.supabase);
  }

  throw new Error(`Unsupported auth provider "${config?.authProvider}".`);
}
