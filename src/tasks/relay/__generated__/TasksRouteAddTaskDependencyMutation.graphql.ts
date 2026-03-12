/**
 * @generated SignedSource<<ae6b1045cbb7a3ea56dc0795e8ef5d03>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteAddTaskDependencyMutation$variables = {
  dependencyTaskId: string;
  taskId: string;
};
export type TasksRouteAddTaskDependencyMutation$data = {
  readonly addTaskDependency: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteAddTaskDependencyMutation = {
  response: TasksRouteAddTaskDependencyMutation$data;
  variables: TasksRouteAddTaskDependencyMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "dependencyTaskId"
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
        "name": "dependencyTaskId",
        "variableName": "dependencyTaskId"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "addTaskDependency",
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
    "name": "TasksRouteAddTaskDependencyMutation",
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
    "name": "TasksRouteAddTaskDependencyMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "990277d4a004dca4fde3ecf0dd4c656c",
    "id": null,
    "metadata": {},
    "name": "TasksRouteAddTaskDependencyMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteAddTaskDependencyMutation(\n  $taskId: ID!\n  $dependencyTaskId: ID!\n) {\n  addTaskDependency(taskId: $taskId, dependencyTaskId: $dependencyTaskId) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "9cdee5e524b624197d2395bb42d18882";

export default node;
