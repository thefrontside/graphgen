import { describe, beforeEach, it } from 'mocha';
import expect from 'expect';

import { Graph, createGraph, createVertex, constant } from '../src';

describe('preseeding data', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createGraph({
      types: {
        edge: [{
          name: 'Author.posts',
          from: 'Author',
          to: 'BlogPost'
        }],
        vertex: [{
          name: 'Author',
          data: () => ({
            description: "Author Data",
            sample: (seed) => ({
              name: `author ${seed()}`
            })
          }),
          relationships: [{
            type: 'Author.posts',
            direction: 'from',
            size: constant(3)
          }]
        }, {
          name: 'BlogPost',
          relationships: []
        }]
      },
    });
  });

  it('can preset primary vertext data', () => {
    let vertex = createVertex(graph, 'Author', {
      name: 'Roberta'
    });
    expect(vertex.data.name).toEqual('Roberta');
  });

  describe('on relationships', () => {
    it('can preset a single value in a relationship', () => {
      let vertex = createVertex(graph, 'Author', {
        'Author.posts': {
          title: "A Tale of Two Vertices"
        }
      });
      let posts = graph.from[vertex.id]
        .map(edge => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{ title: "A Tale of Two Vertices"}]);
    });

    it('can preset a subset of the relationships', () => {
      let vertex = createVertex(graph, 'Author', {
        'Author.posts': [{
          title: "A Tale of Two Vertices"
        }, {
          title: "The Razor's Edge"
        }]
      });

      let posts = graph.from[vertex.id]
        .map(edge => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{
        title: "A Tale of Two Vertices"
      }, {
        title: "The Razor's Edge"
      }, expect.anything() ]);
    });

    it('can preset a superset of the relationships', () => {
      let vertex = createVertex(graph, 'Author', {
        'Author.posts': [{
          title: "A Tale of Two Vertices"
        }, {
          title: "The Razor's Edge"
        }, {
          title: "Graphical Thinking"
        }, {
          title: "Simplicity in All Things"
        }]
      });

      let posts = graph.from[vertex.id]
        .map(edge => graph.vertices[edge.to])
        .map(({ data }) => data);

      expect(posts).toEqual([{
        title: "A Tale of Two Vertices"
      }, {
        title: "The Razor's Edge"
      }, {
        title: "Graphical Thinking"
      }, {
        title: "Simplicity in All Things"
      }]);
    });
  });
});
