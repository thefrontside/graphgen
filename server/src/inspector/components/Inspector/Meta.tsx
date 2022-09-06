import { Meta } from "../types.ts";

export function MetaView({ name }: Meta): JSX.Element {
  return (
    <div className="meta">
      <strong>{name}</strong>
    </div>
  );
}