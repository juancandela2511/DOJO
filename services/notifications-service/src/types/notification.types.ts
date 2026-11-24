/**
 * @file notification.types.ts
 * @description Tipos estrictos para el microservicio de notificaciones locales/push.
 */

import { QueryResultRow } from 'pg';

export type NotificationType =
  | 'IN_CLASS_GPS'
  | 'MEMBERSHIP_WARNING'
  | 'MEMBERSHIP_EXPIRED'
  | 'BELT_PROMOTION';

export interface NotificationRow extends QueryResultRow {
  id: string;
  user_id: string;
  student_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  delivered_to_device: boolean;
  created_at: Date;
}

export interface CreateNotificationDto {
  userId: string;
  studentId?: string | null;
  notificationType: NotificationType;
  title: string;
  message: string;
}
