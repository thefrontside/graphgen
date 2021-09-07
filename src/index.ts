import assert from 'assert-ts';

import { cryptoSeed, Seed, Distribution } from './distribution';

export interface Vertex {
  type: string;
  id: number;
}

export interface VertexType {
  name: string;
  relationships: Relationship[];
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

export interface Relationship {
  type: string;
  size: Distribution<number>;
  direction: 'from' | 'to';
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

  Object.values(vertexTypes).forEach(t => t.relationships.forEach(o => {
    assert(!!edgeTypes[o.type], `edge distribution references unknown edge type '${o.type}'`);
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

export function createVertex(graph: Graph, typeName: string, id: number = ++graph.currentId): Vertex {
  let vertexType = graph.types.vertex[typeName];
  assert(!!vertexType, `unknown vertex type '${typeName}'; must be one of '${Object.keys(graph.types)}'`);

  let vertex = {
    id,
    type: typeName
  };

  graph.vertices[vertex.id] = vertex;
  graph.roots[typeName][vertex.id] = vertex;

  for (let relationship of vertexType.relationships) {
    let size = relationship.size.sample(graph.seed);
    let existing = graph[relationship.direction][id] || [];

    for (let i = existing.length; i < size; i++) {
      let edgeType = graph.types.edge[relationship.type];
      let targetId = ++graph.currentId;
      let edge: Edge = { type: edgeType.name, from: vertex.id, to: targetId };

      graph.from[vertex.id] ||= [];
      graph.from[vertex.id].push(edge);

      graph.to[targetId] ||= [];
      graph.to[targetId].push(edge);

      createVertex(graph, edgeType.to, targetId);

    }
  }

  return vertex;
}
