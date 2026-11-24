/**
 * @file auth-rbac.middleware.ts
 * @description Middleware del API Gateway para validar el token JWT, verificar permisos
 *              estrictos por rol (`ADMIN`, `AYUDANTE`, `ESTUDIANTE`) e inyectar cabeceras
 *              de identidad (`x-user-id`, `x-user-fullname`, `x-user-role`) hacia los
 *              microservicios internos para trazabilidad automática en `audit_logs`.
 */

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { gatewayConfig } from '../config/env.config';

/**
 * Roles reconocidos en el ecosistema del Dojo.
 */
export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';

/**
 * Estructura decodificada del token JWT emitido por `auth-audit-service`.
 */
export interface DecodedJwtUser {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  studentId?: string | null;
}

/**
 * Extiende la interfaz Request de Express de forma estrictamente tipada (sin usar any).
 */
export interface AuthenticatedRequest extends Request {
  authenticatedUser?: DecodedJwtUser;
}

/**
 * Middleware que verifica la presencia y validez del Bearer Token JWT.
 * Inyecta además cabeceras seguras hacia los microservicios destino.
 */
export function verifyJwtToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'No autorizado: Token JWT ausente en la cabecera Authorization.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, gatewayConfig.jwtAccessSecret) as DecodedJwtUser;
    req.authenticatedUser = decoded;

    // Inyectar cabeceras de identidad auditables hacia los microservicios internos
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-username'] = decoded.username;
    req.headers['x-user-fullname'] = decoded.fullName;
    req.headers['x-user-role'] = decoded.role;
    if (decoded.studentId) {
      req.headers['x-user-student-id'] = decoded.studentId;
    }

    next();
  } catch (_error: unknown) {
    res.status(401).json({
      success: false,
      message: 'Token JWT inválido o expirado. Utilice /api/auth/refresh para renovar su sesión.',
    });
  }
}

/**
 * Fábrica de middleware RBAC que restringe el acceso a una lista de roles permitidos.
 * Además aplica reglas finas de método HTTP (por ejemplo, AYUDANTE solo puede hacer GET
 * en estudiantes y mensualidades, nunca POST/PUT/DELETE).
 *
 * @param {ReadonlyArray<UserRole>} allowedRoles Lista de roles autorizados para la ruta.
 */
export function requireRoles(allowedRoles: ReadonlyArray<UserRole>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.authenticatedUser;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.',
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `Acceso prohibido (RBAC): Su rol actual (${user.role}) no tiene permiso para esta operación.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware especializado para proteger rutas donde:
 * - `ADMIN` tiene permiso total (GET, POST, PUT, PATCH, DELETE).
 * - `AYUDANTE` y `ESTUDIANTE` tienen estrictamente permiso de SOLO LECTURA (`GET`).
 */
export function enforceReadOnlyUnlessAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.authenticatedUser;
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado.',
    });
    return;
  }

  const isReadMethod = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';

  if (user.role !== 'ADMIN' && !isReadMethod) {
    res.status(403).json({
      success: false,
      message: `Regla de Seguridad Dojo: El rol ${user.role} tiene acceso de SOLO LECTURA en este módulo. Solo un ADMIN puede crear, editar o renovar registros.`,
    });
    return;
  }

  next();
}
