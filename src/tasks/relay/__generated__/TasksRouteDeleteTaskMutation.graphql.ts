/**
 * @generated SignedSource<<bfba5bccbb572126b9e5d0b2e5123242>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteDeleteTaskMutation$variables = {
  id: string;
};
export type TasksRouteDeleteTaskMutation$data = {
  readonly deleteTask: {
    readonly deletedTaskId: string | null | undefined;
    readonly error: string | null | undefined;
    readonly ok: boolean;
  };
};
export type TasksRouteDeleteTaskMutation = {
  response: TasksRouteDeleteTaskMutation$data;
  variables: TasksRouteDeleteTaskMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "concreteType": "DeleteTaskPayload",
    "kind": "LinkedField",
    "name": "deleteTask",
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
        "kind": "ScalarField",
        "name": "deletedTaskId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TasksRouteDeleteTaskMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TasksRouteDeleteTaskMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "12911230174404cb66f096d9ed4dad25",
    "id": null,
    "metadata": {},
    "name": "TasksRouteDeleteTaskMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteDeleteTaskMutation(\n  $id: ID!\n) {\n  deleteTask(id: $id) {\n    ok\n    error\n    deletedTaskId\n  }\n}\n"
  }
};
})();

(node as any).hash = "0e768e2829386c3c95a92ca7cf6d0198";

export default node;
