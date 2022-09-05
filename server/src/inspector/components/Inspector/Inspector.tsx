/// <reference lib="DOM" />
import type { Reference, Type } from "../../../graphql/types.ts";
import { RefObject } from "react";
import { ObjectInspector } from "react-inspector";
import { Views } from "../types.ts";
import Tree, { useTreeState } from "react-hyper-tree";
import { DefaultNode } from "./Node.tsx";

export function Inspector(
  { data, innerRef, view }: {
    innerRef: RefObject<HTMLDivElement>;
    // deno-lint-ignore no-explicit-any
    data: any;
    view: Views;
  },
): JSX.Element {
  console.log({data})
  const { required, handlers } = useTreeState({
    data: data ?? [],
    id: "your_tree_id",
    defaultOpened: true
  });

  return (
    <Tree
      depth={0}
      gapMode="padding"
      depthGap={20}
      {...required}
      {...handlers}
      renderNode={(props) => {
        console.log(props);
        return <DefaultNode {...props} />
      }}
    />
  );
}
