/**
 * @generated SignedSource<<3baaf1849a0551daa5d4779988780207>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type TasksRoute_tokenUsage$data = {
  readonly cachedInputTokens: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly reasoningOutputTokens: number;
  readonly totalTokens: number;
  readonly " $fragmentType": "TasksRoute_tokenUsage";
};
export type TasksRoute_tokenUsage$key = {
  readonly " $data"?: TasksRoute_tokenUsage$data;
  readonly " $fragmentSpreads": FragmentRefs<"TasksRoute_tokenUsage">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "TasksRoute_tokenUsage",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "inputTokens",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "cachedInputTokens",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "outputTokens",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "reasoningOutputTokens",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "totalTokens",
      "storageKey": null
    }
  ],
  "type": "TokenUsageBreakdown",
  "abstractKey": null
};

(node as any).hash = "c686db1cda02bcc5103712b07d021686";

export default node;
