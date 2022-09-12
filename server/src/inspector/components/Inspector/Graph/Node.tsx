import TreeItem from "@mui/lab/TreeItem";
import { VertexNode } from "../../../../graphql/types.ts";
// import { Loader } from "../Loader/Loader.tsx";

const Loader = function (): JSX.Element {
  return <div>loading............</div>;
};

function isNode(node: unknown): node is VertexNode {
  return typeof node === "object" && node !== null && "id" in node &&
    "fields" in node;
}

export function Node(
  { parentId, node }: { parentId: string; node: VertexNode },
): JSX.Element {
  const props = node.fields.flatMap((n) =>
    n.__typename === "JSONFieldEntry" ? [n] : []
  );

  const relationships = node.fields.flatMap((n) =>
    n.__typename !== "JSONFieldEntry" ? [n] : []
  );

  return (
    <div className="node" style={{ display: "inline-block" }}>
      {props
        .map((n) => (
          <div className="field">
            <div className="th">{n.key}</div>
            <div className="td">{n.json as string}</div>
          </div>
        ))}
      {relationships.map((r) => {
        const index = node.fields.findIndex((field) => r.key === field.key);
        const path = /\|data$/.test(parentId)
          ? `${parentId}.${r.key}`
          : `${parentId}.fields.${index}`;
        let id = path;

        if (r.__typename === "VertexFieldEntry") {
          id += `.${r.__typename}.${r.id}`;
        } else if (r.__typename === "VertexListFieldEntry") {
          id += `.${r.__typename}.${r.ids.join(",")}`;
        } else {
          throw new Error(`illegal FieldEntry`);
        }

        return (
          <TreeItem key={id} nodeId={id} label={r.key}>
            {r.data && r.__typename === "VertexFieldEntry"
              ? (
                <TreeItem
                  key={r.data.id}
                  nodeId={r.data.id}
                  label={<Node parentId={`${path}.data`} node={r.data} />}
                />
              )
              : r.__typename === "VertexListFieldEntry" && !!r.data
              ? r.data.map((n, i) => (
                <TreeItem
                  key={n.id}
                  nodeId={n.id}
                  label={<Node parentId={`${path}.data.${i}`} node={n} />}
                />
              ))
              : <Loader />}
          </TreeItem>
        );
      })}
    </div>
  );
}
