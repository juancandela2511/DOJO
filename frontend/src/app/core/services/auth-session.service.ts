/**
 * @file auth-session.service.ts
 * @description Servicio de autenticación estructurado por tipo de acceso:
 *              1. Usuario Final (Estudiante): Solo pide número de Cédula para consultar
 *                 sus datos personales, semáforo de mensualidad e historial.
 *              2. Encargado de Clase (Permiso Delegado, no Admin): Ingresa con su Cédula
 *                 si tiene permisos delegados por el Admin para ver quién vino, editar
 *                 si vino o no y registrar qué hizo cada persona en la clase.
 *              3. Administrador (Shifu): Requiere Cédula como usuario y Contraseña.
 */

import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { StudentFullRecord, UserRole, UserSessionProfile } from '../models/dojo.models';
import { DojoApiService } from './dojo-api.service';

const STORAGE_SESSION_KEY = 'dojo_clean_auth_session_v2';
const STORAGE_AUTH_FLAG_KEY = 'dojo_clean_is_authenticated_v2';

const ADMIN_ACCOUNTS: ReadonlyArray<{
  acceptedIdentifiers: string[];
  passwords: string[];
  profile: UserSessionProfile;
}> = [
  {
    acceptedIdentifiers: ['1000100100', '80123456', 'admin'],
    passwords: ['AdminDojo2026!', 'admin123', 'demo'],
    profile: {
      id: '11111111-1111-4111-8111-111111111111',
      username: '1000100100',
      documentNumber: '1000100100',
      email: 'sensei@dojo.local',
      fullName: 'Shifu Administrador Principal',
      role: 'ADMIN',
      isActive: true,
      studentId: null,
      hasDelegatedClassPermission: true,
    },
  },
];

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly dojoApi = inject(DojoApiService);

  public readonly isAuthenticated: WritableSignal<boolean> = signal<boolean>(
    this.restoreAuthenticatedFlag()
  );

  public readonly currentUser: WritableSignal<UserSessionProfile> = signal<UserSessionProfile>(
    this.restorePersistentSession()
  );

  /**
   * Vista activa actual ('ADMIN', 'AYUDANTE' para clase delegada, o 'ESTUDIANTE' para consulta de datos).
   */
  public readonly activeWorkspaceView: WritableSignal<UserRole> = signal<UserRole>(
    this.currentUser().role
  );

  /**
   * 1. LOGIN USUARIO FINAL (SOLO CÉDULA):
   * El estudiante ingresa únicamente su número de cédula para ver sus datos, mensualidad y clases.
   * Si además el Admin le delegó permisos de clase, se habilita el botón para gestionar la clase.
   */
  public loginStudentByCedulaOnly(cedulaInput: string): {
    success: boolean;
    message: string;
    user?: UserSessionProfile;
  } {
    const cleanCedula = cedulaInput.trim();
    if (!cleanCedula) {
      return {
        success: false,
        message: 'Por favor ingresa tu número de cédula para consultar tus datos.',
      };
    }

    const student: StudentFullRecord | undefined = this.dojoApi
      .students()
      .find((s) => s.documentNumber.toLowerCase() === cleanCedula.toLowerCase());

    if (!student) {
      return {
        success: false,
        message: `No se encontró ningún estudiante registrado con la cédula "${cleanCedula}".`,
      };
    }

    const profile: UserSessionProfile = {
      id: `usr-${student.id}`,
      username: student.documentNumber,
      documentNumber: student.documentNumber,
      email: `${student.documentNumber}@dojo.local`,
      fullName: `${student.firstName} ${student.lastName}`,
      role: 'ESTUDIANTE',
      isActive: student.isActive,
      studentId: student.id,
      hasDelegatedClassPermission: student.hasDelegatedClassPermission,
    };

    this.persistSession(profile, 'ESTUDIANTE');
    return {
      success: true,
      message: `Bienvenido(a), ${profile.fullName}.`,
      user: profile,
    };
  }

  /**
   * 2. LOGIN ENCARGADO DE CLASE (PERMISO DELEGADO - NO ADMIN):
   * Cualquier persona que esté haciendo la clase (a quien el Admin le haya delegado permisos)
   * ingresa con su cédula para ver quién vino, editar si vino o no, y anotar qué hizo cada persona.
   */
  public loginDelegatedInstructorByCedula(cedulaInput: string): {
    success: boolean;
    message: string;
    user?: UserSessionProfile;
  } {
    const cleanCedula = cedulaInput.trim();
    if (!cleanCedula) {
      return {
        success: false,
        message: 'Ingresa el número de cédula de la persona encargada de la clase.',
      };
    }

    const student = this.dojoApi
      .students()
      .find((s) => s.documentNumber.toLowerCase() === cleanCedula.toLowerCase());

    if (!student) {
      return {
        success: false,
        message: `No existe ninguna persona registrada con la cédula "${cleanCedula}".`,
      };
    }

    if (!student.hasDelegatedClassPermission) {
      return {
        success: false,
        message: `${student.firstName} ${student.lastName} (CC ${student.documentNumber}) aún no tiene permisos delegados para dirigir la clase. El Administrador debe activarle "Delegar Clase" en su panel.`,
      };
    }

    const profile: UserSessionProfile = {
      id: `del-${student.id}`,
      username: student.documentNumber,
      documentNumber: student.documentNumber,
      email: `${student.documentNumber}@dojo.local`,
      fullName: `${student.firstName} ${student.lastName}`,
      role: 'AYUDANTE',
      isActive: student.isActive,
      studentId: student.id,
      hasDelegatedClassPermission: true,
    };

    this.persistSession(profile, 'AYUDANTE');
    return {
      success: true,
      message: `Modo Encargado de Clase activo para ${profile.fullName}.`,
      user: profile,
    };
  }

  /**
   * 3. LOGIN ADMINISTRADOR (CÉDULA COMO USUARIO + CONTRASEÑA):
   * Requiere obligatoriamente la cédula del administrador y su contraseña.
   */
  public loginAdminWithCedulaAndPassword(cedulaInput: string, passwordInput: string): {
    success: boolean;
    message: string;
    user?: UserSessionProfile;
  } {
    const cleanCedula = cedulaInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanCedula || !cleanPass) {
      return {
        success: false,
        message: 'Para acceso Administrador debes ingresar tu Cédula y tu Contraseña.',
      };
    }

    const matchedAdmin = ADMIN_ACCOUNTS.find((acc) =>
      acc.acceptedIdentifiers.some((id) => id.toLowerCase() === cleanCedula)
    );

    if (!matchedAdmin) {
      return {
        success: false,
        message: 'Cédula de Administrador no reconocida.',
      };
    }

    if (!matchedAdmin.passwords.includes(cleanPass)) {
      return {
        success: false,
        message: 'Contraseña de Administrador incorrecta.',
      };
    }

    this.persistSession(matchedAdmin.profile, 'ADMIN');
    return {
      success: true,
      message: `Sesión iniciada como ${matchedAdmin.profile.fullName}.`,
      user: matchedAdmin.profile,
    };
  }

  /**
   * Compatibilidad general para login por credenciales.
   */
  public loginWithCredentials(username: string, password?: string): {
    success: boolean;
    message: string;
    user?: UserSessionProfile;
  } {
    if (password && password.trim().length > 0) {
      return this.loginAdminWithCedulaAndPassword(username, password);
    }
    return this.loginStudentByCedulaOnly(username);
  }

  /**
   * Permite a un estudiante que también tiene permiso delegado de clase alternar entre:
   * - 'ESTUDIANTE': Ver sus propios datos y mensualidad.
   * - 'AYUDANTE': Gestionar la asistencia y actividades de la clase que está dirigiendo.
   */
  public setWorkspaceView(view: UserRole): void {
    this.activeWorkspaceView.set(view);
  }

  /**
   *Verifica en vivo si el usuario actual tiene permiso delegado para gestionar la clase.
   */
  public currentUserCanManageClass(): boolean {
    const user = this.currentUser();
    if (user.role === 'ADMIN' || user.role === 'AYUDANTE') return true;
    if (user.studentId) {
      const stu = this.dojoApi.students().find((s) => s.id === user.studentId);
      if (stu?.hasDelegatedClassPermission) return true;
    }
    return Boolean(user.hasDelegatedClassPermission);
  }

  /**
   * Cambio rápido de rol para pruebas ágiles en la barra superior.
   */
  public switchActiveRole(role: UserRole): UserSessionProfile {
    if (role === 'ADMIN') {
      const adminProfile = ADMIN_ACCOUNTS[0].profile;
      this.persistSession(adminProfile, 'ADMIN');
      return adminProfile;
    }

    if (role === 'AYUDANTE') {
      const delegatedStudent =
        this.dojoApi.students().find((s) => s.hasDelegatedClassPermission) ||
        this.dojoApi.students()[1];
      const profile: UserSessionProfile = {
        id: `del-${delegatedStudent.id}`,
        username: delegatedStudent.documentNumber,
        documentNumber: delegatedStudent.documentNumber,
        email: `${delegatedStudent.documentNumber}@dojo.local`,
        fullName: `${delegatedStudent.firstName} ${delegatedStudent.lastName}`,
        role: 'AYUDANTE',
        isActive: true,
        studentId: delegatedStudent.id,
        hasDelegatedClassPermission: true,
      };
      this.persistSession(profile, 'AYUDANTE');
      return profile;
    }

    const defaultStudent = this.dojoApi.students()[0];
    const studentProfile: UserSessionProfile = {
      id: `usr-${defaultStudent.id}`,
      username: defaultStudent.documentNumber,
      documentNumber: defaultStudent.documentNumber,
      email: `${defaultStudent.documentNumber}@dojo.local`,
      fullName: `${defaultStudent.firstName} ${defaultStudent.lastName}`,
      role: 'ESTUDIANTE',
      isActive: true,
      studentId: defaultStudent.id,
      hasDelegatedClassPermission: defaultStudent.hasDelegatedClassPermission,
    };
    this.persistSession(studentProfile, 'ESTUDIANTE');
    return studentProfile;
  }

  /**
   * Cierra la sesión actual y regresa a la pantalla estructurada de Login.
   */
  public logout(): void {
    this.isAuthenticated.set(false);
    try {
      localStorage.removeItem(STORAGE_AUTH_FLAG_KEY);
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // Sin acceso a localStorage
    }
  }

  private persistSession(profile: UserSessionProfile, view: UserRole): void {
    this.currentUser.set(profile);
    this.activeWorkspaceView.set(view);
    this.isAuthenticated.set(true);
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
      localStorage.setItem(STORAGE_AUTH_FLAG_KEY, 'true');
    } catch {
      // Sin acceso a localStorage
    }
  }

  private restoreAuthenticatedFlag(): boolean {
    try {
      return localStorage.getItem(STORAGE_AUTH_FLAG_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private restorePersistentSession(): UserSessionProfile {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw) as UserSessionProfile;
      }
    } catch {
      // Ignorar error de parseo
    }
    return ADMIN_ACCOUNTS[0].profile;
  }
}
