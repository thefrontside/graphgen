import { beforeEach, describe, expect, it } from "./suite.ts";

import { constant, createGraph, createVertex, Graph, normal } from "../mod.ts";

describe("preseeding data", () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createGraph({
      types: {
        edge: [{
          name: "Author.posts",
          from: "Author",
          to: "BlogPost",
        }],
        vertex: [{
          name: "Author",
          data: () => ({
            description: "Author Data",
            sample: (seed) => ({
              firstName: `author ${seed()}`,
              lastName: `${seed()}`,
              get displayName() {
                return `${this.firstName} ${this.lastName}`;
              },
            }),
          }),
          relationships: [{
            type: "Author.posts",
            direction: "from",
            size: constant(3),
          }],
        }, {
          name: "BlogPost",
          relationships: [],
        }],
      },
    });
  });

  it("can preset primary vertext data", () => {
    let vertex = createVertex(graph, "Author", {
      firstName: "Roberta",
    });
    expect(vertex.data.firstName).toEqual("Roberta");
  });

  it("can use computed properties to merge preset data with sample data", () => {
    let vertex = createVertex(graph, "Author", {
      firstName: "Roberta",
      lastName: "Dobalina",
    });
    expect(vertex.data.displayName).toEqual("Roberta Dobalina");
  });

  describe("on relationships", () => {
    it("can preset a single value in a relationship", () => {
      let vertex = createVertex(graph, "Author", {
        "Author.posts": {
          title: "A Tale of Two Vertices",
        },
      });
      let posts = graph.from[vertex.id]
        .map((edge) => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{ title: "A Tale of Two Vertices" }]);
    });

    it("can preset a subset of the relationships", () => {
      let vertex = createVertex(graph, "Author", {
        "Author.posts": [{
          title: "A Tale of Two Vertices",
        }, {
          title: "The Razor's Edge",
        }],
      });

      let posts = graph.from[vertex.id]
        .map((edge) => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{
        title: "A Tale of Two Vertices",
      }, {
        title: "The Razor's Edge",
      }, {}]);
    });

    it("can preset a superset of the relationships", () => {
      let vertex = createVertex(graph, "Author", {
        "Author.posts": [{
          title: "A Tale of Two Vertices",
        }, {
          title: "The Razor's Edge",
        }, {
          title: "Graphical Thinking",
        }, {
          title: "Simplicity in All Things",
        }],
      });

      let posts = graph.from[vertex.id]
        .map((edge) => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{
        title: "A Tale of Two Vertices",
      }, {
        title: "The Razor's Edge",
      }, {
        title: "Graphical Thinking",
      }, {
        title: "Simplicity in All Things",
      }]);
    });
  });
});

it("will override a decision to use an existing vertex based on affinity if a preset is present", () => {
  let graph = createGraph({
    types: {
      vertex: [{
        name: "Component",
        data() {
          return {
            description: "Generate Component Data",
            sample(seed) {
              return `Component ${seed()}`;
            },
          };
        },
        relationships: [{
          type: "subComponents",
          direction: "from",
          size: normal({ mean: 2, standardDeviation: 1, min: 0 }),
          affinity: .5,
        }, {
          type: "consumes",
          direction: "from",
          size: normal({ mean: 1, standardDeviation: 1, min: 1 }),
          affinity: 1,
        }],
      }, {
        name: "API",
        data() {
          return {
            description: "Genate API Data",
            sample(seed) {
              return {
                name: `API ${seed()}`,
              };
            },
          };
        },
        relationships: [{
          type: "consumes",
          direction: "to",
          size: normal({ mean: 3, standardDeviation: 1, min: 0 }),
          affinity: .1,
        }],
      }],
      edge: [{
        name: "subComponents",
        from: "Component",
        to: "Component",
      }, {
        name: "consumes",
        from: "Component",
        to: "API",
      }],
    },
  });

  let vertex = createVertex(graph, "Component", {
    consumes: [{
      name: "github-enterprise",
    }],
  });

  let edges = (graph.from[vertex.id] ?? []).filter((edge) =>
    edge.type === "consumes"
  );
  let consumedApis = edges.map((edge) => graph.vertices[edge.to].data.name);
  expect(consumedApis).toContain("github-enterprise");
});
