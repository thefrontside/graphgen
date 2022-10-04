import "./GraphInspector.css";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import { allQuery, node } from "./queries";
import { graphReducer } from "./graphReducer";
import { VertexNode } from "../../../../graphql/types";
import { MinusSquare, PlusSquare } from "./icons";
import { StyledTreeItem } from "./StyledTreeItem";
import { fetchGraphQL } from "../../graphql/fetchGraphql";
import { useQuery } from "urql";
import type { Page } from "../../../../graphql/relay";
import { DynamicRowVirtualizer } from "./DynamicRowVirtualizer";

const emptyGraph = { graph: {} };

const limit = 5;

export function GraphInspector(): JSX.Element {
  const [after, setAfter] = useState("");
  const [typename, setTypename] = useState<string | undefined>();
  // TODO: this really needs to go at some point and the rangeExtractor prop of
  // useVirtualized seems a better way to go
  // https://tanstack.com/virtual/v3/docs/api/virtualizer#rangeextractor
  // measureElement might be useful here too
  // https://tanstack.com/virtual/v3/docs/api/virtualizer#measureelement
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  const [result] = useQuery<{ all: Page<VertexNode> }, {
    typename: string;
    first: number;
    after: string;
  }>({
    query: allQuery,
    pause: !typename && !after,
    variables: {
      typename,
      first: limit,
      after,
    },
  });

  const [{ graph }, dispatch] = useReducer(graphReducer, emptyGraph);

  const { data, error, fetching } = result;

  useEffect(() => {
    const edges = data?.all?.edges ?? [];

    if (edges.length === 0) {
      return;
    }

    dispatch({
      type: "ALL",
      payload: {
        typename,
        nodes: edges.map((edge) => edge.node),
      },
    });
  }, [data, typename]);

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

        setTimeout(forceUpdate, 300);

        return;
      }

      setAfter("");
      setTypename(nodeId);

      setTimeout(forceUpdate, 300);
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

  if (error) {
    return <p className="error">Oh no... {error?.message}</p>;
  }

  return (
    <div>
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
              ? (
                <DynamicRowVirtualizer
                  hasNextPage={!!data?.all?.pageInfo?.hasNextPage}
                  nodes={nodes}
                  typename={typename}
                  fetching={fetching}
                  fetchNextPage={() => setAfter(data.all.pageInfo.endCursor)}
                  update={update}
                />
              )
              : <div>loading....</div>}
          </StyledTreeItem>
        ))}
      </TreeView>
    </div>
  );
}
