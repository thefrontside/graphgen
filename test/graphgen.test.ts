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
            outgoing: []
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
            outgoing: []
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
            outgoing: [{
              edgeType: 'User.repositories',
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
            outgoing: []
          }, {
            name: 'Article',
            outgoing: []
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
            outgoing: [{
              edgeType: 'User.posts',
              size: constant(3)
            }]
          }, {
            name: 'BlogPost',
            outgoing: []
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
});
