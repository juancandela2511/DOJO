/**
 * @file attendance.controller.ts
 * @description Controlador HTTP para Geofencing GPS desde Android, panel en vivo
 *              "Quién está en clase actualmente" y registro de técnicas por el Ayudante/Admin.
 */

import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import {
  AttendanceActor,
  GpsGeofencePingDto,
  RecordClassActivityDto,
  UserRole,
} from '../types/attendance.types';

function extractActor(req: Request): AttendanceActor {
  return {
    userId: (req.headers['x-user-id'] as string) || '11111111-1111-4111-8111-111111111111',
    fullName: (req.headers['x-user-fullname'] as string) || 'Sensei Administrador Principal',
    role: ((req.headers['x-user-role'] as UserRole) || 'ADMIN') as UserRole,
  };
}

/**
 * Controlador de endpoints de Asistencia, Geofencing y Historial de Clases.
 */
export class AttendanceController {
  /**
   * POST /api/attendance/geofence-ping
   * Recibe coordenadas GPS de la app Android y marca asistencia automática (`AUTO_GPS`)
   * si el estudiante permanece dentro del radio del Dojo durante el tiempo configurado.
   */
  public async handleGeofencePing(req: Request, res: Response): Promise<void> {
    try {
      const actor = extractActor(req);
      const dto = req.body as GpsGeofencePingDto;
      if (!dto.studentId || dto.latitude === undefined || dto.longitude === undefined) {
        res.status(400).json({
          success: false,
          message: 'Se requieren studentId, latitude, longitude y dwellTimeMinutes.',
        });
        return;
      }

      const evaluation = await attendanceService.processGpsGeofencePing(dto, actor);
      res.status(200).json({
        success: true,
        data: evaluation,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al procesar ping de Geofencing.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/attendance/live
   * Devuelve la lista en tiempo real de quiénes están en clase actualmente en el Dojo.
   */
  public async getLiveInClass(_req: Request, res: Response): Promise<void> {
    try {
      const list = await attendanceService.listCurrentlyInClass();
      res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al consultar clase en vivo.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/attendance/class-log
   * Permite a `ADMIN` o `AYUDANTE` registrar qué técnicas practicó un estudiante en clase
   * o corregir manualmente su asistencia en tiempo real.
   */
  public async recordClassLog(req: Request, res: Response): Promise<void> {
    try {
      const actor = extractActor(req);
      if (actor.role !== 'ADMIN' && actor.role !== 'AYUDANTE') {
        res.status(403).json({
          success: false,
          message: 'Solo los roles ADMIN o AYUDANTE pueden registrar técnicas o editar asistencia.',
        });
        return;
      }

      const dto = req.body as RecordClassActivityDto;
      if (!dto.studentId) {
        res.status(400).json({
          success: false,
          message: 'El campo studentId es obligatorio.',
        });
        return;
      }

      const session = await attendanceService.recordOrOverrideClassSession(dto, actor);
      res.status(200).json({
        success: true,
        message: 'Asistencia y bitácora de clase guardadas y auditadas correctamente.',
        data: session,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar registro de clase.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/attendance/student/:studentId
   * Obtiene el historial completo de clases tomadas por un estudiante.
   */
  public async getStudentHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await attendanceService.getStudentClassHistory(req.params.studentId);
      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al consultar historial de clases.';
      res.status(500).json({ success: false, message: msg });
    }
  }
}

export const attendanceController = new AttendanceController();
