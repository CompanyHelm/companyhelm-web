/**
 * @generated SignedSource<<2d4a8ed342bdf3f6cb025684c04462ea>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteBatchDeleteTasksMutation$variables = {
  ids: ReadonlyArray<string>;
};
export type TasksRouteBatchDeleteTasksMutation$data = {
  readonly batchDeleteTasks: {
    readonly deletedTaskIds: ReadonlyArray<string>;
    readonly error: string | null | undefined;
    readonly ok: boolean;
  };
};
export type TasksRouteBatchDeleteTasksMutation = {
  response: TasksRouteBatchDeleteTasksMutation$data;
  variables: TasksRouteBatchDeleteTasksMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ids"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "ids",
        "variableName": "ids"
      }
    ],
    "concreteType": "BatchDeleteTasksPayload",
    "kind": "LinkedField",
    "name": "batchDeleteTasks",
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
        "name": "deletedTaskIds",
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
    "name": "TasksRouteBatchDeleteTasksMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TasksRouteBatchDeleteTasksMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "77dbfc0e8827ee99f6a5dbe9826a49b8",
    "id": null,
    "metadata": {},
    "name": "TasksRouteBatchDeleteTasksMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteBatchDeleteTasksMutation(\n  $ids: [ID!]!\n) {\n  batchDeleteTasks(ids: $ids) {\n    ok\n    error\n    deletedTaskIds\n  }\n}\n"
  }
};
})();

(node as any).hash = "5f113828fbd6ed83437dd501933b04f1";

export default node;
