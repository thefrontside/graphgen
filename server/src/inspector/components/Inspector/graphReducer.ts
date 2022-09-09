import { VertexNode } from "../../../graphql/types.ts";
import { GraphData } from "./types.ts";
import { assert } from "assert-ts";

interface State {
  graphData: GraphData;
}

type Actions =
  | {
    type: "SET_ROOT";
    payload: { typename: string; count: number }[];
  }
  | {
    type: "NODE";
    payload: {
      nodes: VertexNode[];
      typename: string;
    };
  }
  | {
    type: "EXPAND";
    payload: {
      fieldType: "VertexListFieldEntry" | "VertexFieldEntry";
      fieldname: string;
      parentId: string;
      id: string;
      data: VertexNode;
    };
  };

const idMap: Record<string, VertexNode> = {};

export function graphReducer(state: State, action: Actions): State {
  switch (action.type) {
    case "SET_ROOT": {
      const graphData: GraphData = {
        nodes: action.payload.map(({ typename, count }) => ({
          data: {
            id: typename,
            label: `${typename} (${count})`,
            size: count,
          },
        })),
        edges: [],
      };
      return { ...state, graphData: { ...graphData } };
    }
    case "NODE": {
      return {
        ...state,
        graphData: {
          ...state.graphData,
          nodes: state.graphData.nodes.flatMap((node) => {
            if (node.data.id == action.payload.typename) {
              for (const vertexNode of action.payload.nodes) {
                idMap[vertexNode.id] = vertexNode;
              }

              return [{
                ...node,
                // deno-lint-ignore no-explicit-any
                data: { ...node.data, children: action.payload.nodes as any },
              }];
            } else {
              return [node];
            }
          }),
          edges: [],
        },
      };
    }
    case "EXPAND": {
      const { fieldType, parentId, fieldname, data } = action.payload;

      const parent = idMap[parentId];

      assert(!!parent, `no parent for ${parentId}`);

      if (fieldType === "VertexFieldEntry") {
        parent.fields = parent.fields.flatMap((field) =>
          field.key === fieldname
            ? [{
              ...field,
              __typename: 'JSONFieldEntry',
              json: data
            }]
            : [field]
        );

        idMap[data.id] = data;

        const copy = JSON.parse(JSON.stringify(state.graphData));

        return { ...state, graphData: { ...copy } };
      }

      return state;
    }
    default:
      return state;
  }
}
