import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { GraphData, Node } from "./types.ts";
import { MetaView } from "./Meta.tsx";
import { Item } from "./Item.tsx";
import { node, relationship, root } from "./queries.ts";

interface State {
  graphData: GraphData;
}

type Actions =
  | {
    type: "SET_ROOT";
    payload: { typename: string; size: number }[];
  }
  | {
    type: "NODE";
    payload: {
      typename: string;
      data: Node[];
    };
  }
  | {
    type: "RELATIONSHIP";
    payload: {
      id: string;
      typename: string;
      fieldname: string;
      data:
        | Node
        | Node[];
    };
  };

const idMap: Record<string, Record<string, Node>> = {};

function graphReducer(state: State, action: Actions): State {
  switch (action.type) {
    case "SET_ROOT": {
      const graphData: GraphData = {
        nodes: action.payload.map(({ typename, size }) => ({
          data: {
            id: typename,
            label: `${typename} (${size})`,
            size,
            child: false,
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
            if(node.data.id == action.payload.typename) {              
              for(const o of action.payload.data) {
                if (!idMap[o.typename]) {
                  idMap[o.typename] = {};
                }
                idMap[action.payload.typename][o.id] = o
              }

              return [{
                ...node,
                // deno-lint-ignore no-explicit-any
                data: { ...node.data, children: action.payload.data as any },
              }]
            } else {
              return [node];
            }
          }),
          edges: [],
        },
      };
    }
    case "RELATIONSHIP": {
      const parent = idMap[action.payload.typename][action.payload.id];

      parent[action.payload.fieldname] = action.payload.data;

      // TODO: use immer or something for nested package updates
      const copy = JSON.parse(JSON.stringify(state.graphData));
      
      return { ...state, graphData: { ...copy } };
    }
    default:
      return state;
  }
}

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function GraphInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(graphReducer, emptyGraph);

  const handleChange = useCallback((_: SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return;
    }

    const nodeId = nodeIds[0];

    if (nodeId.startsWith("relationship.")) {
      const [, parentId, typename, fieldname] = nodeId.split(".");
      relationship({ parentId, typename, fieldname })
        .then((response) =>
          dispatch({
            type: "RELATIONSHIP",
            payload: {
              id: parentId,
              typename,
              fieldname,
              data: response.data.relationship,
            },
          })
        )
        .catch(console.error);
    }

    root(nodeId).then((result) => {
      dispatch({
        type: "NODE",
        payload: {
          typename: nodeIds[0],
          data: result.data.root,
        },
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadGraph() {
      const graph = await fetchGraphQL(`
      query Graph {
        graph
      }
      `);

      dispatch({ type: "SET_ROOT", payload: graph.data.graph });
    }

    loadGraph().catch(console.error);
  }, []);

  return (
    <TreeView
      aria-label="graph inspector"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={handleChange}
    >
      {graphData.nodes.map(({ data: node }) => (
        <TreeItem key={node.id} nodeId={node.id} label={node.label}>
          {node?.children
            ? node.children.map(({ id, ...rest }) => {
              return (
                <TreeItem
                  key={id}
                  nodeId={id}
                  label={<Item typename={node.id} id={id} fields={rest} />}
                />
              );
            })
            : <Loader />}
        </TreeItem>
      ))}
    </TreeView>
  );
}
