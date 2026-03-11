import {
  createClient,
  type AuthChangeEvent,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { GRAPHQL_URL } from "../utils/constants.ts";
import { getActiveCompanyId } from "../utils/company-context.ts";

export interface SignInInput {
  email?: string;
  password?: string;
}

export interface SignUpInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface CompanyhelmAuthConfig {
  tokenStorageKey: string;
}

export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  tokenStorageKey: string;
}

export interface CreateAuthProviderConfig {
  authProvider: string;
  api?: {
    graphqlApiUrl?: string;
  };
  auth: {
    companyhelm: CompanyhelmAuthConfig;
    supabase?: SupabaseAuthConfig;
  };
}

export interface SupabaseSignUpResult {
  user: User | null;
  requiresEmailConfirmation: boolean;
}

export type AuthProviderSignInResult = Record<string, unknown> | User | null;
export type AuthProviderSignUpResult = Record<string, unknown> | SupabaseSignUpResult;
export type AuthStateListener = (hasSession: boolean) => void;

export interface AuthProviderContract {
  name: "companyhelm" | "supabase";
  requiresPassword: boolean;
  requiresProfileOnSignUp: boolean;
  hasSession(): boolean;
  getAuthorizationHeaderValue(): string | null;
  signIn(input: SignInInput): Promise<AuthProviderSignInResult>;
  signUp(input: SignUpInput): Promise<AuthProviderSignUpResult>;
  signOut(): void;
  subscribeAuthStateChange(listener: AuthStateListener): () => void;
}

interface GraphQLPayloadError {
  message?: string;
}

interface GraphQLPayload {
  data?: Record<string, unknown>;
  errors?: GraphQLPayloadError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function getStoredToken(storageKey: string): string {
  const storage = getBrowserStorage();
  if (!storage) {
    return "";
  }

  return String(storage.getItem(storageKey) || "").trim();
}

function setStoredToken(storageKey: string, token: string): void {
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

function clearStoredToken(storageKey: string): void {
  const storage = getBrowserStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(storageKey);
}

function decodeJwtPayloadSegment(segment: string): Record<string, unknown> | null {
  const normalizedSegment = String(segment || "").trim();
  if (!normalizedSegment) {
    return null;
  }

  const base64 = normalizedSegment
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(normalizedSegment.length / 4) * 4, "=");

  try {
    const decoded = typeof globalThis.atob === "function"
      ? globalThis.atob(base64)
      : Buffer.from(base64, "base64").toString("utf8");
    return toRecord(JSON.parse(decoded));
  } catch {
    return null;
  }
}

function isCompanyhelmJwtPayload(payload: Record<string, unknown> | null): boolean {
  if (!payload) {
    return false;
  }

  const issuer = String(payload.iss || "").trim();
  const provider = String(payload.provider || "").trim();
  const audience = payload.aud;
  const audienceValues = Array.isArray(audience)
    ? audience.map((value) => String(value || "").trim()).filter(Boolean)
    : [String(audience || "").trim()].filter(Boolean);

  return provider === "companyhelm"
    && issuer.startsWith("companyhelm.")
    && audienceValues.includes("companyhelm-web");
}

function getValidatedCompanyhelmToken(storageKey: string): string {
  const token = getStoredToken(storageKey);
  if (!token) {
    return "";
  }

  const tokenParts = token.split(".");
  const payload = tokenParts.length === 3 ? decodeJwtPayloadSegment(tokenParts[1] || "") : null;
  if (isCompanyhelmJwtPayload(payload)) {
    return token;
  }

  clearStoredToken(storageKey);
  return "";
}

async function executeGraphQLAuthMutation(
  query: string,
  variables: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
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
      variables,
    }),
  });

  const rawPayload = await response.json();
  const payload: GraphQLPayload = isRecord(rawPayload) ? (rawPayload as GraphQLPayload) : {};
  if (!response.ok) {
    const message = payload.errors?.[0]?.message || `GraphQL request failed with status ${response.status}.`;
    throw new Error(message);
  }
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error(payload.errors[0]?.message || "GraphQL auth mutation failed.");
  }

  return toRecord(payload.data);
}

abstract class AuthProviderBase implements AuthProviderContract {
  abstract name: "companyhelm" | "supabase";
  abstract requiresPassword: boolean;
  abstract requiresProfileOnSignUp: boolean;

