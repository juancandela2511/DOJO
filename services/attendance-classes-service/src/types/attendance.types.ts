/**
 * @file attendance.types.ts
 * @description Tipos e interfaces estrictas para el control de asistencia por Geofencing
 *              Android, el panel "En Clase Ahora" y el registro de técnicas por clase.
 */

import { QueryResultRow } from 'pg';

export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
export type AttendanceMethod = 'AUTO_GPS' | 'MANUAL_ADMIN' | 'MANUAL_AYUDANTE';

export interface AttendanceActor {
  userId: string;
  fullName: string;
  role: UserRole;
}

/**
 * Fila enriquecida de una sesión de entrenamiento (`attendance_sessions`).
 */
export interface AttendanceSessionRow extends QueryResultRow {
  id: string;
  student_id: string;
  student_full_name?: string;
  document_number?: string;
  belt_name?: string;
  belt_color_hex?: string;
  session_date: string;
  check_in_time: Date;
  check_out_time: Date | null;
  is_currently_in_class: boolean;
  detection_method: AttendanceMethod;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_distance_meters: number | null;
  dwell_time_minutes: number;
  techniques_practiced: string | null;
  training_observations: string | null;
  recorded_by_user_id: string | null;
  recorded_by_role: UserRole | null;
}

/**
 * Payload enviado por la App Android en segundo plano al detectar ubicación GPS.
 */
export interface GpsGeofencePingDto {
  studentId: string;
  latitude: number;
  longitude: number;
  dwellTimeMinutes: number;
}

/**
 * Resultado de la evaluación matemática del Geofence del Dojo.
 */
export interface GeofenceEvaluationResult {
  insideDojoRadius: boolean;
  distanceMeters: number;
  configuredRadiusMeters: number;
  minimumDwellMinutes: number;
  dwellRequirementMet: boolean;
  attendanceTriggered: boolean;
  notificationMessage: string | null;
  session: AttendanceSessionRow | null;
}

/**
 * DTO utilizado por el AYUDANTE o ADMIN para registrar qué hizo un estudiante
 * en la clase del día (técnicas practicadas y observaciones).
 */
export interface RecordClassActivityDto {
  studentId: string;
  sessionDate?: string;
  isCurrentlyInClass?: boolean;
  techniquesPracticed?: string | null;
  trainingObservations?: string | null;
}
