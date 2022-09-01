import { TopBar } from "../TopBar/TopBar.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
import { Suspense, useState, useEffect } from "react";
import { load } from "https://esm.sh/v92/@types/flat-cache@latest/index~.d.ts";

export function GraphInspector() {
  const [graph, setGraph] = useState();

  useEffect(() => {
    if(graph) {
      return;
    }

    async function createGraph() {

      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `mutation CreateMany {
            createMany(inputs: [
              {typename:"Component"},
              {typename:"Group"},
              {typename:"API"},
              {typename:"Resource"},
              {typename:"User"},
              {typename:"Domain"}
            ])
          }`
        })
      }); 
    }

    async function loadGraph() {
      const response = await fetch('http://localhost:4000', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `{
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
        }`
        })
      });
  
      const graph = await response.json();
  
      setGraph(graph);
    }

    createGraph()
      .then(loadGraph)
      .catch(console.error);
  }, [graph])
  
  if (typeof window === "undefined" || !graph) {
    return <div>loading......</div>;
  }
  
  return (
    <Suspense>
      <TopBar />
      <section className="main">
        <section className="margin" />
        <section className="left">
          <div className="top"></div>
          <div className="bottom"></div>
        </section>
        <section className="right">
          <Inspector graph={graph} />
        </section>
      </section>
    </Suspense>
  );
}
