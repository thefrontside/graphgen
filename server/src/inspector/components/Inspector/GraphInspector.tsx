import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { GraphData } from "./types.ts";

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
      data: Record<string, any>;
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
      // deno-lint-ignore no-explicit-any
      const ids = action.payload.data.map((n: any) => n.id) as string[];
      return {
        ...state,
        graphData: {
          ...state.graphData,
          nodes: [
            ...state.graphData.nodes.filter((n) =>
              ids.includes(n.data.id) === false
            ),
            // deno-lint-ignore no-explicit-any
            ...action.payload.data.map((n: any) => ({
              data: { id: n.id, label: n.name },
            })),
          ],
          edges: [
            ...state.graphData.edges,
            // deno-lint-ignore no-explicit-any
            ...action.payload.data.map((n: any) => ({
              data: { source: action.payload.typename, target: n.id },
            })),
          ],
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
    if (nodeIds.length === 0) {
      return;
    }

    async function root(typename: string) {
      return await fetchGraphQL(
        `
        query Root($root:String!) {
          root(typename: $root)
        }
      `,
        {
          "root": typename,
        },
      );
    }

    const nodeId = nodeIds[0];

    root(nodeId).then((result) => {
      dispatch({
        type: "ROOT_DATA",
        payload: {
          typename: nodeId,
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

      dispatch({ type: "SET_ROOTS", payload: graph.data.graph });
    }

    loadGraph().catch(console.error);
  }, []);

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
      onNodeToggle={handleChange}
    >
      {graphData.nodes.map(({ data: node }) => (
        <TreeItem key={node.id} nodeId={node.id} label={node.label}>
          <Loader />
        </TreeItem>
      ))}
    </TreeView>
  );
}
