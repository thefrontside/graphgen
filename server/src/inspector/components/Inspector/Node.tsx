import TreeItem from "@mui/lab/TreeItem";
import { VertexNode } from "../../../graphql/types.ts";
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
    <div className="sub-meta" style={{ display: "inline-block" }}>
      <table>
        <tbody>
          {props
            .map((n) => (
              <tr key={n.key}>
                <td>{n.key}</td>
                <td>{n.json as string}</td>
              </tr>
            ))}
          {relationships.map((r) => {
            const path = /\|data$/.test(parentId)
              ? `${parentId}|${r.key}`
              : `${parentId}|${node.id}|${r.key}`;
            let id = path;

            if (r.__typename === "VertexFieldEntry") {
              id += `|${r.id}`;
            } else if (r.__typename === "VertexListFieldEntry") {
              id += `|${r.ids.join(",")}`;
            } else {
              throw new Error(`illegal FieldEntry`);
            }

            // if (r.key === "owner") {
            //   console.log("--------------------");
            //   console.log(`parentId = ${parentId}`);
            //   console.log(`id = ${id}`);
            //   console.log(r);
            //   console.log(`${path}|data`);
            //   console.log("--------------------");
            // }

            return (
              <TreeItem key={id} nodeId={id} label={r.key}>
                {r.data && r.__typename === "VertexFieldEntry"
                  ? (
                    <TreeItem
                      key={r.data.id}
                      nodeId={r.data.id}
                      label={<Node parentId={`${path}|data`} node={r.data} />}
                    />
                  )
                  : r.__typename === "VertexListFieldEntry" && !!r.data
                  ? r.data.map((n) => (
                    <TreeItem
                      key={n.id}
                      nodeId={n.id}
                      label={<Node parentId={`${path}|data`} node={n} />}
                    />
                  ))
                  : <Loader />}
              </TreeItem>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}