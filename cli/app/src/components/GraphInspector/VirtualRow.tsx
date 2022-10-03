import { StyledTreeItem } from './StyledTreeItem';
import { Node } from './Node';
import { VirtualItem } from '@tanstack/react-virtual';
import type { VertexNode } from "../../../../graphql/types";

export function VirtualRow({ virtualRow, vertexNode, typename }: { virtualRow: VirtualItem<unknown>, vertexNode: VertexNode, typename: string }): JSX.Element {
  return (
    <div
      key={vertexNode.id}
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
}