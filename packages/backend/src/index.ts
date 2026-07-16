import { serve } from '@hono/node-server';
import app from './api/index.js';
import { env } from './config/env.js';
import { runCustomMigrations } from './db/migrate.js';

await runCustomMigrations();

serve({ fetch: app.fetch, port: env.BACKEND_PORT }, (info) => {
  console.log(`[API] Server running at http://localhost:${info.port}`);
});
