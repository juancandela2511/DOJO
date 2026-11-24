/**
 * @file attendance.service.ts
 * @description Servicio de asistencia por Geofencing GPS (Android), panel en vivo
 *              "Quién está en clase actualmente", override manual del ADMIN y registro
 *              de técnicas practicadas en clase por parte del AYUDANTE o ADMIN.
 */

import { executeQuery, recordAttendanceAudit } from '../db/pool';
import {
  AttendanceActor,
  AttendanceMethod,
  AttendanceSessionRow,
  GeofenceEvaluationResult,
  GpsGeofencePingDto,
  RecordClassActivityDto,
} from '../types/attendance.types';
import {
  calculateHaversineDistanceMeters,
  getDojoGeofenceParameters,
} from '../utils/geofence.util';

/**
 * Servicio principal de asistencia y bitácora de clases.
 */
export class AttendanceService {
  /**
   * Procesa un ping de coordenadas GPS desde la App Android del estudiante.
   * Si el estudiante está dentro del radio del Dojo durante el tiempo mínimo continuo
   * (ej. >= 15 min), marca automáticamente su asistencia (`AUTO_GPS`) y dispara la
   * notificación "Estás en clase".
   */
  public async processGpsGeofencePing(
    dto: GpsGeofencePingDto,
    actor: AttendanceActor
  ): Promise<GeofenceEvaluationResult> {
    const config = getDojoGeofenceParameters();
    const distanceMeters = calculateHaversineDistanceMeters(
      dto.latitude,
      dto.longitude,
      config.dojoLatitude,
      config.dojoLongitude
    );

    const insideDojoRadius = distanceMeters <= config.radiusMeters;
    const dwellRequirementMet = dto.dwellTimeMinutes >= config.minDwellMinutes;

    if (!insideDojoRadius || !dwellRequirementMet) {
      return {
        insideDojoRadius,
        distanceMeters,
        configuredRadiusMeters: config.radiusMeters,
        minimumDwellMinutes: config.minDwellMinutes,
        dwellRequirementMet,
        attendanceTriggered: false,
        notificationMessage: null,
        session: null,
      };
    }

    // Registrar o actualizar la asistencia automática del día (AUTO_GPS)
    const upsertSql = `
      INSERT INTO attendance_sessions (
        student_id, session_date, check_in_time, is_currently_in_class,
        detection_method, gps_latitude, gps_longitude, gps_distance_meters,
        dwell_time_minutes, recorded_by_user_id, recorded_by_role
      ) VALUES (
        $1, CURRENT_DATE, NOW(), TRUE,
        'AUTO_GPS', $2, $3, $4,
        $5, $6, $7
      )
      ON CONFLICT (student_id, session_date)
      DO UPDATE SET
        is_currently_in_class = TRUE,
        gps_latitude = EXCLUDED.gps_latitude,
        gps_longitude = EXCLUDED.gps_longitude,
        gps_distance_meters = EXCLUDED.gps_distance_meters,
        dwell_time_minutes = GREATEST(attendance_sessions.dwell_time_minutes, EXCLUDED.dwell_time_minutes),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await executeQuery<AttendanceSessionRow>(upsertSql, [
      dto.studentId,
      dto.latitude,
      dto.longitude,
      distanceMeters,
      dto.dwellTimeMinutes,
      actor.userId,
      actor.role,
    ]);

    const session = result.rows[0];
    const notificationMsg = `Estás en clase: Presencia confirmada en el Dojo (${distanceMeters}m del tatami, ${dto.dwellTimeMinutes} min).`;

    // Crear notificación local/push en la tabla notifications para la App Android
    await executeQuery(
      `INSERT INTO notifications (user_id, student_id, notification_type, title, message)
       SELECT COALESCE(s.user_id, $1), s.id, 'IN_CLASS_GPS', '🥋 Estás en clase', $2
       FROM students s WHERE s.id = $3`,
      [actor.userId, notificationMsg, dto.studentId]
    );

    await recordAttendanceAudit({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'ATTENDANCE_CHECKIN',
      targetRecordId: session.id,
      description: `Asistencia automática por Geofencing GPS (distancia: ${distanceMeters}m, permanencia: ${dto.dwellTimeMinutes} min).`,
      oldData: null,
      newData: session as unknown as Record<string, unknown>,
    });

    return {
      insideDojoRadius: true,
      distanceMeters,
      configuredRadiusMeters: config.radiusMeters,
      minimumDwellMinutes: config.minDwellMinutes,
      dwellRequirementMet: true,
      attendanceTriggered: true,
      notificationMessage: notificationMsg,
      session,
    };
  }

  /**
   * Lista en tiempo real quiénes se encuentran actualmente en clase en el tatami.
   */
  public async listCurrentlyInClass(): Promise<AttendanceSessionRow[]> {
    const sql = `
      SELECT a.*,
             s.first_name || ' ' || s.last_name AS student_full_name,
             s.document_number,
             b.name AS belt_name,
             b.color_hex AS belt_color_hex
      FROM attendance_sessions a
      JOIN students s ON s.id = a.student_id
      JOIN belts b ON b.id = s.current_belt_id
      WHERE a.session_date = CURRENT_DATE AND a.is_currently_in_class = TRUE
      ORDER BY a.check_in_time DESC
    `;
    const result = await executeQuery<AttendanceSessionRow>(sql);
    return result.rows;
  }

  /**
   * Permite al AYUDANTE o ADMIN registrar qué técnicas/actividades practicó un estudiante
   * en la sesión del día, o corregir manualmente si está o no en clase (si el GPS falla).
   * Si no se envían técnicas, queda registrada la asistencia simple sin descripción.
   */
  public async recordOrOverrideClassSession(
    dto: RecordClassActivityDto,
    actor: AttendanceActor
  ): Promise<AttendanceSessionRow> {
    const method: AttendanceMethod =
      actor.role === 'ADMIN' ? 'MANUAL_ADMIN' : 'MANUAL_AYUDANTE';

    const existingResult = await executeQuery<AttendanceSessionRow>(
      `SELECT * FROM attendance_sessions
       WHERE student_id = $1 AND session_date = COALESCE($2::date, CURRENT_DATE)
       LIMIT 1`,
      [dto.studentId, dto.sessionDate || null]
    );
    const previousData = existingResult.rows[0] ?? null;

    const sql = `
      INSERT INTO attendance_sessions (
        student_id, session_date, check_in_time, is_currently_in_class,
        detection_method, techniques_practiced, training_observations,
        recorded_by_user_id, recorded_by_role
      ) VALUES (
        $1, COALESCE($2::date, CURRENT_DATE), NOW(), COALESCE($3, TRUE),
        $4, $5, $6,
        $7, $8
      )
      ON CONFLICT (student_id, session_date)
      DO UPDATE SET
        is_currently_in_class = COALESCE($3, attendance_sessions.is_currently_in_class),
        check_out_time = CASE WHEN $3 = FALSE THEN NOW() ELSE attendance_sessions.check_out_time END,
        techniques_practiced = COALESCE($5, attendance_sessions.techniques_practiced),
        training_observations = COALESCE($6, attendance_sessions.training_observations),
        recorded_by_user_id = $7,
        recorded_by_role = $8,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await executeQuery<AttendanceSessionRow>(sql, [
      dto.studentId,
      dto.sessionDate || null,
      dto.isCurrentlyInClass ?? true,
      method,
      dto.techniquesPracticed ?? null,
      dto.trainingObservations ?? null,
      actor.userId,
      actor.role,
    ]);

    const saved = result.rows[0];

    await recordAttendanceAudit({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'ATTENDANCE_OVERRIDE',
      targetRecordId: saved.id,
      description: `Registro/actualización de clase por ${actor.role} (${actor.fullName}). En clase: ${saved.is_currently_in_class}. Técnicas: ${saved.techniques_practiced || 'Asistencia simple sin descripción'}.`,
      oldData: previousData ? (previousData as unknown as Record<string, unknown>) : null,
      newData: saved as unknown as Record<string, unknown>,
    });

    return saved;
  }

  /**
   * Obtiene el historial completo de clases tomadas por un estudiante y las técnicas practicadas.
   */
  public async getStudentClassHistory(studentId: string): Promise<AttendanceSessionRow[]> {
    const sql = `
      SELECT a.*,
             s.first_name || ' ' || s.last_name AS student_full_name,
             b.name AS belt_name,
             b.color_hex AS belt_color_hex
      FROM attendance_sessions a
      JOIN students s ON s.id = a.student_id
      JOIN belts b ON b.id = s.current_belt_id
      WHERE a.student_id::text = $1 OR s.document_number = $1
      ORDER BY a.session_date DESC, a.check_in_time DESC
    `;
    const result = await executeQuery<AttendanceSessionRow>(sql, [studentId]);
    return result.rows;
  }
}

export const attendanceService = new AttendanceService();
