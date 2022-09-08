import { TopBar } from "../TopBar/TopBar.tsx";
import { MetaInspector } from "../Inspector/MetaInspector.tsx";
import { GraphInspector } from "../Inspector/GraphInspector.tsx";
import {
  ChangeEvent,
  StrictMode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { defaultTheme, RadioGroup } from "@cutting/component-library";
import { Views, views } from "../types.ts";
import { StyledEngineProvider } from "@mui/material/styles";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";

const Inspectors = {
  Graph: GraphInspector,
  Meta: MetaInspector,
} as const;

export function Factory() {
  const [view, setView] = useState<Views>("Graph");
  const ref = useRef<HTMLDivElement>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    async function createGraph() {
      await fetchGraphQL(`mutation CreateMany {
        createMany(inputs: [
          {typename:"Component"},
          {typename:"Group"},
          {typename:"API"},
          {typename:"Resource"},
          {typename:"User"},
          {typename:"Domain"}
        ])
      }`);
    }

    createGraph().then(() => setCreated(true)).catch(console.error);
  }, [view]);

  if (!created) {
    return <div>loading......</div>;
  }

  const Inspector = Inspectors[view];

  return (
    <Suspense>
      <StrictMode>
        <StyledEngineProvider injectFirst>
          <TopBar />
          <section className={`main ${defaultTheme}`}>
            <section className="margin" />
            <section className="left">
              <div className="top">
                <RadioGroup
                  name="large-inline-radio"
                  checkableLayout={"stacked"}
                  checkableSize={"large"}
                  legend="View"
                  options={views.map((v) => ({
                    content: v,
                    value: v,
                    checked: v === view,
                  }))}
                  // deno-lint-ignore no-explicit-any
                  onChange={(e: ChangeEvent<any>) => {
                    setView(e.target.value as Views);
                  }}
                />
              </div>
              <div className="bottom"></div>
            </section>
            <section ref={ref} className="right">
              <Inspector />
            </section>
          </section>
        </StyledEngineProvider>
      </StrictMode>
    </Suspense>
  );
}
