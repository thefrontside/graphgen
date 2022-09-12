export const views = ['Meta', 'Graph'] as const;

export type Views = (typeof views)[number];

export interface Meta {
  id: string;
  name: string;
  // deno-lint-ignore no-explicit-any
  attributes: Record<string, any>;
  children: Omit<Meta, 'children'>[];
}

import { VertexNode } from "../../../../graphql/types.ts";

export interface Node {
  id: string;
  label: string;
  size: number;
  child?: boolean;
  children?: VertexNode[];
  // deno-lint-ignore no-explicit-any
  [key: string]: any;

}

export interface Edge {
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: {
    data: Node;
  }[];
  edges: {
    data: Edge;
  }[];
}
