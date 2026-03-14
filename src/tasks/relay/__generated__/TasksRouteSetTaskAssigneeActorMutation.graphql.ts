/**
 * @generated SignedSource<<094d34d7b8a1e2cdb03c8a9e467c93c1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteSetTaskAssigneeActorMutation$variables = {
  assigneeActorId?: string | null | undefined;
  taskId: string;
};
export type TasksRouteSetTaskAssigneeActorMutation$data = {
  readonly setTaskAssigneeActor: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteSetTaskAssigneeActorMutation = {
  response: TasksRouteSetTaskAssigneeActorMutation$data;
  variables: TasksRouteSetTaskAssigneeActorMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "assigneeActorId"
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
        "name": "assigneeActorId",
        "variableName": "assigneeActorId"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "setTaskAssigneeActor",
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
    "name": "TasksRouteSetTaskAssigneeActorMutation",
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
    "name": "TasksRouteSetTaskAssigneeActorMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "d56566260d69098fb3b1ee028a015383",
    "id": null,
    "metadata": {},
    "name": "TasksRouteSetTaskAssigneeActorMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteSetTaskAssigneeActorMutation(\n  $taskId: ID!\n  $assigneeActorId: ID\n) {\n  setTaskAssigneeActor(taskId: $taskId, assigneeActorId: $assigneeActorId) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2739767bc682feca68563b30aa01c440";

export default node;
