import type { GraphGen, Node as GraphgenNode } from "../../mod.ts";
import { Field, FieldEntry, VertexNode } from "./types.ts";
import { assert } from "../../src/deps.ts";

type Factory = GraphGen;

export function idOf(node: GraphgenNode): string {
  return `${node.__typename}:${node.id}`;
}

// deno-lint-ignore no-explicit-any
function isGraphgenNode(o: any): o is GraphgenNode {
  return typeof o === "object" && "__typename" in o && "id" in o;
}

export function toVertexNode<
  T extends { id: string; typename: string; [key: string]: Field | Field[] },
>(factory: Factory, typename: string, value: T): VertexNode {
  console.log({a: factory.analysis})
  const { fields, references, computed } = factory.analysis.types[typename];

  const fieldEntries: FieldEntry[] = [];

  for (const field of fields) {
    fieldEntries.push({
      __typename: "JSONFieldEntry",
      key: field.name,
      json: value[field.name],
      typename: field.typename,
    });
  }

  for (const reference of references) {
    if (reference.arity.has === "one") {
      fieldEntries.push({
        __typename: "VertexFieldEntry",
        key: reference.name,
        id: idOf(value[reference.name] as unknown as GraphgenNode),
        typenames: reference.typenames,
      });
    } else {
      fieldEntries.push({
        __typename: "VertexListFieldEntry",
        key: reference.name,
        ids: (value[reference.name] as unknown as GraphgenNode[]).map(idOf),
        typenames: reference.typenames,
      });
    }
  }

  for (const compute of computed) {
    const materialized = value[compute.name];

    if (Array.isArray(materialized) === false && isGraphgenNode(materialized)) {
      fieldEntries.push({
        __typename: "VertexFieldEntry",
        key: compute.name,
        id: idOf(materialized),
        typenames: [compute.typename],
      });
    } else if (Array.isArray(materialized)) {
      const some = materialized.some(isGraphgenNode);

      if (some) {
        assert(
          materialized.every(isGraphgenNode),
          `Not all nodes for ${compute.name} are GraphGen nodes`,
        );

        fieldEntries.push({
          __typename: "VertexListFieldEntry",
          key: compute.name,
          ids: (value[compute.name] as unknown as GraphgenNode[]).map(idOf),
          typenames: [compute.typename],
        });
      } else {
        fieldEntries.push({
          __typename: "JSONFieldEntry",
          key: compute.name,
          json: value[compute.name],
          typename: compute.typename,
        });
      }
    } else {
      fieldEntries.push({
        __typename: "JSONFieldEntry",
        key: compute.name,
        json: value[compute.name],
        typename: compute.typename,
      });
    }
  }

  return {
    id: `${typename}:${value.id}`,
    __typename: "Vertex",
    typename,
    fields: fieldEntries,
  } as VertexNode;
}
