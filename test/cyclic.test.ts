import { beforeEach, describe, expect, it } from "./suite.ts";
import { constant, createGraph, createVertex, Graph } from "../mod.ts";

describe("cyclic references", () => {
  let graph: Graph;

  describe("has many and belongs to", () => {
    // User has many repositories, Repository is owned by exactly one user
    beforeEach(() => {
      graph = createGraph({
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
    });

    it("creates back references from the owned vertices", () => {
      let user = createVertex(graph, "User");

      let [repository] = graph.from[user.id].map((edge) =>
        graph.vertices[edge.to]
      );

      let [back] = graph.to[repository.id].map((edge) =>
        graph.vertices[edge.from]
      );

      expect(back).toEqual(user);
    });

    it("can begin generation from the owned vertex", () => {
      let repo = createVertex(graph, "Repository");

      expect(graph.to[repo.id]).toBeDefined();

      let [user] = graph.to[repo.id].map((edge) => graph.vertices[edge.from]);

      let [back] = graph.from[user.id].map((edge) => graph.vertices[edge.to]);

      expect(back).toEqual(repo);
    });
  });

  describe("cyclic relationships", () => {
    beforeEach(() => {
      graph = createGraph({
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
              type: "Repository.collaborators",
              direction: "from",
              size: constant(2),
              affinity: 0.01,
            }, {
              type: "User.repositories",
              direction: "to",
              size: constant(1),
            }],
          }],
          edge: [{
            name: "User.repositories",
            from: "User",
            to: "Repository",
          }, {
            name: "Repository.collaborators",
            from: "Repository",
            to: "User",
          }],
        },
      });
    });

    it("converges on a state of re-using existing vertices", () => {
      let user = createVertex(graph, "User");
      let [repository] = graph.from[user.id].map((edge) =>
        graph.vertices[edge.to]
      );
      let [collaborator] = graph.from[repository.id].map((edge) =>
        graph.vertices[edge.to]
      );
      expect(collaborator).toBeDefined();
    });
  });
});
