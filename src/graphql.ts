import type { Seed } from "./distribution.ts";
import { seedrandom } from "./seedrandom.ts";
import { assert, evaluate, graphql, shift } from "./deps.ts";
import { createGraph, createVertex } from "./graph.ts";

export interface GraphGen {
  create(
    typename: string,
    preset?: Record<string, unknown>,
    //deno-lint-ignore no-explicit-any
  ): Record<string, any>;
}

export interface FieldGen {
  (info: FieldGenInfo): unknown;
}

export interface FieldGenInfo {
  method: string;
  typename: string;
  fieldname: string;
  fieldtype: string;
  seed: Seed;
  next(): unknown;
}

export interface GraphQLOptions {
  source: string;
  fieldgen?: FieldGen | FieldGen[];
  seed?: Seed;
}

export function createGraphGen(options: GraphQLOptions): GraphGen {
  let { seed = seedrandom("graphgen") } = options;
  let prelude = graphql.buildSchema(`
directive @has(chance: Float!) on FIELD_DEFINITION
directive @gen(with: String!) on FIELD_DEFINITION
directive @inverse(of: String!) on FIELD_DEFINITION
`);

  let schema = graphql.extendSchema(prelude, graphql.parse(options.source));

  let { types, relationships } = analyze(schema);
  console.dir({ relationships });

  let fieldgen = createFieldGenerate(
    seed,
    options.fieldgen ? ([] as FieldGen[]).concat(options.fieldgen) : [],
  );


  let graph = createGraph({
    seed,
    types: {
      vertex: types.map(({ name, fields }) => ({
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
        relationships: [],
      })),
      edge: relationships.map(rel => ({
        name: rel.name,
        from: rel.from.name,
        to: rel.to.name,
      }))
    },
  });

  console.dir({ graph }, { depth: 10 });

  return {
    create(typename, preset?: Record<string, unknown>) {
      let vertex = createVertex(graph, typename, preset);
      return vertex.data;
    },
  };
}

type GQLField = graphql.GraphQLField<unknown, unknown>;

interface Type {
  name: string;
  fields: Field[];
  references: Reference[]
}

interface Reference {
  name: string;
  typename: string;
  holder: Type;
  arity: Arity;
  key: string;
  inverse?: string;
}

interface Field {
  name: string;
  typename: string;
  holder: Type;
  probability: number;
  valueGeneratorMethodName: string;
}

interface Relationship {
  name: string;
  from: Type;
  to: Type;
  overspecified?: boolean;
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

function createFieldGenerate(seed: Seed, middlewares: FieldGen[]) {
  type Invoke = (info: Omit<FieldGenInfo, "next">) => unknown;

  let invoke = evaluate<Invoke>(function* () {
    for (let middleware of middlewares) {
      yield* shift<void>(function* (k) {
        return ((info) =>
          middleware({ ...info, next: () => k()(info) })) as Invoke;
      });
    }
    return () => "blork";
  });

  return function (field: Field) {
    if (field.probability < 1 && (seed() < field.probability)) {
      return null;
    } else {
      return invoke({
        seed,
        typename: field.holder.name,
        method: field.valueGeneratorMethodName,
        fieldtype: field.typename,
        fieldname: field.name,
      });
    }
  };
}

interface Analysis {
  types: Type[];
  relationships: Relationship[];
}

function analyze(schema: graphql.GraphQLSchema): Analysis {
  let gqlTypes = Object.values<graphql.GraphQLNamedType>(schema.getTypeMap());

  let types = gqlTypes.reduce((current, graphqlType) => {
    if (
      !graphql.isObjectType(graphqlType) || graphqlType.name.startsWith("_")
    ) {
      return current;
    } else {
      let fields = Object.values<GQLField>(graphqlType.getFields());

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
          let valueGeneratorMethodName = methodOf(
            field,
            `${graphqlType.name}.${field.name}`,
          );
          return {
            name: field.name,
            get holder() {
              return type;
            },
            typename,
            probability,
            valueGeneratorMethodName,
          } as Field;
        }),
        references: relFields.map(field => {
          let typename = graphql.getNamedType(field.type).name;
          return {
            name: field.name,
            get holder() { return type; },
            typename,
            arity: arityOf(field),
            inverse: inverseOf(field),
            key: `${graphqlType.name}.${field.name}`,
          };
        })
      };
      return current.concat([type]);
    }
  }, [] as Type[]);

  let relationships = new Map<string, Relationship>();

  let allrefs = types.reduce((refs, type) => {
    for (let ref of type.references) {
      refs.set(ref.key, ref);
    }
    return refs;
  }, new Map<string, Reference>())

  for (let ref of allrefs.values()) {
    if (ref.inverse) {
      // other side is present, and over-specified
      let key = `${ref.inverse}->${ref.key}`;
      let reverseKey = `${ref.key}->${ref.inverse}`;
      if (relationships.has(reverseKey)) {
        let rel = relationships.get(reverseKey);
        assert(rel);
        rel.overspecified = true;
      } else if (relationships.has(ref.inverse)) {
        // other side is present, but not complete
        let current = relationships.get(ref.inverse);
        relationships.delete(ref.inverse);
        assert(current);

        relationships.set(key, {
          ...current,
          name: key,
        });
      } else {
        // neither side is present
        let from = allrefs.get(ref.inverse);

        assert(from, `${ref.key} specified an inverse of ${ref.inverse}, but no such field exists`);
        relationships.set(key, {
          name: key,
          from: from.holder,
          to: ref.holder,
        })
      }
    } else {
      // no inverse, so either we are the source of an inverse, or nothing yet
      if (![...relationships.values()].find(relation => {
        return relation.name.startsWith(ref.key)
      })) {
        let to = types.find(t => t.name === ref.typename);
        assert(to, `${ref.key} references non existent type: ${ref.typename}`);

        relationships.set(ref.key, {
          name: ref.key,
          from: ref.holder,
          to,
        });
      }
    }
  }
  return {
    types,
    relationships: [...relationships.values()],
  };
}

function inverseOf(field: GQLField): string | undefined {
  let inverse =
    field.astNode?.directives?.filter((d) => d.name.value === "inverse")[0];
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
  let has = field.astNode?.directives?.filter((d) => d.name.value === "has")[0];
  if (has) {
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

function methodOf(field: GQLField, defaultMethod: string) {
  let gen =
    field.astNode?.directives?.filter(({ name }) => name.value === "gen")[0];
  if (gen) {
    assert(gen.arguments, "malformed @gen directive");
    let method = gen.arguments?.find((arg) => arg.name.value === "with");
    assert(method, "malformed @gen directive");
    return String((method?.value as graphql.StringValueNode).value);
  } else {
    return defaultMethod;
  }
}

function arityOf(field: GQLField): Arity {
  if (graphql.isListType(field.type)) {
    return {
      has: "many",
      size: {
        mean: 5,
        max: 10,
        standardDeviation: 10,
      },
    };
  } else {
    return {
      has: "one",
      chance: chanceOf(field),
    };
  }
}

function isStructuralField(field: GQLField): boolean {
  let named = graphql.getNamedType(field.type);
  return !graphql.isObjectType(named);
}
