
import { gql, TypeSource } from '../deps.ts';
import { GraphQLJSON, GraphQLJSONObject } from '../deps.ts';
import type { GraphQLContext } from './context.ts';

export const typeDefs = gql(Deno.readTextFileSync('./graphql/world.graphql')) as TypeSource;

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    all(_: unknown, { typename: _typename }: { typename: string; }, _context: GraphQLContext) {
      return []
    }
  }
};
