import type { ChangeEvent } from "react";
import { Page } from "../components/Page.tsx";
import type { AppFlags, OnboardingPhase } from "../utils/persistence.ts";

const PHASE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "none (auto-detect)" },
  { value: "runner", label: "runner" },
  { value: "configuring", label: "configuring" },
  { value: "agent", label: "agent" },
  { value: "github", label: "github" },
  { value: "done", label: "done" },
];

interface FlagsPageProps {
  flags: AppFlags;
  onboardingPhase: OnboardingPhase;
  onFlagChange: (key: keyof AppFlags, value: boolean) => void;
  onResetOnboarding: () => void;
  onPhaseChange: (phase: OnboardingPhase) => void;
}

const FLAG_DEFINITIONS: { key: keyof AppFlags; label: string; description: string }[] = [
  {
    key: "skipOnboarding",
    label: "Skip onboarding",
    description: "Skip the onboarding flow when no runners are registered.",
  },
];

export function FlagsPage({ flags, onboardingPhase, onFlagChange, onResetOnboarding, onPhaseChange }: FlagsPageProps) {
  const phaseValue = onboardingPhase || "none";

  return (
    <Page>
      <div className="page-stack">
        <section className="panel">
          <p className="eyebrow">Debug</p>
          <h1>Flags</h1>
          <p className="subcopy">
            Internal settings for debugging and testing. Changes take effect immediately.
          </p>
        </section>

        <section className="panel flags-list-panel">
          {FLAG_DEFINITIONS.map((flag) => (
            <label key={flag.key} className="flags-row">
              <div className="flags-row-text">
                <span className="flags-row-label">{flag.label}</span>
                <span className="flags-row-desc">{flag.description}</span>
              </div>
              <input
                type="checkbox"
                className="flags-toggle"
                checked={flags[flag.key]}
                onChange={(event) => onFlagChange(flag.key, event.target.checked)}
              />
            </label>
          ))}
        </section>

        <section className="panel">
          <p className="panel-section-title">Onboarding</p>
          <div className="flags-row">
            <div className="flags-row-text">
              <span className="flags-row-label">Current phase</span>
              <span className="flags-row-desc">
                Persisted onboarding phase stored in localStorage.
              </span>
            </div>
            <select
              className="flags-phase-select"
              value={phaseValue}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                const val = event.target.value;
                onPhaseChange(val === "none" ? null : val as OnboardingPhase);
              }}
            >
              {PHASE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flags-row">
            <div className="flags-row-text">
              <span className="flags-row-label">Reset onboarding</span>
              <span className="flags-row-desc">
                Clear persisted phase and re-evaluate from current data.
              </span>
            </div>
            <button type="button" className="flags-reset-btn" onClick={onResetOnboarding}>
              Reset
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}
