import { serve } from 'http/server.ts'
import { createServer } from '@graphql-yoga/common'
import { typeDefs } from '../graphql/schema.ts';

export function main() {
  const graphQLServer = createServer({
    schema: {
      typeDefs
    }
  })

  serve(graphQLServer.handleRequest, {
    port: 4000,
  });

  console.log('Server is running on http://localhost:4000/graphql')
}