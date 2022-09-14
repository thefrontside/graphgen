import type { MainOptions } from "../types.ts";
import { createServer, Hono, serve, serveStatic } from "../deps.ts";
import { resolvers, typeDefs } from "./schema.ts";
import { makeContext } from "./context.ts";

export async function main(options: MainOptions) {
  const app = new Hono();

  const graphQLServer = createServer({
    schema: {
      typeDefs,
      resolvers,
    },
    maskedErrors: false,
    context: makeContext(options.factory),
  });

  app.use("/graphql", (ctx) => {
    return graphQLServer.handleRequest(ctx.req, ctx.res);
  });

  app.use("*", serveStatic({ root: "./", path: "public" }));

  await serve(app.fetch, {
    port: options.port,
    onListen({ port }) {
      console.log(`Server started at http://localhost:${port}`);
    },
  });
}
