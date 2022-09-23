export const graphqlServer = "/graphql";

export async function fetchGraphQL(
  text: string,
  variables?: Record<string, unknown>,
) {
  const response = await fetch(graphqlServer, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: text,
      variables,
    }),
  });

  // Get the response as JSON
  return await response.json();
}
