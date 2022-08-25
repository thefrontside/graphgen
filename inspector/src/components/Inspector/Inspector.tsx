import { ObjectInspector } from 'react-inspector';

export function GraphInspector(graph: any): JSX.Element {
  if (!graph) {
    return <div>loading....</div>
  }
  return (
    <ObjectInspector expandLevel={6} data={graph} />
  )
}