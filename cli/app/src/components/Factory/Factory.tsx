import './Factory.css';
import React from "react";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector.tsx";
import { Loader } from "../Loader/Loader.tsx";

export function Factory() {
  return (
    <Suspense>
      <StrictMode>
        <StyledEngineProvider injectFirst>
          <section className="app">
            <section>
              <a target="_blank" href="/graphql">GraphiQL</a>
            </section>
            <GraphInspector />
          </section>
        </StyledEngineProvider>
      </StrictMode>
    </Suspense>
  );
}
