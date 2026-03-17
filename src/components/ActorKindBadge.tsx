import type { Actor } from "../types/domain.ts";

interface ActorKindBadgeProps {
  kind: Actor["kind"];
  className?: string;
}

function getActorKindLabel(kind: Actor["kind"]) {
  if (kind === "user") {
    return "Human";
  }
  if (kind === "external_agent") {
    return "External AI";
  }
  return "AI";
}

function ActorKindIcon({ kind }: { kind: Actor["kind"] }) {
  if (kind === "user") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M9.5 9.5h5v5h-5z" />
    </svg>
  );
}

export function ActorKindBadge({ kind, className = "" }: ActorKindBadgeProps) {
  const resolvedClassName = `actor-kind-badge actor-kind-badge-${kind}${className ? ` ${className}` : ""}`;

  return (
    <span className={resolvedClassName}>
      <span className="actor-kind-badge-icon">
        <ActorKindIcon kind={kind} />
      </span>
      <span>{getActorKindLabel(kind)}</span>
    </span>
  );
}
