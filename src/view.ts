import { Graph, Vertex } from "./graph.ts";

export function createView(graph: Graph) {
  return Object.entries(graph.roots).reduce((view, [name, root]) => {
    return {
      ...view,
      [name]: Object.values(root).reduce((entries, v) => {
        return {
          ...entries,
          [v.id]: createVertexView(v, graph),
        };
      }, {} as Record<number, VertexView>),
    };
  }, {} as GraphView);
}

export type GraphView = Record<string, Record<number, VertexView>>;

export interface VertexView {
  id: number;
  attributes: Record<string, unknown>;
  relationships?: Record<string, VertexView[]>;
}

function createVertexView(vertex: Vertex, graph: Graph) {
  let view = {
    id: vertex.id,
    attributes: vertex.data,
  };

  let edges = (graph.from[vertex.id] ?? []).concat(graph.to[vertex.id] ?? []);
  if (edges) {
    return {
      ...view,
      relationships: Object.create(
        {},
        edges.reduce((properties, edge) => {
          if (!properties[edge.type]) {
            return {
              ...properties,
              [edge.type]: {
                enumerable: true,
                get(): Record<number, VertexView> {
                  return edges
                    .filter((e) => e.type === edge.type)
                    .reduce((views, edge) => {
                      let targetId = vertex.id === edge.from
                        ? edge.to
                        : edge.from;
                      return {
                        ...views,
                        [targetId]: createVertexView(
                          graph.vertices[targetId],
                          graph,
                        ),
                      };
                    }, {});
                },
              },
            };
          } else {
            return properties;
          }
        }, {} as Record<string, PropertyDescriptor>),
      ),
    };
  } else {
    return view;
  }
}
