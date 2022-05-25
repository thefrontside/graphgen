import { beforeEach, describe, expect, it } from "./suite.ts";
import { seedrandom } from "../src/seedrandom.ts";
import {
  constant,
  createGraph,
  createVertex,
  Graph,
  GraphOptions,
  Vertex,
} from "../mod.ts";

describe("polymorphic edges", () => {
  let options: GraphOptions;
  let graph: Graph;
  let source: Vertex;

  beforeEach(() => {
    options = {
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
  });

  describe("a uniform distribution of target types", () => {
    beforeEach(() => {
      graph = createGraph(options);
      source = createVertex(graph, "Search");
    });

    it("creates a set of evenly distributed targets", () => {
      let [one, two, three, four] = graph.from[source.id].map(({ to }) =>
        graph.vertices[to]
      );
      expect(one.type).toEqual("GithubProfile");
      expect(two.type).toEqual("LDAPProfile");
      expect(three.type).toEqual("LDAPProfile");
      expect(four.type).toEqual("GithubProfile");
    });
  });

  describe("a weighted distribution of target types", () => {
    beforeEach(() => {
      graph = createGraph({
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
      source = createVertex(graph, "Search");
    });

    it("creates a set of targets according to weight", () => {
      let [one, two, three, four] = graph.from[source.id].map(({ to }) =>
        graph.vertices[to]
      );
      expect(one.type).toEqual("LDAPProfile");
      expect(two.type).toEqual("LDAPProfile");
      expect(three.type).toEqual("LDAPProfile");
      expect(four.type).toEqual("GithubProfile");
    });
  });
});
