/**
 * @generated SignedSource<<8e7a2be8f511068c23dbf04b28954616>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type TasksRouteSetTaskAssigneePrincipalMutation$variables = {
  assigneePrincipalId?: string | null | undefined;
  taskId: string;
};
export type TasksRouteSetTaskAssigneePrincipalMutation$data = {
  readonly setTaskAssigneePrincipal: {
    readonly error: string | null | undefined;
    readonly ok: boolean;
    readonly task: {
      readonly id: string;
    } | null | undefined;
  };
};
export type TasksRouteSetTaskAssigneePrincipalMutation = {
  response: TasksRouteSetTaskAssigneePrincipalMutation$data;
  variables: TasksRouteSetTaskAssigneePrincipalMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "assigneePrincipalId"
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
        "name": "assigneePrincipalId",
        "variableName": "assigneePrincipalId"
      },
      {
        "kind": "Variable",
        "name": "taskId",
        "variableName": "taskId"
      }
    ],
    "concreteType": "TaskMutationPayload",
    "kind": "LinkedField",
    "name": "setTaskAssigneePrincipal",
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
    "name": "TasksRouteSetTaskAssigneePrincipalMutation",
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
    "name": "TasksRouteSetTaskAssigneePrincipalMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "30f24fb4587a041946d653a75e632ccd",
    "id": null,
    "metadata": {},
    "name": "TasksRouteSetTaskAssigneePrincipalMutation",
    "operationKind": "mutation",
    "text": "mutation TasksRouteSetTaskAssigneePrincipalMutation(\n  $taskId: ID!\n  $assigneePrincipalId: ID\n) {\n  setTaskAssigneePrincipal(taskId: $taskId, assigneePrincipalId: $assigneePrincipalId) {\n    ok\n    error\n    task {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "f7d76809bb7c17a5908236a849a060b5";

export default node;
