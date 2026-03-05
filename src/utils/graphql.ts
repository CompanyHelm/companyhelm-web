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
      companyId
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
  query ListGithubInstallations($companyId: String!) {
    githubInstallations(companyId: $companyId) {
      installationId
      companyId
      createdAt
    }
  }
`;

export const ADD_GITHUB_INSTALLATION_MUTATION = `
  mutation AddGithubInstallation(
    $companyId: String!
    $installationId: String!
    $setupAction: String
  ) {
    addGithubInstallation(
      companyId: $companyId
      installationId: $installationId
      setupAction: $setupAction
    ) {
      ok
      error
      githubInstallation {
        installationId
        companyId
        createdAt
      }
    }
  }
`;

export const DELETE_GITHUB_INSTALLATION_MUTATION = `
  mutation DeleteGithubInstallation($companyId: String!, $installationId: String!) {
    deleteGithubInstallation(companyId: $companyId, installationId: $installationId) {
      ok
      error
      deletedInstallationId
    }
  }
`;

export const LIST_REPOSITORIES_QUERY = `
  query ListRepositories($companyId: String!, $provider: String, $githubInstallationId: String) {
    repositories(
      companyId: $companyId
      provider: $provider
      githubInstallationId: $githubInstallationId
    ) {
      id
      companyId
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
  mutation RefreshGithubInstallationRepositories($companyId: String!, $installationId: String!) {
    refreshGithubInstallationRepositories(companyId: $companyId, installationId: $installationId) {
      ok
      error
      repositories {
        id
        companyId
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

export const LIST_TASKS_QUERY = `
  query ListTasks($companyId: String!) {
    tasks(companyId: $companyId) {
      id
      company {
        id
      }
      name
      description
      acceptanceCriteria
      assigneePrincipalId
      threadId
      parentTaskId
      status
      createdAt
      updatedAt
      dependencyTaskIds
      comments {
        id
        taskId
        companyId
        comment
        authorPrincipalId
        authorPrincipal {
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

export const LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY = `
  query ListTaskAssignablePrincipals($companyId: String!) {
    taskAssignablePrincipals(companyId: $companyId) {
      id
      kind
      displayName
      agentId
      userId
      email
    }
  }
`;

export const LIST_AGENT_RUNNERS_QUERY = `
  query ListAgentRunners($companyId: String!) {
    agentRunners(companyId: $companyId) {
      id
      companyId
      name
      callbackUrl
      hasAuthSecret
      availableAgentSdks {
        name
        availableModels {
          name
          reasoningLevels
        }
      }
      status
      lastHealthCheckAt
      lastSeenAt
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGENT_RUNNER_MUTATION = `
  mutation CreateAgentRunner(
    $companyId: String!
    $name: String!
  ) {
    createAgentRunner(
      companyId: $companyId
      name: $name
    ) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
        id
        companyId
        name
        callbackUrl
        hasAuthSecret
        availableAgentSdks {
          name
          availableModels {
            name
            reasoningLevels
          }
        }
        status
        lastHealthCheckAt
        lastSeenAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const REGENERATE_AGENT_RUNNER_SECRET_MUTATION = `
  mutation RegenerateAgentRunnerSecret($companyId: String!, $id: String!) {
    regenerateAgentRunnerSecret(companyId: $companyId, id: $id) {
      ok
      error
      provisionedAuthSecret
      runnerLaunchCommand
      agentRunner {
      id
      companyId
      name
      callbackUrl
      hasAuthSecret
      availableAgentSdks {
        name
        availableModels {
          name
          reasoningLevels
        }
      }
        status
        lastHealthCheckAt
        lastSeenAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const LIST_AGENTS_QUERY = `
  query ListAgents($companyId: String!) {
    agents(companyId: $companyId) {
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
        status
      }
    }
  }
`;

export const LIST_SKILLS_QUERY = `
  query ListSkills($companyId: String!) {
    skills(companyId: $companyId) {
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
  query ListRoles($companyId: String!) {
    roles: roles(companyId: $companyId) {
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
  query ListSkillGroups($companyId: String!) {
    skillGroups(companyId: $companyId) {
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
  query ListGitSkillPackages($companyId: String!) {
    gitSkillPackages(companyId: $companyId) {
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
    $companyId: ID!
    $gitRepositoryUrl: String!
    $gitReference: String!
  ) {
    createGitSkillPackage(
      companyId: $companyId
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
  mutation DeleteGitSkillPackage($companyId: ID!, $id: ID!) {
    deleteGitSkillPackage(companyId: $companyId, id: $id) {
      ok
      error
      deletedGitSkillPackageId
    }
  }
`;

export const CREATE_SKILL_GROUP_MUTATION = `
  mutation CreateSkillGroup($companyId: ID!, $name: String!, $parentSkillGroupId: ID) {
    createSkillGroup(
      companyId: $companyId
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
    $companyId: ID!
    $id: ID!
    $name: String!
    $parentSkillGroupId: ID
  ) {
    updateSkillGroup(
      companyId: $companyId
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
  mutation DeleteSkillGroup($companyId: ID!, $id: ID!) {
    deleteSkillGroup(companyId: $companyId, id: $id) {
      ok
      error
      deletedSkillGroupId
    }
  }
`;

export const ADD_SKILL_TO_GROUP_MUTATION = `
  mutation AddSkillToGroup($companyId: ID!, $skillGroupId: ID!, $skillId: ID!) {
    addSkillToSkillGroup(
      companyId: $companyId
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
  mutation RemoveSkillFromGroup($companyId: ID!, $skillGroupId: ID!, $skillId: ID!) {
    removeSkillFromSkillGroup(
      companyId: $companyId
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
  mutation CreateRole($companyId: ID!, $name: String!, $parentRoleId: ID) {
    createRole: createRole(
      companyId: $companyId
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
    $companyId: ID!
    $id: ID!
    $name: String!
    $parentRoleId: ID
  ) {
    updateRole: updateRole(
      companyId: $companyId
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
  mutation DeleteRole($companyId: ID!, $id: ID!) {
    deleteRole: deleteRole(companyId: $companyId, id: $id) {
      ok
      error
      deletedRoleId: deletedRoleId
    }
  }
`;

export const ADD_SKILL_TO_ROLE_MUTATION = `
  mutation AddSkillToRole($companyId: ID!, $roleId: ID!, $skillId: ID!) {
    addSkillToRole: addSkillToRole(
      companyId: $companyId
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
  mutation RemoveSkillFromRole($companyId: ID!, $roleId: ID!, $skillId: ID!) {
    removeSkillFromRole: removeSkillFromRole(
      companyId: $companyId
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
  mutation AddSkillGroupToRole($companyId: ID!, $roleId: ID!, $skillGroupId: ID!) {
    addSkillGroupToRole(
      companyId: $companyId
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
  mutation RemoveSkillGroupFromRole($companyId: ID!, $roleId: ID!, $skillGroupId: ID!) {
    removeSkillGroupFromRole(
      companyId: $companyId
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
  mutation AddMcpServerToRole($companyId: ID!, $roleId: ID!, $mcpServerId: ID!) {
    addMcpServerToRole(
      companyId: $companyId
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
  mutation RemoveMcpServerFromRole($companyId: ID!, $roleId: ID!, $mcpServerId: ID!) {
    removeMcpServerFromRole(
      companyId: $companyId
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
  query ListMcpServers($companyId: String!) {
    mcpServers(companyId: $companyId) {
      id
      companyId
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
      customHeaders {
        key
        value
      }
      enabled
    }
  }
`;

export const LIST_SECRETS_QUERY = `
  query ListSecrets($companyId: String!) {
    secrets(companyId: $companyId) {
      id
      companyId
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const LIST_SECRET_VALUE_QUERY = `
  query ListSecretValue($companyId: String!, $secretId: String!) {
    secretValue(companyId: $companyId, secretId: $secretId) {
      ok
      error
      value
    }
  }
`;

export const LIST_SECRET_ACCESS_LOGS_QUERY = `
  query ListSecretAccessLogs($companyId: String!, $secretId: String!, $first: Int) {
    secretAccessLogs(companyId: $companyId, secretId: $secretId, first: $first) {
      id
      companyId
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
  query ListApprovals($companyId: String!, $status: String, $first: Int) {
    approvals(companyId: $companyId, status: $status, first: $first) {
      id
      companyId
      type
      status
      secretId
      threadId
      reason
      rejectionReason
      createdByPrincipalId
      resolvedByPrincipalId
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
  mutation ApproveApproval($companyId: String!, $id: String!) {
    approveApproval(companyId: $companyId, id: $id) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const REJECT_APPROVAL_MUTATION = `
  mutation RejectApproval($companyId: String!, $id: String!, $rejectionReason: String) {
    rejectApproval(companyId: $companyId, id: $id, rejectionReason: $rejectionReason) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const DELETE_APPROVAL_MUTATION = `
  mutation DeleteApproval($companyId: String!, $id: String!) {
    deleteApproval(companyId: $companyId, id: $id) {
      ok
      error
      deletedApprovalId
    }
  }
`;

export const CREATE_SECRET_MUTATION = `
  mutation CreateSecret(
    $companyId: String!
    $name: String!
    $description: String!
    $value: String!
  ) {
    createSecret(
      companyId: $companyId
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        companyId
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
    $companyId: String!
    $id: String!
    $name: String!
    $description: String!
    $value: String
  ) {
    updateSecret(
      companyId: $companyId
      id: $id
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        companyId
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_SECRET_MUTATION = `
  mutation DeleteSecret($companyId: String!, $id: String!) {
    deleteSecret(companyId: $companyId, id: $id) {
      ok
      error
      deletedSecretId
    }
  }
`;

export const CREATE_TASK_MUTATION = `
  mutation CreateTask(
    $companyId: String!
    $name: String!
    $description: String
    $acceptanceCriteria: String
    $status: TaskStatus
    $assigneePrincipalId: ID
    $parentTaskId: ID
    $dependencyTaskIds: [ID!]
  ) {
    createTask(
      companyId: $companyId
      name: $name
      description: $description
      acceptanceCriteria: $acceptanceCriteria
      status: $status
      assigneePrincipalId: $assigneePrincipalId
      parentTaskId: $parentTaskId
      dependencyTaskIds: $dependencyTaskIds
    ) {
      ok
      error
      task {
        id
        company {
          id
        }
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
  }
`;

export const ADD_TASK_DEPENDENCY_MUTATION = `
  mutation AddTaskDependency($companyId: ID!, $taskId: ID!, $dependencyTaskId: ID!) {
    addTaskDependency(
      companyId: $companyId
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
        id
        company {
          id
        }
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
  }
`;

export const REMOVE_TASK_DEPENDENCY_MUTATION = `
  mutation RemoveTaskDependency($companyId: ID!, $taskId: ID!, $dependencyTaskId: ID!) {
    removeTaskDependency(
      companyId: $companyId
      taskId: $taskId
      dependencyTaskId: $dependencyTaskId
    ) {
      ok
      error
      task {
        id
        company {
          id
        }
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
  }
`;

export const SET_TASK_PARENT_MUTATION = `
  mutation SetTaskParent($companyId: ID!, $taskId: ID!, $parentTaskId: ID) {
    setTaskParent(
      companyId: $companyId
      taskId: $taskId
      parentTaskId: $parentTaskId
    ) {
      ok
      error
      task {
        id
        company {
          id
        }
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
  }
`;

export const SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION = `
  mutation SetTaskAssigneePrincipal($companyId: ID!, $taskId: ID!, $assigneePrincipalId: ID) {
    setTaskAssigneePrincipal(
      companyId: $companyId
      taskId: $taskId
      assigneePrincipalId: $assigneePrincipalId
    ) {
      ok
      error
      task {
        id
        assigneePrincipalId
        status
      }
    }
  }
`;

export const SET_TASK_STATUS_MUTATION = `
  mutation SetTaskStatus($companyId: ID!, $taskId: ID!, $status: TaskStatus!) {
    setTaskStatus(
      companyId: $companyId
      taskId: $taskId
      status: $status
    ) {
      ok
      error
      task {
        id
        assigneePrincipalId
        status
      }
    }
  }
`;

export const DELETE_TASK_MUTATION = `
  mutation DeleteTask($companyId: ID!, $id: ID!) {
    deleteTask(companyId: $companyId, id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

export const BATCH_DELETE_TASKS_MUTATION = `
  mutation BatchDeleteTasks($companyId: ID!, $ids: [ID!]!) {
    batchDeleteTasks(companyId: $companyId, ids: $ids) {
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
        id
        company {
          id
        }
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
  }
`;

export const CREATE_TASK_COMMENT_MUTATION = `
  mutation CreateTaskComment($companyId: ID!, $taskId: ID!, $comment: String!) {
    createTaskComment(companyId: $companyId, taskId: $taskId, comment: $comment) {
      ok
      error
      taskComment {
        id
        taskId
        companyId
        comment
        authorPrincipalId
        authorPrincipal {
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
  mutation DeleteAgentRunner($companyId: String!, $id: String!) {
    deleteAgentRunner(companyId: $companyId, id: $id) {
      ok
      error
      deletedAgentRunnerId
    }
  }
`;

export const CREATE_AGENT_MUTATION = `
  mutation CreateAgent(
    $companyId: String!
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
      companyId: $companyId
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
        companyId
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
    $companyId: String!
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
      companyId: $companyId
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
        companyId
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
  mutation DeleteAgent($companyId: String!, $id: String!) {
    deleteAgent(companyId: $companyId, id: $id) {
      ok
      error
      deletedAgentId
    }
  }
`;

export const CREATE_SKILL_MUTATION = `
  mutation CreateSkill(
    $companyId: String!
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    createSkill(
      companyId: $companyId
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
        companyId
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
    $companyId: String!
    $id: String!
    $name: String!
    $skillType: String
    $skillsMpPackageName: String
    $description: String
    $instructions: String
  ) {
    updateSkill(
      companyId: $companyId
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
        companyId
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
  mutation DeleteSkill($companyId: String!, $id: String!) {
    deleteSkill(companyId: $companyId, id: $id) {
      ok
      error
      deletedSkillId
    }
  }
`;

export const CREATE_MCP_SERVER_MUTATION = `
  mutation CreateMcpServer(
    $companyId: String!
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
      companyId: $companyId
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
        companyId
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
    $companyId: String!
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
      companyId: $companyId
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
        companyId
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
  mutation DeleteMcpServer($companyId: String!, $id: String!) {
    deleteMcpServer(companyId: $companyId, id: $id) {
      ok
      error
      deletedMcpServerId
    }
  }
`;

export const INITIALIZE_AGENT_MUTATION = `
  mutation InitializeAgentRunner($companyId: String!, $runnerId: String!, $agentId: String!) {
    initializeAgentRunner(companyId: $companyId, runnerId: $runnerId, agentId: $agentId) {
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
    $companyId: String!
    $agentId: String!
    $skillId: String!
    $runnerId: String
  ) {
    retryAgentSkillInstall(
      companyId: $companyId
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
        companyId
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
    $companyId: String!
    $agentId: String!
    $threadId: String
    $limit: Int
  ) {
    agentTurns(
      companyId: $companyId
      agentId: $agentId
      threadId: $threadId
      limit: $limit
    ) {
      id
      threadId
      companyId
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
        companyId
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
  query ListAgentThreads($companyId: String!, $agentId: String!, $limit: Int) {
    agentThreads(companyId: $companyId, agentId: $agentId, limit: $limit) {
      id
      threadId
      companyId
      agentId
      runnerId
      title
      additionalModelInstructions
      status
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AGENT_THREAD_MUTATION = `
  mutation CreateAgentThread(
    $companyId: String!
    $agentId: String!
    $title: String
    $additionalModelInstructions: String
    $runnerId: String
  ) {
    createAgentThread(
      companyId: $companyId
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
        companyId
        agentId
        runnerId
        title
        additionalModelInstructions
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
        companyId
        agentId
        runnerId
        title
        additionalModelInstructions
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_AGENT_THREAD_MUTATION = `
  mutation DeleteAgentThread($companyId: String!, $agentId: String!, $threadId: String!) {
    deleteAgentThread(companyId: $companyId, agentId: $agentId, threadId: $threadId) {
      ok
      error
      deletedThreadId
    }
  }
`;

export const CREATE_AGENT_TURN_MUTATION = `
  mutation CreateAgentTurn(
    $companyId: String!
    $agentId: String!
    $threadId: String!
    $text: String!
    $runnerId: String
  ) {
    createAgentTurn(
      companyId: $companyId
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
    $companyId: String!
    $agentId: String!
    $threadId: String!
    $turnId: String!
    $message: String!
    $runnerId: String
  ) {
    steerAgentTurn(
      companyId: $companyId
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
    $companyId: String!
    $agentId: String!
    $threadId: String!
    $runnerId: String
  ) {
    interruptAgentTurn(
      companyId: $companyId
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
  subscription AgentRunnersUpdated($companyId: ID!, $first: Int = 200) {
    agentRunnersUpdated(companyId: $companyId, first: $first) {
      edges {
        node {
          id
          company {
            id
          }
          agentSdks {
            name
            models {
              name
              reasoning
            }
          }
          status
        }
      }
    }
  }
`;

export const AGENT_THREADS_SUBSCRIPTION = `
  subscription AgentThreadsUpdated($companyId: ID!, $agentId: ID, $first: Int = 500) {
    agentThreadsUpdated(companyId: $companyId, agentId: $agentId, first: $first) {
      edges {
        node {
          id
          title
          additionalModelInstructions
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
`;

export const AGENT_TURNS_SUBSCRIPTION = `
  subscription AgentTurnsUpdated(
    $companyId: ID!
    $agentId: ID!
    $threadId: ID!
    $first: Int = 100
  ) {
    agentTurnsUpdated(companyId: $companyId, agentId: $agentId, threadId: $threadId, first: $first) {
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
    $companyId: ID!
    $agentId: ID!
    $threadId: ID!
    $first: Int = 200
  ) {
    queuedUserMessagesUpdated(
      companyId: $companyId
      agentId: $agentId
      threadId: $threadId
      first: $first
    ) {
      id
      status
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
  mutation CompanyApiDeleteCompany($companyId: ID!) {
    deleteCompany(companyId: $companyId)
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
  query CompanyApiListGithubInstallations($companyId: ID!) {
    githubInstallations(companyId: $companyId) {
      installationId
      company {
        id
      }
      createdAt
    }
  }
`;

export const COMPANY_API_LIST_REPOSITORIES_CONNECTION_QUERY = `
  query CompanyApiListRepositories(
    $companyId: ID!
    $githubInstallationId: ID
    $first: Int!
    $after: String
  ) {
    repositories(
      companyId: $companyId
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
          company {
            id
          }
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
    $companyId: ID!
    $installationId: ID!
    $setupAction: String
  ) {
    addGithubInstallation(
      companyId: $companyId
      installationId: $installationId
      setupAction: $setupAction
    ) {
      ok
      error
      githubInstallation {
        installationId
        createdAt
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_DELETE_GITHUB_INSTALLATION_MUTATION = `
  mutation CompanyApiDeleteGithubInstallation(
    $companyId: ID!
    $installationId: ID!
  ) {
    deleteGithubInstallation(
      companyId: $companyId
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
    $companyId: ID!
    $installationId: ID!
  ) {
    refreshGithubInstallationRepositories(
      companyId: $companyId
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
        company {
          id
        }
        githubInstallation {
          installationId
        }
      }
    }
  }
`;

export const COMPANY_API_LIST_TASKS_QUERY = `
  query CompanyApiListTasks($companyId: ID!) {
    tasks(companyId: $companyId) {
      id
      name
      description
      acceptanceCriteria
      assigneePrincipalId
      threadId
      parentTaskId
      status
      createdAt
      updatedAt
      dependencyTaskIds
      comments {
        id
        taskId
        companyId
        comment
        authorPrincipalId
        authorPrincipal {
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
      company {
        id
      }
    }
  }
`;

export const COMPANY_API_LIST_TASK_ASSIGNABLE_PRINCIPALS_QUERY = `
  query CompanyApiListTaskAssignablePrincipals($companyId: ID!) {
    taskAssignablePrincipals(companyId: $companyId) {
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
    $companyId: ID!
    $name: String!
    $description: String
    $acceptanceCriteria: String
    $status: TaskStatus
    $assigneePrincipalId: ID
    $parentTaskId: ID
    $dependencyTaskIds: [ID!]
  ) {
    createTask(
      companyId: $companyId
      name: $name
      description: $description
      acceptanceCriteria: $acceptanceCriteria
      status: $status
      assigneePrincipalId: $assigneePrincipalId
      parentTaskId: $parentTaskId
      dependencyTaskIds: $dependencyTaskIds
    ) {
      ok
      error
      task {
        id
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_ADD_TASK_DEPENDENCY_MUTATION = `
  mutation CompanyApiAddTaskDependency(
    $companyId: ID!
    $taskId: ID!
    $dependencyTaskId: ID!
  ) {
    addTaskDependency(
      companyId: $companyId
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
    $companyId: ID!
    $taskId: ID!
    $dependencyTaskId: ID!
  ) {
    removeTaskDependency(
      companyId: $companyId
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
  mutation CompanyApiSetTaskParent($companyId: ID!, $taskId: ID!, $parentTaskId: ID) {
    setTaskParent(
      companyId: $companyId
      taskId: $taskId
      parentTaskId: $parentTaskId
    ) {
      ok
      error
      task {
        id
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_SET_TASK_ASSIGNEE_PRINCIPAL_MUTATION = `
  mutation CompanyApiSetTaskAssigneePrincipal(
    $companyId: ID!
    $taskId: ID!
    $assigneePrincipalId: ID
  ) {
    setTaskAssigneePrincipal(
      companyId: $companyId
      taskId: $taskId
      assigneePrincipalId: $assigneePrincipalId
    ) {
      ok
      error
      task {
        id
        assigneePrincipalId
        status
      }
    }
  }
`;

export const COMPANY_API_SET_TASK_STATUS_MUTATION = `
  mutation CompanyApiSetTaskStatus($companyId: ID!, $taskId: ID!, $status: TaskStatus!) {
    setTaskStatus(
      companyId: $companyId
      taskId: $taskId
      status: $status
    ) {
      ok
      error
      task {
        id
        assigneePrincipalId
        status
      }
    }
  }
`;

export const COMPANY_API_DELETE_TASK_MUTATION = `
  mutation CompanyApiDeleteTask($companyId: ID!, $id: ID!) {
    deleteTask(companyId: $companyId, id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

export const COMPANY_API_BATCH_DELETE_TASKS_MUTATION = `
  mutation CompanyApiBatchDeleteTasks($companyId: ID!, $ids: [ID!]!) {
    batchDeleteTasks(companyId: $companyId, ids: $ids) {
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
        id
        name
        description
        acceptanceCriteria
        assigneePrincipalId
        threadId
        parentTaskId
        status
        createdAt
        updatedAt
        dependencyTaskIds
        comments {
          id
          taskId
          companyId
          comment
          authorPrincipalId
          authorPrincipal {
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
        company {
          id
        }
      }
    }
  }
`;

export const COMPANY_API_CREATE_TASK_COMMENT_MUTATION = `
  mutation CompanyApiCreateTaskComment($companyId: ID!, $taskId: ID!, $comment: String!) {
    createTaskComment(companyId: $companyId, taskId: $taskId, comment: $comment) {
      ok
      error
      taskComment {
        id
        taskId
        companyId
        comment
        authorPrincipalId
        authorPrincipal {
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
  query CompanyApiListSkills($companyId: ID!) {
    skills(companyId: $companyId) {
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
  query CompanyApiListRoles($companyId: ID!) {
    roles: roles(companyId: $companyId) {
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
  query CompanyApiListSkillGroups($companyId: ID!) {
    skillGroups(companyId: $companyId) {
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
  query CompanyApiListGitSkillPackages($companyId: ID!) {
    gitSkillPackages(companyId: $companyId) {
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
    $companyId: ID!
    $gitRepositoryUrl: String!
    $gitReference: String!
  ) {
    createGitSkillPackage(
      companyId: $companyId
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
  mutation CompanyApiDeleteGitSkillPackage($companyId: ID!, $id: ID!) {
    deleteGitSkillPackage(companyId: $companyId, id: $id) {
      ok
      error
      deletedGitSkillPackageId
    }
  }
`;

export const COMPANY_API_CREATE_SKILL_GROUP_MUTATION = `
  mutation CompanyApiCreateSkillGroup($companyId: ID!, $name: String!, $parentSkillGroupId: ID) {
    createSkillGroup(
      companyId: $companyId
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
    $companyId: ID!
    $id: ID!
    $name: String!
    $parentSkillGroupId: ID
  ) {
    updateSkillGroup(
      companyId: $companyId
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
  mutation CompanyApiDeleteSkillGroup($companyId: ID!, $id: ID!) {
    deleteSkillGroup(companyId: $companyId, id: $id) {
      ok
      error
      deletedSkillGroupId
    }
  }
`;

export const COMPANY_API_ADD_SKILL_TO_GROUP_MUTATION = `
  mutation CompanyApiAddSkillToGroup($companyId: ID!, $skillGroupId: ID!, $skillId: ID!) {
    addSkillToSkillGroup(
      companyId: $companyId
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
  mutation CompanyApiRemoveSkillFromGroup($companyId: ID!, $skillGroupId: ID!, $skillId: ID!) {
    removeSkillFromSkillGroup(
      companyId: $companyId
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
  mutation CompanyApiCreateRole($companyId: ID!, $name: String!, $parentRoleId: ID) {
    createRole: createRole(
      companyId: $companyId
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
    $companyId: ID!
    $id: ID!
    $name: String!
    $parentRoleId: ID
  ) {
    updateRole: updateRole(
      companyId: $companyId
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
  mutation CompanyApiDeleteRole($companyId: ID!, $id: ID!) {
    deleteRole: deleteRole(companyId: $companyId, id: $id) {
      ok
      error
      deletedRoleId: deletedRoleId
    }
  }
`;

export const COMPANY_API_ADD_SKILL_TO_ROLE_MUTATION = `
  mutation CompanyApiAddSkillToRole($companyId: ID!, $roleId: ID!, $skillId: ID!) {
    addSkillToRole: addSkillToRole(
      companyId: $companyId
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
  mutation CompanyApiRemoveSkillFromRole($companyId: ID!, $roleId: ID!, $skillId: ID!) {
    removeSkillFromRole: removeSkillFromRole(
      companyId: $companyId
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
  mutation CompanyApiAddSkillGroupToRole($companyId: ID!, $roleId: ID!, $skillGroupId: ID!) {
    addSkillGroupToRole(
      companyId: $companyId
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
  mutation CompanyApiRemoveSkillGroupFromRole($companyId: ID!, $roleId: ID!, $skillGroupId: ID!) {
    removeSkillGroupFromRole(
      companyId: $companyId
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
  mutation CompanyApiAddMcpServerToRole($companyId: ID!, $roleId: ID!, $mcpServerId: ID!) {
    addMcpServerToRole(
      companyId: $companyId
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
  mutation CompanyApiRemoveMcpServerFromRole($companyId: ID!, $roleId: ID!, $mcpServerId: ID!) {
    removeMcpServerFromRole(
      companyId: $companyId
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
  query CompanyApiListMcpServers($companyId: ID!) {
    mcpServers(companyId: $companyId) {
      id
      companyId
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
      customHeaders {
        key
        value
      }
      enabled
    }
  }
`;

export const COMPANY_API_LIST_SECRETS_QUERY = `
  query CompanyApiListSecrets($companyId: ID!) {
    secrets(companyId: $companyId) {
      id
      companyId
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const COMPANY_API_LIST_SECRET_VALUE_QUERY = `
  query CompanyApiListSecretValue($companyId: ID!, $secretId: ID!) {
    secretValue(companyId: $companyId, secretId: $secretId) {
      ok
      error
      value
    }
  }
`;

export const COMPANY_API_LIST_SECRET_ACCESS_LOGS_QUERY = `
  query CompanyApiListSecretAccessLogs($companyId: ID!, $secretId: ID!, $first: Int) {
    secretAccessLogs(companyId: $companyId, secretId: $secretId, first: $first) {
      id
      companyId
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
  query CompanyApiListApprovals($companyId: ID!, $status: ApprovalStatus, $first: Int) {
    approvals(companyId: $companyId, status: $status, first: $first) {
      id
      companyId
      type
      status
      secretId
      threadId
      reason
      rejectionReason
      createdByPrincipalId
      resolvedByPrincipalId
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
  mutation CompanyApiApproveApproval($companyId: ID!, $id: ID!) {
    approveApproval(companyId: $companyId, id: $id) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const COMPANY_API_REJECT_APPROVAL_MUTATION = `
  mutation CompanyApiRejectApproval($companyId: ID!, $id: ID!, $rejectionReason: String) {
    rejectApproval(companyId: $companyId, id: $id, rejectionReason: $rejectionReason) {
      ok
      error
      approval {
        id
      }
    }
  }
`;

export const COMPANY_API_DELETE_APPROVAL_MUTATION = `
  mutation CompanyApiDeleteApproval($companyId: ID!, $id: ID!) {
    deleteApproval(companyId: $companyId, id: $id) {
      ok
      error
      deletedApprovalId
    }
  }
`;

export const COMPANY_API_CREATE_SECRET_MUTATION = `
  mutation CompanyApiCreateSecret(
    $companyId: ID!
    $name: String!
    $description: String!
    $value: String!
  ) {
    createSecret(
      companyId: $companyId
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        companyId
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
    $companyId: ID!
    $id: ID!
    $name: String!
    $description: String!
    $value: String
  ) {
    updateSecret(
      companyId: $companyId
      id: $id
      name: $name
      description: $description
      value: $value
    ) {
      ok
      error
      secret {
        id
        companyId
        name
        description
        createdAt
        updatedAt
      }
    }
  }
`;

export const COMPANY_API_DELETE_SECRET_MUTATION = `
  mutation CompanyApiDeleteSecret($companyId: ID!, $id: ID!) {
    deleteSecret(companyId: $companyId, id: $id) {
      ok
      error
      deletedSecretId
    }
  }
`;

export const COMPANY_API_CREATE_MCP_SERVER_MUTATION = `
  mutation CompanyApiCreateMcpServer(
    $companyId: ID!
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
      companyId: $companyId
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
        companyId
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
    $companyId: ID!
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
      companyId: $companyId
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
        companyId
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
  mutation CompanyApiDeleteMcpServer($companyId: ID!, $id: ID!) {
    deleteMcpServer(companyId: $companyId, id: $id) {
      ok
      error
      deletedMcpServerId
    }
  }
`;

export const COMPANY_API_LIST_AGENT_RUNNERS_CONNECTION_QUERY = `
  query CompanyApiListAgentRunners($companyId: ID, $first: Int!, $after: String) {
    agentRunners(companyId: $companyId, first: $first, after: $after) {
      edges {
        node {
          id
          name
          agentSdks {
            id
            name
            company {
              id
            }
            runner {
              id
            }
            models {
              id
              name
              reasoning
              company {
                id
              }
              sdk {
                id
              }
            }
          }
          status
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
  mutation CompanyApiCreateAgentRunner($companyId: ID!, $name: String!) {
    createAgentRunner(companyId: $companyId, name: $name) {
      secret
      agentRunner {
        id
        name
        agentSdks {
          id
          name
          company {
            id
          }
          runner {
            id
          }
          models {
            id
            name
            reasoning
            company {
              id
            }
            sdk {
              id
            }
          }
        }
        status
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
        agentSdks {
          id
          name
          company {
            id
          }
          runner {
            id
          }
          models {
            id
            name
            reasoning
            company {
              id
            }
            sdk {
              id
            }
          }
        }
        status
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

export const COMPANY_API_LIST_AGENTS_CONNECTION_QUERY = `
  query CompanyApiListAgents($companyId: ID, $first: Int!, $after: String) {
    agents(companyId: $companyId, first: $first, after: $after) {
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
            status
            agentSdks {
              id
              name
              models {
                id
                name
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

export const COMPANY_API_LIST_AGENTS_WITH_THREADS_CONNECTION_QUERY = `
  query CompanyApiListAgentsWithThreads(
    $companyId: ID
    $first: Int!
    $after: String
    $firstThreads: Int = 500
  ) {
    agents(companyId: $companyId, first: $first, after: $after) {
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
            status
            agentSdks {
              id
              name
              models {
                id
                name
                reasoning
              }
            }
          }
          threads(first: $firstThreads) {
            edges {
              node {
                id
                title
                additionalModelInstructions
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
    $companyId: ID!
    $agentRunnerId: ID!
    $agentRunnerSdkId: ID!
    $defaultModelId: ID!
    $roleIds: [ID!]
    $mcpServerIds: [ID!]
    $defaultReasoningLevel: String
    $defaultAdditionalModelInstructions: String
  ) {
    createAgent(
      name: $name
      companyId: $companyId
      agentRunnerId: $agentRunnerId
      agentRunnerSdkId: $agentRunnerSdkId
      defaultModelId: $defaultModelId
      roleIds: $roleIds
      mcpServerIds: $mcpServerIds
      defaultReasoningLevel: $defaultReasoningLevel
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
    ) {
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
      defaultAdditionalModelInstructions
      company {
        id
      }
      runner {
        id
        name
        status
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
      mcpServerIds: $mcpServerIds
      defaultReasoningLevel: $defaultReasoningLevel
      defaultAdditionalModelInstructions: $defaultAdditionalModelInstructions
    ) {
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
      defaultAdditionalModelInstructions
      company {
        id
      }
      runner {
        id
        name
        status
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
  query CompanyApiListThreads($companyId: ID, $agentId: ID, $first: Int!, $after: String) {
    threads(companyId: $companyId, agentId: $agentId, first: $first, after: $after) {
      edges {
        node {
          id
          title
          additionalModelInstructions
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
    $companyId: ID!
    $agentId: ID!
    $title: String
    $additionalModelInstructions: String
  ) {
    createThread(
      companyId: $companyId
      agentId: $agentId
      title: $title
      additionalModelInstructions: $additionalModelInstructions
    ) {
      id
      title
      additionalModelInstructions
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
    deleteThread(threadId: $threadId)
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
