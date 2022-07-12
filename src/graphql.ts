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
`);

  let schema = graphql.extendSchema(prelude, graphql.parse(options.source));

  let types = analyze(schema);

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
    },
  });

  return {
    create(typename, preset?: Record<string, unknown>) {
      let vertex = createVertex(graph, typename, preset);
      return vertex.data;
    },
  };
}

interface Type {
  name: string;
  fields: Field[];
  //  relationships: Relationship[];
}

interface Field {
  name: string;
  typename: string;
  holder: Type;
  probability: number;
  valueGeneratorMethodName: string;
}

function createFieldGenerate(seed: Seed, middlewares: FieldGen[]) {
  type Invoke = (info: Omit<FieldGenInfo, "next">) => unknown;

  let invoke = evaluate<Invoke>(function* () {
    for (let middleware of middlewares) {
      yield* shift<void>(function* (resolve) {
        return ((info) =>
          middleware({ ...info, next: () => resolve()(info) })) as Invoke;
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

function analyze(schema: graphql.GraphQLSchema): Type[] {
  return Object.values(schema.getTypeMap()).reduce((types, graphqlType) => {
    if (
      !graphql.isObjectType(graphqlType) || graphqlType.name.startsWith("_")
    ) {
      return types;
    } else {
      let graphQLFields = Object.entries(graphqlType.getFields()).filter((
        [, field],
      ) => isStructuralField(field));
      let type: Type = {
        name: graphqlType.name,
        fields: graphQLFields.map(([name, field]) => {
          let typename = graphql.getNamedType(field.type).name;
          let probability = chanceOf(field, 0.5);
          let valueGeneratorMethodName = methodOf(
            field,
            `${graphqlType.name}.${field.name}`,
          );
          return {
            name,
            get holder() {
              return type;
            },
            typename,
            probability,
            valueGeneratorMethodName,
          } as Field;
        }),
      };
      return types.concat(type);
    }
  }, [] as Type[]);
}

function chanceOf(
  field: graphql.GraphQLField<unknown, unknown>,
  defaultChance: number,
): number {
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
    return defaultChance;
  }
}

function methodOf(
  field: graphql.GraphQLField<unknown, unknown>,
  defaultMethod: string,
) {
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

function isStructuralField(
  field: graphql.GraphQLField<unknown, unknown>,
): boolean {
  return !graphql.isObjectType(field.type);
}
