import { useMemo } from "react";
import { Page } from "../components/Page.tsx";
import {
  formatTimestamp,
  normalizeRunnerConnectionState,
  toSortableTimestamp,
} from "../utils/formatting.ts";
import type { AgentRunner, Company, TaskItem } from "../types/domain.ts";

interface DashboardPageProps {
  selectedCompanyId: string;
  selectedCompany: Company | null;
  tasks: TaskItem[];
  agentRunners: AgentRunner[];
  isLoadingTasks: boolean;
  isLoadingRunners: boolean;
  taskError: string;
  runnerError: string;
  onNavigate: (page: string) => void;
}

export function DashboardPage({
  selectedCompanyId,
  selectedCompany,
  tasks,
  agentRunners,
  isLoadingTasks,
  isLoadingRunners,
  taskError,
  runnerError,
  onNavigate,
}: DashboardPageProps) {
  const connectedRunnerCount = useMemo(() => {
    return agentRunners.filter((runner) => runner.isConnected === true)
      .length;
  }, [agentRunners]);

  const disconnectedRunnerCount = useMemo(() => {
    return agentRunners.length - connectedRunnerCount;
  }, [agentRunners.length, connectedRunnerCount]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 5);
  }, [tasks]);

  const recentRunners = useMemo(() => {
    return [...agentRunners]
      .sort((a, b) => toSortableTimestamp(b.lastSeenAt) - toSortableTimestamp(a.lastSeenAt))
      .slice(0, 5);
  }, [agentRunners]);

  return (
    <Page><div className="page-stack">
      <section className="dashboard-grid">
        <article className="panel stat-panel">
          <p className="stat-label">Tasks</p>
          <p className="stat-value">{tasks.length}</p>
          <button type="button" className="secondary-btn" onClick={() => onNavigate("tasks")}>
            Open task page
          </button>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Runners</p>
          <p className="stat-value">{agentRunners.length}</p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigate("agent-runner")}
          >
            Open runner page
          </button>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Connected</p>
          <p className="stat-value">{connectedRunnerCount}</p>
          <p className="stat-footnote">healthy connections</p>
        </article>

        <article className="panel stat-panel">
          <p className="stat-label">Disconnected</p>
          <p className="stat-value">{disconnectedRunnerCount}</p>
          <p className="stat-footnote">needs attention</p>
        </article>
      </section>

      {taskError ? <p className="error-banner">Task error: {taskError}</p> : null}
      {runnerError ? <p className="error-banner">Runner error: {runnerError}</p> : null}

      <section className="dashboard-panels">
        <article className="panel">
          <header className="panel-header panel-header-row">
            <h2>Latest tasks</h2>
            <button type="button" className="secondary-btn" onClick={() => onNavigate("tasks")}>
              Manage
            </button>
          </header>

          {isLoadingTasks ? <p className="empty-hint">Loading tasks...</p> : null}
          {!isLoadingTasks && recentTasks.length === 0 ? (
            <p className="empty-hint">No tasks yet.</p>
          ) : null}

          {recentTasks.length > 0 ? (
            <ul className="compact-list">
              {recentTasks.map((task) => (
                <li key={`dashboard-task-${task.id}`} className="compact-item">
                  <div>
                    <strong>{task.name}</strong>
                    <p>{task.description || "No description provided."}</p>
                  </div>
                  <span className="task-id">#{task.id}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel">
          <header className="panel-header panel-header-row">
            <h2>Runner heartbeat</h2>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onNavigate("agent-runner")}
            >
              Inspect
            </button>
          </header>

          {isLoadingRunners ? <p className="empty-hint">Loading runners...</p> : null}
          {!isLoadingRunners && recentRunners.length === 0 ? (
            <p className="empty-hint">No runners registered yet.</p>
          ) : null}

          {recentRunners.length > 0 ? (
            <ul className="compact-list">
              {recentRunners.map((runner) => {
                const connectionState = normalizeRunnerConnectionState(runner.isConnected);
                return (
                  <li key={`dashboard-runner-${runner.id}`} className="compact-item">
                    <div>
                      <strong>{String(runner.name || "").trim() || "Unnamed runner"}</strong>
                      <p>{connectionState} · Seen {formatTimestamp(runner.lastSeenAt)}</p>
                    </div>
                    <span className={`runner-status runner-status-${connectionState}`}>
                      {connectionState}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </article>

      </section>
    </div></Page>
  );
}
