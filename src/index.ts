import assert from 'assert-ts';

import { cryptoSeed, Seed, Distribution } from './distribution';

export interface Vertex {
  type: string;
  id: number;
}

export interface VertexType {
  name: string;
  outgoing: EdgeDistribution[];
}

export interface Edge {
  type: string;
  from: number;
  to: number;
}

export interface EdgeType {
  name: string;
  from: string;
  to: string;
}

export interface EdgeDistribution {
  edgeType: string;
  size: Distribution<number>;
}

export interface GraphTypes {
  vertex: Record<string, VertexType>;
  edge: Record<string, EdgeType>;
}

export interface Graph {
  seed: Seed;
  currentId: number;
  types: GraphTypes;
  roots: Record<string, Record<number, Vertex>>;
  vertices: Record<number, Vertex>;
  from: Record<number, Edge[]>;
  to: Record<number, Edge[]>;
}

export interface GraphOptions {
  types?: {
    vertex?: VertexType[];
    edge?: EdgeType[];
  };
  seed?: Seed;
}

export function createGraph(options: GraphOptions = {}): Graph {
  let currentId = 0;
  let seed = options.seed || cryptoSeed;

  let vertexTypes = (options.types?.vertex || []).reduce((types, t) => {
    return { ...types, [t.name]: t };
  }, {} as Record<string, VertexType>);

  let edgeTypes = (options.types?.edge || []).reduce((types, t) => {
    assert(!!vertexTypes[t.from], `edge type '${t.name}' references unknown vertex type '${t.from}'`);
    assert(!!vertexTypes[t.to], `edge type '${t.name}' references unknown vertex type ${t.to}`);
    return { ...types, [t.name]: t };
  }, {} as Record<string, EdgeType>);

  Object.values(vertexTypes).forEach(t => t.outgoing.forEach(o => {
    assert(!!edgeTypes[o.edgeType], `edge distribution references unknown edge type '${o.edgeType}'`);
  }))

  let types = { vertex: vertexTypes, edge: edgeTypes };

  let roots = Object.keys(types.vertex).reduce((roots, name) => {
    return { ...roots, [name]: {} };
  }, {} as Record<string, Record<number, Vertex>>);

  let vertices = {} as Record<number, Vertex>;

  let from = {} as Record<number, Edge[]>;

  let to = {} as Record<number, Edge[]>;

  return { currentId, seed, types, roots, vertices, from, to };
}

export function createVertex(graph: Graph, typeName: string): Vertex {
  let vertexType = graph.types.vertex[typeName];
  assert(!!vertexType, `unknown vertex type '${typeName}'; must be one of '${Object.keys(graph.types)}'`);

  let vertex = {
    id: ++graph.currentId,
    type: typeName
  };

  graph.vertices[vertex.id] = vertex;
  graph.roots[typeName][vertex.id] = vertex;

  for (let distribution of vertexType.outgoing) {
    let size = distribution.size.sample(graph.seed);
    for (let i = 0; i < size; i++) {
      let edgeType = graph.types.edge[distribution.edgeType];
      let target = createVertex(graph, edgeType.to);

      let edge: Edge = { type: edgeType.name, from: vertex.id, to: target.id };
      graph.from[vertex.id] ||= [];
      graph.from[vertex.id].push(edge);
      graph.to[target.id] ||= [];
      graph.to[target.id].push(edge);
    }
  }

  return vertex;
}
