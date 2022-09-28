import { GraphQLJSON, GraphQLJSONObject } from "../deps.ts";
import type { GraphQLContext } from "./context.ts";
import { toVertexNode } from "./toVertexNode.ts";
import { CreateInput, Type } from "./types.ts";
import { VertexNode } from "./types.ts";

export const typeDefs = Deno.readTextFileSync('./graphql/inspector.graphql');

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    meta(_: unknown, __: unknown, context: GraphQLContext): Type[] {
      const graph = context.factory.graph;

      return Object.keys(graph.roots)
        .flatMap((typename) => {
          const values = Object.values(graph.roots[typename]);

          return {
            typename,
            count: values.length,
          };
        }).filter((t) => t.count > 0)
        .sort((left, right) => right.count - left.count);
    },
    all(
      _: unknown,
      { typename }: { typename: string },
      context: GraphQLContext,
    ): VertexNode[] {
      const collection = context.factory.all(typename);

      const nodes = [...collection];

      const result = nodes.map((node) =>
        toVertexNode(context.factory, typename, node)
      );

      return result;
    },
    node(_: unknown, { id }: { id: string }, context: GraphQLContext) {
      const [typename, nodeId] = id.split(":");

      const node = context.factory.all(typename)?.get(nodeId);

      if (!node) {
        return null;
      }

      return toVertexNode(context.factory, typename, node);
    },
  },
  Mutation: {
    create(
      _: unknown,
      { typename, preset }: CreateInput,
      context: GraphQLContext,
    ): VertexNode {
      return toVertexNode(
        context.factory,
        typename,
        context.factory.create(typename, preset),
      );
    },
    createMany(
      _: unknown,
      { inputs }: { inputs: CreateInput[] },
      context: GraphQLContext,
    ): VertexNode[] {
      return inputs.map(({ typename, preset }) =>
        toVertexNode(
          context.factory,
          typename,
          context.factory.create(typename, preset),
        )
      );
    },
  },
};
