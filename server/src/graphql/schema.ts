// deno-lint-ignore-file no-explicit-any
import { gql } from 'graphql_tag';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import { CreateInput, Type } from "./types.ts";
import type { GraphQLContext } from '../context/context.ts';
import { assert } from 'assert-ts';
import type { GraphGen, Node as GraphgenNode } from '../../../mod.ts';

type Factory = GraphGen;

export const typeDefs = gql(Deno.readTextFileSync('./src/graphql/base.graphql'));

export function idOf(node: GraphgenNode): string {
  return `${node.__typename}:${node.id}`;
}

interface Node {
  id: string;
}

type Field = string | number | boolean | VertexNode | Field[];

type FieldEntry =
  {
    __typename: 'VertexFieldEntry';
    key: string;
    id: string
  } | {
    __typename: 'VertexListFieldEntry';
    key: string;
    ids: string[];
  } | {
    __typename: 'JSONFieldEntry';
    key: string;
    json: unknown;
  }

interface VertexNode extends Node {
  typename: string;
  fields: FieldEntry[];
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
      json: value[field.name]
    })
  }

  for (const reference of references) {
    if (reference.arity.has === 'one') {
      fieldEntries.push({
        __typename: 'VertexFieldEntry',
        key: reference.name,
        id: idOf(value[reference.name] as unknown as GraphgenNode)
      })
    } else {
      fieldEntries.push({
        __typename: 'VertexListFieldEntry',
        key: reference.name,
        ids: (value[reference.name] as unknown as GraphgenNode[]).map(idOf)
      })
    }
  }

  for (const compute of computed) {
    const materialized = value[compute.name];

    if (isGraphgenNode(materialized)) {
      fieldEntries.push({
        __typename: 'VertexFieldEntry',
        key: compute.name,
        id: idOf(materialized)
      })
    } else if (Array.isArray(materialized)) {
      const some = materialized.some(isGraphgenNode);

      if (some) {
        assert(materialized.every(isGraphgenNode), `Not all nodes for ${compute.name} are GraphGen nodes`);

        fieldEntries.push({
          __typename: 'VertexListFieldEntry',
          key: compute.name,
          ids: (value[compute.name] as unknown as GraphgenNode[]).map(idOf),
        })
      } else {
        fieldEntries.push({
          __typename: 'JSONFieldEntry',
          key: compute.name,
          json: value[compute.name]
        })
      }
    } else {
      fieldEntries.push({
        __typename: 'JSONFieldEntry',
        key: compute.name,
        json: value[compute.name]
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

function createMakeSerializable(context: GraphQLContext) {
  return function makeSerializable<T extends Node & Record<string, any>>(node: T) {
    const { references, fields } = context.factory.analysis.types[node.__typename];

    const result: Record<string, unknown> = { id: `${node.__typename}:${node.id}` };

    for (const field of fields) {
      result[field.name] = node[field.name];
    }

    // for(const compute of computed) {
    //   result[compute.name] = node[compute.name];
    // }

    for (const reference of references) {
      result[reference.name] = { id: node[reference.name]?.id, parentId: node.id, kind: 'relationship', typenames: reference.typenames, parentTypeName: node.__typename }
    }

    return result;
  }
}

interface NodeId {
  id: string;
  typename: string;
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
      const result: { typename: string, size: number }[] = [];

      for (const root of rootKeys) {
        const nodes = [...context.factory.all(root)];

        if (nodes.length === 0) {
          continue;
        }

        result.push({
          typename: root,
          size: nodes.length
        });
      }

      return result;
    },
    root(_: any, { typename }: { typename: string; }, context: GraphQLContext) {
      const makeSerializable = createMakeSerializable(context);

      const types = context.factory.all(typename);

      const nodes = [...types];

      if (nodes.length === 0) {
        return [];
      }

      return nodes.map(makeSerializable);
    },
    node(_: any, { id }: { id: string; }, context: GraphQLContext) {
      const [typename, nodeId] = id.split(':')

      const node = context.factory.all(typename)?.get(nodeId);

      if (!node) {
        return null;
      }

      return toVertexNode(context.factory, typename, node);
    },
    relationship(_: any, { parentId, typename, fieldname }: { parentId: string; typename: string; fieldname: string }, context: GraphQLContext) {
      const makeSerializable = createMakeSerializable(context);

      const parent = context.factory.all(typename).get(parentId);

      assert(!!parent, `no parent for type ${typename} ${parentId}`);

      const data = parent[fieldname];

      if (!data) {
        console.log(`no data found for field ${fieldname} ${typename} ${parentId} `);
        return;
      }

      if (Array.isArray(data)) {
        return data.map(makeSerializable);
      } else {
        return makeSerializable(data);
      }
    }
  },
  Mutation: {
    create(_: any, { typename, preset }: CreateInput, context: GraphQLContext) {
      return toVertexNode(context.factory, typename, context.factory.create(typename, preset));
    },
    createMany(_: any, { inputs }: { inputs: CreateInput[] }, context: GraphQLContext) {
      return inputs.map(({ typename, preset }) => toVertexNode(context.factory, typename, context.factory.create(typename, preset)));
    }
  }
};
