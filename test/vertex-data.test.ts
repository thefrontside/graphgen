import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import { Graph, createGraph, createVertex, Distribution, constant } from '../src';

describe('field generation', () => {
  let graph: Graph;
  let countries: Distribution<string>;
  let states: Distribution<string>;

  describe("with a static distribution", () => {
    beforeEach(() => {
      countries = sequence('a few countries', [
        'US', 'ZA'
      ]);
      states = sequence('US States', [
        'TX', 'AK'
      ]);
      graph = createGraph({
        types: {
          vertex: [{
            name: 'LDAPProfile',
            relationships: [],
            data() {
              return {
                description: `State and Country`,
                sample(seed) {
                  return {
                    country: countries.sample(seed),
                    state: states.sample(seed)
                  }
                }
              }
            }
          }]
        }
      })
    });

    it('generates fields according to the distributions defined in the vertex type', () => {
      let [one, two] = [
        createVertex(graph, 'LDAPProfile'),
        createVertex(graph, 'LDAPProfile')
      ];

      expect(one.data.country).toEqual('US');
      expect(one.data.state).toEqual('TX');

      expect(two.data.country).toEqual('ZA');
      expect(two.data.state).toEqual('AK');
    });
  });

  describe('with a distribution that follows from generating at an edge traversal', () => {
    beforeEach(() => {
      let countries = sequence('countries', ['US', 'UK']);
      let cities = sequence('cities', ['Glasgow', 'Austin']);
      graph = createGraph({
        types: {
          vertex: [{
            name: 'Country',
            relationships: [],
            data: {
              [`City.country`]: (source) => {
                if (source.data === 'Glasgow') {
                  return constant('UK');
                } else {
                  return constant('US');
                }
              },
              root: () => countries
            }
          }, {
            name: 'City',
            relationships: [{
              type: 'City.country',
              direction: 'from',
              size: constant(1)
            }],
            data: () => cities
          }],
          edge: [{
            name: 'City.country',
            from: 'City',
            to: 'Country'
          }]
        }
      })
    });

    it('can use the source of the traversal to parameterize the distribution', () => {
      let [[one], [two]] = [
        createVertex(graph, 'City'),
        createVertex(graph, 'City')
      ].map(city => graph.from[city.id].map(edge => graph.vertices[edge.to]));

      expect(one.data).toEqual('UK');
      expect(two.data).toEqual('US');
    });
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
