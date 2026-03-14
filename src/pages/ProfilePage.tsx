import { useEffect, useState, type FormEvent } from "react";
import { Page } from "../components/Page.tsx";

export function ProfilePage({
  currentUser,
  currentUserError,
  isLoadingCurrentUser,
  isSavingProfileName,
  selectedCompany,
  tasks,
  skills,
  agents,
  agentRunners,
  onSaveProfileName,
  onSignOut,
}: any) {
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");

  useEffect(() => {
    setFirstNameDraft(String(currentUser?.firstName || ""));
    setLastNameDraft(String(currentUser?.lastName || ""));
  }, [currentUser?.firstName, currentUser?.lastName, currentUser?.id]);

  const firstName = String(currentUser?.firstName || "").trim();
  const lastName = String(currentUser?.lastName || "").trim();
  const email = String(currentUser?.email || "").trim();
  const displayName = `${firstName} ${lastName}`.trim() || firstName || "Unknown user";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSaveProfileName) {
      return;
    }
    await onSaveProfileName({
      firstName: firstNameDraft,
      lastName: lastNameDraft,
    });
  };

  return (
    <Page><div className="page-stack">
      <section className="panel profile-user-panel">
        <header className="panel-header">
          <div className="panel-header-row">
            <h2>User Profile</h2>
            <button type="button" className="danger-btn" onClick={onSignOut}>Log out</button>
          </div>
        </header>
        {isLoadingCurrentUser ? <p className="empty-hint">Loading profile...</p> : null}
        {currentUserError ? <p className="error-banner">{currentUserError}</p> : null}
        {!isLoadingCurrentUser && currentUser ? (
          <>
            <form className="profile-user-form" onSubmit={handleSubmit}>
              <div className="profile-user-form-grid">
                <label className="profile-user-form-field" htmlFor="profile-first-name">
                  <span className="profile-user-form-label">First name</span>
                  <input
                    id="profile-first-name"
                    className="chat-settings-input"
                    value={firstNameDraft}
                    onChange={(event) => setFirstNameDraft(event.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="profile-user-form-field" htmlFor="profile-last-name">
                  <span className="profile-user-form-label">Last name</span>
                  <input
                    id="profile-last-name"
                    className="chat-settings-input"
                    value={lastNameDraft}
                    onChange={(event) => setLastNameDraft(event.target.value)}
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <div className="profile-user-actions">
                <button type="submit" className="primary-button" disabled={isSavingProfileName}>
                  {isSavingProfileName ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
            <dl className="profile-user-details">
              <div>
                <dt>Name</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{email || "Not set"}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{selectedCompany?.name || "No company selected"}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </section>
      <section className="runner-summary-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Tasks</p>
          <p className="stat-value">{tasks.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Skills</p>
          <p className="stat-value">{skills.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Agents</p>
          <p className="stat-value">{agents.length}</p>
        </article>
        <article className="panel stat-panel">
          <p className="stat-label">Runners</p>
          <p className="stat-value">{agentRunners.length}</p>
        </article>
      </section>
    </div></Page>
  );
}
