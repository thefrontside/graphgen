import { TopBar } from "../TopBar/TopBar.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
import { Suspense, useState, useEffect } from "react";

export function GraphInspector() {
  const [graph, setGraph] = useState();

  useEffect(() => {
    if(graph) {
      return;
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
            name
            count
            vertices
          }
        }`
        })
      });
  
      const graph = await response.json();
  
      setGraph(graph);
    }

    loadGraph().catch(console.error);
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
