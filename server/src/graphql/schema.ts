// deno-lint-ignore-file no-explicit-any
import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { CreateInput, Field, FieldEntry, Type, VertexNode } from "./types.ts";
import type { GraphQLContext } from '../context/context.ts';
import { assert } from 'assert-ts';
import type { GraphGen, Node as GraphgenNode } from '@frontside/graphgen';

type Factory = GraphGen;

export const typeDefs = gql(Deno.readTextFileSync('./src/graphql/base.graphql'));

export function idOf(node: GraphgenNode): string {
  return `${node.__typename}:${node.id}`;
}

function isGraphgenNode(o: any): o is GraphgenNode {
  return typeof o === 'object' && '__typename' in o && 'id' in o;
}

function toVertexNode<T extends { id: string, typename: string, [key: string]: Field | Field[] }>(factory: Factory, typename: string, value: T): VertexNode {
  const { fields, references, computed } = factory.analysis.types[typename];

  const fieldEntries: FieldEntry[] = [];

  for (const field of fields) {
    fieldEntries.push({
      __typename: 'JSONFieldEntry',
      key: field.name,
      json: value[field.name],
      typename: field.typename
    })
  }

  for (const reference of references) {
    if (reference.arity.has === 'one') {
      fieldEntries.push({
        __typename: 'VertexFieldEntry',
        key: reference.name,
        id: idOf(value[reference.name] as unknown as GraphgenNode),
        typenames: reference.typenames
      })
    } else {
      fieldEntries.push({
        __typename: 'VertexListFieldEntry',
        key: reference.name,
        ids: (value[reference.name] as unknown as GraphgenNode[]).map(idOf),
        typenames: reference.typenames
      })
    }
  }

  for (const compute of computed) {
    const materialized = value[compute.name];

    if (isGraphgenNode(materialized)) {
      fieldEntries.push({
        __typename: 'VertexFieldEntry',
        key: compute.name,
        id: idOf(materialized),
        typenames: [compute.typename]
      })
    } else if (Array.isArray(materialized)) {
      const some = materialized.some(isGraphgenNode);

      if (some) {
        assert(materialized.every(isGraphgenNode), `Not all nodes for ${compute.name} are GraphGen nodes`);

        fieldEntries.push({
          __typename: 'VertexListFieldEntry',
          key: compute.name,
          ids: (value[compute.name] as unknown as GraphgenNode[]).map(idOf),
          typenames: [compute.typename]
        })
      } else {
        fieldEntries.push({
          __typename: 'JSONFieldEntry',
          key: compute.name,
          json: value[compute.name],
          typename: compute.typename
        })
      }
    } else {
      fieldEntries.push({
        __typename: 'JSONFieldEntry',
        key: compute.name,
        json: value[compute.name],
        typename: compute.typename
      })
    }
  }

  return {
    id: `${typename}:${value.id}`,
    __typename: 'Vertex',
    typename,
    fields: fieldEntries
  } as VertexNode
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
    all(_: any, { typename }: { typename: string; }, context: GraphQLContext): VertexNode[] {
      const collection = context.factory.all(typename);

      const nodes = [...collection];

      const result = nodes.map(node => toVertexNode(context.factory, typename, node));

      return result;
    },
    node(_: any, { id }: { id: string; }, context: GraphQLContext) {
      const [typename, nodeId] = id.split(':')

      const node = context.factory.all(typename)?.get(nodeId);

      if (!node) {
        return null;
      }

      return toVertexNode(context.factory, typename, node);
    },
  },
  Mutation: {
    create(_: any, { typename, preset }: CreateInput, context: GraphQLContext): VertexNode {
      return toVertexNode(context.factory, typename, context.factory.create(typename, preset));
    },
    createMany(_: any, { inputs }: { inputs: CreateInput[] }, context: GraphQLContext): VertexNode[] {
      return inputs.map(({ typename, preset }) => toVertexNode(context.factory, typename, context.factory.create(typename, preset)));
    }
  }
};
