export interface Node {
  id: string;
  label: string;
  size: number;
  child: boolean; 
  children?: Node[];
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
