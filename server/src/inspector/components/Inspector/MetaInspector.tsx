import { useEffect, useReducer, useRef } from "react";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape from "cytoscape";
import DagreLayout from "cytoscape-dagre";
import type { Type } from "../../../graphql/types.ts";
import type { Edge, GraphData, Node } from './types.ts';

Cytoscape.use(DagreLayout);

interface State {
  graphData: GraphData;
}

type Actions = {
  type: "SET_META";
  payload: Type[];
};

function metaReducer(state: State, action: Actions): State {
  switch (action.type) {
    case "SET_META": {
      const nodes: {data: Node}[] = [];
      const edges: { data: Edge }[] = [];

      const defaultNodeSize = 100;

      for(const { typename, references = [], count } of action.payload) {
        nodes.push({
          data: {
            id: typename,
            label: `${typename} (${count})`,
            size: Math.max(defaultNodeSize, count * 10),
            child: false
          }
        });

        for(const { fieldname, count: referenceCount } of references) {
          const id = `${typename}-${fieldname}`
          nodes.push({data:{
            id,
            label: `${fieldname} (${referenceCount})`,
            size: Math.max(defaultNodeSize, referenceCount * 5),
            child: true
          }});

          edges.push({
            data: {
              source: typename,
              target: id
            }
          })
        }
      }
      
      const graphData: GraphData = {
        nodes,
        edges
      }

      return { ...state, graphData: { ...graphData } };
    }
    default:
      return state;
  }
}

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function MetaInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(metaReducer, emptyGraph);
  const cyRef = useRef<cytoscape.Core>();

  useEffect(() => {
    async function loadMeta() {
      const response: { data: { meta: Type[] } } = await fetchGraphQL(`
      query Meta {
        meta {
          typename
          count
          references {
            typename
            fieldname
            path
            count
            description
            affinity
          }
        }
      }
      `);

      return response;
    }
    
    loadMeta().then((d) => {
      console.log(d);
      dispatch({ type: "SET_META", payload: d.data.meta })
    }
    ).catch(console.error);
  }, []);

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }

    console.log(graphData);
    cyRef.current.layout({
      name: "fcose",
      quality: "proof",
      // randomize: false,
      // animate: true,
      // animationEasing: "ease-out",
      // uniformNodeDimensions: false,
      packComponents: true,
      tile: false,
      nodeRepulsion: 4500,
      idealEdgeLength: 100,
      // edgeElasticity: 0.45,
      // nestingFactor: 0.1,
      // gravity: 0.25,
      // gravityRange: 3.8,
      // gravityCompound: 1,
      // gravityRangeCompound: 1.5,
      // numIter: 2500,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
      // initialEnergyOnIncremental: 0.3,
      // step: "all",
    // deno-lint-ignore no-explicit-any
    } as any).run();
    cyRef.current.fit();
  }, [graphData]);

  return (
    <CytoscapeComponent
      cy={(cy) => cyRef.current = cy}
      style={{ width: "100%", height: "100%" }}
      stylesheet={[
        {
          selector: "node",
          css: {
            "text-valign": "center",
            // "text-halign": "center",
            label: "data(label)",
            "background-color": function(node) {
              console.log(node);
              if (node.data("child"))
                return  "#58D68D";
              else
                return "#2B65EC";
            },
            // color: "#fff",
            'font-size': 20,
            'height': 'data(size)',
            'width': 'data(size)',
          },
        },
        {
          selector: "edge",
          css: {
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
    />
  );
}
