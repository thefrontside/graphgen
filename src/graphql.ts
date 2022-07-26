import type { Seed } from "./distribution.ts";
import { seedrandom } from "./seedrandom.ts";
import { assert, evaluate, graphql, shift } from "./deps.ts";
import { createGraph, createVertex, Vertex } from "./graph.ts";
import { normal, weighted } from "./distribution.ts";

import { DispatchArg } from "./dispatch.ts";

export * from "./dispatch.ts";

export interface Node {
  id: string;
}

export type Preset<T> = T extends object
  ? {
    [P in keyof T]?: Preset<T[P]>;
  }
  : T;

//deno-lint-ignore no-explicit-any
export interface GraphGen<API = Record<string, any>> {
  create<T extends string & keyof API>(
    typename: T,
    preset?: Preset<API[T]>,
  ): Node & API[T];
  all<T extends string & keyof API>(typename: T): Iterable<Node & API[T]>;
  createMany<T extends string & keyof API>(typename: T, amount: number): Iterable<Node & API[T]>;
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

type DefaultComputeMap = Record<string, (node: any) => any>;

type ComputeMap<API> = {
  [K in keyof API]: {
    [P in keyof API[K] as `${K & string}.${P & string}`]?: (o: API[K]) => any;
  }
}[keyof API];

export interface GraphQLOptions<API = Record<string, any>> {
  source: string;
  generate?: Generate | Generate[];
  compute?: ComputeMap<API>;
  seed?: Seed;
}

export function createGraphGen<API = Record<string, any>>(
  options: GraphQLOptions<API>,
): GraphGen<API> {
  let { seed = seedrandom("graphgen") } = options;
  let prelude = graphql.buildSchema(`
union _Arg = String | Float | Int | Boolean
directive @has(chance: Float!) on FIELD_DEFINITION
directive @gen(with: String! args: [_Arg] ) on FIELD_DEFINITION
directive @affinity(of: Float!) on FIELD_DEFINITION
directive @inverse(of: String!) on FIELD_DEFINITION
directive @size(mean: Int, min: Int, max: Int, standardDeviation: Int) on FIELD_DEFINITION
directive @computed on FIELD_DEFINITION
`);

  let schema = graphql.extendSchema(prelude, graphql.parse(options.source));

  let { types, edges, relationships } = analyze(schema);
  //console.dir({ types, edges, relationships }, { depth: 5 });

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
      let node = {
        id: String(vertex.id),
        ...vertex.data,
      };
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

      let propsToCompute = type.computed.filter(compute => !resolvedKeys.includes(compute.name));

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

  function transform(type: Type, preset: Record<string, unknown> = {}): Record<string, unknown> {
    let transformed = Object.entries<unknown>(preset).reduce((transformed, [fieldname, value]) => {
      let ref: Reference | undefined = type.references.find(({ name }) => name === fieldname);
      if (ref) {
        let target = expect(ref.typenames[0], types);
        let relationship = expect(ref.key, relationships);
        return {
          ...transformed,
          [relationship.name]: transform(target, preset[fieldname] as Record<string, unknown> | undefined ),
        }
      } else {
        return {
          ...transformed,
          [fieldname]: value,
        };
      }
    }, {} as Record<string, unknown>);
    return transformed;
  }

  function all<T extends string & keyof API>(typename: T) {
    return {
      * [Symbol.iterator]() {

        for(let id in graph.roots[typename]) {
          yield toNode<API[typeof typename]>(graph.roots[typename][id]);
        }
      }
    }
  }

  function create<T extends string & keyof API>(
    typename: T,
    preset?: Preset<API[T]>,
  ): Node & API[T] {
    let type = expect(typename, types, `unknown type '${typename}'`);
    let vertex = createVertex(graph, typename, transform(type, preset as Record<string, unknown>));
    return toNode(vertex) as Node & API[typeof typename];
  }

  return {
    create,
    all,
    createMany(typename, amount) {
      for(let i = 0; i < amount;i++) {
        create(typename);
      }

      return all(typename);
    }
  };
}

type GQLField = graphql.GraphQLField<unknown, unknown>;

interface Type {
  name: string;
  fields: Field[];
  computed: Computed[];
  references: Reference[];
}

interface Reference {
  name: string;
  typenames: [string, ...string[]];
  holder: Type;
  probability: number;
  arity: Arity;
  key: string;
  inverse?: string;
  affinity?: number;
}

interface Field {
  name: string;
  typename: string;
  holder: Type;
  probability: number;
  gen: {
    method: string;
    args: DispatchArg[];
  }
}

interface Computed {
  name: string;
  typename: string;
  key: string;
  holder: Type;
}

interface Relationship {
  name: string;
  direction: "from" | "to";
}

type Vector = {
  type: "bidirectional";
  from: Reference;
  to: Reference[];
} | {
  type: "unidirectional";
  from: Reference;
  to: Type[];
};

interface Edge {
  name: string;
  vector: Vector;
}

type Arity = {
  has: "one";
  chance: number;
} | {
  has: "many";
  size: {
    mean: number;
    max: number;
    standardDeviation: number;
  };
};

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

interface Analysis {
  types: Record<string, Type>;
  edges: Edge[];
  relationships: Record<string, Relationship>;
}

function analyze(schema: graphql.GraphQLSchema): Analysis {
  let gqlTypes = Object.values<graphql.GraphQLNamedType>(schema.getTypeMap());

  let types = gqlTypes.reduce((current, graphqlType) => {
    if (
      !graphql.isObjectType(graphqlType) || graphqlType.name.startsWith("_")
    ) {
      return current;
    } else {
      let [computedFields, fields] = partition(
        Object.values<GQLField>(graphqlType.getFields()),
        isComputed,
      );

      let scalarFields = fields.flatMap((field) => {
        if (isStructuralField(field)) {
          return [field];
        } else {
          return [];
        }
      });

      let relFields = fields.flatMap((field) => {
        if (isStructuralField(field)) {
          return [];
        } else {
          return [field];
        }
      });

      let type: Type = {
        name: graphqlType.name,
        fields: scalarFields.map((field) => {
          let typename = graphql.getNamedType(field.type).name;
          let probability = chanceOf(field);
          let gen = genOf(field,`${graphqlType.name}.${field.name}`);
          return {
            name: field.name,
            get holder() {
              return type;
            },
            typename,
            probability,
            gen,
          } as Field;
        }),
        computed: computedFields.map((field) => {
          let typename = graphql.getNamedType(field.type).name;
          let key = `${graphqlType.name}.${field.name}`;

          return {
            name: field.name,
            typename,
            get holder() {
              return type;
            },
            key,
          };
        }),
        references: relFields.map((field) => {
          let typenames = typesOf(field);
          let probability = chanceOf(field);
          let inverse = inverseOf(field);
          let affinity = affinityOf(field);
          let withInverse = inverse ? { inverse } : {};
          let ref = affinity == null
            ? withInverse
            : { ...withInverse, affinity };

          return {
            ...ref,
            name: field.name,
            get holder() {
              return type;
            },
            typenames,
            probability,
            arity: arityOf(field),
            key: `${graphqlType.name}.${field.name}`,
          };
        }),
      };
      return {
        ...current,
        [graphqlType.name]: type,
      };
    }
  }, {} as Record<string, Type>);

  let allrefs = Object.values<Type>(types).reduce((refs, type) => {
    for (let ref of type.references) {
      refs[ref.key] = ref;
    }
    return refs;
  }, {} as Record<string, Reference>);

  /*
    Person.account

    "Person.account": {type: 'unidirectional', from: "Person.manager", to: "Account" }

    Account.owner @inverse(of: "Person.account")

    "Person.account": {type: 'bidirectional', from: "Person.account", to: ['Account.owner']

    Bicycle.owner @inverse(of: "Person.account")

    "Person.account": {type: 'bidirectional', from: "Person.account", to: ['Account.owner', 'Bicycle.owner']
  */

  let vectors = Object.values<Reference>(allrefs).reduce((vectors, ref) => {
    if (ref.inverse) {
      let inverse = allrefs[ref.inverse];
      assert(
        inverse,
        `'${ref.key}' is declared as the inverse of '${ref.inverse}', but that type/field does not exist, or is not a reference to another vertex`,
      );
      let referents = vectors[ref.inverse];

      if (!referents) {
        vectors[inverse.key] = {
          type: "bidirectional",
          from: inverse,
          to: [ref],
        };
      } else {
        if (referents.type === "bidirectional") {
          referents.to.push(ref);
        } else {
          vectors[inverse.key] = {
            type: "bidirectional",
            from: inverse,
            to: [ref],
          };
        }
      }
    } else if (!vectors[ref.key]) {
      vectors[ref.key] = {
        type: "unidirectional",
        from: ref,
        to: ref.typenames.map((name) => expect(name, types)),
      };
    }

    return vectors;
  }, {} as Record<string, Vector>);

  let edges = Object.values<Vector>(vectors).map((vector) => {
    if (vector.type === "bidirectional") {
      for (let ref of vector.to) {
        if (!ref.typenames.includes(vector.from.holder.name)) {
          throw new Error(
            `'${ref.key}' is declared as the inverse of '${vector.from.key}', but '${vector.from.key}' does not reference type '${ref.holder.name}'. It references '${
              vector.from.typenames.join("|")
            }'`,
          );
        }
      }
    }
    let targets = vector.to.map((t) => "key" in t ? t.key : t.name);
    return ({
      vector,
      name: `${vector.from.key}->[${targets.join("|")}]`,
    });
  });

  let relationships = edges.reduce((relationships, edge) => {
    relationships[edge.vector.from.key] = {
      name: edge.name,
      direction: "from",
    };

    let refs = edge.vector.to.flatMap((t) => "key" in t ? [t] : []);

    for (let ref of refs) {
      relationships[ref.key] = {
        name: edge.name,
        direction: "to",
      };
    }
    return relationships;
  }, {} as Record<string, Relationship>);

  return {
    types,
    edges,
    relationships,
  };
}

function typesOf(field: GQLField): [string, ...string[]] {
  let named = graphql.getNamedType(field.type);
  if (graphql.isUnionType(named)) {
    let types = named.getTypes();
    return types.map(({ name }) => name) as [string, ...string[]];
  } else {
    return [named.name];
  }
}

function inverseOf(field: GQLField): string | undefined {
  let inverse = directiveOf(field, "inverse");
  if (inverse) {
    assert(
      inverse.arguments,
      "missing @inverse(of) argument",
    );
    let of = inverse.arguments?.find((arg) => {
      return arg.name.value === "of";
    });
    assert(of?.value, "malformed @inverse directive, has no 'of' argument");
    return (of?.value as graphql.StringValueNode).value;
  }
}

function chanceOf(field: GQLField): number {
  let has = directiveOf(field, "has");
  if (has) {
    assert(
      !graphql.isListType(field.type),
      `${field.name} is a List, and so the @has directive cannot be used`,
    );
    assert(
      has.arguments,
      "has must have arguments. This should be guaranteed by syntax.",
    );
    let chance = has.arguments?.find((arg) => {
      return arg.name.value === "chance";
    });
    assert(chance?.value, "malformed @has directive has no 'chance' argument");
    assert(
      chance?.value.kind === "FloatValue",
      "malformed @has directive 'chance' should be a float",
    );
    let value = parseFloat((chance?.value as graphql.FloatValueNode).value);
    assert(
      value >= 0 && value <= 1,
      "@has(chance: VALUE): VALUE must be in between 0 and 1",
    );
    assert(
      graphql.isNullableType(field.type) || value === 1,
      `non-null field ${field.name} can only have a chance of 1`,
    );
    return value;
  } else if (!graphql.isNullableType(field.type)) {
    return 1;
  } else {
    return 0.7;
  }
}

function genOf(field: GQLField, defaultMethod: string) {
  let gen = directiveOf(field, "gen");
  if (gen) {
    assert(gen.arguments, "malformed @gen directive");
    let methodArg = gen.arguments?.find((arg) => arg.name.value === "with");
    assert(methodArg, "malformed @gen directive");

    let method = String((methodArg?.value as graphql.StringValueNode).value);

    let argArg = gen.arguments?.find((arg) => arg.name.value === "args");
    let args = (() => {
      if (argArg) {
        assert(argArg.value.kind === "ListValue");
        return argArg.value.values.map(readValue);
      } else {
        return [];
      }
    })();

    return {
      method,
      args,
    };
  } else {
    return { method: defaultMethod, args: [] };
  }
}

function directiveOf(field: GQLField, name: string) {
  return field.astNode?.directives?.filter((directive) =>
    directive.name.value === name
  )[0];
}

function arityOf(field: GQLField): Arity {
  if (graphql.isListType(field.type)) {
    return {
      has: "many",
      size: sizeOf(field),
    };
  } else {
    return {
      has: "one",
      chance: chanceOf(field),
    };
  }
}

interface Size {
  mean: number;
  min: number;
  max: number;
  standardDeviation: number;
}

function sizeOf(field: GQLField): Size {
  let directive = directiveOf(field, "size");
  if (directive) {
    assert(directive.arguments, "@size must have arguments");
    let meanArg = directive.arguments?.find((arg) => arg.name.value === "mean");
    let mean = parseInt((meanArg?.value as graphql.IntValueNode).value ?? 5);
    let minArg = directive.arguments?.find(({ name }) => name.value === "min");
    let min = parseInt((minArg?.value as graphql.IntValueNode).value ?? 0);
    let maxArg = directive.arguments?.find(({ name }) => name.value === "max");
    let max = parseInt((maxArg?.value as graphql.IntValueNode).value ?? 10);
    let standardDeviationArg = directive.arguments?.find(({ name }) =>
      name.value === "standardDeviation"
    );
    let standardDeviation = parseInt(
      (standardDeviationArg?.value as graphql.IntValueNode).value ?? 1,
    );
    return { mean, min, max, standardDeviation };
  } else {
    return {
      min: 0,
      mean: 5,
      max: 10,
      standardDeviation: 1,
    };
  }
}

function affinityOf(field: GQLField): number | undefined {
  let directive = directiveOf(field, "affinity");
  if (directive) {
    assert(directive.arguments, "@affinity must have arguments");
    let valueArg = directive.arguments?.find((arg) => arg.name.value === "of");
    return parseFloat((valueArg?.value as graphql.IntValueNode).value);
  }
}

function readValue(value: graphql.ASTNode): DispatchArg {
  switch (value.kind) {
    case "StringValue":
    case "BooleanValue":
      return value.value;
    case "FloatValue":
      return parseFloat(value.value);
    case "IntValue":
      return parseInt(value.value);
    default:
      throw new Error(`Don't know how to handle argument of kind ${value.kind}`);
  }
}

function isStructuralField(field: GQLField): boolean {
  let named = graphql.getNamedType(field.type);
  return !graphql.isObjectType(named) && !graphql.isUnionType(named);
}

function expect<T>(key: string, record: Record<string, T>, msg?: string): T {
  let value = record[key];
  assert(
    value,
    msg ?? `expected map to contain value with key: '${key}', but it did not`,
  );
  return value;
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

function partition<T>(
  ts: Iterable<T>,
  predicate: (t: T) => boolean,
): [T[], T[]] {
  let is = [] as T[];
  let isNot = [] as T[];

  for (let t of ts) {
    if (predicate(t)) {
      is.push(t);
    } else {
      isNot.push(t);
    }
  }

  return [is, isNot];
}

function isComputed(field: GQLField): boolean {
  return !!directiveOf(field, "computed");
}
