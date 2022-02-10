import { assertEquals } from "https://deno.land/std@0.125.0/testing/asserts.ts";
import { constant, createGraph, createVertex } from "../mod.ts";
const { test } = Deno;

test("cyclic references", () => {
  let graph = createGraph({
    types: {
      vertex: [{
        name: "User",
        relationships: [{
          type: "User.repositories",
          direction: "from",
          size: constant(3),
        }],
      }, {
        name: "Repository",
        relationships: [{
          type: "User.repositories",
          direction: "to",
          size: constant(1),
        }],
      }],
      edge: [{
        name: "User.repositories",
        from: "User",
        to: "Repository",
      }],
    },
  });

  let user = createVertex(graph, "User");

  let [repository] = graph.from[user.id].map((edge) => graph.vertices[edge.to]);

  let [back] = graph.to[repository.id].map((edge) => graph.vertices[edge.from]);

  assertEquals(back, user);
});
