/// <reference lib="DOM" />
import { ReactNode } from "react";
import { Views } from "../types.ts";
import Tree, { TreeProps } from "react-animated-tree-v2";
import { Meta } from "../types.ts";
import { close, minus, plus } from "./icons.tsx";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";

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
            <tr key={k}>
              <td>{k}</td>
              <td>{v}</td>
              {/* <td>{k === "affinity" ? `affinity ${v}` : v}</td> */}
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

export function MetaInspector(
  { data = [] }: {
    data: Meta[];
  },
): JSX.Element {
  console.log(data);
  return (
    <TreeView
      aria-label="file system navigator"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      defaultExpanded={data.map(d => d.name)}
      sx={{ height: '100%', flexGrow: 1, width: '100%', overflowY: "auto" }}
    >
      {(data ?? []).map((d) => (
        <TreeItem
          key={d.name}
          nodeId={d.name}
          label={<Meta {...d} />}
        >
          {d.children.length > 0 &&
            d.children.map((r) => (
              <TreeItem key={r.id} nodeId={r.id} label={<SubMeta {...r}/>} />
            ))}
        </TreeItem>
      ))}
    </TreeView>
  );
}
