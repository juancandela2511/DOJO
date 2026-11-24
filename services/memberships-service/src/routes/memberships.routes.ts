/**
 * @file memberships.routes.ts
 * @description Rutas HTTP del microservicio `memberships-service` (:3003).
 */

import { Router } from 'express';
import { membershipsController } from '../controllers/memberships.controller';

export const membershipsRouter: Router = Router();

membershipsRouter.get('/memberships', (req, res) =>
  membershipsController.listMemberships(req, res)
);
membershipsRouter.get('/memberships/student/:studentId', (req, res) =>
  membershipsController.getByStudent(req, res)
);
membershipsRouter.post('/memberships/student/:studentId/renew', (req, res) =>
  membershipsController.confirmRenewal(req, res)
);
