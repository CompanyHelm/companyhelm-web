export const LIST_COMPANIES_QUERY = `
  query ListCompanies {
    companies {
      id
      name
    }
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
    }
  }
`;

export const CREATE_COMPANY_MUTATION = `
  mutation CreateCompany($name: String!, $id: String) {
    createCompany(name: $name, id: $id) {
      ok
      error
      company {
        id
        name
      }
    }
  }
`;

export const DELETE_COMPANY_MUTATION = `
  mutation DeleteCompany($id: String!) {
    deleteCompany(id: $id) {
      ok
      error
    }
  }
`;

export const LIST_GITHUB_APP_CONFIG_QUERY = `
  query GithubAppConfig {
    githubAppConfig {
      appClientId
      appLink
    }
  }
`;

export const LIST_GITHUB_INSTALLATIONS_QUERY = `
  query ListGithubInstallations {
    githubInstallations {
      installationId
      createdAt
    }
  }
`;

export const ADD_GITHUB_INSTALLATION_MUTATION = `
  mutation AddGithubInstallation(
    $installationId: String!
    $setupAction: String
  ) {
    addGithubInstallation(
      installationId: $installationId
      setupAction: $setupAction
    ) {
      ok
      error
      githubInstallation {
        installationId
        createdAt
      }
    }
  }
`;

export const DELETE_GITHUB_INSTALLATION_MUTATION = `
  mutation DeleteGithubInstallation($installationId: String!) {
    deleteGithubInstallation(installationId: $installationId) {
      ok
      error
      deletedInstallationId
    }
  }
`;

export const LIST_REPOSITORIES_QUERY = `
  query ListRepositories($provider: String, $githubInstallationId: String) {
    repositories(
      provider: $provider
      githubInstallationId: $githubInstallationId
    ) {
      id
      provider
      externalId
      githubInstallationId
      name
      fullName
      htmlUrl
      isPrivate
      defaultBranch
      archived
      createdAt
      updatedAt
    }
  }
`;

export const REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION = `
  mutation RefreshGithubInstallationRepositories($installationId: String!) {
    refreshGithubInstallationRepositories(installationId: $installationId) {
      ok
      error
      repositories {
        id
        provider
        externalId
        githubInstallationId
        name
        fullName
        htmlUrl
        isPrivate
        defaultBranch
        archived
        createdAt
        updatedAt
      }
    }
  }
`;

const TASK_RUN_FIELDS = `
  id
  taskId
  status
  threadId
  agentId
  triggeredByActorId
  failureMessage
  startedAt
  finishedAt
  createdAt
  updatedAt
`;

const TASK_COMMENT_FIELDS = `
  id
  taskId
  comment
  authorActorId
  authorActor {
    id
    kind
    displayName
    agentId
    userId
    email
  }
  createdAt
  updatedAt
`;

const TASK_FIELDS = `
  id
  company {
    id
  }
  name
  description
  acceptanceCriteria
  assigneeActorId
  assigneeActor {
    id
    kind
    displayName
    agentId
    userId
    email
  }
  agentId
  parentTaskId
  status
  createdAt
  updatedAt
  dependencyTaskIds
  comments {
${TASK_COMMENT_FIELDS}
  }
  runs {
${TASK_RUN_FIELDS}
  }
  latestRun {
${TASK_RUN_FIELDS}
  }
  activeRun {
${TASK_RUN_FIELDS}
  }
  attemptCount
  lastRunStatus
`;

export const LIST_TASKS_QUERY = `
  query ListTasks {
    tasks {
${TASK_FIELDS}
    }
  }
`;

export const LIST_TASK_PAGE_TASKS_QUERY = `
  query ListTaskPageTasks($topLevelOnly: Boolean, $rootTaskId: ID, $maxDepth: Int) {
    tasks(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {
${TASK_FIELDS}
    }
  }
`;

export const LIST_TASK_OPTIONS_QUERY = `
  query ListTaskOptions {
    taskOptions {
      id
      name
      parentTaskId
    }
  }
`;

export const LIST_TASK_ASSIGNABLE_ACTORS_QUERY = `
  query ListTaskAssignableActors {
    taskAssignableActors {
      id
      kind
      displayName
      agentId
      userId
      email
    }
  }
`;

export const LIST_ORG_QUERY = `
  query ListOrg {
    orgActors {
      id
      kind
      displayName
      agentId
      userId
      email
    }
    reportees {
      id
      companyId
      managerActorId
      reporteeActorId
      managerActor {
        id
        kind
        displayName
        agentId
        userId
        email
      }
      reporteeActor {
        id
        kind
        displayName
        agentId
        userId
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const SET_ACTOR_DESCRIPTION_MUTATION = `
  mutation SetActorDescription(
    $actorId: ID!
    $description: String
  ) {
    setActorDescription(
      actorId: $actorId
      description: $description
    ) {
      ok
      error
      actor {
        id
        kind
        displayName
        description
        agentId
        userId
        email
      }
    }
  }
