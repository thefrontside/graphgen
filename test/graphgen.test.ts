import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import { Graph, Vertex, createGraph, createVertex } from '../src';
import { constant } from '../src/distribution';

describe("graph generation", () => {
  let graph: Graph;

  describe("with a completely empty space", () => {
    beforeEach(() => {
      graph = createGraph();
    });
    it("starts with no edges", () => {
      expect(graph.vertices).toEqual({});

    });

    it("is an error to try and create a node because ", () => {
      expect(() => { createVertex(graph, 'User')}).toThrow();
    })
  });

  describe('with invalid graph types', () => {
    it('fails when an edge type references an invalid vertex type', () => {
      expect(() => createGraph({
        types: {
          vertex: [{
            name: 'User',
            relationships: []
          }],
          edge: [{
            name: 'to-nowhere',
            from: 'User',
            to: 'Nowhere'
          }]
        }
      })).toThrow();

      expect(() => createGraph({
        types: {
          vertex: [{
            name: 'User',
            relationships: []
          }],
          edge: [{
            name: 'from-nowhere',
            from: 'Nowhere',
            to: 'User'
          }]
        }
      })).toThrow();
    });

    it('fails when an edge distribution references a non existent edge type', () => {
      expect(() => createGraph({
        types: {
          vertex: [{
            name: 'User',
            relationships: [{
              type: 'User.repositories',
              direction: 'from',
              size: constant(1)
            }]
          }]
        }
      })).toThrow();
    });
  });


  describe("with node types, but no explicit relationships", () => {
    beforeEach(() => {
      graph = createGraph({
        types: {
          vertex: [{
            name: 'User',
            relationships: []
          }, {
            name: 'Article',
            relationships: []
          }]
        }
      });
    });

    describe("generating nodes of a certain node type", () => {
      let user: Vertex;

      beforeEach(() => {
        user = createVertex(graph, 'User');
      });

      it("creates the new vertex", () => {
        expect(user).toBeTruthy();
        expect(user.type).toEqual('User');
      });

      it("contains the new vertex in the graph", () => {
        expect(graph.vertices[user.id]).toBe(user);
      })
    });
  });

  describe("generating node from a space with relationships", () => {
    let graph: Graph;
    let user: Vertex;

    beforeEach(() => {
      graph = createGraph({
        types: {
          edge: [{
            name: 'User.posts',
            from: 'User',
            to: 'BlogPost'
          }],
          vertex: [{
            name: 'User',
            relationships: [{
              type: 'User.posts',
              direction: 'from',
              size: constant(3)
            }]
          }, {
            name: 'BlogPost',
            relationships: []
          }]
        },

      });

      user = createVertex(graph, 'User');
    });

    it("creates three blog posts", () => {
      expect(Object.entries(graph.roots['BlogPost']).length).toEqual(3);
    });

    it("draws three edges between the user and those blog posts", () => {
      expect(graph.from[user.id].length).toEqual(3);
      let [one, two, three] = graph.from[user.id];
      expect(one.from).toEqual(user.id);
      expect(two.from).toEqual(user.id);
      expect(three.from).toEqual(user.id);
    })

    it("it creates the edges connecting the user and the blog posts", () => {
      let [first] = Object.values(graph.roots['BlogPost']);
      expect(graph.to[first.id].length).toEqual(1);
    });
  });

  describe("generating multiple relationships from a single node", () => {
    let graph: Graph;
    let article: Vertex;

    beforeEach(() => {
      graph = createGraph({
        types: {
          edge: [{
            name: 'author',
            from: 'Article',
            to: 'User'
          }, {
            name: 'editor',
            from: 'Article',
            to: 'User'
          }],
          vertex: [{
            name: 'Article',
            relationships: [{
              type: 'author',
              direction: 'from',
              size: constant(1),
            }, {
              type: 'editor',
              direction: 'from',
              size:  constant(1)
            }],
          }, {
            name: 'User',
            relationships: []
          }]
        },

      });

      article = createVertex(graph, 'Article');
    });

    it("creates edges for each relationship type", () => {
      expect(graph.from[article.id]).toHaveLength(2);
    });
  });
});
