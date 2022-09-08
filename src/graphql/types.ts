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
