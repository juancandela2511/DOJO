/**
 * @file pool.ts
 * @description Configuración del pool de conexiones a PostgreSQL para auth-audit-service.
 *              Cumple con TypeScript estricto (prohibido el uso de any) y < 300 líneas.
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Instancia única del Pool de PostgreSQL conectada mediante DATABASE_URL o variables discretas.
 */
export const dbPool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST || 'dojo-postgres',
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || 'dojo_management_db',
  user: process.env.POSTGRES_USER || 'dojo_admin',
  password: process.env.POSTGRES_PASSWORD || 'DojoSuperSecretDbPass2026!',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Ejecuta una consulta SQL parametrizada con tipado genérico seguro.
 *
 * @template T Tipo de fila esperada en el resultado.
 * @param {string} text Consulta SQL con placeholders ($1, $2...).
 * @param {ReadonlyArray<unknown>} [params] Valores parametrizados para prevenir inyección SQL.
 * @returns {Promise<QueryResult<T>>} Resultado tipado de PostgreSQL.
 */
export async function executeQuery<T extends QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<QueryResult<T>> {
  const mutableParams: unknown[] | undefined = params ? [...params] : undefined;
  return dbPool.query<T>(text, mutableParams);
}
