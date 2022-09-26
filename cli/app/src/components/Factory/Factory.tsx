import './Factory.css';
import React from "react";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector.tsx";
import { Loader } from "../Loader/Loader.tsx";
import { Topbar } from '../Topbar/Topbar.tsx';

export function Factory() {
  return (
    <Suspense>
      <StrictMode>
        <StyledEngineProvider injectFirst>
          <Topbar/>
          <section className="app">
            <GraphInspector />
          </section>
        </StyledEngineProvider>
      </StrictMode>
    </Suspense>
  );
}
