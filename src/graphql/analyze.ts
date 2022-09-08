import type {
  Arity,
  DispatchArg,
  EdgeInfo,
  Field,
  Reference,
  RelationshipInfo,
  Type,
  Vector,
} from "./types.ts";

import { assert, graphql } from "../deps.ts";
import { expect } from "./expect.ts";

export interface Analysis {
  types: Record<string, Type>;
  edges: EdgeInfo[];
  relationships: Record<string, RelationshipInfo>;
}

export function analyze(schema: graphql.GraphQLSchema): Analysis {
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
          let gen = genOf(field, `${graphqlType.name}.${field.name}`);
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
  }, {} as Record<string, RelationshipInfo>);

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

type GQLField = graphql.GraphQLField<unknown, unknown>;

function directiveOf(field: GQLField, name: string) {
  return field.astNode?.directives?.filter((directive) =>
    directive.name.value === name
  )[0];
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
interface Size {
  mean: number;
  min: number;
  max: number;
  standardDeviation: number;
}

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

function arityOf(field: GQLField): Arity {
  if (isListType(field.type)) {
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

function readValue(value: graphql.ASTNode): DispatchArg {
  switch (value.kind) {
    case "StringValue":
    case "BooleanValue":
      return value.value;
    case "FloatValue":
      return parseFloat(value.value);
    case "IntValue":
      return parseInt(value.value);
    case "NullValue":
      return null;
    case "ListValue":
      return value.values.map(readValue);
    default:
      throw new Error(
        `Don't know how to handle argument of kind ${value.kind}`,
      );
  }
}

function isStructuralField(field: GQLField): boolean {
  let named = graphql.getNamedType(field.type);
  return !graphql.isObjectType(named) && !graphql.isUnionType(named);
}

function isListType(type: GQLField["type"]): boolean {
  if (graphql.isNonNullType(type)) {
    return isListType(type.ofType);
  }

  return graphql.isListType(type);
}
