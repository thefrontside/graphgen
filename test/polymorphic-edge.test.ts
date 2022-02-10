import { assertEquals } from "./asserts.ts";
import {
  constant,
  createGraph,
  createVertex,
  GraphOptions,
  seedrandom,
} from "../mod.ts";
const { test } = Deno;

test("polymorphic edges", async (t) => {
  let options: GraphOptions = {
    seed: seedrandom("polymorphic-edges-test"),
    types: {
      vertex: [{
        name: "Search",
        relationships: [{
          type: "Search.results",
          size: constant(4),
          direction: "from",
        }],
      }, {
        name: "GithubProfile",
        relationships: [],
      }, {
        name: "LDAPProfile",
        relationships: [],
      }],
      edge: [{
        name: "Search.results",
        from: "Search",
        to: ["GithubProfile", "LDAPProfile"],
      }],
    },
  };

  await t.step(
    "a uniform distribution of target types creates a set of evenly distributed targets",
    () => {
      let graph = createGraph(options);
      let source = createVertex(graph, "Search");

      let [one, two, three, four] = graph.from[source.id].map(({ to }) =>
        graph.vertices[to]
      );
      assertEquals(one.type, "GithubProfile");
      assertEquals(two.type, "LDAPProfile");
      assertEquals(three.type, "LDAPProfile");
      assertEquals(four.type, "GithubProfile");
    },
  );

  await t.step(
    "a weighted distribution of target types create a set of targets according to weight",
    () => {
      let graph = createGraph({
        ...options,
        types: {
          ...options.types,
          edge: [{
            name: "Search.results",
            from: "Search",
            to: {
              "GithubProfile": 1,
              "LDAPProfile": 2,
            },
          }],
        },
      });
      let source = createVertex(graph, "Search");

      let [one, two, three, four] = graph.from[source.id].map(({ to }) =>
        graph.vertices[to]
      );
      assertEquals(one.type, "LDAPProfile");
      assertEquals(two.type, "GithubProfile");
      assertEquals(three.type, "LDAPProfile");
      assertEquals(four.type, "LDAPProfile");
    },
  );
});
