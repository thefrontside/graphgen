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
import fcose from "cytoscape-fcose";

Cytoscape.use(fcose);

interface Node {
  id: string;
  label: string;
  size: number;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: {
    data: Node;
  }[];
  edges: {
    data: Edge;
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
            label: `${typename} (${size})`,
            size,
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
          // deno-lint-ignore no-explicit-any
          edges: [
            ...state.graphData.edges,
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
  const cyRef = useRef<cytoscape.Core>();

  useEffect(() => {
    async function loadGraph() {
      const graph = await fetchGraphQL(`
      query Graph {
        graph
      }
      `);

      dispatch({ type: "SET_ROOTS", payload: graph.data.graph });
    }

    console.log('loading...')
    loadGraph().catch(console.error);
  }, []);

  const layout = {
    name: "fcose",
    quality: "default",
    randomize: false,
    animate: true,
    animationEasing: "ease-out",
    uniformNodeDimensions: true,
    packComponents: true,
    tile: false,
    nodeRepulsion: 4500,
    idealEdgeLength: 50,
    edgeElasticity: 0.45,
    nestingFactor: 0.1,
    gravity: 0.25,
    gravityRange: 3.8,
    gravityCompound: 1,
    gravityRangeCompound: 1.5,
    numIter: 2500,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
    initialEnergyOnIncremental: 0.3,
    step: "all",
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
    cyRef.current.layout({ name: "fcose" }).run();
    cyRef.current.fit();
    cyRef.current.on("select", "node", (e) => {
      const node: Node = e.target["_private"]["data"];

      root(node.id).then((result) => {
        dispatch({
          type: "ROOT_DATA",
          payload: {
            typename: node.id,
            data: result.data.root,
          },
        });
      }).catch(console.error);
    });
  }, [graphData]);

  return (
    <CytoscapeComponent
      cy={(cy) => cyRef.current = cy}
      style={{ width: "100%", height: "100%" }}
      stylesheet={[
        {
          selector: "node",
          style: {
            "text-valign": "center",
            "text-halign": "center",
            label: "data(label)",
            "background-color": "#2B65EC",
            color: '#fff',
            "font-size": 3
          },
        },
        {
          selector: ":parent",
          style: {
            label: "data(label)",
            "background-opacity": 0.333,
            "border-color": "#2B65EC",
          },
        },
        {
          selector: "edge",
          style: {
            "line-color": "#2B65EC",
          },
        },

        {
          selector: "node:selected",
          style: {
            label: "data(label)",
            "background-color": "#F08080",
            "border-color": "red",
          },
        },

        {
          selector: "edge:selected",
          style: {
            label: "data(label)",
            "line-color": "#F08080",
          },
        },
      ]}
      elements={CytoscapeComponent.normalizeElements(graphData)}
      layout={layout}
    />
  );
}
