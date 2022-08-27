import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { Type } from "./types.ts";

export const typeDefs = gql(Deno.readTextFileSync('./graphql/base.graphql'));

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    meta() {
      const result: Type[] = [
        {
          name: 'bob',
          count: 3,
          vertices: {}
        }
      ]

      return result;
    }
  }
};
