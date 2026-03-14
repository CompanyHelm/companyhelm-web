/**
 * @generated SignedSource<<7c78695aa7371c122a01531fc6ad4f4b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PrincipalKind = "agent" | "user" | "%future added value";
export type TasksRouteQuery$variables = {
  maxDepth?: number | null | undefined;
  rootTaskId?: string | null | undefined;
  topLevelOnly?: boolean | null | undefined;
};
export type TasksRouteQuery$data = {
  readonly agents: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly name: string;
      };
    }>;
  };
  readonly taskAssignablePrincipals: ReadonlyArray<{
    readonly agentId: string | null | undefined;
    readonly displayName: string;
    readonly email: string | null | undefined;
    readonly id: string;
    readonly kind: PrincipalKind;
    readonly userId: string | null | undefined;
  }>;
  readonly tasks: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"TasksRoute_task">;
  }>;
};
export type TasksRouteQuery = {
  response: TasksRouteQuery$data;
  variables: TasksRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "maxDepth"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "rootTaskId"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "topLevelOnly"
},
v3 = [
  {
    "kind": "Variable",
    "name": "maxDepth",
    "variableName": "maxDepth"
  },
  {
    "kind": "Variable",
    "name": "rootTaskId",
    "variableName": "rootTaskId"
  },
  {
    "kind": "Variable",
    "name": "topLevelOnly",
    "variableName": "topLevelOnly"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = [
  (v4/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "kind",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "displayName",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "agentId",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "userId",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "email",
    "storageKey": null
  }
],
v6 = {
  "alias": null,
  "args": null,
  "concreteType": "Principal",
  "kind": "LinkedField",
  "name": "taskAssignablePrincipals",
  "plural": true,
  "selections": (v5/*: any*/),
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": [
    {
      "kind": "Literal",
      "name": "first",
      "value": 200
    }
  ],
  "concreteType": "AgentConnection",
  "kind": "LinkedField",
  "name": "agents",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "AgentEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "Agent",
          "kind": "LinkedField",
          "name": "node",
          "plural": false,
          "selections": [
            (v4/*: any*/),
            (v7/*: any*/)
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "storageKey": "agents(first:200)"
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "TasksRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Task",
        "kind": "LinkedField",
        "name": "tasks",
        "plural": true,
        "selections": [
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TasksRoute_task"
          }
        ],
        "storageKey": null
      },
      (v6/*: any*/),
      (v8/*: any*/)
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v2/*: any*/),
      (v1/*: any*/),
      (v0/*: any*/)
    ],
    "kind": "Operation",
    "name": "TasksRouteQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "Task",
        "kind": "LinkedField",
        "name": "tasks",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Company",
            "kind": "LinkedField",
            "name": "company",
            "plural": false,
            "selections": [
              (v4/*: any*/)
            ],
            "storageKey": null
          },
          (v7/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "acceptanceCriteria",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "assigneePrincipalId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Principal",
            "kind": "LinkedField",
            "name": "assigneePrincipal",
            "plural": false,
            "selections": (v5/*: any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "threadId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "parentTaskId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
            "storageKey": null
          },
          (v9/*: any*/),
          (v10/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "dependencyTaskIds",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TaskComment",
            "kind": "LinkedField",
            "name": "comments",
            "plural": true,
            "selections": [
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "taskId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "comment",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "authorPrincipalId",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Principal",
                "kind": "LinkedField",
                "name": "authorPrincipal",
                "plural": false,
                "selections": (v5/*: any*/),
                "storageKey": null
              },
              (v9/*: any*/),
              (v10/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      (v6/*: any*/),
      (v8/*: any*/)
    ]
  },
  "params": {
    "cacheID": "4426a7c86269a4f428d0fb876175ef0f",
    "id": null,
    "metadata": {},
    "name": "TasksRouteQuery",
    "operationKind": "query",
    "text": "query TasksRouteQuery(\n  $topLevelOnly: Boolean\n  $rootTaskId: ID\n  $maxDepth: Int\n) {\n  tasks(topLevelOnly: $topLevelOnly, rootTaskId: $rootTaskId, maxDepth: $maxDepth) {\n    ...TasksRoute_task\n    id\n  }\n  taskAssignablePrincipals {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  agents(first: 200) {\n    edges {\n      node {\n        id\n        name\n      }\n    }\n  }\n}\n\nfragment TasksRoute_task on Task {\n  id\n  company {\n    id\n  }\n  name\n  description\n  acceptanceCriteria\n  assigneePrincipalId\n  assigneePrincipal {\n    id\n    kind\n    displayName\n    agentId\n    userId\n    email\n  }\n  threadId\n  parentTaskId\n  status\n  createdAt\n  updatedAt\n  dependencyTaskIds\n  comments {\n    id\n    taskId\n    comment\n    authorPrincipalId\n    authorPrincipal {\n      id\n      kind\n      displayName\n      agentId\n      userId\n      email\n    }\n    createdAt\n    updatedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "5c9f6aa5fb8a2c205be3621d4a6b5192";

export default node;
