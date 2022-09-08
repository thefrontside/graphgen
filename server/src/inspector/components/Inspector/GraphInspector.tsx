import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { GraphData } from "./types.ts";
import { MetaView } from "./Meta.tsx";
import { Item } from "./Item.tsx";

interface State {
  graphData: GraphData;
}

type Actions =
  | {
    type: "SET_ROOTS";
    payload: { typename: string; size: number }[];
  }
  | {
    type: "ROOT_DATA";
    payload: {
      typename: string;
      // deno-lint-ignore no-explicit-any
      data: Record<string, { id: string; [key: string]: any }>;
    };
  };

function graphReducer(state: State, action: Actions): State {
  switch (action.type) {
    case "SET_ROOTS": {
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
    case "ROOT_DATA": {
      return {
        ...state,
        graphData: {
          ...state.graphData,
          nodes: state.graphData.nodes.flatMap((node) => {
            return node.data.id == action.payload.typename
              ? [{
                ...node,
                // deno-lint-ignore no-explicit-any
                data: { ...node.data, children: action.payload.data as any },
              }]
              : [node];
          }),
          edges: [],
        },
      };
    }
    default:
      return state;
  }
}

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function GraphInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(graphReducer, emptyGraph);

  const handleChange = useCallback((e: SyntheticEvent, nodeIds: string[]) => {
    async function node({ typename, id }: { typename: string; id?: string }) {
      return await fetchGraphQL(
        `
        query Node($typename: String!, $id: String) {
          node(typename: $typename, id: $id)
        }
      `,
        {
          "typename": typename,
          "id": id,
        },
      );
    }

    if (nodeIds.length === 0) {
      return;
    }

    const args = nodeIds.length === 1
      ? { typename: nodeIds[0] }
      : { typename: nodeIds[0], id: nodeIds.slice(-1)[0] };

    console.log(args);

    node(args).then((result) => {
      console.log(result);
      dispatch({
        type: "ROOT_DATA",
        payload: {
          typename: nodeIds[0],
          data: result.data.node,
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

      dispatch({ type: "SET_ROOTS", payload: graph.data.graph });
    }

    loadGraph().catch(console.error);
  }, []);

  return (
    <TreeView
      aria-label="graph inspector"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
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
