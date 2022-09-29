import "./Factory.css";
import { StrictMode, Suspense } from "react";
import { StyledEngineProvider } from "@mui/material/styles";
import { GraphInspector } from "../GraphInspector/GraphInspector";
import { Topbar } from "../Topbar/Topbar";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";

const client = createClient({
  url: "/graphql",
  exchanges: [
    dedupExchange,
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
