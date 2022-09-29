import './Factory.css';
import React from "react";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector.tsx";
import { Topbar } from '../Topbar/Topbar.tsx';
import { createClient, Provider, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
        },
      },
    }),
    fetchExchange,
  ],
});

export function Factory() {
  return (
    <Suspense>
      <StrictMode>
        <Provider value={client}>
          <StyledEngineProvider injectFirst>
            <Topbar />
            <section className="app">
              <GraphInspector />
            </section>
          </StyledEngineProvider>
        </Provider>
      </StrictMode>
    </Suspense>
  );
}
