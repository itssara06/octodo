import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL || '';
    const sql = neon(url);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}
