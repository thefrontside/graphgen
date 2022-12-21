import type { Graph } from "../graph.ts";
import type { Seed } from "../distribution.ts";

export interface Type {
  name: string;
  fields: Field[];
  computed: Computed[];
  references: Reference[];
}

export interface Reference {
  name: string;
  typenames: [string, ...string[]];
  holder: Type;
  probability: number;
  arity: Arity;
  key: string;
  inverse?: string;
  affinity?: number;
}

export interface Field {
  name: string;
  typename: string;
  holder: Type;
  probability: number;
  gen: {
    method: string;
    args: DispatchArg[];
  };
}

export interface Computed {
  name: string;
  typename: string;
  key: string;
  holder: Type;
}

export interface RelationshipInfo {
  name: string;
  direction: "from" | "to";
}

export type Vector = {
  type: "bidirectional";
  from: Reference;
  to: Reference[];
} | {
  type: "unidirectional";
  from: Reference;
  to: Type[];
};

export interface EdgeInfo {
  name: string;
  vector: Vector;
}

export type Arity = {
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

export type DispatchArg = string | number | boolean | null | DispatchArg[];

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
export interface Analysis {
  types: Record<string, Type>;
  edges: EdgeInfo[];
  relationships: Record<string, RelationshipInfo>;
}
