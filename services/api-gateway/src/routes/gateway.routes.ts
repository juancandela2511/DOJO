/**
 * @file gateway.routes.ts
 * @description Enrutador y Proxy inverso del API Gateway hacia los 5 microservicios de dominio,
 *              aplicando las reglas estrictas de permisos por rol (`ADMIN`, `AYUDANTE`, `ESTUDIANTE`).
 */

import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { gatewayConfig } from '../config/env.config';
import {
  enforceReadOnlyUnlessAdmin,
  requireRoles,
  verifyJwtToken,
} from '../middlewares/auth-rbac.middleware';

export const gatewayRouter: Router = Router();

/**
 * 1. RUTAS DE AUTENTICACIÓN Y AUDITORÍA (`auth-audit-service` :3001)
 * - /api/auth/login y /api/auth/refresh son públicas.
 * - /api/auth/users y /api/audit/* son exclusivas para el rol ADMIN.
 */
gatewayRouter.use(
  '/api/auth/login',
  createProxyMiddleware({
    target: `${gatewayConfig.services.authAuditUrl}/api/auth/login`,
    changeOrigin: true,
  })
);

gatewayRouter.use(
  '/api/auth/refresh',
  createProxyMiddleware({
    target: `${gatewayConfig.services.authAuditUrl}/api/auth/refresh`,
    changeOrigin: true,
  })
);

gatewayRouter.use(
  '/api/auth/users',
  verifyJwtToken,
  requireRoles(['ADMIN']),
  createProxyMiddleware({
    target: `${gatewayConfig.services.authAuditUrl}/api/auth/users`,
    changeOrigin: true,
  })
);

gatewayRouter.use(
  '/api/audit',
  verifyJwtToken,
  requireRoles(['ADMIN']),
  createProxyMiddleware({
    target: `${gatewayConfig.services.authAuditUrl}/api/audit`,
    changeOrigin: true,
  })
);

/**
 * 2. RUTAS DE ESTUDIANTES, CINTURONES, DOCUMENTOS Y OCR (`students-docs-service` :3002)
 * - ADMIN: Control total (CRUD, subir Fotos/CC/EPS, ejecutar escaneo OCR, registrar ascensos).
 * - AYUDANTE y ESTUDIANTE: Estricto SOLO LECTURA (GET).
 */
gatewayRouter.use(
  '/api/students',
  verifyJwtToken,
  requireRoles(['ADMIN', 'AYUDANTE', 'ESTUDIANTE']),
  enforceReadOnlyUnlessAdmin,
  createProxyMiddleware({
    target: `${gatewayConfig.services.studentsDocsUrl}/api/students`,
    changeOrigin: true,
  })
);

/**
 * 3. RUTAS DE MENSUALIDADES Y SEMÁFORO VISUAL (`memberships-service` :3003)
 * - ADMIN: Puede consultar el semáforo y es el ÚNICO rol que puede ejecutar POST/PUT para
 *          "Confirmar Pago / Renovar Mensualidad" cuando está VENCIDA.
 * - AYUDANTE y ESTUDIANTE: Solo pueden consultar (GET) el estado del semáforo y días restantes.
 */
gatewayRouter.use(
  '/api/memberships',
  verifyJwtToken,
  requireRoles(['ADMIN', 'AYUDANTE', 'ESTUDIANTE']),
  enforceReadOnlyUnlessAdmin,
  createProxyMiddleware({
    target: `${gatewayConfig.services.membershipsUrl}/api/memberships`,
    changeOrigin: true,
  })
);

/**
 * 4. RUTAS DE ASISTENCIA, HISTORIAL DE CLASES Y GEOFENCING (`attendance-classes-service` :3004)
 * - ESTUDIANTE: Puede consultar su historial de clases y enviar pings de Geofencing GPS desde Android.
 * - AYUDANTE: Puede registrar qué técnicas/actividades hizo cada estudiante en clase y marcar asistencia.
 * - ADMIN: Control total del panel en vivo ("Quién está en clase actualmente") y corrección manual.
 */
gatewayRouter.use(
  '/api/attendance',
  verifyJwtToken,
  requireRoles(['ADMIN', 'AYUDANTE', 'ESTUDIANTE']),
  createProxyMiddleware({
    target: `${gatewayConfig.services.attendanceClassesUrl}/api/attendance`,
    changeOrigin: true,
  })
);

/**
 * 5. RUTAS DE NOTIFICACIONES PUSH / LOCALES (`notifications-service` :3005)
 * - Accesibles por los 3 roles autenticados para recibir alertas de ingreso a clase,
 *   vencimiento de mensualidad y ascensos de cinturón.
 */
gatewayRouter.use(
  '/api/notifications',
  verifyJwtToken,
  requireRoles(['ADMIN', 'AYUDANTE', 'ESTUDIANTE']),
  createProxyMiddleware({
    target: `${gatewayConfig.services.notificationsUrl}/api/notifications`,
    changeOrigin: true,
  })
);
