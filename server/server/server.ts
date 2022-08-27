import { serve } from 'http/server.ts'
import { createServer } from '@graphql-yoga/common'
import { resolvers, typeDefs } from '../graphql/schema.ts';
import { makeContext } from '../context/context.ts';

declare namespace Deno {
  export const env:  {
    PORT?: number;
  }
}

const PORT = Deno.env.PORT ?? 4000;

export function main() {
  const graphQLServer = createServer({
    schema: {
      typeDefs,
      resolvers
    },
    context: makeContext()
  })

  serve(graphQLServer.handleRequest, {
    port: PORT,
  });

  console.log(`Server is running on http://localhost:${PORT}/graphql`)
}