import React from "react";
import { StrictMode, Suspense, useEffect, useRef, useState } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { createGraph } from "./queries.ts";
import { GraphInspector } from "../GraphInspector/GraphInspector.tsx";

export function Factory() {
  const ref = useRef<HTMLDivElement>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    createGraph().then(() => setCreated(true)).catch(console.error);
  }, []);

  if (!created) {
    return <div>loading......</div>;
  }

  return (
    <Suspense>
      <StrictMode>
        <StyledEngineProvider injectFirst>
          <GraphInspector />
        </StyledEngineProvider>
      </StrictMode>
    </Suspense>
  );
}
