export interface NamedEntity {
  id: string;
  name: string;
}

export interface Company extends NamedEntity {}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
}

export interface RunnerModelEntry {
  id: string;
  name: string;
  reasoningLevels: string[];
  isAvailable: boolean;
}

export interface RunnerSdkEntry {
  id: string;
  name: string;
  status?: string;
  isAvailable: boolean;
  codexAuthStatus?: string | null;
  codexAuthType?: string | null;
  errorMessage?: string | null;
  availableModels: RunnerModelEntry[];
}

export interface RunnerCodexModelEntry {
  id: string;
  sdkId: string;
  name: string;
  reasoning: string[];
  isAvailable: boolean;
}

export type RunnerCodexModelEntriesById = Map<string, RunnerCodexModelEntry[]>;

export interface AgentRunner extends NamedEntity {
  companyId?: string;
  callbackUrl?: string | null;
  hasAuthSecret?: boolean;
  availableAgentSdks?: RunnerSdkEntry[];
  isConnected?: boolean;
  lastHealthCheckAt?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RunnerSdkCodexAuthEvent {
  runnerId: string;
  sdkId: string;
  codexAuthStatus: string;
  codexAuthType?: string | null;
  deviceCode?: string | null;
  errorMessage?: string | null;
}

export interface SkillRef extends NamedEntity {}
export interface RoleRef extends NamedEntity {}
export interface SkillGroupRef extends NamedEntity {}
export interface McpServerRef extends NamedEntity {}

export interface GitSkillPackage {
  id: string;
  companyId?: string;
  packageName: string;
  gitRepositoryUrl: string;
  hostingProvider?: string;
  currentCommitHash?: string;
  currentReference?: string;
  skills?: SkillRef[];
}

export interface Skill extends NamedEntity {
  companyId?: string;
  description?: string;
  content?: string;
  instructions?: string;
  fileList?: string[];
  gitSkillPackagePath?: string | null;
  roles?: RoleRef[];
  gitSkillPackage?: GitSkillPackage | null;
}

export interface Role extends NamedEntity {
  companyId?: string;
  parentRole?: RoleRef | null;
  parentId?: string;
  subRoles?: RoleRef[];
  skills?: SkillRef[];
  skillGroups?: SkillGroupRef[];
  effectiveSkills?: SkillRef[];
  mcpServers?: McpServerRef[];
  effectiveMcpServers?: McpServerRef[];
}

export interface SkillGroup extends NamedEntity {
  companyId?: string;
  parentSkillGroup?: SkillGroupRef | null;
  skills?: SkillRef[];
}

export interface McpKeyValueEntry {
  key: string;
  value: string;
}

export interface McpServer extends NamedEntity {
  companyId?: string;
  transportType?: string;
  url?: string;
  command?: string;
  args?: string[];
  envVars?: McpKeyValueEntry[];
  authType?: string;
  bearerTokenSecretId?: string | null;
  oauthConnectionStatus?: string | null;
  oauthLastError?: string | null;
  customHeaders?: McpKeyValueEntry[];
  enabled?: boolean;
}

export interface Secret extends NamedEntity {
  companyId?: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Agent extends NamedEntity {
  companyId?: string;
  status?: string;
  agentRunnerId?: string;
  roleIds?: string[];
  skillIds?: string[];
  roles?: RoleRef[];
  mcpServerIds?: string[];
  installedSkills?: SkillRef[];
  agentSdk?: string;
  model?: string;
  modelReasoningLevel?: string;
  defaultAdditionalModelInstructions?: string | null;
  heartbeats?: AgentHeartbeat[];
}

export interface AgentHeartbeat {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
  intervalSeconds: number;
  nextHeartbeatAt?: string | null;
  lastSentAt?: string | null;
  threadId?: string | null;
}

export interface TaskComment {
  id: string;
  taskId?: string;
  companyId?: string;
  comment: string;
  authorActorId?: string | null;
  authorActor?: Actor | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskRun {
  id: string;
  taskId: string;
  status: string;
  threadId?: string | null;
  agentId?: string | null;
  triggeredByActorId?: string | null;
  failureMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Actor {
  id: string;
  kind: "agent" | "user";
  displayName: string;
  description?: string | null;
  agentId?: string | null;
  userId?: string | null;
  email?: string | null;
}

export interface ReporteeRelation {
  id: string;
  companyId: string;
  managerActorId: string;
  reporteeActorId: string;
  managerActor?: Actor | null;
  reporteeActor?: Actor | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskItem extends NamedEntity {
  companyId?: string;
  description?: string;
  acceptanceCriteria?: string;
  assigneeActorId?: string | null;
  assigneeActor?: Actor | null;
  assigneeAgentId?: string | null;
  threadId?: string | null;
  parentTaskId?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  runs?: TaskRun[];
  latestRun?: TaskRun | null;
  activeRun?: TaskRun | null;
  hasRunningRuns?: boolean;
  attemptCount?: number;
  lastRunStatus?: string | null;
  dependencyTaskIds?: string[];
  comments?: TaskComment[];
}

export interface TaskRelationshipDraft {
  dependencyTaskIds: string[];
  parentTaskId: string;
  childTaskIds: string[];
  assigneeActorId: string;
  status: string;
}

export interface AgentDraft {
  agentRunnerId: string;
  roleIds: string[];
  skillIds: string[];
  mcpServerIds: string[];
  name: string;
  agentSdk: string;
  model: string;
  modelReasoningLevel: string;
  defaultAdditionalModelInstructions: string;
}

export interface RoleDraft {
  name: string;
  parentRoleId: string;
}

export type StringArrayById = Record<string, string[]>;
export type AgentDraftById = Record<string, AgentDraft>;
export type RoleDraftById = Record<string, RoleDraft>;
export type TaskRelationshipDraftById = Record<string, TaskRelationshipDraft>;

export interface GithubInstallation {
  installationId: string;
  companyId?: string;
  accountLogin?: string;
  createdAt?: string;
}

export interface GithubRepository {
  id: string;
  githubInstallationId: string;
  fullName: string;
  htmlUrl?: string;
  defaultBranch?: string;
}

export interface GithubInstallCallback {
  installationId?: string;
  setupAction?: string;
}

export interface GitReference {
  kind: string;
  name: string;
  fullRef: string;
}

export interface GitSkillPackagePreview {
  packageName: string;
  branches?: GitReference[];
  tags?: GitReference[];
}
