import type { Seed } from "./distribution.ts";
import { seedrandom } from "./seedrandom.ts";
import { assert, graphql, evaluate, shift } from "./deps.ts";
import { createGraph, createVertex, VertexType } from "./graph.ts";

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
  optional: boolean;
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
  let fieldgen = createFieldGenerate(seed, options.fieldgen ? ([] as FieldGen[]).concat(options.fieldgen) : []);

  let graph = createGraph({
    seed,
    types: {
      vertex: Object.entries(schema.getTypeMap()).reduce(
        (types, [typename, graphqlType]) => {
          if (!graphql.isObjectType(graphqlType)) {
            return types;
          } else {
            //let { relationships } = analyze(graphqlType);
            let fields = graphqlType.getFields();

            return types.concat({
              name: typename,
              relationships: [],
              data: () => ({
                description: "this description is not used",
                sample() {
                  let values = {} as Record<string, unknown>;
                  for (let [fieldname, field] of Object.entries(fields)) {
                    if (!isRelationship(field)) {
                      values[fieldname] = fieldgen(typename, field);
                    }
                  }
                  return values;
                },
              }),
            });
          }
        },
        [] as VertexType[],
      ),
    },
  });

  return {
    create(typename, preset?: Record<string, unknown>) {
      let vertex = createVertex(graph, typename, preset);
      return vertex.data;
    },
  };
}


function createFieldGenerate(seed: Seed, middlewares: FieldGen[]) {


  return function (
    typename: string,
    field: graphql.GraphQLField<unknown, unknown>,
  ) {

    type Invoke = (info: Omit<FieldGenInfo, 'next'>) => unknown;

    let invoke = evaluate<Invoke>(function*() {
      for (let middleware of middlewares) {
        yield* shift<void>(function*(resolve) {
          return ((info) => middleware({...info, next: () => resolve()(info) })) as Invoke;
        });
      }
      return () => 'blork';
    })

    let fieldname = field.name;
    let method = methodOf(field, `${typename}.${fieldname}`);

    let info = { seed, method, fieldname };

    if (graphql.isListType(field.type)) {
      throw new Error(`cannot generate list types yet`);
    } else if (
      graphql.isNonNullType(field.type) &&
      graphql.isNamedType(field.type.ofType)
    ) {
      assert(
        chanceOf(field, 1) === 1,
        "cannot set the chance of a non-null field to less than 1",
      );

      field.type
      let fieldtype = field.type.ofType.name;
      return invoke({
        ...info,
        typename,
        fieldtype,
        optional: false,
      });
    } else {
      if (seed() < chanceOf(field, 0.5)) {
        return null;
      }
      let fieldtype = field.type.name;
      return invoke({
        ...info,
        typename,
        fieldtype,
        optional: true,
      });
    }
  };
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
    return value;
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


function isRelationship(_field: graphql.GraphQLField<unknown, unknown>): boolean {
  return false;
}
