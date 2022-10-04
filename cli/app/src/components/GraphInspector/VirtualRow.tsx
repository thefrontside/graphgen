import { StyledTreeItem } from "./StyledTreeItem";
import { Node } from "./Node";
import { VirtualItem } from "@tanstack/react-virtual";
import type { VertexNode } from "../../../../graphql/types";
import { useEffect, useRef } from "react";

interface VirtualRowProps {
  virtualRow: VirtualItem<unknown>;
  vertexNode: VertexNode;
  typename: string;
  update: number;
}

export function VirtualRow(
  { virtualRow, vertexNode, typename, update }: VirtualRowProps,
): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    virtualRow.measureElement(elementRef.current);
  }, [update]);

  return (
    <div
      key={vertexNode.id}
      ref={elementRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
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
  );
}
