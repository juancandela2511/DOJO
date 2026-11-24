/**
 * @file pool.ts
 * @description Pool de conexión a PostgreSQL y emisor de auditoría inmutable
 *              para `memberships-service`.
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
  max: 20,
});

export async function executeQuery<T extends QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<QueryResult<T>> {
  const mutableParams: unknown[] | undefined = params ? [...params] : undefined;
  return dbPool.query<T>(text, mutableParams);
}

/**
 * Registra en `audit_logs` quién aprobó una renovación de mensualidad o cambio de estado.
 */
export async function recordMembershipAudit(payload: {
  actorUserId: string;
  actorFullName: string;
  actorRole: 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
  action: 'RENEW_MEMBERSHIP' | 'UPDATE';
  targetRecordId: string;
  description: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}): Promise<void> {
  await executeQuery(
    `INSERT INTO audit_logs (
       actor_user_id, actor_full_name, actor_role, action,
       target_table, target_record_id, description, old_data, new_data
     ) VALUES ($1, $2, $3, $4, 'memberships', $5, $6, $7, $8)`,
    [
      payload.actorUserId,
      payload.actorFullName,
      payload.actorRole,
      payload.action,
      payload.targetRecordId,
      payload.description,
      payload.oldData ? JSON.stringify(payload.oldData) : null,
      payload.newData ? JSON.stringify(payload.newData) : null,
    ]
  );
}
