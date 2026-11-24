/**
 * @file auth.types.ts
 * @description Definiciones de tipos e interfaces estrictas para Autenticación,
 *              Roles (RBAC) y Bitácora de Auditoría Inmutable (audit_logs).
 */

import { QueryResultRow } from 'pg';

/**
 * Roles oficiales permitidos en la plataforma del Dojo.
 */
export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';

/**
 * Tipos de acciones soportadas en la bitácora de auditoría inmutable.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'RENEW_MEMBERSHIP'
  | 'BELT_PROMOTION'
  | 'ATTENDANCE_CHECKIN'
  | 'ATTENDANCE_OVERRIDE'
  | 'OCR_SCAN';

/**
 * Representación de una fila de la tabla `users` en PostgreSQL.
 */
export interface UserRow extends QueryResultRow {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Representación pública y segura de un usuario (sin hash de contraseña).
 */
export interface PublicUserProfile {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  studentId?: string | null;
}

/**
 * Carga útil codificada dentro de los tokens JWT (Access y Refresh).
 */
export interface JwtUserPayload {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  studentId?: string | null;
}

/**
 * Petición de inicio de sesión recibida desde Web o App Android.
 */
export interface LoginRequestDto {
  username: string;
  password?: string;
  deviceInfo?: string;
}

/**
 * Respuesta entregada al iniciar sesión con tokens de larga duración por defecto.
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  persistentSession: boolean;
  user: PublicUserProfile;
}

/**
 * DTO para crear un nuevo usuario o asignar rol (exclusivo para ADMIN).
 */
export interface CreateUserDto {
  username: string;
  email?: string | null;
  password: string;
  fullName: string;
  role: UserRole;
}

/**
 * DTO para registrar un evento inmutable en la tabla `audit_logs`.
 */
export interface CreateAuditLogDto {
  actorUserId: string | null;
  actorFullName: string;
  actorRole: UserRole;
  action: AuditAction;
  targetTable: string;
  targetRecordId: string;
  description: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Fila devuelta al consultar el historial de auditoría.
 */
export interface AuditLogRow extends QueryResultRow {
  id: string;
  actor_user_id: string | null;
  actor_full_name: string;
  actor_role: UserRole;
  action: AuditAction;
  target_table: string;
  target_record_id: string;
  description: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}
