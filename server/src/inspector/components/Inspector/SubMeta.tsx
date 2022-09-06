import { Meta } from "../types.ts";

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
