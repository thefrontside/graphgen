import React from 'react';
import {
  ChangeEvent,
  StrictMode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { defaultTheme, RadioGroup } from "@cutting/component-library";
import { StyledEngineProvider } from "@mui/material/styles";
import { createGraph } from "./queries.ts";
import { GraphInspector } from '../GraphInspector/GraphInspector.tsx';

// const Inspectors = {
//   Graph: GraphInspector,
//   Meta: MetaInspector,
// } as const;

export function Factory() {
  const [view, setView] = useState<Views>("Graph");
  const ref = useRef<HTMLDivElement>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    createGraph().then(() => setCreated(true)).catch(console.error);
  }, [view]);

  if (!created) {
    return <div>loading......</div>;
  }

  return (
    <Suspense>
      <StrictMode>
        <StyledEngineProvider injectFirst>
          <section ref={ref} className="main">
            <h1>Inspector</h1>
          </section>
        </StyledEngineProvider>
      </StrictMode>
    </Suspense>
  );
}
