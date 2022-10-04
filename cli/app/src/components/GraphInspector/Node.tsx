import { VertexNode } from "../../../../graphql/types";
import { Loader } from "../Loader/Loader";
import { StyledTreeItem } from "./StyledTreeItem";
import { TypeLabel } from "./TypeLabel";

interface NodeProps {
  parentId: string;
  node: VertexNode;
}

export function Node({ parentId, node }: NodeProps): JSX.Element {
  const props = node.fields.flatMap((n) =>
    n.__typename === "JSONFieldEntry" ? [n] : []
  );

  const relationships = node.fields.flatMap((n) =>
    n.__typename !== "JSONFieldEntry" ? [n] : []
  );

  return (
    <>
      <div className="angle">{`{`}</div>
      <div className="node">
        <div className="field">
          <span className="fieldname">id</span>
          <div className="type">(string)</div>
          <div className="colon">:</div>
          <span className="value">{node.id.split(":")[1]}</span>
        </div>
        {props
          .map((n, i) => (
            <div className="field" key={`${parentId}${n.key}${i}`}>
              <div className="fieldname">{n.key}</div>
              <div className="type">{`(${n.typename})`}</div>
              <div className="colon">:</div>
              <div className="value">
                {n.typename === "String" && <span>&quot;</span>}
                {n.json as string}
                {n.typename === "String" && <span>&quot;</span>}
              </div>
            </div>
          ))}
        {relationships.map((relationship) => {
          const index = node.fields.findIndex((field) =>
            relationship.key === field.key
          );
          const path = /\|materialized$/.test(parentId)
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
            <StyledTreeItem
              key={id}
              nodeId={id}
              label={
                <TypeLabel
                  fieldname={relationship.key}
                  typenames={relationship.typenames}
                />
              }
            >
              {relationship.materialized &&
                  relationship.__typename === "VertexFieldEntry"
                ? (
                  <StyledTreeItem
                    key={relationship.materialized.id}
                    nodeId={relationship.materialized.id}
                    label={
                      <Node
                        parentId={`${path}.materialized`}
                        node={relationship.materialized}
                      />
                    }
                  />
                )
                : relationship.__typename === "VertexListFieldEntry" &&
                    !!relationship.materialized
                ? relationship.materialized.map((n, i) => (
                  <StyledTreeItem
                    key={n.id}
                    nodeId={n.id}
                    label={
                      <Node parentId={`${path}.materialized.${i}`} node={n} />
                    }
                  />
                ))
                : <Loader debug={relationship} />}
            </StyledTreeItem>
          );
        })}
        <div className="angle">{`},`}</div>
      </div>
    </>
  );
}
