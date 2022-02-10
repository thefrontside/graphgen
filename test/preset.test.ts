import { assertEquals } from "./asserts.ts";
import { constant, createGraph, createVertex } from "../mod.ts";

const { test } = Deno;

test("preseeding data", async (t) => {
  let graph = createGraph({
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

  await t.step("can preset primary vertext data", () => {
    let vertex = createVertex(graph, "Author", {
      firstName: "Roberta",
    });
    assertEquals(vertex.data.firstName, "Roberta");
  });

  await t.step(
    "can use computed properties to merge preset data with sample data",
    () => {
      let vertex = createVertex(graph, "Author", {
        firstName: "Roberta",
        lastName: "Dobalina",
      });
      assertEquals(vertex.data.displayName, "Roberta Dobalina");
    },
  );

  await t.step("can preset a single value in a relationship", () => {
    let vertex = createVertex(graph, "Author", {
      "Author.posts": {
        title: "A Tale of Two Vertices",
      },
    });
    let posts = graph.from[vertex.id]
      .map((edge) => graph.vertices[edge.to])
      .map(({ data }) => data);

    assertEquals(posts, [{ title: "A Tale of Two Vertices" }]);
  });

  await t.step("can preset a subset of the relationships", () => {
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

    assertEquals(posts.length, 3);
    assertEquals(posts.slice(0, 2), [{
      title: "A Tale of Two Vertices",
    }, {
      title: "The Razor's Edge",
    }]);
  });

  await t.step("can preset a superset of the relationships", () => {
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

    assertEquals(posts, [{
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
