export const views = ['Meta', 'Tree', 'Graph'] as const;

export type Views = (typeof views)[number];