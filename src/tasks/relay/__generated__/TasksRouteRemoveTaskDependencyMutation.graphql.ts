/**
 * @generated SignedSource<<5c3f608f642556ae7934e94ffb11a506>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteRemoveTaskDependencyMutation$variables = {
  dependencyTaskId: string;
  taskId: string;
};
export type TasksRouteRemoveTaskDependencyMutation$data = {
  readonly removeTaskDependency: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteRemoveTaskDependencyMutation = {
  response: TasksRouteRemoveTaskDependencyMutation$data;
  variables: TasksRouteRemoveTaskDependencyMutation$variables;
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
    "name": "removeTaskDependency",
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
    "name": "TasksRouteRemoveTaskDependencyMutation",
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
    "name": "TasksRouteRemoveTaskDependencyMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "cb728fb17fc94bf3ce0a1083780d5539",
    "id": null,
    "metadata": {},
    "name": "TasksRouteRemoveTaskDependencyMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteRemoveTaskDependencyMutation(\n  $taskId: ID!\n  $dependencyTaskId: ID!\n) {\n  removeTaskDependency(taskId: $taskId, dependencyTaskId: $dependencyTaskId) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "63f7cd130c78c0f4543c1c03d3701b04";

export default node;
