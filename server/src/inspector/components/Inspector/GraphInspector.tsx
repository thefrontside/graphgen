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
import { VertexNode } from "../../../graphql/types.ts";

const emptyGraph = { graph: {} };

export function GraphInspector(): JSX.Element {
  const [{ graph }, dispatch] = useReducer(graphReducer, emptyGraph);

  const handleChange = useCallback(
    async (_: SyntheticEvent, nodeIds: string[]) => {
      if (nodeIds.length === 0) {
        return;
      }

      const nodeId = nodeIds[0];

      if (nodeId.indexOf(".") > -1) {
        const path = nodeId.split(".");

        const [fieldEntryType, ids] = path.slice(-2);

        const pathToField = path.slice(0, -2);

        if (fieldEntryType === 'VertexListFieldEntry') {
          try {
            const nodes = await Promise.all<{ data: { node: VertexNode } }>(
              ids.split(",")
                .map((id) => node(id)),
            );

            dispatch({
              type: "EXPAND",
              payload: {
                kind: "VertexListFieldEntry",
                path: pathToField,
                nodes: nodes.map((node) => node.data.node),
              },
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
        } else {
          try {
            const response = await node(ids);

            dispatch({
              type: "EXPAND",
              payload: {
                kind: "VertexFieldEntry",
                path: pathToField,
                node: response.data.node,
              },
            });
          } catch (e) {
            console.error(e);
            throw e;
          }
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
    },
    [],
  );

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
