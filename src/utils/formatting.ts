import { normalizeSkillType } from "./normalization.ts";
import { SKILL_TYPE_SKILLSMP } from "./constants.ts";

export function formatSkillLabel(skill: any) {
  if (!skill || typeof skill !== "object") {
    return "";
  }
  const skillTypeLabel =
    normalizeSkillType(skill.skillType) === SKILL_TYPE_SKILLSMP ? " (SkillsMP)" : "";
  return `${skill.name}${skillTypeLabel}`;
}

export function normalizeRunnerConnectionState(value: any) {
  return value === true ? "connected" : "disconnected";
}

export function formatRunnerLifecycleStatus(value: any) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "unknown";
}

export function isRunnerReadyAndConnected(runner: any) {
  return runner?.isConnected === true && formatRunnerLifecycleStatus(runner?.status) === "ready";
}

export function formatRunnerLabel(runner: any) {
  if (!runner) {
    return "Unassigned";
  }
  return `${runner.id.slice(0, 8)} (${normalizeRunnerConnectionState(runner.isConnected)}, ${formatRunnerLifecycleStatus(runner.status)})`;
}

export function toSortableTimestamp(value: any) {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
}

export function formatTimestamp(value: any) {
  if (!value) {
    return "never";
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }
  return parsedDate.toLocaleString();
}

export function normalizeChatStatus(value: any) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "running" ? "running" : "idle";
}
