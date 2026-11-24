/**
 * @file pool.ts
 * @description Pool de conexión a PostgreSQL para `notifications-service`.
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const dbPool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST || 'dojo-postgres',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'dojo_management_db',
  user: process.env.POSTGRES_USER || 'dojo_admin',
  password: process.env.POSTGRES_PASSWORD || 'DojoSuperSecretDbPass2026!',
  max: 15,
});

export async function executeQuery<T extends QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<QueryResult<T>> {
  const mutableParams: unknown[] | undefined = params ? [...params] : undefined;
  return dbPool.query<T>(text, mutableParams);
}
