import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.125.0/testing/asserts.ts";
import { constant, createGraph, createVertex } from "../mod.ts";

const { test } = Deno;

test("graph generation", async (t) => {
  let graph = createGraph();

  await t.step("starts with no edges", () => {
    assertEquals(graph.vertices, {});
  });

  await t.step("is an error to try and create a node because ", () => {
    assertThrows(() => createVertex(graph, "User"));
  });
});

test("with invalid graph types", async (t) => {
  await t.step(
    "fails when an edge type references an invalid vertex type",
    () => {
      assertThrows(() =>
        createGraph({
          types: {
            vertex: [{
              name: "User",
              relationships: [],
            }],
            edge: [{
              name: "to-nowhere",
              from: "User",
              to: "Nowhere",
            }],
          },
        })
      );

      assertThrows(() =>
        createGraph({
          types: {
            vertex: [{
              name: "User",
              relationships: [],
            }],
            edge: [{
              name: "from-nowhere",
              from: "Nowhere",
              to: "User",
            }],
          },
        })
      );
    },
  );

  await t.step(
    "fails when an edge distribution references a non existent edge type",
    () => {
      assertThrows(() =>
        createGraph({
          types: {
            vertex: [{
              name: "User",
              relationships: [{
                type: "User.repositories",
                direction: "from",
                size: constant(1),
              }],
            }],
          },
        })
      );
    },
  );
});

test("with node types, but no explicit relationships", async (t) => {
  let graph = createGraph({
    types: {
      vertex: [{
        name: "User",
        relationships: [],
      }, {
        name: "Article",
        relationships: [],
      }],
    },
  });
  let user = createVertex(graph, "User");

  await t.step("creates the new vertex", () => {
    assert(user);
    assertEquals(user.type, "User");
  });

  await t.step("contains the new vertex in the graph", () => {
    assertEquals(graph.vertices[user.id], user);
  });
});

test("generating node from a space with relationships", async (t) => {
  let graph = createGraph({
    types: {
      edge: [{
        name: "User.posts",
        from: "User",
        to: "BlogPost",
      }],
      vertex: [{
        name: "User",
        relationships: [{
          type: "User.posts",
          direction: "from",
          size: constant(3),
        }],
      }, {
        name: "BlogPost",
        relationships: [],
      }],
    },
  });
  let user = createVertex(graph, "User");

  await t.step("creates three blog posts", () => {
    assertEquals(Object.entries(graph.roots["BlogPost"]).length, 3);
  });

  await t.step(
    "draws three edges between the user and those blog posts",
    () => {
      assertEquals(graph.from[user.id].length, 3);
      let [one, two, three] = graph.from[user.id];
      assertEquals(one.from, user.id);
      assertEquals(two.from, user.id);
      assertEquals(three.from, user.id);
    },
  );

  await t.step(
    "it creates the edges connecting the user and the blog posts",
    () => {
      let [first] = Object.values(graph.roots["BlogPost"]);
      assertEquals(graph.to[first.id].length, 1);
    },
  );
});
