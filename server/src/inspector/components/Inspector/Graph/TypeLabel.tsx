export interface TypeLabelProps {
  fieldname: string;
  typenames: string[];
}

export function TypeLabel(
  { fieldname, typenames }: TypeLabelProps,
) {
  return (
    <div className="type-label">
      <div>{fieldname}</div>
      <div>({typenames.join(" | ")})</div>
    </div>
  );
}
