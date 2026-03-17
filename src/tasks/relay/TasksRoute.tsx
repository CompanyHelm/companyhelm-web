import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ReactRelay from "react-relay";
import { authProvider } from "../../auth/runtime.ts";
import { TasksPage } from "../../pages/TasksPage.tsx";
import type { TaskRelationshipDraftById } from "../../types/domain.ts";
import { getActiveCompanyId } from "../../utils/company-context.ts";
import { GRAPHQL_URL } from "../../utils/constants.ts";
import { normalizeUniqueStringList } from "../../utils/normalization.ts";
import { buildTaskExecutionPlan } from "../../utils/task-execution.ts";
import {
  shouldRefetchTaskRoute,
  toTaskRouteViewModel,
} from "./adapters.ts";
import { filterTasksForAssigneeUserId } from "./task-route-filters.ts";

const {
  commitMutation,
  graphql,
  requestSubscription,
  useFragment,
  useLazyLoadQuery,
  useRelayEnvironment,
} = ReactRelay as any;

const tokenUsageFields = graphql`
  fragment TasksRoute_tokenUsage on TokenUsageBreakdown {
    inputTokens
    cachedInputTokens
    outputTokens
    reasoningOutputTokens
    totalTokens
  }
`;

const tasksRouteTaskFragment = graphql`
  fragment TasksRoute_task on Task @relay(plural: true) {
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
    parentTaskId
    status
    createdAt
    updatedAt
    attemptCount
    lastRunStatus
    has_running_threads
    latestRun {
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
      tokenUsage {
        ...TasksRoute_tokenUsage
      }
    }
    activeRun {
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
      tokenUsage {
        ...TasksRoute_tokenUsage
      }
    }
    runningThreadId
    runs {
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
      tokenUsage {
        ...TasksRoute_tokenUsage
      }
    }
    tokenUsage {
      ...TasksRoute_tokenUsage
    }
    aggregateTokenUsage {
      ...TasksRoute_tokenUsage
    }
    dependencyTaskIds
    comments {
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
`;

