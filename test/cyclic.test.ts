import { describe, beforeEach, it } from 'mocha';

import { createGraph, createVertex, Graph } from '../src';
import { constant } from '../src/distribution';

describe('cyclic references', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createGraph({
      types: {
        vertex: [{
          name: 'User',
          relationships: [{
            type: 'User.repositories',
            size: constant(3)
          }]
        }, {
          name: 'Repository',
          relationships: [{
            type: 'User.repositories',
            size: constant(20)
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

  it.skip('does not blow up in computational complexity', () => {
    createVertex(graph, 'User');
    //let [repository] = graph.from[user.id].map(edge => graph.vertices[edge.to]);
    // let users = graph.traverse(repository, 'users');
    // expect(users.length)
  });
});
