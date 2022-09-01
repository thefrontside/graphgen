import { TopBar } from "../TopBar/TopBar.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
import { Suspense, useState, useEffect, useRef } from "react";
import { RadioGroup, defaultTheme } from '@cutting/component-library';
import { views, Views } from "../types.ts";

export function GraphInspector() {
  const [graph, setGraph] = useState();
  const [view, setView] = useState<Views>('Relationships');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(graph) {
      return;
    }

    async function createGraph() {
      await fetch('http://localhost:4000', {
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
      <section className={`main ${defaultTheme}`}>
        <section className="margin" />
        <section className="left">
          <div className="top">
            <RadioGroup
              name="large-inline-radio"
              checkableLayout={'stacked'}
              checkableSize={'large'}
              legend="large inline"
              options={views.map(v => ({
                content: v,
                value: v,
                checked: v === view
              }))}
              onChange={(e) => {
                setView(e.target.value as Views)
              }}
            />
          </div>
          <div className="bottom"></div>
        </section>
        <section ref={ref} className="right">
          <Inspector view={view} innerRef={ref} graph={graph} />
        </section>
      </section>
    </Suspense>
  );
}