`;

export const SET_ACTOR_MANAGER_MUTATION = `
  mutation SetActorManager(
    $reporteeActorId: ID!
    $managerActorId: ID
  ) {
    setActorManager(
      reporteeActorId: $reporteeActorId
      managerActorId: $managerActorId
    ) {
      ok
      error
      reportee {
        id
        companyId
        managerActorId
        reporteeActorId
        managerActor {
          id
          kind
          displayName
          agentId
          userId
          email
        }
        reporteeActor {
          id
          kind
          displayName
          agentId
          userId
          email
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_AGENT_RUNNERS_QUERY = `
  query ListAgentRunners {
    agentRunners {
      id
      name
      callbackUrl
      hasAuthSecret
      availableAgentSdks {
        id
        name
        status
        isAvailable
        codexAuthStatus
        codexAuthType
        errorMessage
        availableModels {
          id
          name
          isAvailable
          reasoningLevels
        }
      }
      isConnected
      lastHealthCheckAt
      lastSeenAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGENT_RUNNER_MUTATION = `
  mutation CreateAgentRunner(
    $name: String!
  ) {
    createAgentRunner(
      name: $name
    ) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
        id
        name
        callbackUrl
        hasAuthSecret
        availableAgentSdks {
          id
          name
          status
          isAvailable
          codexAuthStatus
          codexAuthType
          errorMessage
          availableModels {
            id
            name
            isAvailable
            reasoningLevels
          }
        }
        isConnected
        lastHealthCheckAt
        lastSeenAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGENERATE_AGENT_RUNNER_SECRET_MUTATION = `
  mutation RegenerateAgentRunnerSecret($id: String!) {
    regenerateAgentRunnerSecret(id: $id) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
      id
      name
      callbackUrl
      hasAuthSecret
      availableAgentSdks {
        id
        name
        status
        isAvailable
        codexAuthStatus
        codexAuthType
        errorMessage
        availableModels {
          id
          name
          isAvailable
          reasoningLevels
        }
      }
        isConnected
        lastHealthCheckAt
        lastSeenAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_AGENTS_QUERY = `
  query ListAgents {
    agents {
      id
      name
      status
      defaultAdditionalModelInstructions
      company {
        id
      }
      runner {
        id
        name
        isConnected
      }
    }
  }
`;

export const LIST_AGENTS_WITH_RUNNERS_QUERY = `
  query ListAgentsWithRunners {
    agents {
      id
      name
      status
      defaultAdditionalModelInstructions
      company {
        id
      }
      runner {
        id
        name
        isConnected
      }
    }
    agentRunners {
      id
      name
      callbackUrl
      hasAuthSecret
      availableAgentSdks {
        id
        name
        status
        isAvailable
        codexAuthStatus
        codexAuthType
        errorMessage
        availableModels {
          id
          name
          isAvailable
          reasoningLevels
        }
      }
      isConnected
      lastHealthCheckAt
      lastSeenAt
      createdAt
      updatedAt
    }
  }
`;

export const LIST_SKILLS_QUERY = `
  query ListSkills {
    skills {
      id
      name
      description
      content
      fileList
      gitSkillPackagePath
      company {
        id
      }
      roles {
        id
        name
      }
      gitSkillPackage {
        id
        packageName
        gitRepositoryUrl
      }
    }
  }
`;

export const LIST_ROLES_QUERY = `
  query ListRoles {
    roles: roles {
      id
      name
      company {
        id
      }
      parentRole: parentRole {
        id
        name
      }
      subRoles {
        id
        name
      }
      skills {
        id
        name
      }
      skillGroups {
        id
        name
      }
      effectiveSkills {
        id
        name
      }
      mcpServers {
        id
        name
      }
      effectiveMcpServers {
        id
        name
      }
    }
  }
`;

export const LIST_SKILL_GROUPS_QUERY = `
  query ListSkillGroups {
    skillGroups {
      id
      name
      company {
        id
      }
      parentSkillGroup {
        id
        name
      }
      skills {
        id
        name
      }
    }
  }
`;

export const LIST_GIT_SKILL_PACKAGES_QUERY = `
  query ListGitSkillPackages {
    gitSkillPackages {
      id
      packageName
      gitRepositoryUrl
      hostingProvider
      currentCommitHash
      currentReference
      company {
        id
      }
      skills {
        id
        name
      }
    }
  }
`;

export const PREVIEW_GIT_SKILL_PACKAGE_MUTATION = `
  mutation PreviewGitSkillPackage($gitRepositoryUrl: String!) {
    previewGitSkillPackage(gitRepositoryUrl: $gitRepositoryUrl) {
      ok
      error
      normalizedRepositoryUrl
      packageName
      branches {
        kind
        name
        fullRef
      }
      tags {
        kind
        name
        fullRef
      }
    }
  }
`;

export const CREATE_GIT_SKILL_PACKAGE_MUTATION = `
  mutation CreateGitSkillPackage(
    $gitRepositoryUrl: String!
    $gitReference: String!
  ) {
    createGitSkillPackage(
      gitRepositoryUrl: $gitRepositoryUrl
      gitReference: $gitReference
    ) {
      ok
      error
      warnings
      packageId
      gitSkillPackage {
        id
        packageName
        gitRepositoryUrl
        hostingProvider
        currentCommitHash
        currentReference
        company {
          id
        }
      }
      skills {
        id
        name
        description
        content
        fileList
        gitSkillPackagePath
        company {
          id
        }
      }
    }
  }
`;

export const DELETE_GIT_SKILL_PACKAGE_MUTATION = `
  mutation DeleteGitSkillPackage($id: ID!) {
    deleteGitSkillPackage(id: $id) {
      ok
      error
      deletedGitSkillPackageId
    }
  }
`;

export const CREATE_SKILL_GROUP_MUTATION = `
  mutation CreateSkillGroup($name: String!, $parentSkillGroupId: ID) {
    createSkillGroup(
      name: $name
      parentSkillGroupId: $parentSkillGroupId
    ) {
      ok
      error
      skillGroup {
        id
        name
        company {
          id
        }
        parentSkillGroup {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_SKILL_GROUP_MUTATION = `
  mutation UpdateSkillGroup(
    $id: ID!
    $name: String!
    $parentSkillGroupId: ID
  ) {
    updateSkillGroup(
      id: $id
      name: $name
      parentSkillGroupId: $parentSkillGroupId
    ) {
      ok
      error
      skillGroup {
        id
        name
        company {
          id
        }
        parentSkillGroup {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_SKILL_GROUP_MUTATION = `
  mutation DeleteSkillGroup($id: ID!) {
    deleteSkillGroup(id: $id) {
      ok
      error
      deletedSkillGroupId
    }
  }
`;

export const ADD_SKILL_TO_GROUP_MUTATION = `
  mutation AddSkillToGroup($skillGroupId: ID!, $skillId: ID!) {
    addSkillToSkillGroup(
      skillGroupId: $skillGroupId
      skillId: $skillId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const REMOVE_SKILL_FROM_GROUP_MUTATION = `
  mutation RemoveSkillFromGroup($skillGroupId: ID!, $skillId: ID!) {
    removeSkillFromSkillGroup(
      skillGroupId: $skillGroupId
      skillId: $skillId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const CREATE_ROLE_MUTATION = `
  mutation CreateRole($name: String!, $parentRoleId: ID) {
    createRole: createRole(
      name: $name
      parentRoleId: $parentRoleId
    ) {
      ok
      error
      role: role {
        id
        name
        company {
          id
        }
        parentRole: parentRole {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_ROLE_MUTATION = `
  mutation UpdateRole(
    $id: ID!
    $name: String!
    $parentRoleId: ID
  ) {
    updateRole: updateRole(
      id: $id
      name: $name
      parentRoleId: $parentRoleId
    ) {
      ok
      error
      role: role {
        id
        name
        company {
          id
        }
        parentRole: parentRole {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_ROLE_MUTATION = `
  mutation DeleteRole($id: ID!) {
    deleteRole: deleteRole(id: $id) {
      ok
      error
      deletedRoleId: deletedRoleId
    }
  }
`;

export const ADD_SKILL_TO_ROLE_MUTATION = `
  mutation AddSkillToRole($roleId: ID!, $skillId: ID!) {
    addSkillToRole: addSkillToRole(
      roleId: $roleId
      skillId: $skillId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const REMOVE_SKILL_FROM_ROLE_MUTATION = `
  mutation RemoveSkillFromRole($roleId: ID!, $skillId: ID!) {
    removeSkillFromRole: removeSkillFromRole(
      roleId: $roleId
      skillId: $skillId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const ADD_SKILL_GROUP_TO_ROLE_MUTATION = `
  mutation AddSkillGroupToRole($roleId: ID!, $skillGroupId: ID!) {
    addSkillGroupToRole(
      roleId: $roleId
      skillGroupId: $skillGroupId
    ) {
      ok
      error
      role {
        id
      }
    }
  }
`;

export const REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION = `
  mutation RemoveSkillGroupFromRole($roleId: ID!, $skillGroupId: ID!) {
    removeSkillGroupFromRole(
      roleId: $roleId
      skillGroupId: $skillGroupId
    ) {
      ok
      error
      role {
        id
      }
    }
  }
`;

export const ADD_MCP_SERVER_TO_ROLE_MUTATION = `
  mutation AddMcpServerToRole($roleId: ID!, $mcpServerId: ID!) {
    addMcpServerToRole(
      roleId: $roleId
      mcpServerId: $mcpServerId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const REMOVE_MCP_SERVER_FROM_ROLE_MUTATION = `
  mutation RemoveMcpServerFromRole($roleId: ID!, $mcpServerId: ID!) {
    removeMcpServerFromRole(
      roleId: $roleId
      mcpServerId: $mcpServerId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const LIST_MCP_SERVERS_QUERY = `
  query ListMcpServers {
    mcpServers {
      id
      name
      transportType
      url
      command
      args
      envVars {
        key
        value
      }
      authType
      bearerTokenSecretId
      oauthConnectionStatus
      oauthLastError
      customHeaders {
        key
        value
      }
      enabled
    }
  }
`;

export const LIST_SECRETS_QUERY = `
  query ListSecrets {
    secrets {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const LIST_SECRET_VALUE_QUERY = `
  query ListSecretValue($secretId: String!) {
    secretValue(secretId: $secretId) {
      ok
      error
      value
    }
  }
`;

export const LIST_SECRET_ACCESS_LOGS_QUERY = `
  query ListSecretAccessLogs($secretId: String!, $first: Int) {
    secretAccessLogs(secretId: $secretId, first: $first) {
      id
      secretId
      threadId
      agentId
      mcpServerId
      accessReason
      accessedAt
      agent {
        id
        name
      }
      thread {
        id
        title
      }
      mcpServer {
        id
        name
      }
    }
  }
`;

export const LIST_APPROVALS_QUERY = `
  query ListApprovals($status: String, $first: Int) {
    approvals(status: $status, first: $first) {
      id
      type
      status
      secretId
      threadId
      reason
      rejectionReason
      createdByActorId
      resolvedByActorId
      resolvedAt
      createdAt
      updatedAt
      secretName
      requestingAgentId
      requestingAgentName
    }
  }
`;

export const APPROVE_APPROVAL_MUTATION = `
  mutation ApproveApproval($id: String!) {
    approveApproval(id: $id) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const REJECT_APPROVAL_MUTATION = `
  mutation RejectApproval($id: String!, $rejectionReason: String) {
    rejectApproval(id: $id, rejectionReason: $rejectionReason) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const DELETE_APPROVAL_MUTATION = `
  mutation DeleteApproval($id: String!) {
    deleteApproval(id: $id) {
      ok
      error
      deletedApprovalId
    }
  }
`;

export const CREATE_SECRET_MUTATION = `
  mutation CreateSecret(
    $name: String!
    $description: String!
    $value: String!
  ) {
    createSecret(
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_SECRET_MUTATION = `
  mutation UpdateSecret(
    $id: String!
    $name: String!
    $description: String!
    $value: String
  ) {
    updateSecret(
      id: $id
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_SECRET_MUTATION = `
  mutation DeleteSecret($id: String!) {
    deleteSecret(id: $id) {
      ok
      error
      deletedSecretId
    }
  }
`;

export const CREATE_TASK_MUTATION = `
  mutation CreateTask(
    $name: String!
    $description: String
    $acceptanceCriteria: String
    $status: TaskStatus
    $assigneeActorId: ID
    $parentTaskId: ID
    $dependencyTaskIds: [ID!]
  ) {
    createTask(
      name: $name
      description: $description
      acceptanceCriteria: $acceptanceCriteria
      status: $status
      assigneeActorId: $assigneeActorId
      parentTaskId: $parentTaskId
      dependencyTaskIds: $dependencyTaskIds
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const ADD_TASK_DEPENDENCY_MUTATION = `
  mutation AddTaskDependency($taskId: ID!, $dependencyTaskId: ID!) {
    addTaskDependency(
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const REMOVE_TASK_DEPENDENCY_MUTATION = `
  mutation RemoveTaskDependency($taskId: ID!, $dependencyTaskId: ID!) {
    removeTaskDependency(
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const SET_TASK_PARENT_MUTATION = `
  mutation SetTaskParent($taskId: ID!, $parentTaskId: ID) {
    setTaskParent(
      taskId: $taskId
      parentTaskId: $parentTaskId
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const SET_TASK_ASSIGNEE_ACTOR_MUTATION = `
  mutation SetTaskAssigneeActor($taskId: ID!, $assigneeActorId: ID) {
    setTaskAssigneeActor(
      taskId: $taskId
      assigneeActorId: $assigneeActorId
    ) {
      ok
      error
      task {
        id
        assigneeActorId
        status
      }
    }
  }
`;

export const SET_TASK_STATUS_MUTATION = `
  mutation SetTaskStatus($taskId: ID!, $status: TaskStatus!) {
    setTaskStatus(
      taskId: $taskId
      status: $status
    ) {
      ok
      error
      task {
        id
        assigneeActorId
        status
      }
    }
  }
`;

export const DELETE_TASK_MUTATION = `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

export const BATCH_DELETE_TASKS_MUTATION = `
  mutation BatchDeleteTasks($ids: [ID!]!) {
    batchDeleteTasks(ids: $ids) {
      ok
      error
      deletedTaskIds
    }
  }
`;

export const BATCH_EXECUTE_TASKS_MUTATION = `
  mutation BatchExecuteTasks($taskIds: [ID!]!, $agentId: ID!) {
    batchExecuteTasks(taskIds: $taskIds, agentId: $agentId) {
      ok
      error
      tasks {
${TASK_FIELDS}
      }
    }
  }
`;

export const CREATE_TASK_COMMENT_MUTATION = `
  mutation CreateTaskComment($taskId: ID!, $comment: String!) {
    createTaskComment(taskId: $taskId, comment: $comment) {
      ok
      error
      taskComment {
        id
        taskId
        comment
        authorActorId
        authorActor {
          id
          kind
          displayName
          agentId
          userId
          email
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AGENT_RUNNER_MUTATION = `
  mutation DeleteAgentRunner($id: String!) {
    deleteAgentRunner(id: $id) {
      ok
      error
      deletedAgentRunnerId
    }
  }
`;

export const CREATE_AGENT_MUTATION = `
  mutation CreateAgent(
    $agentRunnerId: String
    $skillIds: [String!]
    $mcpServerIds: [String!]
    $defaultAdditionalModelInstructions: String
    $name: String!
    $agentSdk: String!
    $model: String!
    $modelReasoningLevel: String!
  ) {
    createAgent(
      agentRunnerId: $agentRunnerId
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
      name: $name
      agentSdk: $agentSdk
      model: $model
      modelReasoningLevel: $modelReasoningLevel
    ) {
      ok
      error
      agent {
        id
        agentRunnerId
        skillIds
        mcpServerIds
        defaultAdditionalModelInstructions
        name
        agentSdk
        model
        modelReasoningLevel
      }
    }
  }
`;

export const UPDATE_AGENT_MUTATION = `
  mutation UpdateAgent(
    $id: String!
    $agentRunnerId: String
    $skillIds: [String!]
    $mcpServerIds: [String!]
    $defaultAdditionalModelInstructions: String
    $name: String!
    $agentSdk: String!
    $model: String!
    $modelReasoningLevel: String!
  ) {
    updateAgent(
      id: $id
      agentRunnerId: $agentRunnerId
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
      name: $name
      agentSdk: $agentSdk
      model: $model
      modelReasoningLevel: $modelReasoningLevel
    ) {
      ok
      error
      agent {
        id
        agentRunnerId
        skillIds
        mcpServerIds
        defaultAdditionalModelInstructions
        name
        agentSdk
        model
        modelReasoningLevel
      }
    }
  }
`;

export const DELETE_AGENT_MUTATION = `
  mutation DeleteAgent($id: String!) {
    deleteAgent(id: $id) {
      ok
      error
      deletedAgentId
    }
  }
`;

export const CREATE_SKILL_MUTATION = `
  mutation CreateSkill(
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    createSkill(
      name: $name
      skillType: $skillType
      skillsMpPackageName: $skillsMpPackageName
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        name
        skillType
        skillsMpPackageName
        description
        instructions
      }
    }
  }
`;

export const UPDATE_SKILL_MUTATION = `
  mutation UpdateSkill(
    $id: String!
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    updateSkill(
      id: $id
      name: $name
      skillType: $skillType
      skillsMpPackageName: $skillsMpPackageName
      description: $description
      instructions: $instructions
    ) {
      ok
      error
      skill {
        id
        name
        skillType
        skillsMpPackageName
        description
        instructions
      }
    }
  }
`;

export const DELETE_SKILL_MUTATION = `
  mutation DeleteSkill($id: String!) {
    deleteSkill(id: $id) {
      ok
      error
      deletedSkillId
    }
  }
`;

export const CREATE_MCP_SERVER_MUTATION = `
  mutation CreateMcpServer(
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerTokenSecretId: ID
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    createMcpServer(
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerTokenSecretId: $bearerTokenSecretId
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerTokenSecretId
        oauthConnectionStatus
        oauthLastError
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

export const UPDATE_MCP_SERVER_MUTATION = `
  mutation UpdateMcpServer(
    $id: String!
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerTokenSecretId: ID
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    updateMcpServer(
      id: $id
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerTokenSecretId: $bearerTokenSecretId
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerTokenSecretId
        oauthConnectionStatus
        oauthLastError
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

export const DELETE_MCP_SERVER_MUTATION = `
  mutation DeleteMcpServer($id: String!) {
    deleteMcpServer(id: $id) {
      ok
      error
      deletedMcpServerId
    }
  }
`;

export const START_MCP_SERVER_OAUTH_MUTATION = `
  mutation StartMcpServerOAuth(
    $mcpServerId: ID!
    $oauthClientId: String
    $oauthClientSecret: String
    $requestedScopes: [String!]
  ) {
    startMcpServerOAuth(
      mcpServerId: $mcpServerId
      oauthClientId: $oauthClientId
      oauthClientSecret: $oauthClientSecret
      requestedScopes: $requestedScopes
    ) {
      ok
      error
      authorizationUrl
    }
  }
`;

export const DISCONNECT_MCP_SERVER_OAUTH_MUTATION = `
  mutation DisconnectMcpServerOAuth($mcpServerId: ID!) {
    disconnectMcpServerOAuth(mcpServerId: $mcpServerId) {
      ok
      error
    }
  }
`;

export const INITIALIZE_AGENT_MUTATION = `
  mutation InitializeAgentRunner($runnerId: String!, $agentId: String!) {
    initializeAgentRunner(runnerId: $runnerId, agentId: $agentId) {
      ok
      error
      commandId
      runnerId
      agentId
      queuedSkillInstallCount
    }
  }
`;

export const RETRY_AGENT_SKILL_INSTALL_MUTATION = `
  mutation RetryAgentSkillInstall(
    $agentId: String!
    $skillId: String!
    $runnerId: String
  ) {
    retryAgentSkillInstall(
      agentId: $agentId
      skillId: $skillId
      runnerId: $runnerId
    ) {
      ok
      error
      requestId
      runnerId
      agentId
      skillId
      installedSkill {
        agentId
        skillId
        skillName
        skillType
        skillsMpPackageName
        requestId
        status
        message
        installLogs
        installedAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_AGENT_TURNS_QUERY = `
  query ListAgentTurns(
    $agentId: String!
    $threadId: String
    $limit: Int
  ) {
    agentTurns(
      agentId: $agentId
      threadId: $threadId
      limit: $limit
    ) {
      id
      threadId
      agentId
      runnerId
      status
      reasoningText
      startedAt
      endedAt
      createdAt
      updatedAt
      items {
        id
        turnId
        threadId
        agentId
        runnerId
        providerItemId
        role
        itemType
        text
        command
        output
        status
        startedAt
        endedAt
        error
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_AGENT_THREADS_QUERY = `
  query ListAgentThreads($agentId: String!, $limit: Int, $status: String) {
    agentThreads(agentId: $agentId, limit: $limit, status: $status) {
      id
      threadId
      agentId
      runnerId
      title
      additionalModelInstructions
      archivedAt
      status
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGENT_THREAD_MUTATION = `
  mutation CreateAgentThread(
    $agentId: String!
    $title: String
    $additionalModelInstructions: String
    $runnerId: String
  ) {
    createAgentThread(
      agentId: $agentId
      title: $title
      additionalModelInstructions: $additionalModelInstructions
      runnerId: $runnerId
    ) {
      ok
      error
      thread {
        id
        threadId
        agentId
        runnerId
        title
        additionalModelInstructions
        archivedAt
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_AGENT_THREAD_MUTATION = `
  mutation UpdateAgentThread($threadId: String!, $title: String) {
    updateAgentThread(threadId: $threadId, title: $title) {
      ok
      error
      thread {
        id
        threadId
        agentId
        runnerId
        title
        additionalModelInstructions
        archivedAt
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AGENT_THREAD_MUTATION = `
  mutation DeleteAgentThread($agentId: String!, $threadId: String!) {
    deleteAgentThread(agentId: $agentId, threadId: $threadId) {
      ok
      error
      deletedThreadId
      thread {
        id
        threadId
        companyId
        agentId
        runnerId
        title
        additionalModelInstructions
        archivedAt
        status
        errorMessage
        currentModelId
        currentModelName
        currentReasoningLevel
        createdAt
        updatedAt
      }
    }
  }
`;

export const ARCHIVE_AGENT_THREAD_MUTATION = `
  mutation ArchiveAgentThread($agentId: String!, $threadId: String!) {
    archiveAgentThread(agentId: $agentId, threadId: $threadId) {
      ok
      error
      thread {
        id
        threadId
        companyId
        agentId
        runnerId
        title
        additionalModelInstructions
        archivedAt
        status
        errorMessage
        currentModelId
        currentModelName
        currentReasoningLevel
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_AGENT_TURN_MUTATION = `
  mutation CreateAgentTurn(
    $agentId: String!
    $threadId: String!
    $text: String!
    $runnerId: String
  ) {
    createAgentTurn(
      agentId: $agentId
      threadId: $threadId
      text: $text
      runnerId: $runnerId
    ) {
      ok
      error
      itemId
      turnId
      queuedUserMessageId
      threadId
      runnerId
      agentId
    }
  }
`;

export const STEER_AGENT_TURN_MUTATION = `
  mutation SteerAgentTurn(
    $agentId: String!
    $threadId: String!
    $turnId: String!
    $message: String!
    $runnerId: String
  ) {
    steerAgentTurn(
      agentId: $agentId
      threadId: $threadId
      turnId: $turnId
      message: $message
      runnerId: $runnerId
    ) {
      ok
      error
      itemId
      turnId
      threadId
      runnerId
      agentId
    }
  }
`;

export const INTERRUPT_AGENT_TURN_MUTATION = `
  mutation InterruptAgentTurn(
    $agentId: String!
    $threadId: String!
    $runnerId: String
  ) {
    interruptAgentTurn(
      agentId: $agentId
      threadId: $threadId
      runnerId: $runnerId
    ) {
      ok
      error
      threadId
      runnerId
      agentId
    }
  }
`;

export const AGENT_RUNNERS_SUBSCRIPTION = `
  subscription AgentRunnersUpdated($first: Int = 200) {
    agentRunnersUpdated(first: $first) {
      edges {
        node {
          id
          agentSdks {
            id
            isAvailable
            name
            status
            codexAuthStatus
            codexAuthType
            errorMessage
            models {
              id
              isAvailable
              name
              reasoning
            }
          }
          isConnected
          lastHealthCheckAt
          lastSeenAt
        }
      }
    }
  }
`;

export const CODEX_AUTH_EVENTS_SUBSCRIPTION = `
  subscription RunnerSdkCodexAuthUpdated($runnerId: ID!, $sdkId: ID!) {
    runnerSdkCodexAuthUpdated(runnerId: $runnerId, sdkId: $sdkId) {
      runnerId
      sdkId
      codexAuthStatus
      codexAuthType
      deviceCode
      errorMessage
    }
  }
`;

export const AGENT_THREADS_SUBSCRIPTION = `
  subscription AgentThreadsUpdated($agentId: ID, $first: Int = 500, $status: ThreadStatus) {
    agentThreadsUpdated(agentId: $agentId, first: $first, status: $status) {
      edges {
        node {
          id
          title
          additionalModelInstructions
          archivedAt
          status
          currentReasoningLevel
          errorMessage
          tasks {
            id
            name
            status
            createdAt
            updatedAt
          }
          agent {
            id
          }
          currentModel {
            id
            name
          }
        }
      }
    }
  }
`;

export const AGENT_TURNS_SUBSCRIPTION = `
  subscription AgentTurnsUpdated(
    $agentId: ID!
    $threadId: ID!
    $first: Int = 100
  ) {
    agentTurnsUpdated(agentId: $agentId, threadId: $threadId, first: $first) {
      edges {
        node {
          id
          sdkTurnId
          status
          reasoningText
          startedAt
          endedAt
          thread {
            id
          }
          agent {
            id
          }
          items {
            id
            sdkItemId
            type
            status
            text
            commandOutput
            consoleOutput
            processId
            startedAt
            completedAt
            turn {
              id
              thread {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const AGENT_QUEUED_USER_MESSAGES_SUBSCRIPTION = `
  subscription AgentQueuedUserMessagesUpdated(
    $agentId: ID!
    $threadId: ID!
    $first: Int = 200
  ) {
    queuedUserMessagesUpdated(
      agentId: $agentId
      threadId: $threadId
      first: $first
    ) {
      id
      status
      errorMessage
      sdkTurnId
      allowSteer
      text
      thread {
        id
      }
    }
  }
`;

export const COMPANY_API_NOT_IMPLEMENTED_ERROR = "Not implemented in companyhelm-api yet.";
export const COMPANY_API_PAGE_SIZE = 100;

export const companyApiAgentMetadataById = new Map<any, any>();
export const companyApiThreadMetadataById = new Map<any, any>();
export const companyApiRunnerMetadataById = new Map<any, any>();

export const COMPANY_API_LIST_COMPANIES_CONNECTION_QUERY = `
  query CompanyApiListCompanies($first: Int!, $after: String) {
    companies(first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_ME_QUERY = `
  query CompanyApiMe {
    me {
      id
      email
      firstName
      lastName
    }
  }
`;

export const COMPANY_API_CREATE_COMPANY_MUTATION = `
  mutation CompanyApiCreateCompany($name: String!) {
    createCompany(name: $name) {
      id
      name
    }
  }
`;

export const COMPANY_API_DELETE_COMPANY_MUTATION = `
  mutation CompanyApiDeleteCompany {
    deleteCompany
  }
`;

export const COMPANY_API_EXPORT_COMPANY_DATA_QUERY = `
  query CompanyApiExportCompanyData($sections: [ExportSection!]!) {
    exportCompanyData(sections: $sections) {
      filename
      yaml
    }
  }
`;

export const COMPANY_API_GITHUB_APP_CONFIG_QUERY = `
  query CompanyApiGithubAppConfig {
    githubAppConfig {
      appClientId
      appLink
    }
  }
`;

export const COMPANY_API_LIST_GITHUB_INSTALLATIONS_QUERY = `
  query CompanyApiListGithubInstallations {
    githubInstallations {
      installationId
      createdAt
    }
  }
`;

export const COMPANY_API_LIST_REPOSITORIES_CONNECTION_QUERY = `
  query CompanyApiListRepositories(
    $githubInstallationId: ID
    $first: Int!
    $after: String
  ) {
    repositories(
      githubInstallationId: $githubInstallationId
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          provider
          externalId
          name
          fullName
          htmlUrl
          isPrivate
          defaultBranch
          archived
          createdAt
          updatedAt
          githubInstallation {
            installationId
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_ADD_GITHUB_INSTALLATION_MUTATION = `
  mutation CompanyApiAddGithubInstallation(
    $installationId: ID!
    $setupAction: String
  ) {
    addGithubInstallation(
      installationId: $installationId
      setupAction: $setupAction
    ) {
      ok
      error
      githubInstallation {
        installationId
        createdAt
      }
    }
  }
`;

export const COMPANY_API_DELETE_GITHUB_INSTALLATION_MUTATION = `
  mutation CompanyApiDeleteGithubInstallation(
    $installationId: ID!
  ) {
    deleteGithubInstallation(
      installationId: $installationId
    ) {
      ok
      error
      deletedInstallationId
    }
  }
`;

export const COMPANY_API_REFRESH_GITHUB_INSTALLATION_REPOSITORIES_MUTATION = `
  mutation CompanyApiRefreshGithubInstallationRepositories(
    $installationId: ID!
  ) {
    refreshGithubInstallationRepositories(
      installationId: $installationId
    ) {
      ok
      error
      repositories {
        id
        provider
        externalId
        name
        fullName
        htmlUrl
        isPrivate
        defaultBranch
        archived
        createdAt
        updatedAt
        githubInstallation {
          installationId
        }
      }
    }
  }
`;

export const COMPANY_API_LIST_TASKS_QUERY = `
  query CompanyApiListTasks($topLevelOnly: Boolean, $rootTaskId: ID, $maxDepth: Int) {
    tasks(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {
${TASK_FIELDS}
    }
  }
`;

export const COMPANY_API_LIST_TASK_OPTIONS_QUERY = `
  query CompanyApiListTaskOptions {
    taskOptions {
      id
      name
      parentTaskId
    }
  }
`;

export const COMPANY_API_LIST_TASK_ASSIGNABLE_ACTORS_QUERY = `
  query CompanyApiListTaskAssignableActors {
    taskAssignableActors {
      id
      kind
      displayName
      agentId
      userId
      email
    }
  }
`;

export const COMPANY_API_CREATE_TASK_MUTATION = `
  mutation CompanyApiCreateTask(
    $name: String!
    $description: String
    $acceptanceCriteria: String
    $status: TaskStatus
    $assigneeActorId: ID
    $parentTaskId: ID
    $dependencyTaskIds: [ID!]
  ) {
    createTask(
      name: $name
      description: $description
      acceptanceCriteria: $acceptanceCriteria
      status: $status
      assigneeActorId: $assigneeActorId
      parentTaskId: $parentTaskId
      dependencyTaskIds: $dependencyTaskIds
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const COMPANY_API_ADD_TASK_DEPENDENCY_MUTATION = `
  mutation CompanyApiAddTaskDependency(
    $taskId: ID!
    $dependencyTaskId: ID!
  ) {
    addTaskDependency(
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
        id
      }
    }
  }
`;

export const COMPANY_API_REMOVE_TASK_DEPENDENCY_MUTATION = `
  mutation CompanyApiRemoveTaskDependency(
    $taskId: ID!
    $dependencyTaskId: ID!
  ) {
    removeTaskDependency(
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
        id
      }
    }
  }
`;

export const COMPANY_API_SET_TASK_PARENT_MUTATION = `
  mutation CompanyApiSetTaskParent($taskId: ID!, $parentTaskId: ID) {
    setTaskParent(
      taskId: $taskId
      parentTaskId: $parentTaskId
    ) {
      ok
      error
      task {
${TASK_FIELDS}
      }
    }
  }
`;

export const COMPANY_API_SET_TASK_ASSIGNEE_ACTOR_MUTATION = `
  mutation CompanyApiSetTaskAssigneeActor(
    $taskId: ID!
    $assigneeActorId: ID
  ) {
    setTaskAssigneeActor(
      taskId: $taskId
      assigneeActorId: $assigneeActorId
    ) {
      ok
      error
      task {
        id
        assigneeActorId
        status
      }
    }
  }
`;

export const COMPANY_API_SET_TASK_STATUS_MUTATION = `
  mutation CompanyApiSetTaskStatus($taskId: ID!, $status: TaskStatus!) {
    setTaskStatus(
      taskId: $taskId
      status: $status
    ) {
      ok
      error
      task {
        id
        assigneeActorId
        status
      }
    }
  }
`;

export const COMPANY_API_DELETE_TASK_MUTATION = `
  mutation CompanyApiDeleteTask($id: ID!) {
    deleteTask(id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

export const COMPANY_API_BATCH_DELETE_TASKS_MUTATION = `
  mutation CompanyApiBatchDeleteTasks($ids: [ID!]!) {
    batchDeleteTasks(ids: $ids) {
      ok
      error
      deletedTaskIds
    }
  }
`;

export const COMPANY_API_BATCH_EXECUTE_TASKS_MUTATION = `
  mutation CompanyApiBatchExecuteTasks($taskIds: [ID!]!, $agentId: ID!) {
    batchExecuteTasks(taskIds: $taskIds, agentId: $agentId) {
      ok
      error
      tasks {
${TASK_FIELDS}
      }
    }
  }
`;

export const COMPANY_API_CREATE_TASK_COMMENT_MUTATION = `
  mutation CompanyApiCreateTaskComment($taskId: ID!, $comment: String!) {
    createTaskComment(taskId: $taskId, comment: $comment) {
      ok
      error
      taskComment {
        id
        taskId
        comment
        authorActorId
        authorActor {
          id
          kind
          displayName
          agentId
          userId
          email
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const COMPANY_API_LIST_SKILLS_QUERY = `
  query CompanyApiListSkills {
    skills {
      id
      name
      description
      content
      fileList
      gitSkillPackagePath
      company {
        id
      }
      roles {
        id
        name
      }
      gitSkillPackage {
        id
        packageName
        gitRepositoryUrl
      }
    }
  }
`;

export const COMPANY_API_LIST_ROLES_QUERY = `
  query CompanyApiListRoles {
    roles: roles {
      id
      name
      company {
        id
      }
      parentRole: parentRole {
        id
        name
      }
      subRoles {
        id
        name
      }
      skills {
        id
        name
      }
      skillGroups {
        id
        name
      }
      effectiveSkills {
        id
        name
      }
      mcpServers {
        id
        name
      }
      effectiveMcpServers {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_LIST_SKILL_GROUPS_QUERY = `
  query CompanyApiListSkillGroups {
    skillGroups {
      id
      name
      company {
        id
      }
      parentSkillGroup {
        id
        name
      }
      skills {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_LIST_GIT_SKILL_PACKAGES_QUERY = `
  query CompanyApiListGitSkillPackages {
    gitSkillPackages {
      id
      packageName
      gitRepositoryUrl
      hostingProvider
      currentCommitHash
      currentReference
      company {
        id
      }
      skills {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_PREVIEW_GIT_SKILL_PACKAGE_MUTATION = `
  mutation CompanyApiPreviewGitSkillPackage($gitRepositoryUrl: String!) {
    previewGitSkillPackage(gitRepositoryUrl: $gitRepositoryUrl) {
      ok
      error
      normalizedRepositoryUrl
      packageName
      branches {
        kind
        name
        fullRef
      }
      tags {
        kind
        name
        fullRef
      }
    }
  }
`;

export const COMPANY_API_CREATE_GIT_SKILL_PACKAGE_MUTATION = `
  mutation CompanyApiCreateGitSkillPackage(
    $gitRepositoryUrl: String!
    $gitReference: String!
  ) {
    createGitSkillPackage(
      gitRepositoryUrl: $gitRepositoryUrl
      gitReference: $gitReference
    ) {
      ok
      error
      warnings
      packageId
      gitSkillPackage {
        id
        packageName
        gitRepositoryUrl
        hostingProvider
        currentCommitHash
        currentReference
        company {
          id
        }
      }
      skills {
        id
        name
        description
        content
        fileList
        gitSkillPackagePath
        company {
          id
        }
        roles {
          id
          name
        }
        gitSkillPackage {
          id
          packageName
          gitRepositoryUrl
        }
      }
    }
  }
`;

export const COMPANY_API_DELETE_GIT_SKILL_PACKAGE_MUTATION = `
  mutation CompanyApiDeleteGitSkillPackage($id: ID!) {
    deleteGitSkillPackage(id: $id) {
      ok
      error
      deletedGitSkillPackageId
    }
  }
`;

export const COMPANY_API_CREATE_SKILL_GROUP_MUTATION = `
  mutation CompanyApiCreateSkillGroup($name: String!, $parentSkillGroupId: ID) {
    createSkillGroup(
      name: $name
      parentSkillGroupId: $parentSkillGroupId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const COMPANY_API_UPDATE_SKILL_GROUP_MUTATION = `
  mutation CompanyApiUpdateSkillGroup(
    $id: ID!
    $name: String!
    $parentSkillGroupId: ID
  ) {
    updateSkillGroup(
      id: $id
      name: $name
      parentSkillGroupId: $parentSkillGroupId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const COMPANY_API_DELETE_SKILL_GROUP_MUTATION = `
  mutation CompanyApiDeleteSkillGroup($id: ID!) {
    deleteSkillGroup(id: $id) {
      ok
      error
      deletedSkillGroupId
    }
  }
`;

export const COMPANY_API_ADD_SKILL_TO_GROUP_MUTATION = `
  mutation CompanyApiAddSkillToGroup($skillGroupId: ID!, $skillId: ID!) {
    addSkillToSkillGroup(
      skillGroupId: $skillGroupId
      skillId: $skillId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const COMPANY_API_REMOVE_SKILL_FROM_GROUP_MUTATION = `
  mutation CompanyApiRemoveSkillFromGroup($skillGroupId: ID!, $skillId: ID!) {
    removeSkillFromSkillGroup(
      skillGroupId: $skillGroupId
      skillId: $skillId
    ) {
      ok
      error
      skillGroup {
        id
      }
    }
  }
`;

export const COMPANY_API_CREATE_ROLE_MUTATION = `
  mutation CompanyApiCreateRole($name: String!, $parentRoleId: ID) {
    createRole: createRole(
      name: $name
      parentRoleId: $parentRoleId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_UPDATE_ROLE_MUTATION = `
  mutation CompanyApiUpdateRole(
    $id: ID!
    $name: String!
    $parentRoleId: ID
  ) {
    updateRole: updateRole(
      id: $id
      name: $name
      parentRoleId: $parentRoleId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_DELETE_ROLE_MUTATION = `
  mutation CompanyApiDeleteRole($id: ID!) {
    deleteRole: deleteRole(id: $id) {
      ok
      error
      deletedRoleId: deletedRoleId
    }
  }
`;

export const COMPANY_API_ADD_SKILL_TO_ROLE_MUTATION = `
  mutation CompanyApiAddSkillToRole($roleId: ID!, $skillId: ID!) {
    addSkillToRole: addSkillToRole(
      roleId: $roleId
      skillId: $skillId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_REMOVE_SKILL_FROM_ROLE_MUTATION = `
  mutation CompanyApiRemoveSkillFromRole($roleId: ID!, $skillId: ID!) {
    removeSkillFromRole: removeSkillFromRole(
      roleId: $roleId
      skillId: $skillId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_ADD_SKILL_GROUP_TO_ROLE_MUTATION = `
  mutation CompanyApiAddSkillGroupToRole($roleId: ID!, $skillGroupId: ID!) {
    addSkillGroupToRole(
      roleId: $roleId
      skillGroupId: $skillGroupId
    ) {
      ok
      error
      role {
        id
      }
    }
  }
`;

export const COMPANY_API_REMOVE_SKILL_GROUP_FROM_ROLE_MUTATION = `
  mutation CompanyApiRemoveSkillGroupFromRole($roleId: ID!, $skillGroupId: ID!) {
    removeSkillGroupFromRole(
      roleId: $roleId
      skillGroupId: $skillGroupId
    ) {
      ok
      error
      role {
        id
      }
    }
  }
`;

export const COMPANY_API_ADD_MCP_SERVER_TO_ROLE_MUTATION = `
  mutation CompanyApiAddMcpServerToRole($roleId: ID!, $mcpServerId: ID!) {
    addMcpServerToRole(
      roleId: $roleId
      mcpServerId: $mcpServerId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_REMOVE_MCP_SERVER_FROM_ROLE_MUTATION = `
  mutation CompanyApiRemoveMcpServerFromRole($roleId: ID!, $mcpServerId: ID!) {
    removeMcpServerFromRole(
      roleId: $roleId
      mcpServerId: $mcpServerId
    ) {
      ok
      error
      role: role {
        id
      }
    }
  }
`;

export const COMPANY_API_LIST_MCP_SERVERS_QUERY = `
  query CompanyApiListMcpServers {
    mcpServers {
      id
      name
      transportType
      url
      command
      args
      envVars {
        key
        value
      }
      authType
      bearerTokenSecretId
      oauthConnectionStatus
      oauthLastError
      customHeaders {
        key
        value
      }
      enabled
    }
  }
`;

export const COMPANY_API_LIST_SECRETS_QUERY = `
  query CompanyApiListSecrets {
    secrets {
      id
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const COMPANY_API_LIST_SECRET_VALUE_QUERY = `
  query CompanyApiListSecretValue($secretId: ID!) {
    secretValue(secretId: $secretId) {
      ok
      error
      value
    }
  }
`;

export const COMPANY_API_LIST_SECRET_ACCESS_LOGS_QUERY = `
  query CompanyApiListSecretAccessLogs($secretId: ID!, $first: Int) {
    secretAccessLogs(secretId: $secretId, first: $first) {
      id
      secretId
      threadId
      agentId
      mcpServerId
      accessReason
      accessedAt
      agent {
        id
        name
      }
      thread {
        id
        title
      }
      mcpServer {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_LIST_APPROVALS_QUERY = `
  query CompanyApiListApprovals($status: ApprovalStatus, $first: Int) {
    approvals(status: $status, first: $first) {
      id
      type
      status
      secretId
      threadId
      reason
      rejectionReason
      createdByActorId
      resolvedByActorId
      resolvedAt
      createdAt
      updatedAt
      secretName
      requestingAgentId
      requestingAgentName
    }
  }
`;

export const COMPANY_API_APPROVE_APPROVAL_MUTATION = `
  mutation CompanyApiApproveApproval($id: ID!) {
    approveApproval(id: $id) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const COMPANY_API_REJECT_APPROVAL_MUTATION = `
  mutation CompanyApiRejectApproval($id: ID!, $rejectionReason: String) {
    rejectApproval(id: $id, rejectionReason: $rejectionReason) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const COMPANY_API_DELETE_APPROVAL_MUTATION = `
  mutation CompanyApiDeleteApproval($id: ID!) {
    deleteApproval(id: $id) {
      ok
      error
      deletedApprovalId
    }
  }
`;

export const COMPANY_API_CREATE_SECRET_MUTATION = `
  mutation CompanyApiCreateSecret(
    $name: String!
    $description: String!
    $value: String!
  ) {
    createSecret(
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const COMPANY_API_UPDATE_SECRET_MUTATION = `
  mutation CompanyApiUpdateSecret(
    $id: ID!
    $name: String!
    $description: String!
    $value: String
  ) {
    updateSecret(
      id: $id
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const COMPANY_API_DELETE_SECRET_MUTATION = `
  mutation CompanyApiDeleteSecret($id: ID!) {
    deleteSecret(id: $id) {
      ok
      error
      deletedSecretId
    }
  }
`;

export const COMPANY_API_CREATE_MCP_SERVER_MUTATION = `
  mutation CompanyApiCreateMcpServer(
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerTokenSecretId: ID
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    createMcpServer(
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerTokenSecretId: $bearerTokenSecretId
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerTokenSecretId
        oauthConnectionStatus
        oauthLastError
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

export const COMPANY_API_UPDATE_MCP_SERVER_MUTATION = `
  mutation CompanyApiUpdateMcpServer(
    $id: ID!
    $name: String!
    $transportType: String
    $url: String
    $command: String
    $args: [String!]
    $envVars: [McpEnvVarInput!]
    $authType: String
    $bearerTokenSecretId: ID
    $customHeaders: [McpHeaderInput!]
    $enabled: Boolean
  ) {
    updateMcpServer(
      id: $id
      name: $name
      transportType: $transportType
      url: $url
      command: $command
      args: $args
      envVars: $envVars
      authType: $authType
      bearerTokenSecretId: $bearerTokenSecretId
      customHeaders: $customHeaders
      enabled: $enabled
    ) {
      ok
      error
      mcpServer {
        id
        name
        transportType
        url
        command
        args
        envVars {
          key
          value
        }
        authType
        bearerTokenSecretId
        oauthConnectionStatus
        oauthLastError
        customHeaders {
          key
          value
        }
        enabled
      }
    }
  }
`;

export const COMPANY_API_DELETE_MCP_SERVER_MUTATION = `
  mutation CompanyApiDeleteMcpServer($id: ID!) {
    deleteMcpServer(id: $id) {
      ok
      error
      deletedMcpServerId
    }
  }
`;

export const COMPANY_API_START_MCP_SERVER_OAUTH_MUTATION = `
  mutation CompanyApiStartMcpServerOAuth(
    $mcpServerId: ID!
    $oauthClientId: String
    $oauthClientSecret: String
    $requestedScopes: [String!]
  ) {
    startMcpServerOAuth(
      mcpServerId: $mcpServerId
      oauthClientId: $oauthClientId
      oauthClientSecret: $oauthClientSecret
      requestedScopes: $requestedScopes
    ) {
      ok
      error
      authorizationUrl
    }
  }
`;

export const COMPANY_API_DISCONNECT_MCP_SERVER_OAUTH_MUTATION = `
  mutation CompanyApiDisconnectMcpServerOAuth($mcpServerId: ID!) {
    disconnectMcpServerOAuth(mcpServerId: $mcpServerId) {
      ok
      error
    }
  }
`;

export const COMPANY_API_LIST_AGENT_RUNNERS_CONNECTION_QUERY = `
  query CompanyApiListAgentRunners($first: Int!, $after: String) {
    agentRunners(first: $first, after: $after) {
      edges {
        node {
          id
          name
          lastHealthCheckAt
          lastSeenAt
          agentSdks {
            id
            name
            status
            isAvailable
            codexAuthStatus
            codexAuthType
            errorMessage
            company {
              id
            }
            runner {
              id
            }
            models {
              id
              name
              isAvailable
              reasoning
              company {
                id
              }
              sdk {
                id
              }
            }
          }
          isConnected
          company {
            id
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_CREATE_AGENT_RUNNER_MUTATION = `
  mutation CompanyApiCreateAgentRunner($name: String!) {
    createAgentRunner(name: $name) {
      secret
        agentRunner {
        id
        name
        lastHealthCheckAt
        lastSeenAt
        agentSdks {
          id
          name
          status
          isAvailable
          codexAuthStatus
          codexAuthType
          errorMessage
          company {
            id
          }
          runner {
            id
          }
          models {
            id
            name
            isAvailable
            reasoning
            company {
              id
            }
            sdk {
              id
            }
          }
        }
        isConnected
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_REGENERATE_AGENT_RUNNER_SECRET_MUTATION = `
  mutation CompanyApiRegenerateAgentRunnerSecret($agentRunnerId: ID!) {
    regenerateAgentRunnerSecret(agentRunnerId: $agentRunnerId) {
      secret
      agentRunner {
        id
        name
        lastHealthCheckAt
        lastSeenAt
        agentSdks {
          id
          name
          status
          isAvailable
          codexAuthStatus
          codexAuthType
          errorMessage
          company {
            id
          }
          runner {
            id
          }
          models {
            id
            name
            isAvailable
            reasoning
            company {
              id
            }
            sdk {
              id
            }
          }
        }
        isConnected
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_DELETE_AGENT_RUNNER_MUTATION = `
  mutation CompanyApiDeleteAgentRunner($agentRunnerId: ID!) {
    deleteAgentRunner(agentRunnerId: $agentRunnerId)
  }
`;

export const COMPANY_API_LIST_ADMIN_TABLES_QUERY = `
  query CompanyApiListAdminTables {
    adminTables {
      name
      label
      description
      featured
      supportsStatusFilter
      defaultLimit
    }
  }
`;

export const COMPANY_API_ADMIN_TABLE_QUERY = `
  query CompanyApiAdminTable(
    $tableName: String!
    $first: Int = 50
    $status: String
    $search: String
  ) {
    adminTable(
      tableName: $tableName
      first: $first
      status: $status
      search: $search
    ) {
      name
      label
      description
      featured
      supportsStatusFilter
      defaultLimit
      availableStatuses
      totalCount
      columns {
        key
        label
      }
      rows {
        id
        cells {
          key
          value
        }
      }
    }
  }
`;

export const COMPANY_API_LIST_AGENTS_CONNECTION_QUERY = `
  query CompanyApiListAgents($first: Int!, $after: String) {
    agents(first: $first, after: $after) {
      edges {
        node {
          id
          name
          status
          roleIds: roleIds
          mcpServerIds
          roles: roles {
            id
            name
            parentRole: parentRole {
              id
            }
          }
          defaultReasoningLevel
          defaultAdditionalModelInstructions
          agentRunnerSdk {
            id
            name
            models {
              id
              name
              reasoning
            }
          }
          defaultModel {
            id
            name
            reasoning
            sdk {
              id
            }
          }
          company {
            id
          }
          runner {
            id
            name
            isConnected
            lastHealthCheckAt
            lastSeenAt
            agentSdks {
              id
              name
              status
              isAvailable
              codexAuthStatus
              codexAuthType
              errorMessage
              models {
                id
                name
                isAvailable
                reasoning
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_LIST_AGENTS_PAGE_QUERY = `
  query CompanyApiListAgentsPage($firstAgents: Int = 500, $firstRunners: Int = 500) {
    agents(first: $firstAgents) {
      edges {
        node {
          id
          name
          status
          roleIds: roleIds
          mcpServerIds
          roles: roles {
            id
            name
            parentRole: parentRole {
              id
            }
          }
          defaultReasoningLevel
          defaultAdditionalModelInstructions
          agentRunnerSdk {
            id
            name
            models {
              id
              name
              reasoning
            }
          }
          defaultModel {
            id
            name
            reasoning
            sdk {
              id
            }
          }
          company {
            id
          }
          runner {
            id
            name
            isConnected
            lastHealthCheckAt
            lastSeenAt
            agentSdks {
              id
              name
              status
              isAvailable
              codexAuthStatus
              codexAuthType
              errorMessage
              models {
                id
                name
                isAvailable
                reasoning
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    agentRunners(first: $firstRunners) {
      edges {
        node {
          id
          name
          lastHealthCheckAt
          lastSeenAt
          agentSdks {
            id
            name
            status
            isAvailable
            codexAuthStatus
            codexAuthType
            errorMessage
            company {
              id
            }
            runner {
              id
            }
            models {
              id
              name
              isAvailable
              reasoning
              company {
                id
              }
              sdk {
                id
              }
            }
          }
          isConnected
          company {
            id
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY = `
  query CompanyApiListAgentsWithThreads(
    $first: Int!
    $after: String
    $firstThreads: Int = 500
    $threadStatus: ThreadStatus
  ) {
    agents(first: $first, after: $after) {
      edges {
        node {
          id
          name
          status
          roleIds: roleIds
          mcpServerIds
          roles: roles {
            id
            name
            parentRole: parentRole {
              id
            }
          }
          defaultReasoningLevel
          defaultAdditionalModelInstructions
          agentRunnerSdk {
            id
            name
            isAvailable
            models {
              id
              name
              isAvailable
              reasoning
            }
          }
          defaultModel {
            id
            name
            reasoning
            sdk {
              id
            }
          }
          company {
            id
          }
          runner {
            id
            name
            isConnected
            lastHealthCheckAt
            lastSeenAt
            agentSdks {
              id
              name
              status
              isAvailable
              codexAuthStatus
              codexAuthType
              errorMessage
              models {
                id
                name
                isAvailable
                reasoning
              }
            }
          }
          threads(first: $firstThreads, status: $threadStatus) {
            edges {
              node {
                id
                title
                additionalModelInstructions
                archivedAt
                status
                errorMessage
                currentReasoningLevel
                tasks {
                  id
                  name
                  status
                  createdAt
                  updatedAt
                }
                company {
                  id
                }
                agent {
                  id
                }
                currentModel {
                  id
                  name
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_CREATE_AGENT_MUTATION = `
  mutation CompanyApiCreateAgent(
    $name: String!
    $agentRunnerId: ID!
    $agentRunnerSdkId: ID!
    $defaultModelId: ID!
    $roleIds: [ID!]
    $skillIds: [ID!]
    $mcpServerIds: [ID!]
    $defaultReasoningLevel: String
    $defaultAdditionalModelInstructions: String
  ) {
    createAgent(
      name: $name
      agentRunnerId: $agentRunnerId
      agentRunnerSdkId: $agentRunnerSdkId
      defaultModelId: $defaultModelId
      roleIds: $roleIds
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      defaultReasoningLevel: $defaultReasoningLevel
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
    ) {
      id
      name
      status
      roleIds: roleIds
      skillIds
      mcpServerIds
      roles: roles {
        id
        name
        parentRole: parentRole {
          id
        }
      }
      defaultAdditionalModelInstructions
      company {
        id
      }
      runner {
        id
        name
        isConnected
        lastHealthCheckAt
        lastSeenAt
      }
    }
  }
`;

export const COMPANY_API_UPDATE_AGENT_MUTATION = `
  mutation CompanyApiUpdateAgent(
    $agentId: ID!
    $name: String!
    $agentRunnerId: ID!
    $agentRunnerSdkId: ID!
    $defaultModelId: ID!
    $roleIds: [ID!]
    $skillIds: [ID!]
    $mcpServerIds: [ID!]
    $defaultReasoningLevel: String
    $defaultAdditionalModelInstructions: String
  ) {
    updateAgent(
      agentId: $agentId
      name: $name
      agentRunnerId: $agentRunnerId
      agentRunnerSdkId: $agentRunnerSdkId
      defaultModelId: $defaultModelId
      roleIds: $roleIds
      skillIds: $skillIds
      mcpServerIds: $mcpServerIds
      defaultReasoningLevel: $defaultReasoningLevel
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
    ) {
      id
      name
      status
      roleIds: roleIds
      skillIds
      mcpServerIds
      roles: roles {
        id
        name
        parentRole: parentRole {
          id
        }
      }
      defaultAdditionalModelInstructions
      company {
        id
      }
    }
  }
`;

export const START_RUNNER_SDK_AUTH_MUTATION = `
  mutation StartRunnerSdkAuth($runnerId: ID!, $sdkId: ID!, $authType: CodexAuthType!, $apiKey: String) {
    startRunnerSdkAuth(runnerId: $runnerId, sdkId: $sdkId, authType: $authType, apiKey: $apiKey) {
      id
      name
      status
      isAvailable
      codexAuthStatus
      codexAuthType
      errorMessage
      runner {
        id
      }
      models {
        id
        name
        isAvailable
        reasoning
      }
    }
  }
`;

export const COMPANY_API_DELETE_AGENT_MUTATION = `
  mutation CompanyApiDeleteAgent($input: DeleteAgentInput!) {
    deleteAgent(input: $input) {
      ok
      errors
    }
  }
`;

export const COMPANY_API_LIST_THREADS_CONNECTION_QUERY = `
  query CompanyApiListThreads($agentId: ID, $first: Int!, $after: String, $status: ThreadStatus) {
    threads(agentId: $agentId, first: $first, after: $after, status: $status) {
      edges {
        node {
          id
          title
          additionalModelInstructions
          archivedAt
          status
          errorMessage
          currentReasoningLevel
          tasks {
            id
            name
            status
            createdAt
            updatedAt
          }
          company {
            id
          }
          agent {
            id
          }
          currentModel {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_CREATE_THREAD_MUTATION = `
  mutation CompanyApiCreateThread(
    $agentId: ID!
    $title: String
    $additionalModelInstructions: String
  ) {
    createThread(
      agentId: $agentId
      title: $title
      additionalModelInstructions: $additionalModelInstructions
    ) {
      id
      title
      additionalModelInstructions
      archivedAt
      status
      errorMessage
      currentReasoningLevel
      company {
        id
      }
      agent {
        id
      }
      currentModel {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_UPDATE_THREAD_TITLE_MUTATION = `
  mutation CompanyApiUpdateThreadTitle($threadId: ID!, $title: String) {
    updateThreadTitle(threadId: $threadId, title: $title) {
      id
      title
      additionalModelInstructions
      archivedAt
      status
      errorMessage
      currentReasoningLevel
      company {
        id
      }
      agent {
        id
      }
      currentModel {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_DELETE_THREAD_MUTATION = `
  mutation CompanyApiDeleteThread($threadId: ID!) {
    deleteThread(threadId: $threadId) {
      id
      title
      archivedAt
      status
      errorMessage
      currentReasoningLevel
      additionalModelInstructions
      company {
        id
      }
      agent {
        id
      }
    }
  }
`;

export const COMPANY_API_ARCHIVE_THREAD_MUTATION = `
  mutation CompanyApiArchiveThread($threadId: ID!) {
    archiveThread(threadId: $threadId) {
      id
      title
      archivedAt
      status
      errorMessage
      currentReasoningLevel
      additionalModelInstructions
      company {
        id
      }
      agent {
        id
      }
      currentModel {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_THREAD_QUERY = `
  query CompanyApiThread($threadId: ID!) {
    thread(id: $threadId) {
      id
      title
      additionalModelInstructions
      archivedAt
      status
      errorMessage
      currentReasoningLevel
      tasks {
        id
        name
        status
        createdAt
        updatedAt
      }
      company {
        id
      }
      agent {
        id
      }
      currentModel {
        id
        name
      }
    }
  }
`;

export const COMPANY_API_LIST_THREAD_TURNS_CONNECTION_QUERY = `
  query CompanyApiListThreadTurns($threadId: ID!, $first: Int!, $after: String) {
    threadTurns(threadId: $threadId, first: $first, after: $after) {
      edges {
        node {
          id
          sdkTurnId
          status
          reasoningText
          startedAt
          endedAt
          company {
            id
          }
          thread {
            id
          }
          agent {
            id
          }
          items {
            id
            sdkItemId
            type
            status
            text
            commandOutput
            consoleOutput
            processId
            startedAt
            completedAt
            company {
              id
            }
            turn {
              id
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const COMPANY_API_LIST_THREAD_TURNS_WITH_QUEUED_QUERY = `
  query CompanyApiListThreadTurnsWithQueued(
    $threadId: ID!
    $firstTurns: Int!
    $firstQueuedUserMessages: Int!
  ) {
    threadTurns(threadId: $threadId, first: $firstTurns) {
      edges {
        node {
          id
          sdkTurnId
          status
          reasoningText
          startedAt
          endedAt
          company {
            id
          }
          thread {
            id
          }
          agent {
            id
          }
          items {
            id
            sdkItemId
            type
            status
            text
            commandOutput
            consoleOutput
            processId
            startedAt
            completedAt
            company {
              id
            }
            turn {
              id
            }
          }
        }
      }
    }
    queuedUserMessages(threadId: $threadId, first: $firstQueuedUserMessages) {
      id
      status
      errorMessage
      sdkTurnId
      allowSteer
      text
      company {
        id
      }
      thread {
        id
      }
    }
  }
`;

export const COMPANY_API_QUEUE_USER_MESSAGE_MUTATION = `
  mutation CompanyApiQueueUserMessage(
    $threadId: ID!
    $text: String!
    $allowSteer: Boolean!
    $modelId: ID
    $reasoningLevel: String
  ) {
    queueUserMessage(
      threadId: $threadId
      text: $text
      allowSteer: $allowSteer
      modelId: $modelId
      reasoningLevel: $reasoningLevel
    ) {
      id
      status
      errorMessage
      sdkTurnId
      allowSteer
      text
      company {
        id
      }
      thread {
        id
      }
    }
  }
`;

export const COMPANY_API_STEER_QUEUED_USER_MESSAGE_MUTATION = `
  mutation CompanyApiSteerQueuedUserMessage($queuedMessageId: ID!) {
    steerQueuedUserMessage(queuedMessageId: $queuedMessageId) {
      id
      status
      errorMessage
      sdkTurnId
      allowSteer
      text
      company {
        id
      }
      thread {
        id
      }
    }
  }
`;

export const COMPANY_API_RETRY_QUEUED_USER_MESSAGE_MUTATION = `
  mutation CompanyApiRetryQueuedUserMessage($queuedMessageId: ID!) {
    retryQueuedUserMessage(queuedMessageId: $queuedMessageId) {
      id
      status
      errorMessage
      sdkTurnId
      allowSteer
      text
      company {
        id
      }
      thread {
        id
      }
    }
  }
`;

export const COMPANY_API_DELETE_QUEUED_USER_MESSAGE_MUTATION = `
  mutation CompanyApiDeleteQueuedUserMessage($queuedMessageId: ID!) {
    deleteQueuedUserMessage(queuedMessageId: $queuedMessageId)
  }
`;

export const COMPANY_API_INTERRUPT_TURN_MUTATION = `
  mutation CompanyApiInterruptTurn($threadId: ID!) {
    interruptTurn(threadId: $threadId)
  }
`;
