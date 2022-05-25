import { beforeEach, describe, expect, it } from "./suite.ts";

import { seedrandom } from "../src/seedrandom.ts";
import { createGraph, createVertex, Graph, normal } from "../mod.ts";

describe("the normal distribution", () => {
  let graph: Graph;

  let seed = seedrandom("normal.test.ts");

  beforeEach(() => {
    graph = createGraph({
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
  });

  it("generates a reliable random sequence", () => {
    let user = createVertex(graph, "User");
    expect(graph.from[user.id].length).toEqual(2);
  });
});
