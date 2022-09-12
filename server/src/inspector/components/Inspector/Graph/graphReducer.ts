import type { VertexNode } from "../../../../graphql/types.ts";
import produce from "immer";
import { assert } from "assert-ts";

interface Type {
  typename: string;
  size: number;
  label: string;
  nodes: VertexNode[];
}

interface State {
  graph: Record<string, Type>;
}

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
      kind: 'VertexFieldEntry'
      path: string[];
      node: VertexNode;
    }
    | {
      kind: 'VertexListFieldEntry';
      path: string[];
      nodes: VertexNode[];
    }
  };

function isNumber(s: unknown): s is number {
  return !isNaN(Number(s));
}

export const graphReducer = produce((state: State, action: Actions) => {
  switch (action.type) {
    case "ROOTS": {
      const graph: Record<string, Type> = {};

      for (const { typename, count } of action.payload) {
        graph[typename] = {
          typename,
          size: count,
          label: `${typename} (${count})`,
          nodes: []
        }
      }

      return { graph };
    }
    case "ALL": {
      const { typename, nodes } = action.payload;

      state.graph[typename].nodes = nodes;

      break;
    }
    /*
      path has the following format which is a path to any field
      
      'Component.nodes.0.fields.5.data.0.fields.3'
      
      and splits into the prop array
      
      ['Component', 'nodes', '0', 'fields', 'data', '0', 'fields', '3']
    */
    case "EXPAND": {
      const { path, kind } = action.payload;

      const [root, ...props] = path;

      // deno-lint-ignore no-explicit-any
      let draft: any = state.graph[root];

      assert(!!draft, `no parent for ${path[0]}`);

      for (const prop of props) {
        if (isNumber(prop)) {
          draft = draft[Number(prop)];
        } else {
          draft = draft[prop];
        }
      }

      
      assert(!!draft, `no draft found at ${path.join('.')}`)
      
      if (kind === 'VertexFieldEntry') {
        console.log(action.payload.node);
        draft['data'] = action.payload.node;
      } else {
        console.log(action.payload.nodes);
        draft['data'] = action.payload.nodes;
      }

      return state;
    }
  }
});
