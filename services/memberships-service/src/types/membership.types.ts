/**
 * @file membership.types.ts
 * @description Tipos estrictos para el control de mensualidades, el semáforo visual
 *              (VERDE -> AMARILLO -> ROJO) y la renovación manual por ADMIN.
 */

import { QueryResultRow } from 'pg';

export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
export type MembershipStatus = 'ACTIVA' | 'POR_VENCER' | 'VENCIDA' | 'SUSPENDIDA';
export type TrafficLightColor = 'VERDE' | 'AMARILLO' | 'ROJO';

/**
 *Fila devuelta por la vista inteligente `vw_student_membership_traffic_light`.
 */
export interface MembershipTrafficLightRow extends QueryResultRow {
  membership_id: string;
  student_id: string;
  document_number: string;
  student_full_name: string;
  belt_name: string;
  belt_color_hex: string;
  start_date: string;
  end_date: string;
  cycle_days: number;
  days_elapsed: number;
  days_remaining: number;
  computed_status: MembershipStatus;
  traffic_light_color: TrafficLightColor;
  last_payment_confirmed_at: Date | null;
  last_confirmed_by_admin_id: string | null;
}

/**
 * DTO enviado cuando un ADMIN hace clic explícito en "Confirmar Pago / Renovar Mensualidad".
 */
export interface ConfirmPaymentRenewalDto {
  cycleDays?: number;
  amountPaid: number;
  paymentReference?: string;
  notes?: string;
}

/**
 * Actor autenticado que ejecuta la petición.
 */
export interface AdminActorContext {
  userId: string;
  fullName: string;
  role: UserRole;
}
