/**
 * @file notifications.service.ts
 * @description Servicio de envío y consulta de notificaciones Push/Locales para Android:
 *              1. Detección de ingreso a clase por ubicación ("Estás en clase").
 *              2. Alerta preventiva de mensualidad próxima a vencer (Amarillo) o vencida (Rojo).
 *              3. Ascenso de cinturón registrado.
 */

import { QueryResultRow } from 'pg';
import { executeQuery } from '../db/pool';
import { CreateNotificationDto, NotificationRow } from '../types/notification.types';

interface ExpiringMembershipLookupRow extends QueryResultRow {
  student_id: string;
  user_id: string;
  student_full_name: string;
  days_remaining: number;
  traffic_light_color: 'VERDE' | 'AMARILLO' | 'ROJO';
}

export class NotificationsService {
  /**
   * Crea una nueva notificación para un usuario/estudiante.
   */
  public async createNotification(dto: CreateNotificationDto): Promise<NotificationRow> {
    const result = await executeQuery<NotificationRow>(
      `INSERT INTO notifications (user_id, student_id, notification_type, title, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.userId, dto.studentId || null, dto.notificationType, dto.title, dto.message]
    );
    return result.rows[0];
  }

  /**
   * Obtiene las notificaciones de un usuario o estudiante ordenadas de más reciente a más antigua.
   */
  public async listUserNotifications(userOrStudentId: string): Promise<NotificationRow[]> {
    const result = await executeQuery<NotificationRow>(
      `SELECT *
       FROM notifications
       WHERE user_id::text = $1 OR student_id::text = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userOrStudentId]
    );
    return result.rows;
  }

  /**
   * Marca una notificación como leída y entregada al dispositivo Android.
   */
  public async markAsRead(notificationId: string): Promise<NotificationRow | null> {
    const result = await executeQuery<NotificationRow>(
      `UPDATE notifications
       SET is_read = TRUE, delivered_to_device = TRUE
       WHERE id = $1
       RETURNING *`,
      [notificationId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Escanea la vista del semáforo de mensualidades y genera alertas automáticas para
   * aquellos estudiantes cuya mensualidad esté en AMARILLO (próxima a vencer) o ROJO (vencida).
   */
  public async dispatchMembershipAlerts(): Promise<number> {
    const rowsResult = await executeQuery<ExpiringMembershipLookupRow>(
      `SELECT v.student_id, s.user_id, v.student_full_name, v.days_remaining, v.traffic_light_color
       FROM vw_student_membership_traffic_light v
       JOIN students s ON s.id = v.student_id
       WHERE s.user_id IS NOT NULL
         AND v.traffic_light_color IN ('AMARILLO', 'ROJO')`
    );

    let generatedCount = 0;
    for (const row of rowsResult.rows) {
      const isExpired = row.traffic_light_color === 'ROJO';
      const notifType = isExpired ? 'MEMBERSHIP_EXPIRED' : 'MEMBERSHIP_WARNING';
      const title = isExpired
        ? '🔴 Mensualidad Vencida — Renovación Requerida'
        : `🟡 Tu mensualidad vence en ${row.days_remaining} día(s)`;
      const message = isExpired
        ? `Hola ${row.student_full_name}, tu mensualidad se encuentra VENCIDA. Acércate al Sensei Administrador para confirmar tu pago y reactivar tu acceso.`
        : `Hola ${row.student_full_name}, te quedan ${row.days_remaining} día(s) de tu ciclo actual en el Dojo.`;

      await this.createNotification({
        userId: row.user_id,
        studentId: row.student_id,
        notificationType: notifType,
        title,
        message,
      });
      generatedCount += 1;
    }

    return generatedCount;
  }
}

export const notificationsService = new NotificationsService();
