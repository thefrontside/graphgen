import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
import { createServer } from "ultra/server.ts";
import { makeContext } from "./src/context/context.ts";
import { resolvers, typeDefs } from "./src/graphql/schema.ts";
import App from "./src/app.tsx";
import { createServer as createGraphqlServer } from '@graphql-yoga/common'

const server = await createServer({
  importMapPath: import.meta.resolve("./importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
});

const context = await makeContext();

const PORT = Number(Deno.env.get('PORT') ?? 8000);
  
export const graphQLServer = createGraphqlServer({
  schema: {
    // deno-lint-ignore no-explicit-any
    typeDefs: typeDefs as any,
    resolvers
  },
  context
})

// deno-lint-ignore no-explicit-any
server.use('/graphql', (ctx: any) => {
  return graphQLServer.handleRequest(ctx.req, ctx.res);
})

// deno-lint-ignore no-explicit-any
server.get('*', async (context: any) => {
  const result = await server.render(<App />);

  return context.body(result, 200, {
    "content-type": "text/html",
  });
}, {
  port: PORT
});

serve(server.fetch);