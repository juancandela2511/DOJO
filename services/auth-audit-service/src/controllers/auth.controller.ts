/**
 * @file auth.controller.ts
 * @description Controlador HTTP para login persistente, renovación de sesión,
 *              creación de usuarios por rol y consulta/registro de auditoría inmutable.
 */

import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import {
  CreateAuditLogDto,
  CreateUserDto,
  JwtUserPayload,
  LoginRequestDto,
  UserRole,
} from '../types/auth.types';

/**
 * Extrae la identidad del usuario autenticado propagada por el API Gateway en las cabeceras HTTP.
 *
 * @param {Request} req Objeto Request de Express.
 * @returns {JwtUserPayload} Datos del actor que ejecuta la operación.
 */
function extractActorFromHeaders(req: Request): JwtUserPayload {
  const userId = (req.headers['x-user-id'] as string) || '11111111-1111-4111-8111-111111111111';
  const username = (req.headers['x-user-username'] as string) || 'admin';
  const fullName = (req.headers['x-user-fullname'] as string) || 'Sensei Administrador Principal';
  const role = ((req.headers['x-user-role'] as UserRole) || 'ADMIN') as UserRole;
  return { userId, username, fullName, role };
}

/**
 * Controlador de endpoints de Autenticación y Auditoría.
 */
export class AuthController {
  /**
   * POST /api/auth/login
   * Autentica al usuario y devuelve Access Token + Refresh Token persistente (365 días).
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as LoginRequestDto;
      if (!body.username) {
        res.status(400).json({
          success: false,
          message: 'Debe proporcionar su número de cédula.',
        });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const result = await authService.login(body, ipAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Error interno de autenticación.';
      res.status(401).json({
        success: false,
        message: errMessage,
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renueva silenciosamente el Access Token para mantener la sesión iniciada por defecto en Android.
   */
  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Se requiere el refreshToken persistente.',
        });
        return;
      }

      const result = await authService.refreshPersistentSession(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Sesión inválida.';
      res.status(401).json({
        success: false,
        message: errMessage,
      });
    }
  }

  /**
   * POST /api/auth/users
   * Permite a un ADMIN crear cuentas de usuario con rol ADMIN, AYUDANTE o ESTUDIANTE.
   */
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const actor = extractActorFromHeaders(req);
      if (actor.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Acceso denegado: Solo el rol ADMIN puede crear usuarios y asignar roles.',
        });
        return;
      }

      const dto = req.body as CreateUserDto;
      if (!dto.username || !dto.password || !dto.fullName || !dto.role) {
        res.status(400).json({
          success: false,
          message: 'Campos obligatorios: username, password, fullName y role.',
        });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const created = await authService.createUserWithRole(dto, actor, ipAddress);

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Error al crear usuario.';
      res.status(400).json({
        success: false,
        message: errMessage,
      });
    }
  }

  /**
   * POST /api/audit/logs
   * Endpoint interno para que los demás microservicios registren eventos en `audit_logs`.
   */
  public async recordInternalAudit(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body as CreateAuditLogDto;
      const saved = await auditService.recordAuditLog(payload);
      res.status(201).json({
        success: true,
        data: saved,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Error al registrar auditoría.';
      res.status(500).json({
        success: false,
        message: errMessage,
      });
    }
  }

  /**
   * GET /api/audit/logs
   * Devuelve la bitácora inmutable de auditoría filtrada por tabla o rol (Exclusivo ADMIN).
   */
  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit || 100);
      const targetTable = req.query.table as string | undefined;
      const actorRole = req.query.role as string | undefined;

      const logs = await auditService.listAuditLogs(limit, targetTable, actorRole);
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Error al consultar auditoría.';
      res.status(500).json({
        success: false,
        message: errMessage,
      });
    }
  }
}

export const authController = new AuthController();