const tasksRouteQuery = graphql`
  query TasksRouteQuery($topLevelOnly: Boolean, $rootTaskId: ID, $maxDepth: Int) {
    tasks(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {
      ...TasksRoute_task
    }
    taskAssignableActors {
      id
      kind
      displayName
      agentId
      userId
      email
    }
    agents(first: 200) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const tasksUpdatedSubscription = graphql`
  subscription TasksRouteTasksUpdatedSubscription(
    $topLevelOnly: Boolean
    $rootTaskId: ID
    $maxDepth: Int
  ) {
    tasksUpdated(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {
      membershipChanged
      deletedTaskIds
      tasks {
        ...TasksRoute_task
      }
    }
  }
`;

const createTaskMutation = graphql`
  mutation TasksRouteCreateTaskMutation(
    $name: String!
    $description: String
    $status: TaskStatus
    $assigneeActorId: ID
    $parentTaskId: ID
    $dependencyTaskIds: [ID!]
  ) {
    createTask(
      name: $name
      description: $description
      status: $status
      assigneeActorId: $assigneeActorId
      parentTaskId: $parentTaskId
      dependencyTaskIds: $dependencyTaskIds
    ) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const setTaskAssigneeActorMutation = graphql`
  mutation TasksRouteSetTaskAssigneeActorMutation($taskId: ID!, $assigneeActorId: ID) {
    setTaskAssigneeActor(taskId: $taskId, assigneeActorId: $assigneeActorId) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const setTaskNameMutation = graphql`
  mutation TasksRouteSetTaskNameMutation($taskId: ID!, $name: String!) {
    setTaskName(taskId: $taskId, name: $name) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const setTaskDescriptionMutation = graphql`
  mutation TasksRouteSetTaskDescriptionMutation($taskId: ID!, $description: String) {
    setTaskDescription(taskId: $taskId, description: $description) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const setTaskStatusMutation = graphql`
  mutation TasksRouteSetTaskStatusMutation($taskId: ID!, $status: TaskStatus!) {
    setTaskStatus(taskId: $taskId, status: $status) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const addTaskDependencyMutation = graphql`
  mutation TasksRouteAddTaskDependencyMutation($taskId: ID!, $dependencyTaskId: ID!) {
    addTaskDependency(taskId: $taskId, dependencyTaskId: $dependencyTaskId) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const removeTaskDependencyMutation = graphql`
  mutation TasksRouteRemoveTaskDependencyMutation($taskId: ID!, $dependencyTaskId: ID!) {
    removeTaskDependency(taskId: $taskId, dependencyTaskId: $dependencyTaskId) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const setTaskParentMutation = graphql`
  mutation TasksRouteSetTaskParentMutation($taskId: ID!, $parentTaskId: ID) {
    setTaskParent(taskId: $taskId, parentTaskId: $parentTaskId) {
      ok
      error
      task {
        id
      }
    }
  }
`;

const deleteTaskMutation = graphql`
  mutation TasksRouteDeleteTaskMutation($id: ID!) {
    deleteTask(id: $id) {
      ok
      error
      deletedTaskId
    }
  }
`;

const batchDeleteTasksMutation = graphql`
  mutation TasksRouteBatchDeleteTasksMutation($ids: [ID!]!) {
    batchDeleteTasks(ids: $ids) {
      ok
      error
      deletedTaskIds
    }
  }
`;

const batchExecuteTasksMutation = graphql`
  mutation TasksRouteBatchExecuteTasksMutation($taskIds: [ID!]!, $agentId: ID!) {
    batchExecuteTasks(taskIds: $taskIds, agentId: $agentId) {
      ok
      error
      tasks {
        id
      }
    }
  }
`;

const createTaskCommentMutation = graphql`
  mutation TasksRouteCreateTaskCommentMutation($taskId: ID!, $comment: String!) {
    createTaskComment(taskId: $taskId, comment: $comment) {
      ok
      error
      taskComment {
        id
      }
    }
  }
`;

interface ConfirmationRequest {
  title: string;
  message: string;
  confirmLabel: string;
}

interface TasksRouteProps {
  pageId?: "tasks" | "my-tasks";
  activeTaskId: string;
  activeTab: "overview" | "runs" | "graph" | "table";
  assigneeUserId?: string;
  onTabChange: (tab: "overview" | "runs" | "graph" | "table") => void;
  onOpenTask: (taskId: string) => void;
  onBackToTasks: () => void;
  onOpenTaskThread: (threadId: string) => Promise<void> | void;
  onRequestConfirmation: (request: ConfirmationRequest) => Promise<boolean>;
}

function commitRelayMutation(environment: ReturnType<typeof useRelayEnvironment>, config: any) {
  return new Promise<any>((resolve, reject) => {
    commitMutation(environment, {
      ...config,
      onCompleted: (response: unknown, errors: Array<{ message?: string }> | null | undefined) => {
        const errorMessage = Array.isArray(errors) ? String(errors[0]?.message || "").trim() : "";
        if (errorMessage) {
          reject(new Error(errorMessage));
          return;
        }
        resolve(response);
      },
      onError: (error: Error) => {
        reject(error);
      },
    });
  });
}

const TASK_OPTIONS_QUERY = `query TaskOptionsQuery { taskOptions { id name parentTaskId } }`;

type TaskOptionRecord = { id: string; name: string; parentTaskId: string | null };

async function fetchTaskOptions(): Promise<TaskOptionRecord[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authorization = authProvider.getAuthorizationHeaderValue();
  if (authorization) {
    headers.Authorization = authorization;
  }
  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) {
    headers["x-company-id"] = activeCompanyId;
  }
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: TASK_OPTIONS_QUERY }),
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return Array.isArray(payload?.data?.taskOptions) ? payload.data.taskOptions : [];
}

function getQueryVariables(params: { activeTaskId: string }) {
  const normalizedActiveTaskId = String(params.activeTaskId || "").trim();
  const isTaskDetailRoute = Boolean(normalizedActiveTaskId);
  return {
    topLevelOnly: false,
    rootTaskId: isTaskDetailRoute ? normalizedActiveTaskId : null,
    maxDepth: null,
  };
}

export function TasksRoute({
  pageId = "tasks",
  activeTaskId,
  activeTab,
  assigneeUserId = "",
  onTabChange,
  onOpenTask,
  onBackToTasks,
  onOpenTaskThread,
  onRequestConfirmation,
}: TasksRouteProps) {
  const environment = useRelayEnvironment();
  const [taskError, setTaskError] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskAssigneeActorId, setTaskAssigneeActorId] = useState("");
  const [taskStatus, setTaskStatus] = useState("draft");
  const [parentTaskId, setParentTaskId] = useState("");
  const [dependencyTaskIds, setDependencyTaskIds] = useState<string[]>([]);
  const [relationshipDrafts, setRelationshipDrafts] = useState<TaskRelationshipDraftById>({});
  const [fetchKey, setFetchKey] = useState(0);
  const [taskOptions, setTaskOptions] = useState<TaskOptionRecord[]>([]);
  const taskOptionsFetchKeyRef = useRef(0);

  useEffect(() => {
    taskOptionsFetchKeyRef.current += 1;
    const currentFetchKey = taskOptionsFetchKeyRef.current;
    void fetchTaskOptions().then((options) => {
      if (currentFetchKey === taskOptionsFetchKeyRef.current) {
        setTaskOptions(options);
      }
    });
  }, [fetchKey]);

  const queryVariables = useMemo(
    () => getQueryVariables({ activeTaskId }),
    [activeTaskId],
  );
  const queryData = useLazyLoadQuery(tasksRouteQuery, queryVariables, {
    fetchPolicy: "store-and-network",
    fetchKey,
  }) as any;
  const taskNodes = useFragment(tasksRouteTaskFragment, queryData.tasks) as any[];
  const filteredTaskRouteData = useMemo(() => {
    if (pageId !== "my-tasks") {
      return {
        tasks: taskNodes,
        taskOptions,
      };
    }
    return filterTasksForAssigneeUserId({
      tasks: taskNodes,
      taskOptions,
      assigneeUserId,
    });
  }, [assigneeUserId, pageId, taskNodes, taskOptions]);
  const viewModel = useMemo(
    () =>
      toTaskRouteViewModel({
        ...queryData,
        tasks: filteredTaskRouteData.tasks,
        taskOptions: filteredTaskRouteData.taskOptions,
      }),
    [filteredTaskRouteData.taskOptions, filteredTaskRouteData.tasks, queryData],
  );

  useEffect(() => {
    setRelationshipDrafts(viewModel.relationshipDrafts);
  }, [viewModel.relationshipDrafts]);

  const refetchTasks = useCallback(() => {
    setFetchKey((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    const disposable = requestSubscription(environment, {
      subscription: tasksUpdatedSubscription,
      variables: queryVariables,
      onNext: (payload: any) => {
        const taskUpdate = payload?.tasksUpdated;
        if (!taskUpdate) {
          return;
        }
        const didDeleteActiveTask = Array.isArray(taskUpdate.deletedTaskIds)
          && taskUpdate.deletedTaskIds.some((taskId: string) => String(taskId || "").trim() === String(activeTaskId || "").trim());
        if (didDeleteActiveTask) {
          onBackToTasks();
        }
        if (shouldRefetchTaskRoute({
          membershipChanged: taskUpdate.membershipChanged,
          deletedTaskIds: taskUpdate.deletedTaskIds,
          activeTaskId,
        })) {
          refetchTasks();
        }
      },
      onError: (error: Error) => {
        setTaskError(error.message);
      },
    });
    return () => {
      disposable.dispose();
    };
  }, [activeTaskId, environment, onBackToTasks, queryVariables, refetchTasks]);

  const resetCreateTaskForm = useCallback(() => {
    setName("");
    setDescription("");
    setTaskAssigneeActorId("");
    setTaskStatus("draft");
    setParentTaskId("");
    setDependencyTaskIds([]);
  }, []);

  const commitRouteMutation = useCallback(async (config: any) => {
    const response = await commitRelayMutation(environment, config);
    return response;
  }, [environment]);

  const handleCreateTask = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return false;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: createTaskMutation,
        variables: {
          name: name.trim(),
          description: description.trim() || null,
          status: String(taskStatus || "").trim() || "draft",
          assigneeActorId: String(taskAssigneeActorId || "").trim() || null,
          parentTaskId: String(parentTaskId || "").trim() || null,
          dependencyTaskIds: normalizeUniqueStringList(dependencyTaskIds),
        },
      });
      const result = response?.createTask;
      if (!result?.ok) {
        throw new Error(result?.error || "Task creation failed.");
      }
      resetCreateTaskForm();
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }, [
    commitRouteMutation,
    dependencyTaskIds,
    description,
    name,
    parentTaskId,
    refetchTasks,
    resetCreateTaskForm,
    taskAssigneeActorId,
    taskStatus,
  ]);

  const handleCreateAndExecuteTask = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setTaskError("Task name is required.");
      return false;
    }
    const normalizedAgentId = String(
      viewModel.actors.find(
        (actor) => String(actor.id || "").trim() === String(taskAssigneeActorId || "").trim() && actor.kind === "agent",
      )?.agentId || "",
    ).trim();
    if (!normalizedAgentId) {
      setTaskError("Assign the task to an agent to execute it.");
      return false;
    }

    try {
      setIsSubmittingTask(true);
      setTaskError("");
      const createResponse = await commitRouteMutation({
        mutation: createTaskMutation,
        variables: {
          name: name.trim(),
          description: description.trim() || null,
          status: String(taskStatus || "").trim() || "draft",
          assigneeActorId: String(taskAssigneeActorId || "").trim() || null,
          parentTaskId: String(parentTaskId || "").trim() || null,
          dependencyTaskIds: normalizeUniqueStringList(dependencyTaskIds),
        },
      });
      const createResult = createResponse?.createTask;
      if (!createResult?.ok) {
        throw new Error(createResult?.error || "Task creation failed.");
      }
      const createdTaskId = String(createResult?.task?.id || "").trim();
      if (!createdTaskId) {
        throw new Error("Task was created but no ID was returned.");
      }

      const executeResponse = await commitRouteMutation({
        mutation: batchExecuteTasksMutation,
        variables: {
          taskIds: [createdTaskId],
          agentId: normalizedAgentId,
        },
      });
      const executeResult = executeResponse?.batchExecuteTasks;
      if (!executeResult?.ok) {
        throw new Error(executeResult?.error || "Task created but execution failed.");
      }

      resetCreateTaskForm();
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setIsSubmittingTask(false);
    }
  }, [
    commitRouteMutation,
    dependencyTaskIds,
    description,
    name,
    parentTaskId,
    refetchTasks,
    resetCreateTaskForm,
    taskAssigneeActorId,
    taskStatus,
    viewModel.actors,
  ]);

  const handleDeleteTask = useCallback(async (taskId: string, taskName: string) => {
    const confirmed = await onRequestConfirmation({
      title: "Delete task",
      message: `Delete task "${taskName}" (#${taskId})?`,
      confirmLabel: "Delete task",
    });
    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: deleteTaskMutation,
        variables: {
          id: taskId,
        },
      });
      const result = response?.deleteTask;
      if (!result?.ok) {
        throw new Error(result?.error || "Task deletion failed.");
      }
      if (String(activeTaskId || "").trim() === taskId) {
        onBackToTasks();
      }
      refetchTasks();
    } catch (error: any) {
      setTaskError(error.message);
    } finally {
      setDeletingTaskId(null);
    }
  }, [activeTaskId, commitRouteMutation, onBackToTasks, onRequestConfirmation, refetchTasks]);

  const handleBatchDeleteTasks = useCallback(async (taskIds: string[]) => {
    const normalizedTaskIds = normalizeUniqueStringList(taskIds || []);
    if (normalizedTaskIds.length === 0) {
      setTaskError("Select at least one task to delete.");
      return false;
    }

    const confirmed = await onRequestConfirmation({
      title: "Delete tasks",
      message: `Delete ${normalizedTaskIds.length} selected task${normalizedTaskIds.length === 1 ? "" : "s"}?`,
      confirmLabel: normalizedTaskIds.length === 1 ? "Delete task" : "Delete tasks",
    });
    if (!confirmed) {
      return false;
    }

    try {
      setDeletingTaskId("batch");
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: batchDeleteTasksMutation,
        variables: {
          ids: normalizedTaskIds,
        },
      });
      const result = response?.batchDeleteTasks;
      if (!result?.ok) {
        throw new Error(result?.error || "Batch task deletion failed.");
      }
      if (normalizedTaskIds.includes(String(activeTaskId || "").trim())) {
        onBackToTasks();
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setDeletingTaskId(null);
    }
  }, [activeTaskId, commitRouteMutation, onBackToTasks, onRequestConfirmation, refetchTasks]);

  const handleBatchExecuteTasks = useCallback(async (taskIds: string[], fallbackAgentId: string = "") => {
    const normalizedTaskIds = normalizeUniqueStringList(taskIds || []);
    if (normalizedTaskIds.length === 0) {
      setTaskError("Select at least one task to execute.");
      return false;
    }

    const executionPlan = buildTaskExecutionPlan({
      taskIds: normalizedTaskIds,
      tasks: viewModel.tasks,
      fallbackAgentId: String(fallbackAgentId || "").trim(),
    });
    if (executionPlan.missingTaskIds.length > 0) {
      setTaskError("Select a fallback agent for tasks without an assigned agent.");
      return false;
    }

    try {
      setSavingTaskId("batch");
      setTaskError("");
      for (const group of executionPlan.groups) {
        const response = await commitRouteMutation({
          mutation: batchExecuteTasksMutation,
          variables: {
            taskIds: group.taskIds,
            agentId: group.agentId,
          },
        });
        const result = response?.batchExecuteTasks;
        if (!result?.ok) {
          throw new Error(result?.error || "Batch task execution failed.");
        }
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks, viewModel.tasks]);

  const handleExecuteTask = useCallback(async (taskId: string, agentId: string) => {
    const normalizedTaskId = String(taskId || "").trim();
    const normalizedAgentId = String(agentId || "").trim();
    if (!normalizedTaskId) {
      setTaskError("Task not found.");
      return false;
    }
    if (!normalizedAgentId) {
      setTaskError("Select an agent to execute the task.");
      return false;
    }

    try {
      setSavingTaskId(normalizedTaskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: batchExecuteTasksMutation,
        variables: {
          taskIds: [normalizedTaskId],
          agentId: normalizedAgentId,
        },
      });
      const result = response?.batchExecuteTasks;
      if (!result?.ok) {
        throw new Error(result?.error || "Task execution failed.");
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks]);

  const handleRelationshipSave = useCallback(async (taskId: string) => {
    const currentTask = viewModel.tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      setTaskError("Task not found.");
      return false;
    }
    const draft = relationshipDrafts[taskId] || {
      dependencyTaskIds: [],
      parentTaskId: String(currentTask.parentTaskId || "").trim(),
      childTaskIds: [],
      assigneeActorId: String(currentTask.assigneeActorId || "").trim(),
      status: String(currentTask.status || "").trim() || "draft",
    };

    try {
      setSavingTaskId(taskId);
      setTaskError("");

      const currentDependencyTaskIds = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
      const draftDependencyTaskIds = normalizeUniqueStringList(draft.dependencyTaskIds || [])
        .filter((dependencyTaskId) => dependencyTaskId !== taskId);
      const draftDependencyTaskIdSet = new Set(draftDependencyTaskIds);
      const dependencyTaskIdsToAdd = draftDependencyTaskIds
        .filter((dependencyTaskId) => !currentDependencyTaskIds.includes(dependencyTaskId));
      const dependencyTaskIdsToRemove = currentDependencyTaskIds
        .filter((dependencyTaskId) => !draftDependencyTaskIdSet.has(dependencyTaskId));

      const currentParentTaskId = String(currentTask.parentTaskId || "").trim();
      const draftParentTaskId = String(draft.parentTaskId || "").trim();
      const nextParentTaskId = draftParentTaskId && draftParentTaskId !== taskId ? draftParentTaskId : "";
      const currentChildTaskIds = normalizeUniqueStringList(
        viewModel.taskOptions
          .filter((candidateTask) => String(candidateTask?.parentTaskId || "").trim() === taskId)
          .map((candidateTask) => String(candidateTask?.id || "").trim()),
      );
      const draftChildTaskIds = normalizeUniqueStringList(draft.childTaskIds || [])
        .filter((childTaskId) => childTaskId !== taskId && childTaskId !== nextParentTaskId);
      const draftChildTaskIdSet = new Set(draftChildTaskIds);
      const childTaskIdsToClearParent = currentChildTaskIds
        .filter((childTaskId) => !draftChildTaskIdSet.has(childTaskId));
      const childTaskIdsToAssign = draftChildTaskIds
        .filter((childTaskId) => !currentChildTaskIds.includes(childTaskId));

      const currentAssigneeActorId = String(currentTask.assigneeActorId || "").trim();
      const nextAssigneeActorId = String(draft.assigneeActorId || "").trim();
      const currentStatus = String(currentTask.status || "").trim() || "draft";
      const nextStatus = String(draft.status || "").trim() || "draft";

      if (currentAssigneeActorId !== nextAssigneeActorId) {
        const response = await commitRouteMutation({
          mutation: setTaskAssigneeActorMutation,
          variables: {
            taskId,
            assigneeActorId: nextAssigneeActorId || null,
          },
        });
        const result = response?.setTaskAssigneeActor;
        if (!result?.ok) {
          throw new Error(result?.error || "Task assignee update failed.");
        }
      }

      if (currentStatus !== nextStatus) {
        const response = await commitRouteMutation({
          mutation: setTaskStatusMutation,
          variables: {
            taskId,
            status: nextStatus,
          },
        });
        const result = response?.setTaskStatus;
        if (!result?.ok) {
          throw new Error(result?.error || "Task status update failed.");
        }
      }

      for (const dependencyTaskId of dependencyTaskIdsToAdd) {
        const response = await commitRouteMutation({
          mutation: addTaskDependencyMutation,
          variables: {
            taskId,
            dependencyTaskId,
          },
        });
        const result = response?.addTaskDependency;
        if (!result?.ok) {
          throw new Error(result?.error || "Task dependency update failed.");
        }
      }

      for (const dependencyTaskId of dependencyTaskIdsToRemove) {
        const response = await commitRouteMutation({
          mutation: removeTaskDependencyMutation,
          variables: {
            taskId,
            dependencyTaskId,
          },
        });
        const result = response?.removeTaskDependency;
        if (!result?.ok) {
          throw new Error(result?.error || "Task dependency update failed.");
        }
      }

      for (const childTaskId of childTaskIdsToClearParent) {
        const response = await commitRouteMutation({
          mutation: setTaskParentMutation,
          variables: {
            taskId: childTaskId,
            parentTaskId: null,
          },
        });
        const result = response?.setTaskParent;
        if (!result?.ok) {
          throw new Error(result?.error || "Task parent update failed.");
        }
      }

      if (currentParentTaskId !== nextParentTaskId) {
        const response = await commitRouteMutation({
          mutation: setTaskParentMutation,
          variables: {
            taskId,
            parentTaskId: nextParentTaskId || null,
          },
        });
        const result = response?.setTaskParent;
        if (!result?.ok) {
          throw new Error(result?.error || "Task parent update failed.");
        }
      }

      for (const childTaskId of childTaskIdsToAssign) {
        const response = await commitRouteMutation({
          mutation: setTaskParentMutation,
          variables: {
            taskId: childTaskId,
            parentTaskId: taskId,
          },
        });
        const result = response?.setTaskParent;
        if (!result?.ok) {
          throw new Error(result?.error || "Task parent update failed.");
        }
      }

      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks, relationshipDrafts, viewModel.taskOptions, viewModel.tasks]);

  const handleRemoveTaskDependency = useCallback(async (taskId: string, dependencyTaskId: string) => {
    const currentTask = viewModel.tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }
    const currentDependencies = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
    if (!currentDependencies.includes(dependencyTaskId)) {
      return;
    }

    try {
      setSavingTaskId(taskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: removeTaskDependencyMutation,
        variables: {
          taskId,
          dependencyTaskId,
        },
      });
      const result = response?.removeTaskDependency;
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to remove dependency.");
      }
      refetchTasks();
    } catch (error: any) {
      setTaskError(error.message);
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks, viewModel.tasks]);

  const handleAddTaskDependency = useCallback(async (taskId: string, dependencyTaskId: string) => {
    const currentTask = viewModel.tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }
    const currentDependencies = normalizeUniqueStringList(currentTask.dependencyTaskIds || []);
    if (currentDependencies.includes(dependencyTaskId) || dependencyTaskId === taskId) {
      return;
    }

    try {
      setSavingTaskId(taskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: addTaskDependencyMutation,
        variables: {
          taskId,
          dependencyTaskId,
        },
      });
      const result = response?.addTaskDependency;
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to add dependency.");
      }
      refetchTasks();
    } catch (error: any) {
      setTaskError(error.message);
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks, viewModel.tasks]);

  const handleCreateTaskComment = useCallback(async (taskId: string, comment: string) => {
    const normalizedTaskId = String(taskId || "").trim();
    const normalizedComment = String(comment || "").trim();
    if (!normalizedTaskId) {
      setTaskError("Task id is required to add a comment.");
      return false;
    }
    if (!normalizedComment) {
      setTaskError("Comment text is required.");
      return false;
    }

    try {
      setCommentingTaskId(normalizedTaskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: createTaskCommentMutation,
        variables: {
          taskId: normalizedTaskId,
          comment: normalizedComment,
        },
      });
      const result = response?.createTaskComment;
      if (!result?.ok) {
        throw new Error(result?.error || "Task comment creation failed.");
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setCommentingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks]);

  const handleDraftChange = useCallback((
    taskId: string,
    field: "dependencyTaskIds" | "parentTaskId" | "childTaskIds" | "assigneeActorId" | "status",
    value: string | string[],
  ) => {
    setRelationshipDrafts((currentDrafts) => {
      const nextDraft = {
        ...(currentDrafts[taskId] || {
          dependencyTaskIds: [],
          parentTaskId: "",
          childTaskIds: [],
          assigneeActorId: "",
          status: "draft",
        }),
      };
      if (field === "dependencyTaskIds" || field === "childTaskIds") {
        nextDraft[field] = normalizeUniqueStringList(Array.isArray(value) ? value : []);
      } else if (field === "status") {
        nextDraft.status = String(value || "").trim() || "draft";
      } else if (field === "assigneeActorId") {
        nextDraft.assigneeActorId = String(value || "").trim();
      } else {
        nextDraft.parentTaskId = String(value || "").trim();
      }
      return {
        ...currentDrafts,
        [taskId]: nextDraft,
      };
    });
  }, []);

  const handleSetTaskName = useCallback(async (taskId: string, nextName: string) => {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      setTaskError("Task name cannot be empty.");
      return false;
    }
    try {
      setSavingTaskId(taskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: setTaskNameMutation,
        variables: { taskId, name: trimmedName },
      });
      const result = response?.setTaskName;
      if (!result?.ok) {
        throw new Error(result?.error || "Task name update failed.");
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks]);

  const handleSetTaskDescription = useCallback(async (taskId: string, nextDescription: string) => {
    try {
      setSavingTaskId(taskId);
      setTaskError("");
      const response = await commitRouteMutation({
        mutation: setTaskDescriptionMutation,
        variables: { taskId, description: nextDescription.trim() || null },
      });
      const result = response?.setTaskDescription;
      if (!result?.ok) {
        throw new Error(result?.error || "Task description update failed.");
      }
      refetchTasks();
      return true;
    } catch (error: any) {
      setTaskError(error.message);
      return false;
    } finally {
      setSavingTaskId(null);
    }
  }, [commitRouteMutation, refetchTasks]);

  return (
    <TasksPage
      tasks={viewModel.tasks}
      taskOptions={viewModel.taskOptions}
      agents={viewModel.agents}
      actors={viewModel.actors}
      isLoadingTasks={false}
      taskError={taskError}
      isSubmittingTask={isSubmittingTask}
      savingTaskId={savingTaskId}
      commentingTaskId={commentingTaskId}
      deletingTaskId={deletingTaskId}
      name={name}
      description={description}
      assigneeActorId={taskAssigneeActorId}
      status={taskStatus}
      parentTaskId={parentTaskId}
      dependencyTaskIds={dependencyTaskIds}
      relationshipDrafts={relationshipDrafts}
      onNameChange={setName}
      onDescriptionChange={setDescription}
      onAssigneeActorIdChange={setTaskAssigneeActorId}
      onStatusChange={setTaskStatus}
      onParentTaskIdChange={setParentTaskId}
      onDependencyTaskIdsChange={setDependencyTaskIds}
      onCreateTask={handleCreateTask}
      onCreateAndExecuteTask={handleCreateAndExecuteTask}
      onDraftChange={handleDraftChange}
      onSaveRelationships={handleRelationshipSave}
      onSetTaskName={handleSetTaskName}
      onSetTaskDescription={handleSetTaskDescription}
      onExecuteTask={handleExecuteTask}
      onAddDependency={handleAddTaskDependency}
      onRemoveDependency={handleRemoveTaskDependency}
      onCreateTaskComment={handleCreateTaskComment}
      onDeleteTask={handleDeleteTask}
      onBatchDeleteTasks={handleBatchDeleteTasks}
      onBatchExecuteTasks={handleBatchExecuteTasks}
      onOpenTaskThread={onOpenTaskThread}
      activeTaskId={activeTaskId}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onOpenTask={onOpenTask}
    />
  );
}
