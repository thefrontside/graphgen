import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StyledTreeItem } from './StyledTreeItem';
import { Node } from './Node';
import { VertexNode } from "../../../../graphql/types";

interface RowVirtualizerDynamicProps {
  nodes: VertexNode[];
  typename: string;
  hasNextPage: boolean;
  fetching: boolean;
  fetchNextPage: () => void;
  height: number;
}

export function RowVirtualizerDynamic({ nodes, typename, hasNextPage, fetching, fetchNextPage, height }: RowVirtualizerDynamicProps): JSX.Element {
  const expanderRef = useRef<HTMLDivElement>();

  const rowVirtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => expanderRef.current,
    estimateSize: () => 250,
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

  // useEffect(() => {
  //   if(isNaN(height)) {
  //     return;
  //   }

  //   const timeout = setTimeout(() => {
  //     console.log(height)
      
  //     rowVirtualizer.measure()
  //   }, 500);

  //   return () => clearTimeout(timeout);
  // }, [rowVirtualizer, height]);

  return (
    <div ref={expanderRef}
      className="List"
      style={{
        height: '100%',
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

          return (
            <div
              key={virtualRow.index}
              ref={virtualRow.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <StyledTreeItem
                key={vertexNode.id}
                nodeId={vertexNode.id}
                label={
                  <Node
                    parentId={`${typename}.nodes.${virtualRow.index}`}
                    node={vertexNode}
                  />
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}