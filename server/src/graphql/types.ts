// deno-lint-ignore-file no-explicit-any
/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
  JSONObject: any;
}

export interface CreateInput {
  preset: InputMaybe<Scalars['JSON']>;
  typename: Scalars['String'];
}

export interface Mutation {
  __typename?: 'Mutation';
  create: Maybe<Scalars['JSON']>;
  createMany: Maybe<Scalars['JSON']>;
}


export interface MutationCreateArgs {
  typename: Scalars['String'];
  preset: InputMaybe<Scalars['JSON']>;
}


export interface MutationCreateManyArgs {
  inputs: Array<CreateInput>;
}

export interface Query {
  __typename?: 'Query';
  meta: Maybe<Array<Maybe<Type>>>;
}

export interface Reference {
  __typename?: 'Reference';
  description: Scalars['String'];
  count: Scalars['Int'];
  typename: Scalars['String'];
  fieldname: Scalars['String'];
  path: Scalars['String'];
  affinity?: Scalars['Float'];
}

export interface Type {
  __typename?: 'Type';
  count: Scalars['Int'];
  references?: Array<Reference>;
  typename: Scalars['String'];
}

export interface Node {
  id: string;
}

export type Field = string | number | boolean | VertexNode | Field[];

export type FieldEntry =
  {
    __typename: 'VertexFieldEntry';
    key: string;
    id: string
    typenames: string[];
    materialized?: VertexNode;
  } | {
    __typename: 'VertexListFieldEntry';
    key: string;
    ids: string[];
    typenames: string[];
    materialized?: VertexNode[];
  } | {
    __typename: 'JSONFieldEntry';
    key: string;
    json: unknown;
    typename: string;
    materialized?: never;
  }

export interface VertexNode extends Node {
  typename: string;
  fields: FieldEntry[];
}
