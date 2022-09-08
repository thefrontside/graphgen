import { Meta } from "../types.ts";

export function MetaView({ label }: { label: string }): JSX.Element {
  return (
    <div className="meta">
      <strong>{label}</strong>
    </div>
  );
}