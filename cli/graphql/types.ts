export interface Node {
  id: string;
}

export type Field = string | number | boolean | VertexNode | Field[];

export type FieldEntry = {
  __typename: "VertexFieldEntry";
  key: string;
  id: string;
  typenames: string[];
  materialized?: VertexNode;
} | {
  __typename: "VertexListFieldEntry";
  key: string;
  ids: string[];
  typenames: string[];
  materialized?: VertexNode[];
} | {
  __typename: "JSONFieldEntry";
  key: string;
  json: unknown;
  typename: string;
  materialized?: never;
};

export interface VertexNode extends Node {
  typename: string;
  fields: FieldEntry[];
}

export interface Type {
  __typename?: "Type";
  count: number;
  typename: string;
}

export interface CreateInput {
  preset: JSON;
  typename: string;
}

export interface Mutation {
  __typename?: "Mutation";
  create: JSON;
  createMany: JSON;
}
