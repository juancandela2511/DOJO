/**
 * @file notifications.controller.ts
 * @description Controlador HTTP para el microservicio `notifications-service` (:3005).
 */

import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../types/notification.types';

export class NotificationsController {
  /**
   * GET /api/notifications/:userOrStudentId
   * Lista las notificaciones pendientes e históricas para la App Android o panel Web.
   */
  public async listForUser(req: Request, res: Response): Promise<void> {
    try {
      const items = await notificationsService.listUserNotifications(
        req.params.userOrStudentId
      );
      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al listar notificaciones.';
      res.status(500).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/notifications
   * Dispara una nueva notificación hacia un estudiante/usuario.
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const dto = req.body as CreateNotificationDto;
      const created = await notificationsService.createNotification(dto);
      res.status(201).json({ success: true, data: created });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al crear notificación.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marca una notificación como leída por el dispositivo Android.
   */
  public async markRead(req: Request, res: Response): Promise<void> {
    try {
      const updated = await notificationsService.markAsRead(req.params.id);
      res.status(200).json({ success: true, data: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar notificación.';
      res.status(400).json({ success: false, message: msg });
    }
  }

  /**
   * POST /api/notifications/dispatch-membership-alerts
   * Evalúa el semáforo de mensualidades y envía alertas preventivas (Amarillo) o de vencimiento (Rojo).
   */
  public async triggerMembershipAlerts(_req: Request, res: Response): Promise<void> {
    try {
      const dispatched = await notificationsService.dispatchMembershipAlerts();
      res.status(200).json({
        success: true,
        dispatchedCount: dispatched,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al despachar alertas.';
      res.status(500).json({ success: false, message: msg });
    }
  }
}

export const notificationsController = new NotificationsController();
