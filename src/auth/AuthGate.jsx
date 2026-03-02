import React, { useMemo, useState } from "react";
import { authProvider } from "./runtime.js";

const SIGN_IN_MODE = "signIn";
const SIGN_UP_MODE = "signUp";

function getInitialFormState() {
  return {
    firstName: "",
    lastName: "",
    email: "",
  };
}

export default function AuthGate({ children }) {
  const [mode, setMode] = useState(SIGN_IN_MODE);
  const [formState, setFormState] = useState(getInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => authProvider.hasSession());

  const isSignInMode = mode === SIGN_IN_MODE;
  const title = useMemo(
    () => (isSignInMode ? "Sign In" : "Sign Up"),
    [isSignInMode],
  );

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
    try {
      if (isSignInMode) {
        await authProvider.signIn({
          email: formState.email,
        });
      } else {
        await authProvider.signUp({
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.email,
        });
      }

      setIsAuthenticated(true);
      setFormState(getInitialFormState());
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
          {!isSignInMode ? (
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
          {!isSignInMode ? (
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
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : title}
          </button>
          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        </form>
        <div className="auth-mode-toggle">
          <button
            type="button"
            onClick={() => {
              setMode(isSignInMode ? SIGN_UP_MODE : SIGN_IN_MODE);
              setErrorMessage("");
            }}
          >
            {isSignInMode ? "Need an account? Sign Up" : "Have an account? Sign In"}
          </button>
        </div>
      </section>
    </main>
  );
}
