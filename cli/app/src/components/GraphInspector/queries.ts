import { fetchGraphQL } from "../../graphql/fetchGraphql";
import { gql } from 'urql';

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

export const allQuery = gql`
query All($typename: String!, $first: Int!, $after: String!) {
  all(typename:$typename, first: $first, after: $after) {
    edges {
      node {
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
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`
