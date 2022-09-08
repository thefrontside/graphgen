import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";

export function Item(
  { typename, id, fields }: {
    typename: string;
    id: string;
    // deno-lint-ignore no-explicit-any
    fields: Record<string, any>;
  },
): JSX.Element {
  const props = Object.entries(fields).filter(([k, v]) =>
    v?.kind !== "relationship"
  );

  const relationships = Object.entries(fields).filter(([k, v]) =>
    v?.kind === "relationship"
  );

  return (
    <div className="sub-meta" style={{ display: "inline-block" }}>
      <table>
        <tbody>
          {props
            .map(([k, v]) => (
              <tr key={id}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          {relationships.map(([k, v]) => {
            const relationshipId = `${v.id}.${v.typenames[0]}`;
            console.log({ relationshipId });
            return (
              <TreeItem key={relationshipId} nodeId={relationshipId} label={k}>
                <Loader />
              </TreeItem>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
