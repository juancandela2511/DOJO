/**
 * @file memberships.controller.ts
 * @description Controlador HTTP para consulta del semáforo de mensualidades
 *              y confirmación explícita de pago/renovación por parte de un ADMIN.
 */

import { Request, Response } from 'express';
import { membershipsService } from '../services/memberships.service';
import {
  AdminActorContext,
  ConfirmPaymentRenewalDto,
  UserRole,
} from '../types/membership.types';

function extractActor(req: Request): AdminActorContext {
  return {
    userId: (req.headers['x-user-id'] as string) || '11111111-1111-4111-8111-111111111111',
    fullName: (req.headers['x-user-fullname'] as string) || 'Sensei Administrador Principal',
    role: ((req.headers['x-user-role'] as UserRole) || 'ADMIN') as UserRole,
  };
}

/**
 * Controlador de endpoints de Mensualidades y Semáforo Visual.
 */
export class MembershipsController {
  /**
   * GET /api/memberships
   * Lista todas las mensualidades con su indicador de semáforo (VERDE / AMARILLO / ROJO).
   * Soporta `?activeOnly=true` para el panel en tiempo real de "Estudiantes activos al día".
   */
  public async listMemberships(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const rows = await membershipsService.listMembershipsTrafficLight(activeOnly);
      res.status(200).json({
        success: true,
        count: rows.length,
        data: rows,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al consultar mensualidades.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * GET /api/memberships/student/:studentId
   * Consulta el semáforo, días transcurridos y días restantes de un estudiante específico.
   */
  public async getByStudent(req: Request, res: Response): Promise<void> {
    try {
      const row = await membershipsService.getStudentMembership(req.params.studentId);
      if (!row) {
        res.status(404).json({
          success: false,
          message: 'No se encontró mensualidad para el estudiante indicado.',
        });
        return;
      }
      res.status(200).json({ success: true, data: row });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al obtener mensualidad.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/memberships/student/:studentId/renew
   * Acción exclusiva de ADMIN: "Confirmar Pago / Renovar Mensualidad".
   * Desbloquea una mensualidad VENCIDA y registra en auditoría quién aprobó el pago.
   */
  public async confirmRenewal(req: Request, res: Response): Promise<void> {
    try {
      const actor = extractActor(req);
      if (actor.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Acceso denegado: Solo un ADMIN puede confirmar pagos y renovar mensualidades.',
        });
        return;
      }

      const dto = req.body as ConfirmPaymentRenewalDto;
      const renewed = await membershipsService.confirmPaymentAndRenew(
        req.params.studentId,
        dto,
        actor
      );

      res.status(200).json({
        success: true,
        message: 'Pago confirmado y mensualidad renovada exitosamente.',
        data: renewed,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al renovar mensualidad.';
      res.status(400).json({ success: false, message: msg });
    }
  }
}

export const membershipsController = new MembershipsController();
