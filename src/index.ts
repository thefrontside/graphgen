import assert from 'assert-ts';

import { Seed, Distribution, uniform, weighted, constant } from './distribution';
import seedrandom from 'seedrandom';

export * from './distribution';

export interface Vertex<TData = any> {
  type: string;
  id: number;
  data: TData;
}

export interface CreateData<T = any> {
  (source: Vertex, graph: Graph, edge: Edge): Distribution<T>
}

export type CreateDataMap<T = any> = Record<string, CreateData<T>>;

export interface VertexType {
  name: string;
  relationships: Relationship[];
  data?: CreateData | CreateDataMap;
}

export interface Edge {
  type: string;
  from: number;
  to: number;
}

export interface EdgeType {
  name: string;
  from: string;
  to: string | [string, ...string[]] | Record<string, number>;
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
  let seed = options.seed || seedrandom();

  let vertexTypes = (options.types?.vertex || []).reduce((types, t) => {
    return { ...types, [t.name]: t };
  }, {} as Record<string, VertexType>);

  let edgeTypes = (options.types?.edge || []).reduce((types, t) => {
    assert(!!vertexTypes[t.from], `edge type '${t.name}' references unknown vertex type '${t.from}'`);

    let references = () => {
      if (Array.isArray(t.to)) {
        return t.to;
      } else if (typeof t.to === 'string' || t.to instanceof String) {
        return [t.to.toString()];
      } else {
        let typeNames = Object.keys(t.to);
        assert(typeNames.length, `empty list of weighted sums passed into edge type 'to' field`);
        return typeNames;
      }
    }

    references().forEach(name => {
      assert(!!vertexTypes[name], `edge type '${t.name}' references unknown vertex type ${name}`);
    });

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

export function createVertex(graph: Graph, typeName: string, preset?: unknown, id: number = ++graph.currentId, whence?: Edge): Vertex {
  let vertexType = graph.types.vertex[typeName];
  assert(!!vertexType, `unknown vertex type '${typeName}'; must be one of '${Object.keys(graph.types)}'`);

  function getCreateDataDistribution(): CreateDataMap {
    if (vertexType.data) {
      if (typeof vertexType.data === 'function') {
        return {
          root: vertexType.data
        }
      } else {
        return {
          root: () => {
            throw new Error(`no root data factory provided for '${typeName}'. It cannot be created directly`);
          },
          ...vertexType.data
        }
      }
    } else {
      return {
        root: () => constant({})
      }
    }
  }

  let source: Vertex = whence ? graph.vertices[whence.from] : { id: -1, type: 'root', data: {}};
  let relationshipName = whence ? whence.type : 'root';
  let dataMap = getCreateDataDistribution()
  let createDistribution = dataMap[relationshipName] || dataMap.root;
  let distribution = createDistribution(source, graph, whence || { type: 'root', from: -1, to: id });

  let sample = distribution.sample(graph.seed);
  let data = typeof sample === 'object'  ? mappend(sample, preset) : preset ?? sample;

  let vertex = {
    id,
    type: typeName,
    data
  };

  graph.vertices[vertex.id] = vertex;
  graph.roots[typeName][vertex.id] = vertex;


  let relationshipPresets = preset as Record<string, unknown> | undefined;

  for (let relationship of vertexType.relationships) {
    function allocateRelated(): [number, unknown[]] {
      let relationshipPreset = relationshipPresets != null && relationship.type in relationshipPresets ? relationshipPresets[relationship.type] : undefined;

      let sampledSize = relationship.size.sample(graph.seed);
      if (Array.isArray(relationshipPreset)) {
        return [Math.max(relationshipPreset.length, sampledSize), relationshipPreset];
      } else if (relationshipPreset != null) {
        return [1, [relationshipPreset]];
      } else {
        return [sampledSize, []];
      }
    }

    let [size, presets] = allocateRelated();

    let existing = graph[relationship.direction][id] || [];

    for (let i = existing.length; i < size; i++) {
      let edgeType = graph.types.edge[relationship.type];
      let targetId = ++graph.currentId;
      let edge: Edge = { type: edgeType.name, from: vertex.id, to: targetId };

      graph.from[vertex.id] ||= [];
      graph.from[vertex.id].push(edge);

      graph.to[targetId] ||= [];
      graph.to[targetId].push(edge);

      function getTargetType(): string {
        if (Array.isArray(edgeType.to)) {
          return uniform(edgeType.to).sample(graph.seed);
        } else if (typeof edgeType.to === 'string') {
          return edgeType.to;
        } else {
          return weighted<string>(Object.entries(edgeType.to) as any).sample(graph.seed);
        }
      }


      createVertex(graph, getTargetType(), presets[i], targetId, edge);
    }
  }

  return vertex;
}

function mappend(left: unknown, right: unknown) {
  const { getOwnPropertyDescriptors } = Object;
  if (!left) {
    return right;
  } else if (typeof left === 'object' ) {
    let properties = Object.assign({}, getOwnPropertyDescriptors(left), getOwnPropertyDescriptors(right ?? {}));
    return Object.create(Object.getPrototypeOf(left), properties);
  } else {
    return right;
  }
}
