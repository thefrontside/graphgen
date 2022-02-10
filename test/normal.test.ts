import { assertEquals } from "./asserts.ts";
import { createGraph, createVertex, normal, seedrandom } from "../mod.ts";

const { test } = Deno;

test("the normal distribution generates a reliable random sequence", () => {
  let seed = seedrandom("normal.test.ts");
  let graph = createGraph({
    seed,
    types: {
      vertex: [{
        name: "User",
        relationships: [{
          type: "User.repositories",
          direction: "from",
          size: normal({ mean: 3, standardDeviation: 2 }),
        }],
      }, {
        name: "Repository",
        relationships: [],
      }],
      edge: [{
        name: "User.repositories",
        from: "User",
        to: "Repository",
      }],
    },
  });

  let user = createVertex(graph, "User");

  assertEquals(graph.from[user.id].length, 2);
});
