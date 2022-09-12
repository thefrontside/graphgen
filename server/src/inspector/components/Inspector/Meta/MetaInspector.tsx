import { useEffect, useReducer, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import { metaReducer } from "./metaReducer.ts";
import { loadMeta } from "./queries.ts";

Cytoscape.use(fcose);

const emptyGraph = { graphData: { nodes: [], edges: [] } };

export function MetaInspector(): JSX.Element {
  const [{ graphData }, dispatch] = useReducer(metaReducer, emptyGraph);
  const cyRef = useRef<cytoscape.Core>();

  useEffect(() => {
    loadMeta().then((d) => {
      dispatch({ type: "SET_META", payload: d.data.meta });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }

    cyRef.current.layout({
      name: "fcose",
      quality: "proof",
      packComponents: true,
      tile: false,
      nodeRepulsion: 4500,
      idealEdgeLength: 100,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
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
            label: "data(label)",
            "background-color": function (node) {
              console.log(node);
              if (node.data("child")) {
                return "#58D68D";
              } else {
                return "#2B65EC";
              }
            },
            "font-size": 20,
            "height": "data(size)",
            "width": "data(size)",
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
