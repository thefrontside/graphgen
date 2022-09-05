import { serve } from "https://deno.land/std@0.153.0/http/server.ts";
  import { createServer } from '@graphql-yoga/common'
import { resolvers, typeDefs } from '../graphql/schema.ts';
import { makeContext } from '../context/context.ts';

const PORT = Number(Deno.env.get('PORT') ?? 4000);

export async function main() {
  const context = await makeContext();
  
  const graphQLServer = createServer({
    schema: {
      typeDefs,
      resolvers
    },
    context
  })

  serve(graphQLServer.handleRequest, {
    port: PORT,
  });

  console.log(`Server is running on http://localhost:${PORT}/graphql`)
}