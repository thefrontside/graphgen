import { TopBar } from "../TopBar/TopBar.tsx";
import { Inspector } from "../Inspector/Inspector.tsx";
import { StrictMode, Suspense, useEffect, useRef, useState } from "react";
import { defaultTheme, RadioGroup } from "@cutting/component-library";
import { Views, views } from "../types.ts";
import { Reference, Type } from "../../../graphql/types.ts";

const graphqlServer = "http://localhost:8000/graphql";

export function GraphInspector() {
  const [data, setData] = useState<any>([]);
  const [view, setView] = useState<Views>("Meta");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function createGraph() {
      await fetch(graphqlServer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          }`,
        }),
      });
    }

    async function loadGraph() {
      const response = await fetch(graphqlServer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `{
        graph
      }`,
        }),
      });

      const graph = await response.json();

      setData(graph);
    }

    async function loadMeta() {
      const response = await fetch(graphqlServer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        }`,
        }),
      });

      const meta = await response.json();

      const data = meta.data.meta.map((
          { typename, references, count, ...rest }: Type,
        ) => ({
          id: typename,
          name: `${typename} (${count})`,
          attributes: {
            count,
            ...rest,
          },
          children: references?.map((
            { fieldname, count, ...rest }: Reference,
            i,
          ) => ({
            id: i,
            name: `${fieldname} (${count})`,
            attributes: {
              ...rest,
            },
          })),
        }));

      setData(data);
    }

    const func = {
      Meta: loadMeta,
      Graph: loadGraph,
    }[view];

    createGraph().then(func)
      .catch(console.error);
  }, [view]);

  console.log(data)

  return (
    <Suspense>
      <StrictMode>
        <TopBar />
        <section className={`main ${defaultTheme}`}>
          <section className="margin" />
          <section className="left">
            <div className="top">
              <RadioGroup
                name="large-inline-radio"
                checkableLayout={"stacked"}
                checkableSize={"large"}
                legend="large inline"
                options={views.map((v) => ({
                  content: v,
                  value: v,
                  checked: v === view,
                }))}
                onChange={(e) => {
                  setView(e.target.value as Views);
                }}
              />
            </div>
            <div className="bottom"></div>
          </section>
          <section ref={ref} className="right">
            <Inspector view={view} innerRef={ref} data={data} />
          </section>
        </section>
      </StrictMode>
    </Suspense>
  );
}
