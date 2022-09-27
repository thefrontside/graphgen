/**
 * @generated SignedSource<<22a6ea8170973aad1f1e9dd40fd30edd>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type GraphInspectorMetaQuery$variables = {};
export type GraphInspectorMetaQuery$data = {
  readonly meta: ReadonlyArray<{
    readonly count: number;
    readonly typename: string;
  } | null> | null;
};
export type GraphInspectorMetaQuery = {
  response: GraphInspectorMetaQuery$data;
  variables: GraphInspectorMetaQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Type",
    "kind": "LinkedField",
    "name": "meta",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "typename",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "count",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "GraphInspectorMetaQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "GraphInspectorMetaQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "6cf0a8a4996f98f9f21fab40e89644ce",
    "id": null,
    "metadata": {},
    "name": "GraphInspectorMetaQuery",
    "operationKind": "query",
    "text": "query GraphInspectorMetaQuery {\n  meta {\n    typename\n    count\n  }\n}\n"
  }
};
})();

(node as any).hash = "9af9ab2060a5452a21aea37de412490e";

export default node;
