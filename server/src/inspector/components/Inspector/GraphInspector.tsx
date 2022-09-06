import type { SyntheticEvent } from "react";
import { useState, useCallback } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";

interface Node {
  id: string;
  displayName: string;
}

export function GraphInspector(
  { data = [] }: {
    data: string[];
  },
): JSX.Element {
  const handleChange = useCallback((e: SyntheticEvent, nodeIds: string[]) => {
    if(nodeIds.length === 0) {
      return;
    }
    console.log({e, nodeIds})
  }, [])

  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: "auto" }}
      onNodeToggle={handleChange}
    >
      {data.map((key) => (
        <TreeItem key={key} nodeId={key} label={key}>
          <Loader />
        </TreeItem>
      ))}
    </TreeView>
  );
}
