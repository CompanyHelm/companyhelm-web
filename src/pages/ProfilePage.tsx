import { Page } from "../components/Page.tsx";

export function ProfilePage({
  currentUser,
  currentUserError,
  isLoadingCurrentUser,
  selectedCompany,
  tasks,
  skills,
  agents,
  agentRunners,
}: any) {
  const firstName = String(currentUser?.firstName || "").trim();
  const lastName = String(currentUser?.lastName || "").trim();
  const email = String(currentUser?.email || "").trim();
  const displayName = `${firstName} ${lastName}`.trim() || firstName || "Unknown user";

  return (
    <Page><div className="page-stack">
      <section className="panel profile-user-panel">
        <header className="panel-header">
          <h2>User Profile</h2>
        </header>
        {isLoadingCurrentUser ? <p className="empty-hint">Loading profile...</p> : null}
        {currentUserError ? <p className="error-banner">{currentUserError}</p> : null}
        {!isLoadingCurrentUser && !currentUserError && currentUser ? (
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
