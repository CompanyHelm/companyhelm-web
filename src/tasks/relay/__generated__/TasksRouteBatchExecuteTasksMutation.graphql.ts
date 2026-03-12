/**
 * @generated SignedSource<<4138fa77c9d03cd66fa892f9abc8fca2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteBatchExecuteTasksMutation$variables = {
  agentId: string;
  taskIds: ReadonlyArray<string>;
};
export type TasksRouteBatchExecuteTasksMutation$data = {
  readonly batchExecuteTasks: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly tasks: ReadonlyArray<{
      readonly id: string;
    }>;
  };
};
export type TasksRouteBatchExecuteTasksMutation = {
  response: TasksRouteBatchExecuteTasksMutation$data;
  variables: TasksRouteBatchExecuteTasksMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "agentId"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "taskIds"
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "agentId",
        "variableName": "agentId"
      },
      {
        "kind": "Variable",
        "name": "taskIds",
        "variableName": "taskIds"
      }
    ],
    "concreteType": "BatchTaskMutationPayload",
    "kind": "LinkedField",
    "name": "batchExecuteTasks",
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
        "name": "tasks",
        "plural": true,
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
    "name": "TasksRouteBatchExecuteTasksMutation",
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
    "name": "TasksRouteBatchExecuteTasksMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "28e4f1ef3a83693db6a339a6bb71382a",
    "id": null,
    "metadata": {},
    "name": "TasksRouteBatchExecuteTasksMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteBatchExecuteTasksMutation(\n  $taskIds: [ID!]!\n  $agentId: ID!\n) {\n  batchExecuteTasks(taskIds: $taskIds, agentId: $agentId) {\n    ok\n    error\n    tasks {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "cec29db8cffc711109bcb08c6c93ec58";

export default node;
