// deno-lint-ignore-file no-explicit-any
import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { CreateInput, Type } from "./types.ts";
import type { GraphQLContext } from '../context/context.ts';

export const typeDefs = gql(Deno.readTextFileSync('./graphql/base.graphql'));

function safeJsonStringify(value: Record<string, unknown>) {
  const visitedObjs: any[] = [];
  function replacerFn(_key: string, obj: Record<string, unknown>) {
    const refIndex = visitedObjs.indexOf(obj);
    if (refIndex >= 0) return `cyclic-ref:${refIndex}`;
    if (typeof obj === 'object' && obj !== null) visitedObjs.push(obj);
    return obj;
  }
  return JSON.stringify(value, replacerFn);
}

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    meta(_: any, __: any, context: GraphQLContext) {
      const graph = context.factory.graph;
      const models = Object.keys(graph.roots)
        .flatMap(typename => {
          const values = Object.values(graph.roots[typename]).map(v => ({ ...v, from: graph.from[Number(v.id)] ?? [] }));

          return {
            typename,
            values,
            relationships: graph.types.vertex[typename].relationships
          }
        }).filter(t => t.values.length > 0);

      if (models.length === 0) {
        return [];
      }

      console.dir(context.factory.graph, { depth: 333, getters: true })

      const types: Type[] = [];

      for (const model of models) {
        types.push({
          typename: model.typename,
          count: model.values.length,
          references: model.relationships.map(r => {
            const froms = model.values.flatMap(x => x.from.filter(f => f.type === r.type));

            // console.dir({ r: r.type, froms }, { depth: 444 })
            return {
              typename: model.typename,
              fieldname: r.type.substring(r.type.indexOf('.') + 1, r.type.indexOf('->')),
              path: r.type,
              count: froms.length
            }
          }).filter(r => r.count > 0)
        })
      }

      return types;
    }
  },
  Mutation: {
    create(_: any, { typename, preset }: CreateInput, context: GraphQLContext) {
      const node = context.factory.create(typename, preset);

      return JSON.parse(safeJsonStringify(node));
    },
    createMany(_: any, { inputs }: { inputs: CreateInput[] }, context: GraphQLContext) {
      const nodes: Record<string, unknown>[] = [];
      for (const { typename, preset } of inputs) {
        const node = context.factory.create(typename, preset);

        nodes.push(JSON.parse(safeJsonStringify(node)));
      }

      return nodes;
    }
  }
};
