import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";

export async function relationship({ parentId, typename, fieldname }: { parentId: string; typename: string; fieldname: string }) {
  return await fetchGraphQL(
    `
    query Relationship($parentId: String!, $typename: String!, $fieldname: String!) {
      relationship(parentId:$parentId, typename:$typename, fieldname: $fieldname)
    }
  `,
    {
      "parentId": parentId,
      "typename": typename,
      "fieldname": fieldname
    },
  );
}


export async function node({ typenames, id }: { typenames: string[]; id: string }) {
  return await fetchGraphQL(
    `
    query Node($typenames: [String!]!, $id: String) {
      node(typenames: $typenames, id: $id)
    }
  `,
    {
      "typenames": typenames,
      "id": id,
    },
  );
}

export async function root(typename: string) {
  return await fetchGraphQL(
    `
    query Root($typename: String!) {
      root(typename: $typename)
    }
  `,
    {
      "typename": typename,
    },
  );
}