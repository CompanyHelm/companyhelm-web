import { useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Page } from "../components/Page.tsx";
import type { Skill } from "../types/domain.ts";

interface SkillsPageProps {
  skills: Skill[];
  activeSkill: Skill | null;
  isLoadingSkills: boolean;
  skillError: string;
  onOpenSkill: (skillId: string) => void;
  onOpenGitSkillPackage: (packageId: string) => void;
}

export function SkillsPage({
  skills,
  activeSkill,
  isLoadingSkills,
  skillError,
  onOpenSkill,
  onOpenGitSkillPackage,
}: SkillsPageProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  if (activeSkill) {
    const gitSkillPackage = activeSkill.gitSkillPackage || null;

    return (
      <Page><div className="page-stack">
        <section className="panel list-panel">
          {skillError ? <p className="error-banner">{skillError}</p> : null}

          <p className="chat-card-meta" style={{ padding: "0.2rem 0" }}>
            {activeSkill.description || "No description provided."}
          </p>

          <div className="skill-detail-info">
            <p className="chat-card-meta">Files: {activeSkill.fileList?.length || 0}</p>
          </div>

          {gitSkillPackage ? (
            <div className="skill-detail-info">
              <p className="chat-card-meta">
                Package: {gitSkillPackage.packageName}
                {" · "}Path: {activeSkill.gitSkillPackagePath || "-"}
              </p>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onOpenGitSkillPackage(gitSkillPackage.id)}
              >
                Open package
              </button>
            </div>
          ) : null}

          <section className="skill-detail-section">
            <div className="skill-detail-section-header">
              <h3>Content</h3>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowRawMarkdown((current) => !current)}
              >
                {showRawMarkdown ? "Rendered" : "Raw"}
              </button>
            </div>
            {showRawMarkdown ? (
              <pre className="skill-content-raw">{activeSkill.content || ""}</pre>
            ) : (
              <div className="chat-message-content chat-message-content-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSkill.content || ""}</ReactMarkdown>
              </div>
            )}
          </section>

          {Array.isArray(activeSkill.fileList) && activeSkill.fileList.length > 0 ? (
            <section className="skill-detail-section">
              <h3>Files</h3>
              <ul className="skill-file-list">
                {activeSkill.fileList.map((filePath) => (
                  <li key={filePath}>
                    <code>{filePath}</code>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div></Page>
    );
  }

  return (
    <Page><div className="page-stack">
      {skillError ? <p className="error-banner">{skillError}</p> : null}
      {isLoadingSkills ? <p className="empty-hint">Loading skills...</p> : null}

      {skills.length > 0 ? (
        <section className="panel list-panel">
          <header className="panel-header panel-header-row">
            <h2>Skills</h2>
            <span className="chat-card-meta">{skills.length} skills</span>
          </header>
          <ul className="chat-card-list">
            {skills.map((skill) => (
              <li
                key={`skill-${skill.id}`}
                className="chat-card"
                onClick={() => onOpenSkill(skill.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event: KeyboardEvent<HTMLLIElement>) => {
                  if (event.key === "Enter") {
                    onOpenSkill(skill.id);
                  }
                }}
              >
                <div className="chat-card-main">
                  <p className="chat-card-title">
                    <strong>{skill.name}</strong>
                  </p>
                  {skill.description ? <p className="chat-card-meta">{skill.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : !isLoadingSkills ? (
        <section className="panel list-panel">
          <p className="empty-hint">No skills yet.</p>
        </section>
      ) : null}
    </div></Page>
  );
}
