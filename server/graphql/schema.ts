// deno-lint-ignore-file no-explicit-any
import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { Type } from "./types.ts";
import type { GraphQLContext } from '../context/context.ts';
import { Factory } from '../factory/factory.ts';
import { Vertex } from "../../mod.ts";

export const typeDefs = gql(Deno.readTextFileSync('./graphql/base.graphql'));

export function traverse(factory: Factory, result: Type, node: Vertex<any>, depth = 0) {
  const froms = factory.graph.from[Number(node.id)];
  // console.log('--------------------------------');
  // console.dir({ node, froms });
  if (!froms) {
    // console.log('--------------------------------');
    return;
  }

  for (const from of froms) {
    const next = factory.graph.vertices[from.to];

    const field = from.type.substring(from.type.indexOf('.') + 1, from.type.indexOf('->'));
    
    if(next.id === node.id) {
      console.log(field);
      continue;
    }

    // console.dir({ from, next, depth });

    
    if (!result.vertices[field]) {
      result.vertices[field] = {
        name: next.type,
        field,
        id: next.id,
        count: 1,
        depth,
        vertices: {}
      }
    } else {
      result.vertices[field].count += 1;
    }
    // console.dir({ from, next, depth })
    // console.log({ next })
    // console.log('--------------------------------');
    traverse(factory, result.vertices[field], next, depth++);
  }
}

export const resolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
  Query: {
    meta(_: any, __: any, context: GraphQLContext) {
      const factory = context.factory;
      const results: Record<string, Type> = {};

      const types = ['Component'];//Object.keys(factory.graph.roots);

      // const cs = [...factory.all('Component')].find(x => x.id === "1");

      // console.dir({cs}, {getters: true, depth: 7})

      for (const typename of types) {
        const root = factory.graph.roots[typename];
        const keys = Object.keys(root);

        if (keys.length === 0) {
          continue;
        }

        // TODO: how do we know this is a top level node?
        const node = root[Number(keys[0])];

        if (!factory.graph.from[node.id]) {
          continue;
        }

        if (!results[typename]) {
          results[typename] = {
            name: typename,
            count: 1,
            vertices: {}
          }
        } else {
          results[typename].count += 1;
        }

        try {
          traverse(factory, results[typename], node);
        } catch (e) {
          console.error(e);

          throw e;
        }
      }

      console.dir({ results }, { depth: 33 });

      return Object.keys(results).map(k => results[k]);
    }
  },
};
