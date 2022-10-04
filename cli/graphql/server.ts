import type { MainOptions } from "../types.ts";
import { createServer, Hono, serve } from "../deps.ts";
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
    logging: {
      debug(...args) {
        console.dir(...args, { depth: 12 });
      },
      warn(...args) {
        console.dir(...args, { depth: 12 });
      },
      info(...args) {
        console.dir(...args, { depth: 12 });
      },
      error(...args) {
        console.error(...args);
      },
    },
    context: makeContext(options.factory),
  });

  app.use("/graphql", (ctx) => {
    return graphQLServer.handleRequest(ctx.req, ctx.res);
  });

  app.use("*", options.app);

  await serve(app.fetch, {
    port: options.port,
    onListen({ port }) {
      console.log(`Server started at http://localhost:${port}`);
    },
  });
}
