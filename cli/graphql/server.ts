import { serve, serveStatic, Hono, createServer } from '../deps.ts';
import { resolvers, typeDefs } from "./schema.ts";
import { makeContext } from './context.ts';

const PORT = Number(Deno.env.get('PORT') ?? 8000);

export const graphQLServer = createServer({
  schema: {
    typeDefs,
    resolvers
  },
  maskedErrors: false,
  context: makeContext()
})

const app = new Hono();

export async function main() {
  app.use('/graphql', (ctx) => {
    return graphQLServer.handleRequest(ctx.req, ctx.res);
  })

  app.use('*', serveStatic({ root: './', path: 'public' }));

  await serve(app.fetch, {
    port: PORT, onListen({ port, hostname }) {
      console.log(`Server started at http://${hostname}:${port}`);
    },
    onError(err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

await main();
