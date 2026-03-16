/**
 * @generated SignedSource<<c5171160c9bbafa57a4e2027dd6b35aa>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TasksRouteTasksUpdatedSubscription$variables = {
  maxDepth?: number | null | undefined;
  rootTaskId?: string | null | undefined;
  topLevelOnly?: boolean | null | undefined;
};
export type TasksRouteTasksUpdatedSubscription$data = {
  readonly tasksUpdated: {
    readonly deletedTaskIds: ReadonlyArray<string>;
    readonly membershipChanged: boolean;
    readonly tasks: ReadonlyArray<{
      readonly " $fragmentSpreads": FragmentRefs<"TasksRoute_task">;
    }>;
  };
};
export type TasksRouteTasksUpdatedSubscription = {
  response: TasksRouteTasksUpdatedSubscription$data;
  variables: TasksRouteTasksUpdatedSubscription$variables;
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
  "name": "membershipChanged",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "deletedTaskIds",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "agentId",
  "storageKey": null
},
v8 = [
  (v6/*: any*/),
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
  (v7/*: any*/),
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
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "taskId",
  "storageKey": null
},
v13 = [
  (v6/*: any*/),
  (v12/*: any*/),
  (v9/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "threadId",
    "storageKey": null
  },
  (v7/*: any*/),
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
  (v10/*: any*/),
  (v11/*: any*/)
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
    "name": "TasksRouteTasksUpdatedSubscription",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "TasksUpdatedPayload",
        "kind": "LinkedField",
        "name": "tasksUpdated",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
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
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Subscription",
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
    "name": "TasksRouteTasksUpdatedSubscription",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "TasksUpdatedPayload",
        "kind": "LinkedField",
        "name": "tasksUpdated",
        "plural": false,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Task",
            "kind": "LinkedField",
            "name": "tasks",
            "plural": true,
            "selections": [
              (v6/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Company",
                "kind": "LinkedField",
                "name": "company",
                "plural": false,
                "selections": [
                  (v6/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "name",
                "storageKey": null
              },
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
                "selections": (v8/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "parentTaskId",
                "storageKey": null
              },
              (v9/*: any*/),
              (v10/*: any*/),
              (v11/*: any*/),
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
                "selections": (v13/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TaskRun",
                "kind": "LinkedField",
                "name": "activeRun",
                "plural": false,
                "selections": (v13/*: any*/),
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
                "selections": (v13/*: any*/),
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
                  (v6/*: any*/),
                  (v12/*: any*/),
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
                    "selections": (v8/*: any*/),
                    "storageKey": null
                  },
                  (v10/*: any*/),
                  (v11/*: any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "3ac4339e3c7c0de5de8e8e9e0e538a1a",
    "id": null,
    "metadata": {},
    "name": "TasksRouteTasksUpdatedSubscription",
    "operationKind": "subscription",
    "text": "subscription TasksRouteTasksUpdatedSubscription(\n  $topLevelOnly: Boolean\n  $rootTaskId: ID\n  $maxDepth: Int\n) {\n  tasksUpdated(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {\n    membershipChanged\n    deletedTaskIds\n    tasks {\n      ...TasksRoute_task\n      id\n    }\n  }\n}\n\nfragment TasksRoute_task on Task {\n  id\n  company {\n    id\n  }\n  name\n  description\n  acceptanceCriteria\n  assigneeActorId\n  assigneeActor {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  parentTaskId\n  status\n  createdAt\n  updatedAt\n  attemptCount\n  lastRunStatus\n  has_running_threads\n  latestRun {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n  }\n  activeRun {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n  }\n  runningThreadId\n  runs {\n    id\n    taskId\n    status\n    threadId\n    agentId\n    triggeredByActorId\n    failureMessage\n    startedAt\n    finishedAt\n    createdAt\n    updatedAt\n  }\n  dependencyTaskIds\n  comments {\n    id\n    taskId\n    comment\n    authorActorId\n    authorActor {\n      id\n      kind\n      displayName\n      agentId\n      userId\n      email\n    }\n    createdAt\n    updatedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "c1449179cb5e8d45ac23eb3c7cc5c4dd";

export default node;
