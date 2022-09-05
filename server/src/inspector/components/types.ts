export const views = ['Meta', 'Graph'] as const;

export type Views = (typeof views)[number];