import { beforeEach, describe, expect, it } from "./suite.ts";

import { seedrandom } from "../src/seedrandom.ts";
import { createGraph, createVertex, constant, GraphView, createView } from "../mod.ts";

describe("view", () => {
  let view: GraphView;
  let seed = seedrandom("view.test.ts");

  beforeEach(() => {
    const graph = createGraph({
      seed,
      types: {
        vertex: [{
          name: "User",
          relationships: [{
            type: "User.repositories",
            direction: "from",
            size: constant(1),
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

    createVertex(graph, 'User', {
      name: 'Bob',
    });
    view = createView(graph);
  });

  it("can navigate the graph lazily", () => {
    let users = Object.values(view.User);
    expect(users).not.toHaveLength(0);


    let [ user ] = users;
    expect(user.attributes).toEqual({ name: "Bob" });

    let relationships = user.relationships ?? {};
    let [ repo ] = Object.values(relationships['User.repositories']);

    expect(repo).toBeDefined();
  });
});
