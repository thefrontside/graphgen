import { ObjectInspector } from "react-inspector";

// deno-lint-ignore no-explicit-any
export function Inspector(graph: any): JSX.Element {
  console.log(graph)
  return (
    <ObjectInspector expandLevel={6} data={graph.graph.data.meta} />
  );
}
