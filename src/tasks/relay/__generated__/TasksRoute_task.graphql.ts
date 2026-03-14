/**
 * @generated SignedSource<<bca1c7e4f7198cca13822072134026c0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ActorKind = "agent" | "user" | "%future added value";
export type TaskStatus = "completed" | "draft" | "in_progress" | "pending" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type TasksRoute_task$data = ReadonlyArray<{
  readonly acceptanceCriteria: string | null | undefined;
  readonly assigneeActor: {
    readonly agentId: string | null | undefined;
    readonly displayName: string;
    readonly email: string | null | undefined;
    readonly id: string;
    readonly kind: ActorKind;
    readonly userId: string | null | undefined;
  } | null | undefined;
  readonly assigneeActorId: string | null | undefined;
  readonly comments: ReadonlyArray<{
    readonly authorActor: {
      readonly agentId: string | null | undefined;
      readonly displayName: string;
      readonly email: string | null | undefined;
      readonly id: string;
      readonly kind: ActorKind;
      readonly userId: string | null | undefined;
    } | null | undefined;
    readonly authorActorId: string;
    readonly comment: string;
    readonly createdAt: string;
    readonly id: string;
    readonly taskId: string;
    readonly updatedAt: string;
  }>;
  readonly company: {
    readonly id: string;
  };
  readonly createdAt: string;
  readonly dependencyTaskIds: ReadonlyArray<string>;
  readonly description: string | null | undefined;
  readonly id: string;
  readonly name: string;
  readonly parentTaskId: string | null | undefined;
  readonly status: TaskStatus;
  readonly threadId: string | null | undefined;
  readonly updatedAt: string;
  readonly " $fragmentType": "TasksRoute_task";
}>;
export type TasksRoute_task$key = ReadonlyArray<{
  readonly " $data"?: TasksRoute_task$data;
  readonly " $fragmentSpreads": FragmentRefs<"TasksRoute_task">;
}>;

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  (v0/*: any*/),
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
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "TasksRoute_task",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Company",
      "kind": "LinkedField",
      "name": "company",
      "plural": false,
      "selections": [
        (v0/*: any*/)
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    },
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
      "name": "assigneeActorId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Actor",
      "kind": "LinkedField",
      "name": "assigneeActor",
      "plural": false,
      "selections": (v1/*: any*/),
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
    (v2/*: any*/),
    (v3/*: any*/),
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
        (v0/*: any*/),
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
          "name": "authorActorId",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "Actor",
          "kind": "LinkedField",
          "name": "authorActor",
          "plural": false,
          "selections": (v1/*: any*/),
          "storageKey": null
        },
        (v2/*: any*/),
        (v3/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Task",
  "abstractKey": null
};
})();

(node as any).hash = "3e79fd5e15daebf09136d28523664e06";

export default node;
