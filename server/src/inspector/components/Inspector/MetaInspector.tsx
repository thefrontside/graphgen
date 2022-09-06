/// <reference lib="DOM" />
import type { ReactNode } from "react";
import { useEffect, useState } from 'react';
import { Views } from "../types.ts";
import Tree, { TreeProps } from "react-animated-tree-v2";
import { Meta } from "../types.ts";
import { close, minus, plus } from "./icons.tsx";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { SubMeta } from "./SubMeta.tsx";
import { MetaView } from "./Meta.tsx";
import { Reference, Type } from "../../../graphql/types.ts";
import { fetchGraphQL } from "../../graphql/fetchGraphql.ts";

export function MetaInspector(): JSX.Element {
  const [data, setData] = useState<Meta[]>([]);

  useEffect(() => {
    async function loadMeta() {
      const meta = await fetchGraphQL(`
      query Meta {
        meta {
          typename
          count
          references {
            typename
            fieldname
            path
            count
            description
            affinity
          }
        }
      }
      `);

      const data = meta.data.meta.map((
        { typename, references, count, ...rest }: Type,
      ) => ({
        id: typename,
        name: `${typename} (${count})`,
        attributes: {
          count,
          ...rest,
        },
        children: references?.map((
          { fieldname, count, ...rest }: Reference,
          i,
        ) => ({
          id: i,
          name: `${fieldname} (${count})`,
          attributes: {
            ...rest,
          },
        })),
      }));

      setData(data);
    }

    loadMeta().catch(console.error);
  }, [])
  
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
          label={<MetaView {...d} />}
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
