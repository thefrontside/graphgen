/// <reference lib="DOM" />
import { Component, ReactNode, RefObject } from "react";
import { Views } from "../types.ts";
import Tree, { TreeProps } from "react-animated-tree-v2";
import { Meta } from "../types.ts";
import { close, minus, plus } from "./icons.tsx";

// deno-lint-ignore no-explicit-any
function NoCheck(props: any) {
  return <></>;
}

function IconTree(props: Partial<TreeProps> & { children?: ReactNode }) {
  return (
    <Tree
      icons={{ closeIcon: close }}
      {
        // deno-lint-ignore no-explicit-any
        ...props as any
      }
    />
  );
}

export function SubMeta(
  { name, attributes, ...rest }: Omit<Meta, "children">,
): JSX.Element {
  console.log(rest);
  return (
    <div className="sub-meta" style={{ display: "inline-block" }}>
      <table>
        <thead>
          <tr>
            <th colSpan={2}>
              <strong>{name}</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(attributes).flatMap(([k, v]) =>
            !v || k === "typename" ? [] : [[k, v]]
          ).map(([k, v]) => (
            <tr>
              <td>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Meta({ name }: Meta): JSX.Element {
  return (
    <div className="meta">
      <strong>{name}</strong>
    </div>
  );
}

export function Inspector(
  { data, view }: {
    data: Meta[];
    view: Views;
  },
): JSX.Element {
  return (
    <>
      {data.map((d, i) => (
        <IconTree
          key={i}
          content={<Meta {...d}/>}
          canHide={d.children.length > 0}
          open={d.children.length > 0}
        >
          {d.children.length > 0 &&
            d.children.map((r, j) => (
              <IconTree key={j} content={<SubMeta {...r} />} />
            ))}
        </IconTree>
      ))}
    </>
  );
}
