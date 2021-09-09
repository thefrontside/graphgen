import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import { Graph, createGraph, createVertex, Seed, Distribution } from '../src';

describe('field generation', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createGraph({
      types: {
        vertex: [{
          name: 'LDAPProfile',
          relationships: [],
          fields: {
            country: sequence('a few countries', [
              'US', 'ZA'
            ]),
            state: sequence('US States', [
              'TX', 'AK'
            ])
          }
        }]
      }
    })
  });

  it('generates fields according to the distributions defined in the vertex type', () => {
    let [one, two, three] = [
      createVertex(graph, 'LDAPProfile'),
      createVertex(graph, 'LDAPProfile'),
      createVertex(graph, 'LDAPProfile')
    ];
    expect(one.fields.country).toEqual('US');
    expect(one.fields.state).toEqual('TX');

    expect(two.fields.country).toEqual('ZA');
    expect(two.fields.state).toEqual('AK');
  });
});

function sequence<T>(description: string, values: [first: T, ...rest: T[]]): Distribution<T> {
  let [first, ...rest] = values;
  let iterator = (function* generate() {
    start:
    {
      for (let value of [first, ...rest]) {
        yield value;
      }
      break start;
    }
    return first;
  })();

  return {
    description,
    sample: () => iterator.next().value
  }
}
