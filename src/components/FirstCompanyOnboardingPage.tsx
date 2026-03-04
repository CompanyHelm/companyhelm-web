import type { ChangeEvent, FormEvent } from "react";
import { Page } from "./Page.tsx";

interface FirstCompanyOnboardingPageProps {
  companyError: string;
  newCompanyName: string;
  isCreatingCompany: boolean;
  onNewCompanyNameChange: (value: string) => void;
  onCreateCompany: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export function FirstCompanyOnboardingPage({
  companyError,
  newCompanyName,
  isCreatingCompany,
  onNewCompanyNameChange,
  onCreateCompany,
}: FirstCompanyOnboardingPageProps) {
  return (
    <Page>
      <div className="page-stack">
        <section className="panel first-company-onboarding-panel">
          <p className="eyebrow">Welcome</p>
          <h1>Create your first company</h1>
          <p className="subcopy">
            You are signed in, but you are not a member of any company yet. Create your first
            company to continue.
          </p>
          <form className="first-company-onboarding-form" onSubmit={onCreateCompany}>
            <label htmlFor="first-company-name">Company name</label>
              <input
                id="first-company-name"
                value={newCompanyName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onNewCompanyNameChange(event.target.value)}
                placeholder="e.g. Acme Labs"
                disabled={isCreatingCompany}
                autoComplete="organization"
            />
            <button type="submit" disabled={isCreatingCompany}>
              {isCreatingCompany ? "Creating..." : "Create company"}
            </button>
          </form>
          {companyError ? <p className="error-banner">{companyError}</p> : null}
        </section>
      </div>
    </Page>
  );
}
