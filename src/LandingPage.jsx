const SIGNALS = [
  { label: "Faster planning cycles", value: "2.4x" },
  { label: "Task visibility", value: "100%" },
  { label: "Runner uptime checks", value: "24/7" },
];

const CAPABILITIES = [
  {
    title: "Company-scoped command center",
    description:
      "Keep tasks, skills, runners, and agents in one operational surface with clean company boundaries.",
  },
  {
    title: "Runner-aware orchestration",
    description:
      "Provision agent runners with callback wiring and auth handling, then monitor status without leaving flow.",
  },
  {
    title: "Codex chat loop",
    description:
      "Move from planned work to live execution in chat while preserving context, command IDs, and response history.",
  },
];

const LOOP_STEPS = [
  "Define and sequence tasks with explicit dependencies.",
  "Attach skills and runtime settings to each agent.",
  "Initialize runners and push work through a controlled command path.",
  "Observe message history and iterate from a single timeline.",
];

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <a className="landing-brand" href="#top">
          <span className="landing-brand-mark">CH</span>
          <span>CompanyHelm</span>
        </a>
        <nav className="landing-nav" aria-label="Primary">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <a href="#launch">Launch</a>
        </nav>
        <a className="landing-btn landing-btn-ghost" href="/?app=1#dashboard">
          Open Console
        </a>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero-copy landing-reveal">
            <p className="landing-kicker">Operations Layer For Agent Teams</p>
            <h1>Run AI delivery like mission control, not a loose script pile.</h1>
            <p className="landing-lead">
              CompanyHelm is the coordination plane for teams running multiple agents.
              Organize tasks, wire runner infrastructure, and keep execution feedback in
              one disciplined loop.
            </p>
            <div className="landing-actions">
              <a className="landing-btn landing-btn-primary" href="/?app=1#dashboard">
                Launch the app
              </a>
              <a className="landing-btn landing-btn-ghost" href="#workflow">
                See workflow
              </a>
            </div>
            <div className="landing-signals" role="list" aria-label="Operational signals">
              {SIGNALS.map((signal) => (
                <article key={signal.label} role="listitem" className="landing-signal-card">
                  <p>{signal.value}</p>
                  <span>{signal.label}</span>
                </article>
              ))}
            </div>
          </div>

          <aside className="landing-hero-panel landing-reveal landing-delay-1" aria-label="Preview">
            <p className="landing-panel-title">Live Control Snapshot</p>
            <div className="landing-console-strip">
              <span>Company</span>
              <strong>Acme Labs</strong>
            </div>
            <ul className="landing-timeline">
              <li>
                <span>09:14</span>
                <p>Task graph synced with 12 dependencies</p>
              </li>
              <li>
                <span>09:16</span>
                <p>Runner `edge-north` heartbeat confirmed</p>
              </li>
              <li>
                <span>09:18</span>
                <p>Codex command executed and response streamed</p>
              </li>
            </ul>
            <div className="landing-console-foot">
              <p>Need full visibility?</p>
              <a href="/?app=1#chat">Open Codex Chat</a>
            </div>
          </aside>
        </section>

        <section className="landing-section" id="capabilities">
          <div className="landing-section-head landing-reveal">
            <p className="landing-kicker">What You Get</p>
            <h2>A practical operations stack for multi-agent execution.</h2>
          </div>
          <div className="landing-capability-grid">
            {CAPABILITIES.map((capability, index) => (
              <article
                key={capability.title}
                className={`landing-capability-card landing-reveal landing-delay-${index + 1}`}
              >
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-workflow" id="workflow">
          <div className="landing-section-head landing-reveal">
            <p className="landing-kicker">Execution Loop</p>
            <h2>Move from planning to agent output in four controlled steps.</h2>
          </div>
          <ol className="landing-step-list">
            {LOOP_STEPS.map((step, index) => (
              <li key={step} className="landing-reveal landing-delay-1">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section landing-launch" id="launch">
          <div className="landing-launch-card landing-reveal">
            <p className="landing-kicker">Ready To Operate</p>
            <h2>Bring your agents into one accountable system.</h2>
            <p>
              Start in the console to create a company scope, define tasks, and connect
              runner infrastructure in minutes.
            </p>
            <a className="landing-btn landing-btn-primary" href="/?app=1#settings">
              Enter CompanyHelm
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
