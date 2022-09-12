import TreeItem from "@mui/lab/TreeItem";
import { VertexNode } from "../../../../graphql/types.ts";

const Loader = function (): JSX.Element {
  return <div>loading............</div>;
};

interface NodeProps {
  parentId: string; 
  node: VertexNode
}

export function Node({ parentId, node }: NodeProps): JSX.Element {
  const props = node.fields.flatMap((n) =>
    n.__typename === "JSONFieldEntry" ? [n] : []
  );

  const relationships = node.fields.flatMap((n) =>
    n.__typename !== "JSONFieldEntry" ? [n] : []
  );

  return (
    <div className="node">
      <div className="field">
        <div className="fieldname">id</div>
        <div className="value">{node.id.split(':')[1]}</div>
      </div>
      {props
        .map((n, i) => (
          <div className="field" key={`${parentId}${n.key}${i}`}>
            <div className="fieldname">{`${n.key} (${n.typename})`}</div>
            <div className="value">{n.json as string}</div>
          </div>
        ))}
      {relationships.map((relationship) => {
        const index = node.fields.findIndex((field) =>
          relationship.key === field.key
        );
        const path = /\|data$/.test(parentId)
          ? `${parentId}.${relationship.key}`
          : `${parentId}.fields.${index}`;
        let id = path;

        if (relationship.__typename === "VertexFieldEntry") {
          id += `.${relationship.__typename}.${relationship.id}`;
        } else if (relationship.__typename === "VertexListFieldEntry") {
          id += `.${relationship.__typename}.${relationship.ids.join(",")}`;
        } else {
          throw new Error(`illegal FieldEntry`);
        }

        return (
          <TreeItem
            key={id}
            nodeId={id}
            label={`${relationship.key} (${relationship.typenames.join(", ")})`}
          >
            {relationship.data && relationship.__typename === "VertexFieldEntry"
              ? (
                <TreeItem
                  key={relationship.data.id}
                  nodeId={relationship.data.id}
                  label={
                    <Node parentId={`${path}.data`} node={relationship.data} />
                  }
                />
              )
              : relationship.__typename === "VertexListFieldEntry" &&
                  !!relationship.data
              ? relationship.data.map((n, i) => (
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
