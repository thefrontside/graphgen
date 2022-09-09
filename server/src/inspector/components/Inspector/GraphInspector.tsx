import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { GraphData } from "./types.ts";
import { Item } from "./Item.tsx";
import { all, node } from "./queries.ts";
import { VertexNode } from "../../../graphql/types.ts";
import { graphReducer } from "./graphReducer.ts";

type ExpandedProperty = [
  "VertexListFieldEntry" | "VertexFieldEntry",
  string,
  string,
  string,
];

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function GraphInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(graphReducer, emptyGraph);

  const handleChange = useCallback((_: SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return;
    }

    const nodeId = nodeIds[0];

    if (nodeId.indexOf("|") > -1) {
      const [fieldType, fieldname, parentId, id]: ExpandedProperty = nodeId
        .split("|") as ExpandedProperty;

      if (fieldType === "VertexFieldEntry") {
        node(id).then((response) =>
          dispatch({
            type: "EXPAND",
            payload: {
              fieldType,
              fieldname,
              parentId,
              id,
              data: response.data.node,
            },
          })
        ).catch(console.error);
      }

      return;
    }

    all(nodeId).then((result) => {
      dispatch({
        type: "NODE",
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

      dispatch({ type: "SET_ROOT", payload: graph.data.meta });
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
            ? node.children.map((vertexNode) => {
              const [id, typename] = vertexNode.id;
              return (
                <TreeItem
                  key={id}
                  nodeId={id}
                  label={<Item node={vertexNode} />}
                />
              );
            })
            : <Loader />}
        </TreeItem>
      ))}
    </TreeView>
  );
}
