import { serve } from 'http/server.ts';
import { createServer } from "ultra/server.ts";
import { makeContext } from "../context/context.ts";
import { resolvers, typeDefs } from "../graphql/schema.ts";
import App from "./App.tsx";
import { createServer as createGraphqlServer } from '@graphql-yoga/common'
import { Context, Next } from 'Hono';

const server = await createServer({
  importMapPath: import.meta.resolve("../importMap.json"),
  browserEntrypoint: import.meta.resolve("./client.tsx"),
});

const context = await makeContext();
  
export const graphQLServer = createGraphqlServer({
  schema: {
    typeDefs,
    resolvers
  },
  context
})

server.use('/graphql', (ctx: Context, next: Next) => {
  return graphQLServer.handleRequest(ctx.req, ctx.res, next);
})

// deno-lint-ignore no-explicit-any
server.get('*', async (context: any) => {
  // const url = context.req.url;

  // if (url.indexOf('/graphql') > - 1) {

  // }
  const result = await server.render(<App />);

  return context.body(result, 200, {
    "content-type": "text/html",
  });
}, {
  port: 8000
});

serve(server.fetch);