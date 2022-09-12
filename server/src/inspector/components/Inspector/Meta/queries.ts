import type { Type } from "../../../../graphql/types.ts";
import { fetchGraphQL } from "../../../graphql/fetchGraphql.ts";

export async function loadMeta() {
  const response: { data: { meta: Type[] } } = await fetchGraphQL(`
  query Meta {
    meta {
      typename
      count
      references {
        typename
        fieldname
        path
        count
        description
        affinity
      }
    }
  }
  `);

  return response;
}