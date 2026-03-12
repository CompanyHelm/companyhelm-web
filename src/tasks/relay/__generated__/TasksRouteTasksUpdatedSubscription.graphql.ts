/**
 * @generated SignedSource<<556fd64518ec7a51f3558fd805f46cf3>>
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
v7 = [
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
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "agentId",
    "storageKey": null
  },
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
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
};
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
                "name": "assigneePrincipalId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Principal",
                "kind": "LinkedField",
                "name": "assigneePrincipal",
                "plural": false,
                "selections": (v7/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "threadId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "parentTaskId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "status",
                "storageKey": null
              },
              (v8/*: any*/),
              (v9/*: any*/),
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
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "taskId",
                    "storageKey": null
                  },
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
                    "name": "authorPrincipalId",
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Principal",
                    "kind": "LinkedField",
                    "name": "authorPrincipal",
                    "plural": false,
                    "selections": (v7/*: any*/),
                    "storageKey": null
                  },
                  (v8/*: any*/),
                  (v9/*: any*/)
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
    "cacheID": "38e6f1153825fb69f63829b9e2932c07",
    "id": null,
    "metadata": {},
    "name": "TasksRouteTasksUpdatedSubscription",
    "operationKind": "subscription",
    "text": "subscription TasksRouteTasksUpdatedSubscription(\n  $topLevelOnly: Boolean\n  $rootTaskId: ID\n  $maxDepth: Int\n) {\n  tasksUpdated(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {\n    membershipChanged\n    deletedTaskIds\n    tasks {\n      ...TasksRoute_task\n      id\n    }\n  }\n}\n\nfragment TasksRoute_task on Task {\n  id\n  company {\n    id\n  }\n  name\n  description\n  acceptanceCriteria\n  assigneePrincipalId\n  assigneePrincipal {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  threadId\n  parentTaskId\n  status\n  createdAt\n  updatedAt\n  dependencyTaskIds\n  comments {\n    id\n    taskId\n    comment\n    authorPrincipalId\n    authorPrincipal {\n      id\n      kind\n      displayName\n      agentId\n      userId\n      email\n    }\n    createdAt\n    updatedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "c1449179cb5e8d45ac23eb3c7cc5c4dd";

export default node;
