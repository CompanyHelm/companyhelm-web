/**
 * @generated SignedSource<<a8a494f656754677ce645af514bcc17f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteSetTaskCategoryMutation$variables = {
  category?: string | null | undefined;
  taskId: string;
};
export type TasksRouteSetTaskCategoryMutation$data = {
  readonly setTaskCategory: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteSetTaskCategoryMutation = {
  response: TasksRouteSetTaskCategoryMutation$data;
  variables: TasksRouteSetTaskCategoryMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "category"
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
        "name": "category",
        "variableName": "category"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "setTaskCategory",
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
    "name": "TasksRouteSetTaskCategoryMutation",
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
    "name": "TasksRouteSetTaskCategoryMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "99cf6c3919cdecd82dfe8c8fd30aabfe",
    "id": null,
    "metadata": {},
    "name": "TasksRouteSetTaskCategoryMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteSetTaskCategoryMutation(\n  $taskId: ID!\n  $category: String\n) {\n  setTaskCategory(taskId: $taskId, category: $category) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "21ae2e5c0f33a2d2d1a2964d7b538909";

export default node;
