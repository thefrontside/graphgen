import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { Node } from "./Node.tsx";
import { all, node } from "./queries.ts";
import { graphReducer } from "./graphReducer.ts";

const emptyGraph = { graph: {} };

export function GraphInspector(): JSX.Element {
  const [{ graph }, dispatch] = useReducer(graphReducer, emptyGraph);

  const handleChange = useCallback((_: SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return;
    }

    const nodeId = nodeIds[0];

    if (nodeId.indexOf("|") > -1) {
      const full = nodeId.split("|");

      const id = full.slice(-1)[0]

      if (id.includes(',')) {
        throw new Error('not implemented yet')
      } else {
        node(id).then((response) =>
          dispatch({
            type: "EXPAND",
            payload: {
              path: full.slice(0, -1),
              data: response.data.node,
            },
          })
        ).catch(console.error);
      }

      return;
    }

    all(nodeId).then((result) => {
      dispatch({
        type: "ALL",
        payload: {
          typename: nodeIds[0],
          nodes: result.data.all,
        },
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    async function loadGraph() {
      const graph = await fetchGraphQL(`
      query Meta {
        meta {
          typename
          count
        }
      }
      `);

      dispatch({ type: "ROOTS", payload: graph.data.meta });
    }

    loadGraph().catch(console.error);
  }, []);

  return (
    <TreeView
      aria-label="graph inspector"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      onNodeToggle={handleChange}
      multiSelect={false}
    >
      {Object.values(graph).map(({ typename, label, nodes }) => (
        <TreeItem key={typename} nodeId={typename} label={label}>
          {nodes.length > 0
            ? nodes.map((vertexNode) => {
              return (
                <TreeItem
                  key={vertexNode.id}
                  nodeId={vertexNode.id}
                  label={<Node parentId={typename} node={vertexNode} />}
                />
              );
            })
            : <Loader />}
        </TreeItem>
      ))}
    </TreeView>
  );
}
