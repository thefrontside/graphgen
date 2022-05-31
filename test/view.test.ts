import { beforeEach, describe, expect, it } from "./suite.ts";

import { seedrandom } from "../src/seedrandom.ts";
import { createGraph, normal, GraphView, createView } from "../mod.ts";

describe("view", () => {
  let view: GraphView;
  let seed = seedrandom("normal.test.ts");

  beforeEach(() => {
    const graph = createGraph({
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

    view = createView(graph);
  });

  it("has Users type", () => {
    expect(view.User).toBeDefined();
  });

  it("has Repository type", () => {
    expect(view.Repository).toBeDefined();
  });

  // TODO: how do I read generated objects from this?
});