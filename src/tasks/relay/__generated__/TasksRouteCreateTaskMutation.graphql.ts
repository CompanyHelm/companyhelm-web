/**
 * @generated SignedSource<<fef8d64d5f6253c616aacbc65afd8caf>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TaskStatus = "completed" | "draft" | "in_progress" | "pending" | "%future added value";
export type TasksRouteCreateTaskMutation$variables = {
  assigneePrincipalId?: string | null | undefined;
  dependencyTaskIds?: ReadonlyArray<string> | null | undefined;
  description?: string | null | undefined;
  name: string;
  parentTaskId?: string | null | undefined;
  status?: TaskStatus | null | undefined;
};
export type TasksRouteCreateTaskMutation$data = {
  readonly createTask: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteCreateTaskMutation = {
  response: TasksRouteCreateTaskMutation$data;
  variables: TasksRouteCreateTaskMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "assigneePrincipalId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "dependencyTaskIds"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "description"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "name"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "parentTaskId"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "status"
},
v6 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "assigneePrincipalId",
        "variableName": "assigneePrincipalId"
      },
      {
        "kind": "Variable",
        "name": "dependencyTaskIds",
        "variableName": "dependencyTaskIds"
      },
      {
        "kind": "Variable",
        "name": "description",
        "variableName": "description"
      },
      {
        "kind": "Variable",
        "name": "name",
        "variableName": "name"
      },
      {
        "kind": "Variable",
        "name": "parentTaskId",
        "variableName": "parentTaskId"
      },
      {
        "kind": "Variable",
        "name": "status",
        "variableName": "status"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "createTask",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "ok",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "error",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Task",
        "kind": "LinkedField",
        "name": "task",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/),
      (v3/*: any*/),
      (v4/*: any*/),
      (v5/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TasksRouteCreateTaskMutation",
    "selections": (v6/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v3/*: any*/),
      (v2/*: any*/),
      (v5/*: any*/),
      (v0/*: any*/),
      (v4/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "TasksRouteCreateTaskMutation",
    "selections": (v6/*: any*/)
  },
  "params": {
    "cacheID": "84281b5cda175ea5fe18c8cc128714dc",
    "id": null,
    "metadata": {},
    "name": "TasksRouteCreateTaskMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteCreateTaskMutation(\n  $name: String!\n  $description: String\n  $status: TaskStatus\n  $assigneePrincipalId: ID\n  $parentTaskId: ID\n  $dependencyTaskIds: [ID!]\n) {\n  createTask(name: $name, description: $description, status: $status, assigneePrincipalId: $assigneePrincipalId, parentTaskId: $parentTaskId, dependencyTaskIds: $dependencyTaskIds) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "e293629fdb734993bf7db0aa74fae751";

export default node;
