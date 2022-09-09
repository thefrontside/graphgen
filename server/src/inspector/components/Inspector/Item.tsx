import TreeItem from "@mui/lab/TreeItem";
import { VertexNode } from "../../../graphql/types.ts";
import { Loader } from "../Loader/Loader.tsx";

function isNode(node: unknown): node is VertexNode {
  return typeof node === "object" && node !== null && "id" in node &&
    "fields" in node;
}

export function Item(
  { node }: { node: VertexNode },
): JSX.Element {
  console.log(node);
  const props = node.fields.flatMap((n) =>
    n.__typename === "JSONFieldEntry" ? [n] : []
  );

  const relationships = node.fields.flatMap((n) =>
    n.__typename !== "JSONFieldEntry" ? [n] : []
  );

  return (
    <div className="sub-meta" style={{ display: "inline-block" }}>
      <table>
        <tbody>
          {props
            .map((n) =>
              isNode(n.json)
                ? (
                  <TreeItem key={n.json.id} nodeId={n.json.id} label={<Item node={n.json}/>}>
                    <Loader />
                  </TreeItem>
                )
                : (
                  <tr key={n.key}>
                    <td>{n.key}</td>
                    <td>{n.json as string}</td>
                  </tr>
                )
            )}
          {relationships.map((r) => {
            let id = `${r.__typename}|${r.key}|${node.id}|`;

            if (r.__typename === "VertexFieldEntry") {
              id += r.id;
            } else if (r.__typename === "VertexListFieldEntry") {
              id += r.ids.join(",");
            } else {
              throw new Error(`illegal FieldEntry`);
            }
            return (
              <TreeItem key={id} nodeId={id} label={r.key}>
                <Loader />
              </TreeItem>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
