import './Factory.css';
import React from "react";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector.tsx";
import {
  RelayEnvironmentProvider,
} from 'react-relay/hooks';
import { Topbar } from '../Topbar/Topbar.tsx';
import { createRelayEnvironment } from '../../graphql/createRelayEnvironment.ts';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary.tsx';

const relayEnvironment = createRelayEnvironment();

export function Factory() {
  return (
    <Suspense>
      <StrictMode>
        <RelayEnvironmentProvider environment={relayEnvironment}>
          <StyledEngineProvider injectFirst>
            <Topbar />
            <section className="app">
              <GraphInspector />
            </section>
          </StyledEngineProvider>
        </RelayEnvironmentProvider>
      </StrictMode>
    </Suspense >
  );
}
