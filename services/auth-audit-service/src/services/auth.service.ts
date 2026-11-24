/**
 * @file auth.service.ts
 * @description Servicio de autenticación con sesión persistente por defecto (Refresh Tokens
 *              de 365 días para App Android), verificación de contraseñas y gestión de roles.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { QueryResultRow } from 'pg';
import { executeQuery } from '../db/pool';
import {
  CreateUserDto,
  JwtUserPayload,
  LoginRequestDto,
  LoginResponseDto,
  PublicUserProfile,
  UserRole,
  UserRow,
} from '../types/auth.types';
import { auditService } from './audit.service';

interface StudentIdLookupRow extends QueryResultRow {
  id: string;
}

interface RefreshTokenJoinRow extends QueryResultRow {
  user_id: string;
  username: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  revoked: boolean;
  expires_at: Date;
}

/**
 * Servicio principal de autenticación y administración de cuentas de usuario.
 */
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'dojo_jwt_access_secret_key_ultra_segura_2026_x99';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'dojo_jwt_refresh_secret_key_persistente_2026_z88';
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '12h';
  }

  /**
   * Autentica a un usuario por su username (o número de cédula) y contraseña.
   * Genera un Refresh Token de 365 días para que la sesión quede iniciada por defecto en Android.
   *
   * @param {LoginRequestDto} dto Credenciales de acceso.
   * @param {string} ipAddress Dirección IP del cliente para trazabilidad.
   * @returns {Promise<LoginResponseDto>} Tokens JWT y perfil del usuario autenticado.
   */
  public async login(dto: LoginRequestDto, ipAddress: string): Promise<LoginResponseDto> {
    const userResult = await executeQuery<UserRow>(
      `SELECT * FROM users WHERE username = $1 LIMIT 1`,
      [dto.username.trim()]
    );

    if (userResult.rowCount === 0) {
      throw new Error('CREDENTIAL_ERROR: Usuario o número de cédula no encontrado.');
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      throw new Error('ACCOUNT_DISABLED: La cuenta se encuentra desactivada por administración.');
    }

    // Si es ADMIN, exige cédula (usuario) y contraseña obligatoriamente.
    // Si es usuario final (ESTUDIANTE) o delegado (AYUDANTE), permite acceso solo con cédula.
    if (user.role === 'ADMIN') {
      if (!dto.password) {
        throw new Error('CREDENTIAL_ERROR: El acceso de Administrador requiere cédula y contraseña.');
      }
      const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
      if (!passwordValid) {
        throw new Error('CREDENTIAL_ERROR: La contraseña de Administrador ingresada es incorrecta.');
      }
    } else if (dto.password) {
      const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
      if (!passwordValid) {
        throw new Error('CREDENTIAL_ERROR: La contraseña ingresada es incorrecta.');
      }
    }

    // Buscar si el usuario tiene ficha de estudiante vinculada
    const studentResult = await executeQuery<StudentIdLookupRow>(
      `SELECT id FROM students WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const studentId: string | null = studentResult.rows[0]?.id ?? null;

    const jwtPayload: JwtUserPayload = {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      studentId,
    };

    const accessToken = jwt.sign(jwtPayload, this.accessSecret, {
      expiresIn: '12h',
    });

    // Crear Refresh Token persistente (365 días) para mantener sesión activa en Android
    const rawRefreshToken = jwt.sign(
      { ...jwtPayload, tokenNonce: crypto.randomUUID() },
      this.refreshSecret,
      { expiresIn: '365d' }
    );
    const tokenHash = this.hashToken(rawRefreshToken);

    await executeQuery(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '365 days')`,
      [user.id, tokenHash, dto.deviceInfo || 'Android/Web Hybrid Client', ipAddress]
    );

    await executeQuery(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // Registrar inicio de sesión en la bitácora inmutable audit_logs
    await auditService.recordAuditLog({
      actorUserId: user.id,
      actorFullName: user.full_name,
      actorRole: user.role,
      action: 'LOGIN',
      targetTable: 'users',
      targetRecordId: user.id,
      description: `Inicio de sesión exitoso (${user.role}) desde dispositivo ${dto.deviceInfo || 'Web/Android'}.`,
      oldData: null,
      newData: { username: user.username, role: user.role },
      ipAddress,
    });

    const publicProfile: PublicUserProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      studentId,
    };

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.accessExpiresIn,
      persistentSession: true,
      user: publicProfile,
    };
  }

  /**
   * Renueva silenciosamente un Access Token usando el Refresh Token persistente almacenado en Android/Web.
   *
   * @param {string} rawRefreshToken Token de refresco enviado por la aplicación.
   * @returns {Promise<{ accessToken: string; user: PublicUserProfile }>} Nuevo Access Token y perfil.
   */
  public async refreshPersistentSession(
    rawRefreshToken: string
  ): Promise<{ accessToken: string; user: PublicUserProfile }> {
    jwt.verify(rawRefreshToken, this.refreshSecret);
    const tokenHash = this.hashToken(rawRefreshToken);

    const tokenResult = await executeQuery<RefreshTokenJoinRow>(
      `SELECT rt.user_id, rt.revoked, rt.expires_at,
              u.username, u.email, u.full_name, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rowCount === 0) {
      throw new Error('INVALID_REFRESH_TOKEN: La sesión persistente no existe o fue cerrada.');
    }

    const row = tokenResult.rows[0];
    if (row.revoked || !row.is_active || new Date(row.expires_at) < new Date()) {
      throw new Error('EXPIRED_REFRESH_TOKEN: La sesión persistente ha expirado o fue revocada.');
    }

    const studentResult = await executeQuery<StudentIdLookupRow>(
      `SELECT id FROM students WHERE user_id = $1 LIMIT 1`,
      [row.user_id]
    );
    const studentId: string | null = studentResult.rows[0]?.id ?? null;

    const payload: JwtUserPayload = {
      userId: row.user_id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      studentId,
    };

    const accessToken = jwt.sign(payload, this.accessSecret, { expiresIn: '12h' });

    return {
      accessToken,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        isActive: row.is_active,
        studentId,
      },
    };
  }

  /**
   * Crea un nuevo usuario con rol específico (ADMIN, AYUDANTE o ESTUDIANTE) y lo registra en auditoría.
   */
  public async createUserWithRole(
    dto: CreateUserDto,
    actor: JwtUserPayload,
    ipAddress: string
  ): Promise<PublicUserProfile> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const insertResult = await executeQuery<UserRow>(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dto.username.trim(), dto.email || null, passwordHash, dto.fullName.trim(), dto.role]
    );

    const created = insertResult.rows[0];

    await auditService.recordAuditLog({
      actorUserId: actor.userId,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: 'CREATE',
      targetTable: 'users',
      targetRecordId: created.id,
      description: `Creación de cuenta de usuario ${created.username} con rol ${created.role}.`,
      oldData: null,
      newData: {
        id: created.id,
        username: created.username,
        fullName: created.full_name,
        role: created.role,
      },
      ipAddress,
    });

    return {
      id: created.id,
      username: created.username,
      email: created.email,
      fullName: created.full_name,
      role: created.role,
      isActive: created.is_active,
    };
  }

  /**
   * Genera un hash SHA-256 determinístico para almacenar el Refresh Token de forma segura.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const authService = new AuthService();
