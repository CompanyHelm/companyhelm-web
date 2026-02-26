export function ProfilePage({ selectedCompany, tasks, skills, agents, agentRunners }) {
  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <p className="eyebrow">Profile</p>
        <h1>Workspace profile</h1>
        <p className="subcopy">
          Account preferences can live here. This page currently shows your active workspace
          context.
        </p>
        <p className="context-pill">Company: {selectedCompany ? selectedCompany.name : "none"}</p>
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
    </div>
  );
}
