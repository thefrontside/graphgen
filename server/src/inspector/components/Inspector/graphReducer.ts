import type { FieldEntry, VertexNode } from "../../../graphql/types.ts";
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
    payload: {
      path: string[];
      data: VertexNode;
    };
  };

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
    case "EXPAND": {
      const { path, data } = action.payload;

      const [root, parentId, fieldname, ...props] = path;

      const parent = state.graph[root];

      assert(!!parent, `no parent for ${path[0]}`);

      const nodeIndex = parent.nodes.findIndex(c => c.id === parentId);

      const fieldIndex = parent.nodes[nodeIndex].fields.findIndex(f => f.key === fieldname);

      if (props.length > 0) {
        // deno-lint-ignore no-explicit-any
        let draft: any = parent.nodes[nodeIndex].fields[fieldIndex];
        
        for(const prop of props) {
          if (prop !== 'data' && typeof draft.fields !== 'undefined') {
            const index = draft.fields.findIndex((f: FieldEntry) => f.key === prop);
            
            draft = draft.fields[index];
          } else {
            draft = draft[prop];
          }
        }
        
        draft['data'] = data;
      } else {
        parent.nodes[nodeIndex].fields[fieldIndex]['data'] = data;
      }

      return state;
    }
  }
});
