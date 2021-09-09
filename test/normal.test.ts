import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import seedrandom from 'seedrandom';
import { createGraph, createVertex, Graph } from '../src';
import { normal } from '../src/distribution';

describe('the normal distribution', () => {
  let graph: Graph;

  let seed = seedrandom('normal.test.ts')

  beforeEach(() => {
    graph = createGraph({
      seed,
      types: {
        vertex: [{
          name: 'User',
          fields: {},
          relationships: [{
            type: 'User.repositories',
            direction: 'from',
            size: normal({ mean: 3, standardDeviation: 2 })
          }]
        }, {
          name: 'Repository',
          fields: {},
          relationships: []
        }],
        edge: [{
          name: 'User.repositories',
          from: 'User',
          to: 'Repository'
        }]
      }
    })
  });

  it('generates a reliable random sequence', () => {
    let user = createVertex(graph, 'User');
    expect(graph.from[user.id].length).toEqual(4);
  });
});
