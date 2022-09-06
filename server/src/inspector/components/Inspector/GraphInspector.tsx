import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useReducer } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";
import { Views } from "../types.ts";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";

interface Node {
  id: string;
  displayName: string;
}

interface State {
  roots: string[];
}

type Actions = {
  type: "SET_ROOTS";
  payload: string[];
};

function graphReducer(state: State, action: Actions): State {
  switch (action.type) {
    case "SET_ROOTS":
      return { ...state, roots: action.payload };
  }
}

export function GraphInspector(): JSX.Element {
  const [state, dispatch] = useReducer(graphReducer, { roots: [] });

  const handleChange = useCallback((e: SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.length === 0) {
      return;
    }
    console.log({ e, nodeIds });
  }, []);

  useEffect(() => {
    async function loadGraph() {
      const graph = await fetchGraphQL(`
      query Graph {
        graph
      }
      `);

      dispatch({ type: "SET_ROOTS", payload: graph.data.graph });
    }

    loadGraph().catch(console.error);
  }, []);

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
      onNodeToggle={handleChange}
    >
      {state.roots.map((key) => (
        <TreeItem key={key} nodeId={key} label={key}>
          <Loader />
        </TreeItem>
      ))}
    </TreeView>
  );
}
