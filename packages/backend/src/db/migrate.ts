import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runCustomMigrations() {
  try {
    const sqlPath = join(__dirname, 'migrations', '0001_hnsw_index.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    await db.execute(sql);
    console.log('[DB] Custom migrations applied successfully');
  } catch (err) {
    console.error('[DB] Failed to apply custom migrations:', err);
  }
}
