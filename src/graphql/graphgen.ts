import type { Seed } from "../distribution.ts";
import type { DispatchArg, Field, Reference, Type } from "./types.ts";

import { assert, evaluate, graphql, shift } from "../deps.ts";
import { createGraph, createVertex, Graph, Vertex } from "../graph.ts";
import { normal, weighted } from "../distribution.ts";
import { CacheStorage, createCache, NullCache } from "./cache.ts";
import { Alea, createAlea } from "../alea.ts";
import { Analysis, analyze } from "./analyze.ts";
import { expect } from "./expect.ts";

export * from "./dispatch.ts";
export type { CacheStorage, CacheValue } from "./cache.ts";

export interface Node {
  id: string;
  __typename: string;
}

type NonOverridableKeys = "__typename" | "id";

//deno-lint-ignore ban-types
export type Preset<T> = T extends object ? {
    [P in keyof T as P extends NonOverridableKeys ? never : P]?: Preset<T[P]>;
  }
  : T;

//deno-lint-ignore no-explicit-any
export interface GraphGen<API = Record<string, any>> {
  graph: Graph;
  create<T extends string & keyof API>(
    typename: T,
    preset?: Preset<API[T]>,
  ): Node & API[T];
  all<T extends string & keyof API>(typename: T): Collection<Node & API[T]>;
  createMany<T extends string & keyof API>(
    typename: T,
    amount: number,
  ): Iterable<Node & API[T]>;
  analysis: Analysis;
}

export interface Collection<T> extends Iterable<T> {
  get(id: string): T | undefined;
}

export interface Generate {
  (info: GenerateInfo): unknown;
}

export interface GenerateInfo {
  method: string;
  args: DispatchArg[];
  typename: string;
  fieldname: string;
  fieldtype: string;
  seed: Seed;
  next(): unknown;
}

//deno-lint-ignore no-explicit-any
type DefaultComputeMap = Record<string, (node: any) => any>;

type ComputeMap<API> = {
  [K in keyof API]: {
    [
      P in keyof API[K] as P extends NonOverridableKeys ? never
        : `${K & string}.${P & string}`
      //deno-lint-ignore no-explicit-any
    ]?: (o: API[K]) => any;
  };
}[keyof API];

//deno-lint-ignore no-explicit-any
export interface GraphQLOptions<API = Record<string, any>> {
  source: string;
  sourceName?: string;
  generate?: Generate | Generate[];
  compute?: ComputeMap<API>;
  seed?: string | Alea;
  storage?: CacheStorage;
}

