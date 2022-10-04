import produce from "immer";
import { assert } from "../../assert/assert";
import { match } from "ts-pattern";
import type { VertexNode } from "../../../../graphql/types";
import { State, Type } from "./types";

type Actions =
  | {
    type: "ROOTS";
    payload: { typename: string; count: number }[];
  }
  | {
    type: "ALL";
    payload: {
      nodes: VertexNode[];
      typename: string;
    };
  }
  | {
    type: "EXPAND";
    payload:
      | {
        kind: "VertexFieldEntry";
        path: string[];
        node: VertexNode;
      }
      | {
        kind: "VertexListFieldEntry";
        path: string[];
        nodes: VertexNode[];
      };
  };

function isNumber(s: unknown): s is number {
  return s === '' ? false : !isNaN(Number(s));
}

export const graphReducer = produce((state: State, action: Actions) => {
  return match(action)
    .with({ type: "ROOTS" }, ({ payload }) => {
      const graph: Record<string, Type> = {};

      for (const { typename, count } of payload) {
        graph[typename] = {
          typename,
          size: count,
          label: `${typename} (${count})`,
          nodes: [],
        };
      }

      return { graph };
    })
    .with({ type: "ALL" }, ({ payload }) => {
      const { typename, nodes } = payload;

      state.graph[typename].nodes = nodes;
    })
    .with({ type: "EXPAND" }, ({ payload }) => {
      const { path, kind } = payload;

      const [root, ...props] = path;

      let draft: Type = state.graph[root];

      assert(!!draft, `no parent for ${path[0]}`);

      for (const prop of props) {
        if (isNumber(prop)) {
          draft = draft[Number(prop)];
        } else {
          draft = draft[prop];
        }
      }

      assert(!!draft, `no draft found at ${path.join(".")}`);

      if (kind === "VertexFieldEntry") {
        draft["materialized"] = payload.node;
      } else {
        draft["materialized"] = payload.nodes;
      }
    }).otherwise(() => state);
});
