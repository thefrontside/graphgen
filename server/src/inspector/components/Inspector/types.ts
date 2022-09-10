import { VertexNode } from "../../../graphql/types.ts";

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


export type ExpandedProperty = [
  "VertexListFieldEntry" | "VertexFieldEntry",
  string,
  string,
  string,
];