//deno-lint-ignore no-explicit-any
export function createGraphGen<API = Record<string, any>>(
  options: GraphQLOptions<API>,
): GraphGen<API> {
  let seed = typeof options.seed === "function"
    ? options.seed
    : createAlea(options.seed ?? "graphgen");
  let prelude = graphql.buildSchema(`
union _Arg = String | Float | Int | Boolean
directive @has(chance: Float!) on FIELD_DEFINITION
directive @gen(with: String! args: [_Arg] ) on FIELD_DEFINITION
directive @affinity(of: Float!) on FIELD_DEFINITION
directive @inverse(of: String!) on FIELD_DEFINITION
directive @size(mean: Int, min: Int, max: Int, standardDeviation: Int) on FIELD_DEFINITION
directive @computed on FIELD_DEFINITION
`);

  let schema = graphql.extendSchema(
    prelude,
    parse(options.source, options.sourceName),
  );

  let analysis = analyze(schema);

  let { types, edges, relationships } = analysis;

  let fieldgen = createFieldGenerate(
    seed,
    options.generate ? ([] as Generate[]).concat(options.generate) : [],
  );

  let graph = createGraph({
    seed,
    types: {
      vertex: Object.values<Type>(types).map((
        { name, fields, references },
      ) => ({
        name,
        data: () => ({
          description: "this description is not used",
          sample() {
            let values = {} as Record<string, unknown>;
            for (let field of fields) {
              values[field.name] = fieldgen(field);
            }
            return values;
          },
        }),
        relationships: references.map((ref) => {
          let relationship = expect(ref.key, relationships);
          let size = ref.arity.has === "many"
            ? normal(ref.arity.size)
            : weighted([[1, ref.probability], [0, 1 - ref.probability]]);

          let rel = {
            type: relationship.name,
            size,
            direction: relationship.direction,
          };

          let { affinity } = ref;
          return affinity != null ? { ...rel, affinity } : rel;
        }),
      })),
      edge: edges.map((edge) => ({
        name: edge.name,
        from: edge.vector.from.holder.name,
        to: edge.vector.to.map((t) =>
          "holder" in t ? t.holder.name : t.name
        ) as [string, ...string[]],
      })),
    },
  });

  let cache = options.storage
    ? createCache({
      graph,
      source: options.source,
      storage: options.storage,
      seed,
    })
    : NullCache;

  for (let type of Object.values(types)) {
    for (let compute of type.computed) {
      assert(
        options.compute && (options.compute as DefaultComputeMap)[compute.key],
        `field '${compute.key}' is declared as @computed, but there is nothing registered to compute it`,
      );
    }
  }

  let nodes = {} as Record<number, Node>;

  function toNode<T>(vertex: Vertex): Node & T {
    let existing = nodes[vertex.id];
    if (existing) {
      return existing as Node & T;
    } else {
      let node = Object.defineProperties({
        id: String(vertex.id),
        ...vertex.data,
      }, {
        __typename: {
          enumerable: false,
          value: vertex.type,
        },
      });

      let type = expect(vertex.type, types);
      let properties = type.references.reduce((props, ref) => {
        return {
          ...props,
          [ref.name]: {
            enumerable: true,
            get() {
              let relationship = expect(ref.key, relationships);
              let edges = (graph[relationship.direction][vertex.id] ?? [])
                .filter((e) => e.type === relationship.name);
              let direction: "from" | "to" = relationship.direction === "from"
                ? "to"
                : "from";
              let nodes = edges.map((edge) =>
                toNode(graph.vertices[edge[direction]])
              );
              if (ref.arity.has === "many") {
                return nodes;
              } else {
                return nodes[0];
              }
            },
          },
        };
      }, {} as PropertyDescriptorMap);

      Object.defineProperties(node, properties);

      let resolvedKeys = Object.keys(vertex.data);

      let propsToCompute = type.computed.filter((compute) =>
        !resolvedKeys.includes(compute.name)
      );

      let computed = propsToCompute.reduce((props, compute) => {
        return {
          ...props,
          [compute.name]: {
            enumerable: true,
            get() {
              let map = (options.compute ?? {}) as DefaultComputeMap;
              let computer = map[compute.key];
              if (computer) {
                return computer(this);
              } else {
                throw new Error(
                  `no computation registered for computed property ${compute.key}`,
                );
              }
            },
          },
        };
      }, {} as PropertyDescriptorMap);

      Object.defineProperties(node, computed);

      return nodes[vertex.id] = node;
    }
  }

  function transform(
    type: Type,
    preset: Record<string, unknown> = {},
  ): Record<string, unknown> {
    let transformed = Object.entries<unknown>(preset).reduce(
      (transformed, [fieldname, value]) => {
        let ref: Reference | undefined = type.references.find(({ name }) =>
          name === fieldname
        );
        if (ref) {
          let target = expect(ref.typenames[0], types);
          let relationship = expect(ref.key, relationships);
          let targetPreset = Array.isArray(value)
            ? value.map((content) => transform(target, content))
            : transform(target, value as Record<string, unknown>);
          return {
            ...transformed,
            [relationship.name]: targetPreset,
          };
        } else {
          return {
            ...transformed,
            [fieldname]: value,
          };
        }
      },
      {} as Record<string, unknown>,
    );
    return transformed;
  }

  function all<T extends string & keyof API>(
    typename: T,
  ): Collection<Node & API[T]> {
    return {
      *[Symbol.iterator]() {
        for (let id in graph.roots[typename]) {
          yield toNode<API[typeof typename]>(graph.roots[typename][id]);
        }
      },
      get(id) {
        let vertex = graph.roots[typename][Number(id)];
        if (vertex) {
          return toNode(vertex);
        }
      },
    };
  }

  function create<T extends string & keyof API>(
    typename: T,
    preset?: Preset<API[T]>,
  ): Node & API[T] {
    let vertex = cache.create(typename, preset, () => {
      let type = expect(typename, types, `unknown type '${typename}'`);
      return createVertex(
        graph,
        typename,
        transform(type, preset as Record<string, unknown>),
      );
    });
    return toNode(vertex) as Node & API[typeof typename];
  }

  return {
    graph,
    create,
    all,
    createMany(typename, amount) {
      for (let i = 0; i < amount; i++) {
        create(typename);
      }

      return all(typename);
    },
    analysis
  };
}

type Invoke = (info: Omit<GenerateInfo, "next">) => unknown;

function createFieldGenerate(seed: Seed, middlewares: Generate[]) {
  let invoke = evaluate<Invoke>(function* () {
    for (let middleware of middlewares) {
      yield* shift<void>(function* (k) {
        return ((info) =>
          middleware({ ...info, next: () => k()(info) })) as Invoke;
      });
    }
    return generateRandomFromType;
  });

  return function (field: Field) {
    if (field.probability < 1 && (seed() < field.probability)) {
      return null;
    } else {
      return invoke({
        seed,
        typename: field.holder.name,
        method: field.gen.method,
        args: field.gen.args,
        fieldtype: field.typename,
        fieldname: field.name,
      });
    }
  };
}

/**
 * Generate a field value using nothing other than its type. This
 * is used as the last fallback, and will result in ugly values like
 * "Person.name 34545"
 */
const generateRandomFromType: Invoke = (info) => {
  switch (info.fieldtype) {
    case "String":
      return `${info.typename}.${info.fieldname} ${
        Math.floor(info.seed() * 10000000)
      }`;
    case "Int":
      return Math.floor(info.seed() * 1000);
    case "Float":
      return info.seed() * 1000;
    case "Boolean":
      return info.seed() > .5 ? true : false;
    default:
      throw new Error(
        `Tried to default generate ${info.typename}.${info.fieldname}, but don't know how to handle ${info.typename}`,
      );
  }
};

function parse(source: string, name = "<anonymous>"): graphql.DocumentNode {
  try {
    return graphql.parse(source);
  } catch (error) {
    if (error instanceof graphql.GraphQLError) {
      throw new Error(
        `GraphQL ${error.message}\n${name} at position ${error.positions}`,
      );
    } else {
      throw error;
    }
  }
}
