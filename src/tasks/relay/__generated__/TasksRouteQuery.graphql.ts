/**
 * @generated SignedSource<<d0beac73f2a291c92beaa0ef93ec943f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ActorKind = "agent" | "user" | "%future added value";
export type TasksRouteQuery$variables = {
  maxDepth?: number | null | undefined;
  rootTaskId?: string | null | undefined;
  topLevelOnly?: boolean | null | undefined;
};
export type TasksRouteQuery$data = {
  readonly agents: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly name: string;
      };
    }>;
  };
  readonly taskAssignableActors: ReadonlyArray<{
    readonly agentId: string | null | undefined;
    readonly displayName: string;
    readonly email: string | null | undefined;
    readonly id: string;
    readonly kind: ActorKind;
    readonly userId: string | null | undefined;
  }>;
  readonly tasks: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"TasksRoute_task">;
  }>;
};
export type TasksRouteQuery = {
  response: TasksRouteQuery$data;
  variables: TasksRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "maxDepth"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "rootTaskId"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "topLevelOnly"
},
v3 = [
  {
    "kind": "Variable",
    "name": "maxDepth",
    "variableName": "maxDepth"
  },
  {
    "kind": "Variable",
    "name": "rootTaskId",
    "variableName": "rootTaskId"
  },
  {
    "kind": "Variable",
    "name": "topLevelOnly",
    "variableName": "topLevelOnly"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "agentId",
  "storageKey": null
},
v6 = [
  (v4/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "kind",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "displayName",
    "storageKey": null
  },
  (v5/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "userId",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "email",
    "storageKey": null
  }
],
v7 = {
  "alias": null,
  "args": null,
  "concreteType": "Actor",
  "kind": "LinkedField",
  "name": "taskAssignableActors",
  "plural": true,
  "selections": (v6/*: any*/),
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 200
    }
  ],
  "concreteType": "AgentConnection",
  "kind": "LinkedField",
  "name": "agents",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "AgentEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Agent",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v4/*: any*/),
            (v8/*: any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": "agents(first:200)"
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "taskId",
  "storageKey": null
},
v14 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "inputTokens",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "cachedInputTokens",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "outputTokens",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "reasoningOutputTokens",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "totalTokens",
    "storageKey": null
  }
],
v15 = {
  "alias": null,
  "args": null,
  "concreteType": "TokenUsageBreakdown",
  "kind": "LinkedField",
  "name": "tokenUsage",
  "plural": false,
  "selections": (v14/*: any*/),
  "storageKey": null
},
v16 = [
  (v4/*: any*/),
  (v13/*: any*/),
  (v10/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "threadId",
    "storageKey": null
  },
  (v5/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "triggeredByActorId",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "failureMessage",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "startedAt",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "finishedAt",
    "storageKey": null
  },
  (v11/*: any*/),
  (v12/*: any*/),
  (v15/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TasksRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Task",
        "kind": "LinkedField",
        "name": "tasks",
        "plural": true,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TasksRoute_task"
          }
        ],
        "storageKey": null
      },
      (v7/*: any*/),
      (v9/*: any*/)
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TasksRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Task",
        "kind": "LinkedField",
        "name": "tasks",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Company",
            "kind": "LinkedField",
            "name": "company",
            "plural": false,
            "selections": [
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          (v8/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "acceptanceCriteria",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "assigneeActorId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Actor",
            "kind": "LinkedField",
            "name": "assigneeActor",
            "plural": false,
            "selections": (v6/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "parentTaskId",
            "storageKey": null
          },
          (v10/*: any*/),
          (v11/*: any*/),
          (v12/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "attemptCount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastRunStatus",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "has_running_threads",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TaskRun",
            "kind": "LinkedField",
            "name": "latestRun",
            "plural": false,
            "selections": (v16/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TaskRun",
            "kind": "LinkedField",
            "name": "activeRun",
            "plural": false,
            "selections": (v16/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "runningThreadId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TaskRun",
            "kind": "LinkedField",
            "name": "runs",
            "plural": true,
            "selections": (v16/*: any*/),
            "storageKey": null
          },
          (v15/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenUsageBreakdown",
            "kind": "LinkedField",
            "name": "aggregateTokenUsage",
            "plural": false,
            "selections": (v14/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "dependencyTaskIds",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TaskComment",
            "kind": "LinkedField",
            "name": "comments",
            "plural": true,
            "selections": [
              (v4/*: any*/),
              (v13/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "comment",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "authorActorId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Actor",
                "kind": "LinkedField",
                "name": "authorActor",
                "plural": false,
                "selections": (v6/*: any*/),
                "storageKey": null
              },
              (v11/*: any*/),
              (v12/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v7/*: any*/),
      (v9/*: any*/)
    ]
  },
  "params": {
    "cacheID": "669363e3b6f126a43d8f00d254f1b6e7",
    "id": null,
    "metadata": {},
    "name": "TasksRouteQuery",
    "operationKind": "query",
    "text": "query TasksRouteQuery(\n  $topLevelOnly: Boolean\n  $rootTaskId: ID\n  $maxDepth: Int\n) {\n  tasks(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {\n    ...TasksRoute_task\n    id\n  }\n  taskAssignableActors {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  agents(first: 200) {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n  }\n}\n\nfragment TasksRoute_task on Task {\n  id\n  company {\n    id\n  }\n  name\n  description\n  acceptanceCriteria\n  assigneeActorId\n  assigneeActor {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  parentTaskId\n  status\n  createdAt\n  updatedAt\n  attemptCount\n  lastRunStatus\n  has_running_threads\n  latestRun {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n    tokenUsage {\n      ...TasksRoute_tokenUsage\n    }\n  }\n  activeRun {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n    tokenUsage {\n      ...TasksRoute_tokenUsage\n    }\n  }\n  runningThreadId\n  runs {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n    tokenUsage {\n      ...TasksRoute_tokenUsage\n    }\n  }\n  tokenUsage {\n    ...TasksRoute_tokenUsage\n  }\n  aggregateTokenUsage {\n    ...TasksRoute_tokenUsage\n  }\n  dependencyTaskIds\n  comments {\n    id\n    taskId\n    comment\n    authorActorId\n    authorActor {\n      id\n      kind\n      displayName\n      agentId\n      userId\n      email\n    }\n    createdAt\n    updatedAt\n  }\n}\n\nfragment TasksRoute_tokenUsage on TokenUsageBreakdown {\n  inputTokens\n  cachedInputTokens\n  outputTokens\n  reasoningOutputTokens\n  totalTokens\n}\n"
  }
};
})();

(node as any).hash = "1b13ae1cb76e9e443fd1fdb3dcc76dfd";

export default node;
