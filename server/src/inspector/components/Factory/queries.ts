import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";

export async function createGraph() {
  await fetchGraphQL(`mutation CreateMany {
    createMany(inputs: [
      {typename:"Component"},
      {typename:"Group"},
      {typename:"API"},
      {typename:"Resource"},
      {typename:"User"},
      {typename:"Domain"}
    ]) {
      id
    }
  }`);
}