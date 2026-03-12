/**
 * @generated SignedSource<<88c342348758709719336651d65be737>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TaskStatus = "completed" | "draft" | "in_progress" | "pending" | "%future added value";
export type TasksRouteSetTaskStatusMutation$variables = {
  status: TaskStatus;
  taskId: string;
};
export type TasksRouteSetTaskStatusMutation$data = {
  readonly setTaskStatus: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteSetTaskStatusMutation = {
  response: TasksRouteSetTaskStatusMutation$data;
  variables: TasksRouteSetTaskStatusMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "status"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "taskId"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "status",
        "variableName": "status"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "setTaskStatus",
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
      (v1/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TasksRouteSetTaskStatusMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TasksRouteSetTaskStatusMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "e6f772aa5a9a558135bd473776d68f96",
    "id": null,
    "metadata": {},
    "name": "TasksRouteSetTaskStatusMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteSetTaskStatusMutation(\n  $taskId: ID!\n  $status: TaskStatus!\n) {\n  setTaskStatus(taskId: $taskId, status: $status) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "8ec8a53f6e68a0391b91db2fb3967023";

export default node;
