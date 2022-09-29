import "./GraphInspector.css";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import TreeView from "@mui/lab/TreeView";
import { Node } from "./Node";
import { all, node } from "./queries";
import { graphReducer } from "./graphReducer";
import { VertexNode } from "../../../../graphql/types";
import { MinusSquare, PlusSquare } from "./icons";
import { StyledTreeItem } from "./StyledTreeItem";
import { fetchGraphQL } from "../../graphql/fetchGraphql";
import { Loader } from "../Loader/Loader";

const emptyGraph = { graph: {} };

export function GraphInspector(): JSX.Element {
  const [{ graph }, dispatch] = useReducer(graphReducer, emptyGraph);
  const expandedNodes = useRef(new Set<string>());

  const handleChange = useCallback(
    async (_: SyntheticEvent, nodeIds: string[]) => {
      if (nodeIds.length === 0) {
        return;
      }

      const nodeId = nodeIds[0];

      if (expandedNodes.current.has(nodeId)) {
        console.log(`${nodeId} has previously been opened`);
        return;
      }

      expandedNodes.current.add(nodeId);

      if (nodeId.indexOf(".") > -1) {
        const path = nodeId.split(".");

        const [fieldEntryType, ids] = path.slice(-2);

        const pathToField = path.slice(0, -2);

        if (fieldEntryType === "VertexListFieldEntry") {
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

      try {
        const response = await all(nodeId);

        dispatch({
          type: "ALL",
          payload: {
            typename: nodeIds[0],
            nodes: response.data.all,
          },
        });
      } catch (e) {
        console.error(e);
        throw e;
      }
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

  const nodes = Object.values(graph);

  if (nodes.length === 0) {
    return <h2>No graph nodes</h2>;
  }

  return (
    <TreeView
      aria-label="graph inspector"
      defaultCollapseIcon={<MinusSquare />}
      defaultExpandIcon={<PlusSquare />}
      onNodeToggle={handleChange}
      multiSelect={false}
    >
      {Object.values(graph).map(({ typename, label, nodes }) => (
        <StyledTreeItem
          key={typename}
          nodeId={typename}
          label={<div className="root">{label}</div>}
        >
          {nodes.length > 0
            ? nodes.map((vertexNode, i) => {
              return (
                <StyledTreeItem
                  key={vertexNode.id}
                  nodeId={vertexNode.id}
                  label={
                    <Node
                      parentId={`${typename}.nodes.${i}`}
                      node={vertexNode}
                    />
                  }
                />
              );
            })
            : <Loader />}
        </StyledTreeItem>
      ))}
    </TreeView>
  );
}
