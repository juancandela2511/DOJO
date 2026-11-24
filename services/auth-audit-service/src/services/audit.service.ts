/**
 * @file audit.service.ts
 * @description Servicio encargado de registrar y consultar eventos en la tabla
 *              inmutable `audit_logs`. Registra qué usuario (user_id, nombre y rol)
 *              creó, editó o eliminó cualquier entidad y guarda old_data vs new_data.
 */

import { executeQuery } from '../db/pool';
import { AuditLogRow, CreateAuditLogDto } from '../types/auth.types';

/**
 * Clase de servicio para la gestión de la bitácora de auditoría inmutable.
 */
export class AuditService {
  /**
   * Inserta un nuevo registro inmutable en la tabla `audit_logs`.
   *
   * @param {CreateAuditLogDto} payload Datos completos del autor, entidad y cambios.
   * @returns {Promise<AuditLogRow>} Registro de auditoría recién almacenado.
   */
  public async recordAuditLog(payload: CreateAuditLogDto): Promise<AuditLogRow> {
    const sql = `
      INSERT INTO audit_logs (
        actor_user_id,
        actor_full_name,
        actor_role,
        action,
        target_table,
        target_record_id,
        description,
        old_data,
        new_data,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const params: ReadonlyArray<unknown> = [
      payload.actorUserId,
      payload.actorFullName,
      payload.actorRole,
      payload.action,
      payload.targetTable,
      payload.targetRecordId,
      payload.description,
      payload.oldData ? JSON.stringify(payload.oldData) : null,
      payload.newData ? JSON.stringify(payload.newData) : null,
      payload.ipAddress || null,
    ];

    const result = await executeQuery<AuditLogRow>(sql, params);
    return result.rows[0];
  }

  /**
   * Consulta el historial de auditoría con filtros opcionales (exclusivo para ADMIN).
   *
   * @param {number} limit Cantidad máxima de registros a devolver.
   * @param {string} [targetTable] Filtro opcional por nombre de tabla afectada.
   * @param {string} [actorRole] Filtro opcional por rol que ejecutó la acción.
   * @returns {Promise<AuditLogRow[]>} Lista ordenada cronológicamente (más recientes primero).
   */
  public async listAuditLogs(
    limit: number = 100,
    targetTable?: string,
    actorRole?: string
  ): Promise<AuditLogRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (targetTable && targetTable.trim().length > 0) {
      params.push(targetTable.trim());
      conditions.push(`target_table = $${params.length}`);
    }

    if (actorRole && actorRole.trim().length > 0) {
      params.push(actorRole.trim());
      conditions.push(`actor_role = $${params.length}`);
    }

    const safeLimit = Math.min(Math.max(1, limit), 500);
    params.push(safeLimit);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length}
    `;

    const result = await executeQuery<AuditLogRow>(sql, params);
    return result.rows;
  }
}

export const auditService = new AuditService();
