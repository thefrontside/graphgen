import type { Component, SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import CytoscapeComponent from "react-cytoscapejs";
import COSEBilkent from "cytoscape-cose-bilkent";
import Cytoscape from "cytoscape";
import DagreLayout from "cytoscape-dagre";
import { useState } from "https://esm.sh/v94/@types/react@18.0.18/index.d.ts";

Cytoscape.use(DagreLayout);

interface Node {
  id: string;
  label: string;
  size: number;
}

interface GraphData {
  nodes: {
    data: Node;
  }[];
  edges: {
    source: string;
    target: string;
    label?: string;
  }[];
}

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
            label: typename,
            size,
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
          nodes: [...state.graphData.nodes, ...action.payload.data.map((n: any) => ({ id: n.id, label: n.name }))],
          edges: [...state.graphData.edges, ...action.payload.data.map((n: any) => ({ source: n.id, label: n.name }))]
        }
      }
    }
    default:
      return state;
  }
}

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function GraphInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(graphReducer, emptyGraph);
  const cyRef = useRef<cytoscape.Core>();

  const handleChange = useCallback((e: SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return;
    }
    console.log({ e, nodeIds });
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

  const layout = {
    name: "dagre",
  };

  useEffect(() => {
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

    if (!cyRef.current) {
      return;
    }
    cyRef.current.layout(layout).run();
    cyRef.current.fit();
    cyRef.current.on("select", "node", (e) => {
      const node: Node = e.target["_private"]["data"];

      root(node.id).then((result) => {
        dispatch({ type: 'ROOT_DATA', 
          payload: {
            typename: node.id,
            data: result.data
          }
        });  
      }).catch(console.error)
    });
  }, [cyRef.current]);

  // const [width, setWith] = useState("100%");
  // const [height, setHeight] = useState("400px");
  // const [graphData, setGraphData] = useState({
  //   nodes: [
  //     { data: { id: "1", label: "IP 1", type: "ip" } },
  //     { data: { id: "2", label: "Device 1", type: "device" } },
  //     { data: { id: "3", label: "IP 2", type: "ip" } },
  //     { data: { id: "4", label: "Device 2", type: "device" } },
  //     { data: { id: "5", label: "Device 3", type: "device" } },
  //     { data: { id: "6", label: "IP 3", type: "ip" } },
  //     { data: { id: "7", label: "Device 5", type: "device" } },
  //     { data: { id: "8", label: "Device 6", type: "device" } },
  //     { data: { id: "9", label: "Device 7", type: "device" } },
  //     { data: { id: "10", label: "Device 8", type: "device" } },
  //     { data: { id: "11", label: "Device 9", type: "device" } },
  //     { data: { id: "12", label: "IP 3", type: "ip" } },
  //     { data: { id: "13", label: "Device 10", type: "device" } }
  //   ],
  //   edges: [
  //     {
  //       data: { source: "1", target: "2", label: "Node2" }
  //     },
  //     {
  //       data: { source: "3", target: "4", label: "Node4" }
  //     },
  //     {
  //       data: { source: "3", target: "5", label: "Node5" }
  //     },
  //     {
  //       data: { source: "6", target: "5", label: " 6 -> 5" }
  //     },
  //     {
  //       data: { source: "6", target: "7", label: " 6 -> 7" }
  //     },
  //     {
  //       data: { source: "6", target: "8", label: " 6 -> 8" }
  //     },
  //     {
  //       data: { source: "6", target: "9", label: " 6 -> 9" }
  //     },
  //     {
  //       data: { source: "3", target: "13", label: " 3 -> 13" }
  //     }
  //   ]
  // });

  console.dir(graphData);

  return (
    <CytoscapeComponent
      cy={(cy) => cyRef.current = cy}
      style={{ width: "100%", height: "100%" }}
      stylesheet={[
        {
          selector: "node",
          css: {
            color: "#fff",
            "text-valign": "center",
            "text-halign": "center",
          },
        },
        {
          selector: "node",
          style: {
            label: "data(label)",
            width: 100,
            height: 50,
            shape: "circle",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            width: 2,
          },
        },
      ]}
      elements={CytoscapeComponent.normalizeElements(graphData)}
      layout={layout}
    />
  );
}
