/**
 * @file memberships.service.ts
 * @description Lógica de negocio del semáforo de mensualidades (Verde -> Amarillo -> Rojo)
 *              y cumplimiento estricto de la regla de NO renovación automática:
 *              Cuando una mensualidad vence, permanece en estado `VENCIDA` (Rojo) hasta
 *              que un usuario con rol `ADMIN` confirme explícitamente el pago.
 */

import { executeQuery, recordMembershipAudit } from '../db/pool';
import {
  AdminActorContext,
  ConfirmPaymentRenewalDto,
  MembershipTrafficLightRow,
} from '../types/membership.types';

/**
 * Servicio de control de mensualidades y semáforo visual.
 */
export class MembershipsService {
  /**
   * Sincroniza en base de datos todas las mensualidades cuya fecha final ya pasó,
   * marcándolas como `VENCIDA` sin renovarlas jamás automáticamente.
   */
  public async syncExpiredMemberships(): Promise<number> {
    const result = await executeQuery(
      `UPDATE memberships
       SET status = 'VENCIDA', updated_at = NOW()
       WHERE end_date < CURRENT_DATE AND status != 'VENCIDA'`
    );
    return result.rowCount || 0;
  }

  /**
   * Lista todas las mensualidades con su semáforo calculado en tiempo real
   * (días transcurridos, días restantes y color VERDE / AMARILLO / ROJO).
   *
   * @param {boolean} onlyActiveUpToDate Si es true, devuelve solo estudiantes activos con mensualidad al día.
   */
  public async listMembershipsTrafficLight(
    onlyActiveUpToDate: boolean = false
  ): Promise<MembershipTrafficLightRow[]> {
    await this.syncExpiredMemberships();

    const filterClause = onlyActiveUpToDate
      ? `WHERE computed_status IN ('ACTIVA', 'POR_VENCER')`
      : '';

    const sql = `
      SELECT *
      FROM vw_student_membership_traffic_light
      ${filterClause}
      ORDER BY days_remaining ASC
    `;

    const result = await executeQuery<MembershipTrafficLightRow>(sql);
    return result.rows;
  }

  /**
   * Obtiene el estado de mensualidad y semáforo de un estudiante específico.
   */
  public async getStudentMembership(
    studentId: string
  ): Promise<MembershipTrafficLightRow | null> {
    await this.syncExpiredMemberships();

    const result = await executeQuery<MembershipTrafficLightRow>(
      `SELECT *
       FROM vw_student_membership_traffic_light
       WHERE student_id::text = $1 OR document_number = $1
       LIMIT 1`,
      [studentId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * ACCIÓN EXCLUSIVA DE ADMIN: "Confirmar Pago / Renovar Mensualidad".
   * Reactiva una mensualidad vencida o extiende el ciclo por 30 días (o cycleDays configurables),
   * registra en el historial de pagos y deja constancia inmutable en `audit_logs`.
   */
  public async confirmPaymentAndRenew(
    studentId: string,
    dto: ConfirmPaymentRenewalDto,
    actor: AdminActorContext
  ): Promise<MembershipTrafficLightRow> {
    if (actor.role !== 'ADMIN') {
      throw new Error(
        'FORBIDDEN_RENEWAL: Solo un usuario con rol ADMIN puede confirmar pagos y reactivar una mensualidad.'
      );
    }

    const current = await this.getStudentMembership(studentId);
    if (!current) {
      throw new Error('NOT_FOUND: No se encontró registro de mensualidad para el estudiante.');
    }

    const cycleDays = dto.cycleDays && dto.cycleDays > 0 ? dto.cycleDays : 30;

    // Actualizar mensualidad iniciando nuevo ciclo a partir de hoy (o desde fecha de corte vigente)
    await executeQuery(
      `UPDATE memberships
       SET start_date = CURRENT_DATE,
           end_date = CURRENT_DATE + ($1 || ' days')::INTERVAL,
           cycle_days = $1,
           status = 'ACTIVA',
           amount_paid = $2,
           last_payment_confirmed_at = NOW(),
           last_confirmed_by_admin_id = $3,
           payment_reference = $4,
           notes = $5,
           updated_at = NOW()
       WHERE student_id = $6`,
      [
        cycleDays,
        dto.amountPaid,
        actor.userId,
        dto.paymentReference || `PAGO-${Date.now()}`,
        dto.notes || 'Renovación manual confirmada por ADMIN',
        current.student_id,
      ]
    );

    const renewed = await this.getStudentMembership(current.student_id);
    if (!renewed) {
      throw new Error('RENEWAL_ERROR: Error al recuperar la mensualidad renovada.');
    }

    // Guardar en el historial de pagos aprobados
    await executeQuery(
      `INSERT INTO membership_payment_history (
         membership_id, student_id, period_start_date, period_end_date,
         amount_paid, approved_by_admin_id, approved_by_admin_name, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        renewed.membership_id,
        renewed.student_id,
        renewed.start_date,
        renewed.end_date,
        dto.amountPaid,
        actor.userId,
        actor.fullName,
        dto.notes || null,
      ]
    );

    // Registrar en la bitácora inmutable de auditoría quién aprobó el pago
    await recordMembershipAudit({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'RENEW_MEMBERSHIP',
      targetRecordId: renewed.membership_id,
      description: `Confirmación manual de pago y renovación de mensualidad por ${cycleDays} días para ${renewed.student_full_name} ($${dto.amountPaid}).`,
      oldData: {
        previousStatus: current.computed_status,
        previousTrafficLight: current.traffic_light_color,
        previousEndDate: current.end_date,
      },
      newData: {
        newStatus: renewed.computed_status,
        newTrafficLight: renewed.traffic_light_color,
        newEndDate: renewed.end_date,
        amountPaid: dto.amountPaid,
        approvedByAdmin: actor.fullName,
      },
    });

    return renewed;
  }
}

export const membershipsService = new MembershipsService();
