/**
 * @generated SignedSource<<b8388b1b99f94e29dfff90ad3cedaba9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteSetTaskDescriptionMutation$variables = {
  description?: string | null | undefined;
  taskId: string;
};
export type TasksRouteSetTaskDescriptionMutation$data = {
  readonly setTaskDescription: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteSetTaskDescriptionMutation = {
  response: TasksRouteSetTaskDescriptionMutation$data;
  variables: TasksRouteSetTaskDescriptionMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "description"
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
        "name": "description",
        "variableName": "description"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "setTaskDescription",
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
    "name": "TasksRouteSetTaskDescriptionMutation",
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
    "name": "TasksRouteSetTaskDescriptionMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "6351ee075d9ac7925053cbc7e5e4aa3d",
    "id": null,
    "metadata": {},
    "name": "TasksRouteSetTaskDescriptionMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteSetTaskDescriptionMutation(\n  $taskId: ID!\n  $description: String\n) {\n  setTaskDescription(taskId: $taskId, description: $description) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "555867deb912bc84556c495d906060e9";

export default node;
