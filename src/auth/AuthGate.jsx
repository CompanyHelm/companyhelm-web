import React, { useEffect, useMemo, useState } from "react";
import { authProvider } from "./runtime.js";
import { normalizePathname, setBrowserPath } from "../utils/path.js";

const SIGN_IN_MODE = "signIn";
const SIGN_UP_MODE = "signUp";
const SIGN_IN_PATH = "/sign-in";

function getInitialFormState() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  };
}

export default function AuthGate({ children }) {
  const [mode, setMode] = useState(SIGN_IN_MODE);
  const [formState, setFormState] = useState(getInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => authProvider.hasSession());
  const requiresPassword = Boolean(authProvider.requiresPassword);
  const requiresProfileOnSignUp = Boolean(authProvider.requiresProfileOnSignUp);

  const isSignInMode = mode === SIGN_IN_MODE;
  const title = useMemo(
    () => (isSignInMode ? "Sign In" : "Sign Up"),
    [isSignInMode],
  );

  useEffect(() => {
    const currentPath = normalizePathname(window.location.pathname);
    if (!isAuthenticated) {
      if (currentPath !== SIGN_IN_PATH) {
        setBrowserPath(SIGN_IN_PATH, { replace: true });
      }
      return;
    }

    if (currentPath === SIGN_IN_PATH) {
      setBrowserPath("/dashboard", { replace: true });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return authProvider.subscribeAuthStateChange((hasSession) => {
      setIsAuthenticated(Boolean(hasSession));
    });
  }, []);

  const handleChange = (fieldName) => (event) => {
    const nextValue = event?.target?.value ?? "";
    setFormState((previous) => ({
      ...previous,
      [fieldName]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      let result;
      if (isSignInMode) {
        result = await authProvider.signIn({
          email: formState.email,
          password: formState.password,
        });
      } else {
        result = await authProvider.signUp({
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.email,
          password: formState.password,
        });
      }

      const hasSession = authProvider.hasSession();
      setIsAuthenticated(hasSession);
      setFormState(getInitialFormState());
      if (!hasSession && result?.requiresEmailConfirmation) {
        setSuccessMessage("Sign up succeeded. Check your email to confirm your account before signing in.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <main className="auth-gate">
      <section className="auth-card">
        <h1>{title}</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isSignInMode && requiresProfileOnSignUp ? (
            <label htmlFor="auth-first-name">
              First name
              <input
                id="auth-first-name"
                type="text"
                value={formState.firstName}
                onChange={handleChange("firstName")}
                required
              />
            </label>
          ) : null}
          {!isSignInMode && requiresProfileOnSignUp ? (
            <label htmlFor="auth-last-name">
              Last name
              <input
                id="auth-last-name"
                type="text"
                value={formState.lastName}
                onChange={handleChange("lastName")}
              />
            </label>
          ) : null}
          <label htmlFor="auth-email">
            Email
            <input
              id="auth-email"
              type="email"
              value={formState.email}
              onChange={handleChange("email")}
              required
            />
          </label>
          {requiresPassword ? (
            <label htmlFor="auth-password">
              Password
              <input
                id="auth-password"
                type="password"
                value={formState.password}
                onChange={handleChange("password")}
                required
                minLength={8}
                autoComplete={isSignInMode ? "current-password" : "new-password"}
              />
            </label>
          ) : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : title}
          </button>
          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
          {successMessage ? <p className="success-banner">{successMessage}</p> : null}
        </form>
        <div className="auth-mode-toggle">
          <button
            type="button"
            onClick={() => {
              setMode(isSignInMode ? SIGN_UP_MODE : SIGN_IN_MODE);
              setErrorMessage("");
              setSuccessMessage("");
            }}
          >
            {isSignInMode ? "Need an account? Sign Up" : "Have an account? Sign In"}
          </button>
        </div>
      </section>
    </main>
  );
}
