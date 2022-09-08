import TreeItem from "@mui/lab/TreeItem";
import { Loader } from "../Loader/Loader.tsx";

export function Item(
  // deno-lint-ignore no-explicit-any
  { item }: { item: Record<string, any> },
): JSX.Element {
  const props = Object.entries(item).filter(([k, v]) =>
    v?.kind !== "relationship"
  );

  const relationships = Object.entries(item).filter(([k, v]) =>
  v?.kind === "relationship"
  );

  return (
    <div className="sub-meta" style={{ display: "inline-block" }}>
      <table>
        <tbody>
          {props
            .map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
            {relationships.map(([k, v]) => (
              <TreeItem key={k} nodeId={k} label={k}>
                <Loader/>
              </TreeItem>
            ))}
        </tbody>
      </table>
    </div>
  );
}
