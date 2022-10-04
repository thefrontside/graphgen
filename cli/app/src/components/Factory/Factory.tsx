import "./Factory.css";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector";
import { Topbar } from "../Topbar/Topbar";
import {
  createClient,
  dedupExchange,
  Exchange,
  fetchExchange,
  Provider,
} from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";

const client = createClient({
  url: "/graphql",
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
          all: relayPagination(),
        },
      },
    }) as Exchange,
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
