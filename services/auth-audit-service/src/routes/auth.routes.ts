/**
 * @file auth.routes.ts
 * @description Definición de rutas HTTP para autenticación persistente, usuarios y auditoría.
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

export const authAuditRouter: Router = Router();

// Rutas públicas de autenticación y renovación persistente de sesión
authAuditRouter.post('/auth/login', (req, res) => authController.login(req, res));
authAuditRouter.post('/auth/refresh', (req, res) => authController.refresh(req, res));

// Gestión de usuarios y roles (Exclusivo ADMIN)
authAuditRouter.post('/auth/users', (req, res) => authController.createUser(req, res));

// Bitácora de auditoría inmutable (Registro interno entre microservicios y consulta ADMIN)
authAuditRouter.post('/audit/logs', (req, res) => authController.recordInternalAudit(req, res));
authAuditRouter.get('/audit/logs', (req, res) => authController.getAuditLogs(req, res));
