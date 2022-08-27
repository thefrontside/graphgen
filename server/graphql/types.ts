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

export interface Node {
  id: Scalars['ID'];
  typename: Scalars['String'];
}

export interface NodeConnection {
  __typename?: 'NodeConnection';
  count: Maybe<Scalars['Int']>;
  edges: Maybe<Array<NodeEdge>>;
  pageInfo: Maybe<PageInfo>;
}

export interface NodeEdge {
  __typename?: 'NodeEdge';
  cursor: Scalars['String'];
  node: Maybe<Node>;
}

export interface PageInfo {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor: Maybe<Scalars['String']>;
}

export interface Query {
  __typename?: 'Query';
  meta: Maybe<Array<Maybe<Type>>>;
}

export interface Type {
  __typename?: 'Type';
  count: Maybe<Scalars['Int']>;
  name: Maybe<Scalars['String']>;
  nodes?: Maybe<NodeConnection>;
  vertices: Scalars['JSONObject'];
}

export interface Vertex {
  __typename?: 'Vertex';
  computed: Maybe<Scalars['JSON']>;
  fields: Maybe<Scalars['JSON']>;
  id: Scalars['ID'];
  references: Maybe<Array<Maybe<VertexEntry>>>;
  typename: Scalars['String'];
}

export interface VertexConnection {
  __typename?: 'VertexConnection';
  count: Maybe<Scalars['Int']>;
  edges: Maybe<Array<VertexEdge>>;
  pageInfo: Maybe<PageInfo>;
}

export interface VertexEdge {
  __typename?: 'VertexEdge';
  cursor: Maybe<Scalars['String']>;
  node: Maybe<Vertex>;
}

export interface VertexEntry {
  __typename?: 'VertexEntry';
  key: Scalars['String'];
  value: Vertex;
}
