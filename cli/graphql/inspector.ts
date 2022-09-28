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

export interface FieldEntry {
  key: Scalars['String'];
}

export interface JsonFieldEntry extends FieldEntry {
  __typename?: 'JSONFieldEntry';
  json: Maybe<Scalars['JSON']>;
  key: Scalars['String'];
  typename: Scalars['String'];
}

export interface MetaConnection {
  __typename?: 'MetaConnection';
  count: Scalars['Int'];
  edges: Array<Maybe<TypeEdge>>;
  pageInfo: PageInfo;
  total: Scalars['Int'];
}

export interface Mutation {
  __typename?: 'Mutation';
  create: Maybe<Vertex>;
  createMany: Array<Vertex>;
}


export interface MutationCreateArgs {
  preset: InputMaybe<Scalars['JSON']>;
  typename: Scalars['String'];
}


export interface MutationCreateManyArgs {
  inputs: Array<CreateInput>;
}

export interface Node {
  id: Scalars['ID'];
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
  all: Maybe<Array<Vertex>>;
  graph: Maybe<Scalars['JSON']>;
  meta: MetaConnection;
  node: Maybe<Node>;
}


export interface QueryAllArgs {
  typename: Scalars['String'];
}


export interface QueryMetaArgs {
  after: InputMaybe<Scalars['String']>;
  before: InputMaybe<Scalars['String']>;
  first: InputMaybe<Scalars['Int']>;
  last: InputMaybe<Scalars['Int']>;
}


export interface QueryNodeArgs {
  id: Scalars['ID'];
}

export interface Type extends Node {
  __typename?: 'Type';
  count: Scalars['Int'];
  id: Scalars['ID'];
  typename: Scalars['String'];
}

export interface TypeEdge {
  __typename?: 'TypeEdge';
  cursor: Scalars['String'];
  node: Type;
}

export interface Vertex extends Node {
  __typename?: 'Vertex';
  fields: Array<FieldEntry>;
  id: Scalars['ID'];
  typename: Scalars['String'];
}

export interface VertexFieldEntry extends FieldEntry {
  __typename?: 'VertexFieldEntry';
  id: Scalars['ID'];
  key: Scalars['String'];
  typenames: Array<Scalars['String']>;
}

export interface VertexListFieldEntry extends FieldEntry {
  __typename?: 'VertexListFieldEntry';
  ids: Array<Scalars['ID']>;
  key: Scalars['String'];
  typenames: Array<Scalars['String']>;
}
