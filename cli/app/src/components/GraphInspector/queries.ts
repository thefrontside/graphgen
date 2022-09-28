import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";
import { gql } from 'urql';

export const metaQuery = gql`
  query Meta($first: Int!, $after: String) {
    meta(first: $first, after: $after) {
      edges {
        node {
          id
          typename
          count
        } 
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;


export async function node(id: string) {
  return await fetchGraphQL(
    `
    query Node($id: ID!) {
      node(id:$id) {
        id
        ...on Vertex {
          fields {
            __typename
            key
            ... on JSONFieldEntry {
              json
              typename
            }
            ... on VertexFieldEntry {
              id
              typenames
            }
            ... on VertexListFieldEntry {
              ids
              typenames
            }
          }
        }
      }
    }
  `,
    {
      "id": id,
    },
  );
}

export async function all(typename: string) {
  return await fetchGraphQL(
    `
    query All($typename: String!) {
      all(typename:$typename) {
        id
        fields {
          key
          __typename
          ... on JSONFieldEntry {
            json
            typename
          }
          ... on VertexFieldEntry {
            id
            typenames
          }
          ... on VertexListFieldEntry {
            ids
            typenames
          }
        }
      }
    }
  `,
    {
      "typename": typename,
    },
  );
}
