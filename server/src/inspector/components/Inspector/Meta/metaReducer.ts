import { Type } from "../../../../graphql/types.ts";
import { Edge, GraphData, Node } from "./types.ts";
import { match } from "ts-pattern";

export interface State {
  graphData: GraphData;
}

export type Actions = {
  type: "SET_META";
  payload: Type[];
};

export function metaReducer(state: State, action: Actions): State {
  return match(action)
    .with({ type: 'SET_META' }, ({ payload }) => {
      const nodes: { data: Node }[] = [];
      const edges: { data: Edge }[] = [];

      const defaultNodeSize = 100;

      for (const { typename, references = [], count } of payload) {
        nodes.push({
          data: {
            id: typename,
            label: `${typename} (${count})`,
            size: Math.max(defaultNodeSize, count * 10),
            child: false
          }
        });

        for (const { fieldname, count: referenceCount } of references) {
          const id = `${typename}-${fieldname}`
          nodes.push({
            data: {
              id,
              label: `${fieldname} (${referenceCount})`,
              size: Math.max(defaultNodeSize, referenceCount * 5),
              child: true
            }
          });

          edges.push({
            data: {
              source: typename,
              target: id
            }
          })
        }
      }

      const graphData: GraphData = {
        nodes,
        edges
      }

      return { ...state, graphData: { ...graphData } };
    })
    .otherwise(() => state);
}
