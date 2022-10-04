import { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { VertexNode } from "../../../../graphql/types";
import { VirtualRow } from "./VirtualRow";

interface DynamicRowVirtualizerProps {
  nodes: VertexNode[];
  typename: string;
  hasNextPage: boolean;
  fetching: boolean;
  fetchNextPage: () => void;
  update: number;
}

const RowSize = 30;

export function DynamicRowVirtualizer(
  { nodes, typename, hasNextPage, fetching, fetchNextPage, update }:
    DynamicRowVirtualizerProps,
): JSX.Element {
  const expanderRef = useRef<HTMLDivElement>();

  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => expanderRef.current,
    // we need useCallback to force the update
    estimateSize: useCallback(() => nodes[0].fields.length * RowSize, [update]),
    enableSmoothScroll: false,
    getItemKey: (index) => nodes[index].id,
    // nuking this for now.  Default does too much
    scrollToFn: () => ({}),
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= nodes.length - 1 &&
      hasNextPage &&
      !fetching
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    nodes.length,
    fetching,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <div
      ref={expanderRef}
      style={{
        height: `${window.innerHeight - 250}px`,
        width: `100%`,
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const vertexNode = nodes[virtualRow.index];

          return (
            <VirtualRow
              key={`${nodes[virtualRow.index].id}`}
              vertexNode={vertexNode}
              typename={typename}
              virtualRow={virtualRow}
              update={update}
            />
          );
        })}
      </div>
    </div>
  );
}
