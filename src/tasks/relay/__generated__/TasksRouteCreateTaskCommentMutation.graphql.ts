/**
 * @generated SignedSource<<f1d09f7ce96a81cd4daf3d43c055e807>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteCreateTaskCommentMutation$variables = {
  comment: string;
  taskId: string;
};
export type TasksRouteCreateTaskCommentMutation$data = {
  readonly createTaskComment: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly taskComment: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteCreateTaskCommentMutation = {
  response: TasksRouteCreateTaskCommentMutation$data;
  variables: TasksRouteCreateTaskCommentMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "comment"
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
        "name": "comment",
        "variableName": "comment"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskCommentMutationPayload",
    "kind": "LinkedField",
    "name": "createTaskComment",
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
        "concreteType": "TaskComment",
        "kind": "LinkedField",
        "name": "taskComment",
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
    "name": "TasksRouteCreateTaskCommentMutation",
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
    "name": "TasksRouteCreateTaskCommentMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "ad71eb80b7b3bfa395d7a223b551846f",
    "id": null,
    "metadata": {},
    "name": "TasksRouteCreateTaskCommentMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteCreateTaskCommentMutation(\n  $taskId: ID!\n  $comment: String!\n) {\n  createTaskComment(taskId: $taskId, comment: $comment) {\n    ok\n    error\n    taskComment {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3cb0dc6069bad49cbad94215ab451819";

export default node;
