export const views = ['Relationships', 'Tree', 'Object'] as const;

export type Views = (typeof views)[number];