/**
 * @file notifications.routes.ts
 * @description Rutas HTTP del microservicio `notifications-service` (:3005).
 */

import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller';

export const notificationsRouter: Router = Router();

notificationsRouter.get('/notifications/:userOrStudentId', (req, res) =>
  notificationsController.listForUser(req, res)
);
notificationsRouter.post('/notifications', (req, res) =>
  notificationsController.create(req, res)
);
notificationsRouter.patch('/notifications/:id/read', (req, res) =>
  notificationsController.markRead(req, res)
);
notificationsRouter.post('/notifications/dispatch-membership-alerts', (req, res) =>
  notificationsController.triggerMembershipAlerts(req, res)
);
