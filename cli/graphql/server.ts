import { serve, serveStatic, Hono } from '../deps.ts';

const app = new Hono();

export async function main() {
  app.use('*', serveStatic({ root: './', path: 'dist' }));
  
  await serve(app.fetch);
}