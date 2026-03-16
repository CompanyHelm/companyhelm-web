/**
 * @generated SignedSource<<5b940d45a9037e744237dd9c87909f13>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ActorKind = "agent" | "user" | "%future added value";
export type TaskRunStatus = "cancelled" | "failed" | "queued" | "running" | "succeeded" | "%future added value";
export type TaskStatus = "completed" | "draft" | "in_progress" | "pending" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type TasksRoute_task$data = ReadonlyArray<{
  readonly acceptanceCriteria: string | null | undefined;
  readonly activeRun: {
    readonly agentId: string | null | undefined;
    readonly createdAt: string;
    readonly failureMessage: string | null | undefined;
    readonly finishedAt: string | null | undefined;
    readonly id: string;
    readonly startedAt: string | null | undefined;
    readonly status: TaskRunStatus;
    readonly taskId: string;
    readonly threadId: string | null | undefined;
    readonly triggeredByActorId: string | null | undefined;
    readonly updatedAt: string;
  } | null | undefined;
  readonly assigneeActor: {
    readonly agentId: string | null | undefined;
    readonly displayName: string;
    readonly email: string | null | undefined;
    readonly id: string;
    readonly kind: ActorKind;
    readonly userId: string | null | undefined;
  } | null | undefined;
  readonly assigneeActorId: string | null | undefined;
  readonly attemptCount: number;
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
  readonly has_running_runs: boolean;
  readonly id: string;
  readonly lastRunStatus: TaskRunStatus | null | undefined;
  readonly latestRun: {
    readonly agentId: string | null | undefined;
    readonly createdAt: string;
    readonly failureMessage: string | null | undefined;
    readonly finishedAt: string | null | undefined;
    readonly id: string;
    readonly startedAt: string | null | undefined;
    readonly status: TaskRunStatus;
    readonly taskId: string;
    readonly threadId: string | null | undefined;
    readonly triggeredByActorId: string | null | undefined;
    readonly updatedAt: string;
  } | null | undefined;
  readonly name: string;
  readonly parentTaskId: string | null | undefined;
  readonly runs: ReadonlyArray<{
    readonly agentId: string | null | undefined;
    readonly createdAt: string;
    readonly failureMessage: string | null | undefined;
    readonly finishedAt: string | null | undefined;
    readonly id: string;
    readonly startedAt: string | null | undefined;
    readonly status: TaskRunStatus;
    readonly taskId: string;
    readonly threadId: string | null | undefined;
    readonly triggeredByActorId: string | null | undefined;
    readonly updatedAt: string;
  }>;
  readonly status: TaskStatus;
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
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "agentId",
  "storageKey": null
},
v2 = [
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
  (v1/*: any*/),
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
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "taskId",
  "storageKey": null
},
v7 = [
  (v0/*: any*/),
  (v6/*: any*/),
  (v3/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "threadId",
    "storageKey": null
  },
  (v1/*: any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "triggeredByActorId",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "failureMessage",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "startedAt",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "finishedAt",
    "storageKey": null
  },
  (v4/*: any*/),
  (v5/*: any*/)
];
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
      "selections": (v2/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "parentTaskId",
      "storageKey": null
    },
    (v3/*: any*/),
    (v4/*: any*/),
    (v5/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "attemptCount",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "lastRunStatus",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "has_running_runs",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TaskRun",
      "kind": "LinkedField",
      "name": "latestRun",
      "plural": false,
      "selections": (v7/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TaskRun",
      "kind": "LinkedField",
      "name": "activeRun",
      "plural": false,
      "selections": (v7/*: any*/),
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "TaskRun",
      "kind": "LinkedField",
      "name": "runs",
      "plural": true,
      "selections": (v7/*: any*/),
      "storageKey": null
    },
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
        (v6/*: any*/),
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
          "selections": (v2/*: any*/),
          "storageKey": null
        },
        (v4/*: any*/),
        (v5/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Task",
  "abstractKey": null
};
})();

(node as any).hash = "908534366e02a281df31bcb1fecfcfff";

export default node;
