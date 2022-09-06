// deno-lint-ignore-file no-explicit-any
import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { CreateInput, Type } from "./types.ts";
import type { GraphQLContext } from '../context/context.ts';
import { Node } from '@frontside/graphgen';

export const typeDefs = gql(Deno.readTextFileSync('./src/graphql/base.graphql'));

function toNode<T extends { id: string, typename: string }>(typename: string, value: T): Node {
  return {
    id: value.id,
    __typename: typename
  }
}

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    meta(_: any, __: any, context: GraphQLContext): Type[] {
      const graph = context.factory.graph;

      return Object.keys(graph.roots)
        .flatMap(typename => {
          const values = Object.values(graph.roots[typename])
            .map(v => ({ ...v, from: graph.from[Number(v.id)] ?? [] }));

          return {
            typename,
            values,
            relationships: graph.types.vertex[typename].relationships
          }
        }).filter(t => t.values.length > 0)
        .map((model) => ({
          typename: model.typename,
          count: model.values.length,
          references: model.relationships.map(r => {
            const fromRelationships = model.values.flatMap(v => v.from.filter(f => f.type === r.type));

            return {
              typename: model.typename,
              fieldname: r.type.substring(r.type.indexOf('.') + 1, r.type.indexOf('->')),
              path: r.type,
              description: r.size.description,
              affinity: r.affinity,
              count: fromRelationships.length
            }
          }).sort((left, right) => right.count - left.count)
        })).sort((left, right) => right.count - left.count);
    },
    graph(_: any, __: any, context: GraphQLContext) {
      const rootKeys = Object.keys(context.factory.graph.roots);
      // const result = {} as Record<string, any>

      // for(const root of rootKeys) {
      //   const nodes = [...context.factory.all(root)];

      //   if(nodes.length === 0) {
      //     continue;
      //   }

      //   result[root] = nodes;
      // }

      return rootKeys;
    },
    root(_: any, { typename }: { typename: string }, context: GraphQLContext) {
      const nodes = [...context.factory.all(typename)];

      if (nodes.length === 0) {
        return [];
      }
      
      // const getters = Object.entries(Object.getOwnPropertyDescriptors(nodes[0]))//.filter(([, v]) => typeof v === 'function');
      
      // console.dir({getters})

    }
  },
  Mutation: {
    create(_: any, { typename, preset }: CreateInput, context: GraphQLContext) {
      return toNode(typename, context.factory.create(typename, preset));
    },
createMany(_: any, { inputs }: { inputs: CreateInput[] }, context: GraphQLContext) {
  return inputs.map(({ typename, preset }) => toNode(typename, context.factory.create(typename, preset)));
}
  }
};
