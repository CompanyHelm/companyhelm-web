import { GRAPHQL_URL } from "../utils/constants.js";

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
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
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

class CompanyhelmAuthProvider {
  constructor(config) {
    this.name = "companyhelm";
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
    if (!email) {
      throw new Error("Email is required.");
    }

    const data = await executeGraphQLAuthMutation(
      `mutation SignIn($email: String!) {
        signIn(email: $email) {
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
      },
    );

    const token = String(data?.signIn?.token || "").trim();
    if (!token) {
      throw new Error("signIn did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    return data.signIn.user;
  }

  async signUp(input) {
    const firstName = String(input?.firstName || "").trim();
    const lastName = String(input?.lastName || "").trim();
    const email = String(input?.email || "").trim();
    if (!firstName || !email) {
      throw new Error("First name and email are required.");
    }

    const data = await executeGraphQLAuthMutation(
      `mutation SignUp($firstName: String!, $lastName: String, $email: String!) {
        signUp(firstName: $firstName, lastName: $lastName, email: $email) {
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
      },
    );

    const token = String(data?.signUp?.token || "").trim();
    if (!token) {
      throw new Error("signUp did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    return data.signUp.user;
  }

  signOut() {
    clearStoredToken(this.config.tokenStorageKey);
  }
}

class SupabaseAuthProvider {
  constructor(config) {
    this.name = "supabase";
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
    const password = String(input?.password || "").trim();
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: this.config.anonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error_description || payload?.msg || "Supabase signIn failed.");
    }

    const accessToken = String(payload?.access_token || "").trim();
    if (!accessToken) {
      throw new Error("Supabase signIn did not return access_token.");
    }

    setStoredToken(this.config.tokenStorageKey, accessToken);
    return {
      id: String(payload?.user?.id || ""),
      email: String(payload?.user?.email || email),
      firstName: String(payload?.user?.user_metadata?.first_name || "User"),
      lastName: payload?.user?.user_metadata?.last_name
        ? String(payload.user.user_metadata.last_name)
        : null,
    };
  }

  async signUp(input) {
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "").trim();
    const firstName = String(input?.firstName || "").trim();
    const lastName = String(input?.lastName || "").trim();
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await fetch(`${this.config.url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: this.config.anonKey,
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error_description || payload?.msg || "Supabase signUp failed.");
    }

    const accessToken = String(payload?.access_token || "").trim();
    if (accessToken) {
      setStoredToken(this.config.tokenStorageKey, accessToken);
    }

    return {
      id: String(payload?.user?.id || ""),
      email: String(payload?.user?.email || email),
      firstName: firstName || "User",
      lastName: lastName || null,
    };
  }

  signOut() {
    clearStoredToken(this.config.tokenStorageKey);
  }
}

export function createAuthProvider(config) {
  const providerName = String(config?.authProvider || "").trim().toLowerCase();
  if (providerName === "supabase") {
    return new SupabaseAuthProvider(config.auth.supabase);
  }
  return new CompanyhelmAuthProvider(config.auth.companyhelm);
}