  private authStateListeners: Set<AuthStateListener>;

  constructor() {
    this.authStateListeners = new Set<AuthStateListener>();
  }

  abstract hasSession(): boolean;
  abstract getAuthorizationHeaderValue(): string | null;
  abstract signIn(input: SignInInput): Promise<AuthProviderSignInResult>;
  abstract signUp(input: SignUpInput): Promise<AuthProviderSignUpResult>;
  abstract signOut(): void;

  subscribeAuthStateChange(listener: AuthStateListener): () => void {
    if (typeof listener !== "function") {
      return () => {};
    }
    this.authStateListeners.add(listener);
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  protected notifyAuthStateChange(): void {
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
  name: "companyhelm";
  requiresPassword: boolean;
  requiresProfileOnSignUp: boolean;
  private config: CompanyhelmAuthConfig;

  constructor(config: CompanyhelmAuthConfig) {
    super();
    this.name = "companyhelm";
    this.requiresPassword = true;
    this.requiresProfileOnSignUp = true;
    this.config = config;
  }

  private getToken(): string {
    return getValidatedCompanyhelmToken(this.config.tokenStorageKey);
  }

  hasSession(): boolean {
    return Boolean(this.getToken());
  }

  getAuthorizationHeaderValue(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return `Bearer ${token}`;
  }

  async signIn(input: SignInInput): Promise<Record<string, unknown>> {
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

    const signInPayload = toRecord(data.signIn);
    const token = String(signInPayload.token || "").trim();
    if (!token) {
      throw new Error("signIn did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return toRecord(signInPayload.user);
  }

  async signUp(input: SignUpInput): Promise<Record<string, unknown>> {
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

    const signUpPayload = toRecord(data.signUp);
    const token = String(signUpPayload.token || "").trim();
    if (!token) {
      throw new Error("signUp did not return an auth token.");
    }

    setStoredToken(this.config.tokenStorageKey, token);
    this.notifyAuthStateChange();
    return toRecord(signUpPayload.user);
  }

  signOut(): void {
    clearStoredToken(this.config.tokenStorageKey);
    this.notifyAuthStateChange();
  }
}

type SupabaseSignUpPayload = Parameters<SupabaseClient["auth"]["signUp"]>[0];

class SupabaseAuthProvider extends AuthProviderBase {
  name: "supabase";
  requiresPassword: boolean;
  requiresProfileOnSignUp: boolean;
  private client: SupabaseClient;
  private config: SupabaseAuthConfig;

  constructor(config: SupabaseAuthConfig) {
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

    this.client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setStoredToken(this.config.tokenStorageKey, session?.access_token || "");
      this.notifyAuthStateChange();
    });
    void this.syncTokenFromSession();
  }

  private async syncTokenFromSession(): Promise<void> {
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

  private getToken(): string {
    return getStoredToken(this.config.tokenStorageKey);
  }

  hasSession(): boolean {
    return Boolean(this.getToken());
  }

  getAuthorizationHeaderValue(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    return `Bearer ${token}`;
  }

  async signIn(input: SignInInput): Promise<User | null> {
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

  async signUp(input: SignUpInput): Promise<SupabaseSignUpResult> {
    const firstName = String(input?.firstName || "").trim();
    const lastName = String(input?.lastName || "").trim();
    const email = String(input?.email || "").trim();
    const password = String(input?.password || "");
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const metadata: Record<string, string> = {};
    if (firstName) {
      metadata.firstName = firstName;
    }
    if (lastName) {
      metadata.lastName = lastName;
    }

    const signUpInput: SupabaseSignUpPayload = {
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

  signOut(): void {
    clearStoredToken(this.config.tokenStorageKey);
    this.notifyAuthStateChange();
    void this.client.auth.signOut();
  }
}

export function createAuthProvider(config: CreateAuthProviderConfig): AuthProviderContract {
  const providerName = String(config?.authProvider || "").trim().toLowerCase();
  if (providerName === "companyhelm") {
    return new CompanyhelmAuthProvider(config.auth.companyhelm);
  }
  if (providerName === "supabase") {
    if (!config.auth.supabase) {
      throw new Error("Supabase auth provider requires auth.supabase configuration.");
    }
    return new SupabaseAuthProvider(config.auth.supabase);
  }

  throw new Error(`Unsupported auth provider "${config?.authProvider}".`);
}
