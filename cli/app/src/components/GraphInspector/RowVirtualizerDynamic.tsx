import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VertexNode } from "../../../../graphql/types";
import { VirtualRow } from './VirtualRow';

interface RowVirtualizerDynamicProps {
  nodes: VertexNode[];
  typename: string;
  hasNextPage: boolean;
  fetching: boolean;
  fetchNextPage: () => void;
}

export function RowVirtualizerDynamic({ nodes, typename, hasNextPage, fetching, fetchNextPage }: RowVirtualizerDynamicProps): JSX.Element {
  const expanderRef = useRef<HTMLDivElement>();
  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => expanderRef.current,
    estimateSize: () => nodes[0].fields.length * 30,
    overscan: 1,
    enableSmoothScroll: true,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()

    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= nodes.length - 1 &&
      hasNextPage &&
      !fetching
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    nodes.length,
    fetching,
    rowVirtualizer.getVirtualItems(),
  ]);

  return (
    <div ref={expanderRef}
      className="List"
      style={{
        height: '800px',
        width: `100%`,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const vertexNode = nodes[virtualRow.index];

          console.log(`${nodes[virtualRow.index].id}`);
          return <VirtualRow key={`${nodes[virtualRow.index].id}`} vertexNode={vertexNode} typename={typename} virtualRow={virtualRow} />
        })}
      </div>
    </div>
  )
}

