/// <reference lib="DOM" />
import Tree from "react-d3-tree";
import type { Reference, Type } from "../../../graphql/types.ts";
import { useParentSize } from "@cutting/use-get-parent-size";
import { RefObject } from "react";
import { useLayoutEffect, useRef } from "react";
import { ObjectInspector } from "react-inspector";
import { Views } from "../types.ts";

export function Inspector<V extends Views>(
  { data, innerRef, view }: {
    innerRef: RefObject<HTMLDivElement>;
    // deno-lint-ignore no-explicit-any
    data: any;
    view: Views;
  },
): JSX.Element {
  const { width, height } = useParentSize(innerRef, { debounceDelay: 50 });
  const it = useRef(false);

  useLayoutEffect(() => {
    if (it.current) {
      return;
    }

    const svg = document.querySelector("svg");

    if (!svg) {
      return;
    }

    const aspect = width / height;

    const adjustedHeight = Math.ceil(width / aspect);

    svg.removeAttribute("width");
    svg.removeAttribute("height");
    // svg.setAttribute("width", `${width}px`);
    // svg.setAttribute("height", `${adjustedHeight}px`);
    svg.setAttribute(
      "viewBox",
      `${-(width / 8)} ${-(adjustedHeight / 2)} ${width} ${adjustedHeight}`,
    );
    svg.setAttribute("preserveAspectRatio", `xMaxYMid meet`);
  }, [view]);

  switch (view) {
    case "Graph":
      return <ObjectInspector data={data}  expandLevel={6} />;
    case "Meta":
      return <ObjectInspector data={data.data.meta} expandLevel={6} />;
    case "Tree": {
      const graphData = {
        name: "Graph",
        children: data.data.meta.map((
          { typename, references, count, ...rest }: Type,
        ) => ({
          name: `${typename} (${count})`,
          attributes: {
            count,
            ...rest,
          },
          children: references?.map(({ fieldname, count, ...rest }: Reference) => ({
            name: `${fieldname} (${count})`,
            attributes: {
              ...rest,
            },
          })),
        })),
      };

      return (
        <Tree
          hasInteractiveNodes
          data={graphData}
          zoom={0.70}
          initialDepth={1}
          transitionDuration={0.1}
          scaleExtent={{ min: 0.1, max: 1 }}
          enableLegacyTransitions={true}
        />
      );
    }
    default:
      throw new Error("we cannot do that");
  }
}
