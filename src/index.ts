import assert from 'assert-ts';

import { cryptoSeed, Seed, Distribution } from './distribution';

export interface Vertex {
  type: string;
  id: number;
}

export interface VertexType {
  name: string;
  outgoing: EdgeType[];
}

export interface EdgeType {
  name: string;
  from: string;
  to: string;
  size: Distribution<number>;
}

export interface Edge {
  from: number;
  to: number;
}

export interface Graph {
  seed: Seed;
  currentId: number;
  types: Record<string, VertexType>;
  roots: Record<string, Record<number, Vertex>>;
  vertices: Record<number, Vertex>;
  from: Record<number, Edge[]>;
  to: Record<number, Edge[]>;
}

export interface GraphOptions {
  types?: VertexType[];
  seed?: Seed;
}

export function createGraph(options: GraphOptions = {}): Graph {
  let currentId = 0;
  let seed = options.seed || cryptoSeed;

  let types = ((options.types || []).reduce((types, t)=> {
    return { ...types, [t.name]: t };
  }, {} as Record<string, VertexType>));

  let roots = Object.keys(types).reduce((roots, name) => {
    return { ...roots, [name]: {} };
  }, {} as Record<string, Record<number, Vertex>>);

  let vertices = {} as Record<number, Vertex>;

  let from = {} as Record<number, Edge[]>;

  let to = {} as Record<number, Edge[]>;

  return { currentId, seed, types, roots, vertices, from, to };
}

export function createVertex(graph: Graph, typeName: string): Vertex {
  let vertexType = graph.types[typeName];
  assert(!!vertexType, `unknown vertex type '${typeName}'; must be one of '${Object.keys(graph.types)}'`);

  let vertex = {
    id: ++graph.currentId,
    type: typeName
  };

  graph.vertices[vertex.id] = vertex;
  graph.roots[typeName][vertex.id] = vertex;

  for (let edgeType of vertexType.outgoing) {
    let size = edgeType.size.sample(graph.seed);
    for (let i = 0; i < size; i++) {
      let target = createVertex(graph, edgeType.to);

      let edge: Edge = { from: vertex.id, to: target.id };
      graph.from[vertex.id] ||= [];
      graph.from[vertex.id].push(edge);
      graph.to[target.id] ||= [];
      graph.to[target.id].push(edge);
    }
  }

  return vertex;
}
