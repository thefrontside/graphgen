import { GraphQLJSON, GraphQLJSONObject } from "../deps.ts";
import type { GraphQLContext } from "./context.ts";

export const typeDefs = /* GraphQL */ `
scalar JSON
scalar JSONObject
interface Node {
  id: ID!
}

interface FieldEntry {
  key: String!
}

type JSONFieldEntry implements FieldEntry {
  key: String!
  json: JSON
  typename: String!
}

type VertexFieldEntry implements FieldEntry {
  key: String!
  id: ID!
  typenames: [String!]!
}

type VertexListFieldEntry implements FieldEntry {
  key: String!
  ids: [ID!]!
  typenames: [String!]!
}

type Vertex implements Node {
  id: ID!
  typename: String!
  fields: [FieldEntry!]!
}

type Query {
  all(typename: String!): [Vertex!]
}
`;

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    all(
      _: unknown,
      { typename: _typename }: { typename: string },
      _context: GraphQLContext,
    ) {
      return [];
    },
  },
};
