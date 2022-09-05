export const views = ['Meta', 'Graph'] as const;

export type Views = (typeof views)[number];

export interface Meta {
  id: string;
  name: string;
  // deno-lint-ignore no-explicit-any
  attributes: Record<string, any>;
  children: Omit<Meta, 'children'>[];
}