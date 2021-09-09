import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import { createGraph, createVertex, Graph } from '../src';
import { constant } from '../src/distribution';

describe('cyclic references', () => {
  let graph: Graph;

  describe('has many and belongs to', () => {
    // User has many repositories, Repository is owned by exactly one user
    beforeEach(() => {
      graph = createGraph({
        types: {
          vertex: [{
            name: 'User',
            fields: {},
            relationships: [{
              type: 'User.repositories',
              direction: 'from',
              size: constant(3),
            }]
          }, {
            name: 'Repository',
            fields: {},
            relationships: [{
              type: 'User.repositories',
              direction: 'to',
              size: constant(1),
            }]
          }],
          edge: [{
            name: 'User.repositories',
            from: 'User',
            to: 'Repository'
          }]
        }
      });
    });

    it('creates back references from the owned vertices', () => {
      let user = createVertex(graph, 'User');

      let [repository] = graph.from[user.id].map(edge => graph.vertices[edge.to]);

      let [back] = graph.to[repository.id].map(edge => graph.vertices[edge.from]);

      expect(back).toEqual(user);
    });
  });
});
