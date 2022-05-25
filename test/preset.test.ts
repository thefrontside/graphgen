import { beforeEach, describe, expect, it } from "./suite.ts";

import { constant, createGraph, createVertex, Graph } from "../mod.ts";

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
