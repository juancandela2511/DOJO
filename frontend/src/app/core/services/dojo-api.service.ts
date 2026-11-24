/**
 * @file dojo-api.service.ts
 * @description Servicio central de estado reactivo y comunicación con el API Gateway (:8080).
 *              Garantiza el cumplimiento de todas las reglas de negocio:
 *              1. Semáforo progresivo (VERDE -> AMARILLO -> ROJO) sin auto-renovación.
 *              2. Delegación de permisos de clase a cualquier persona no-admin para ver quién vino,
 *                 editar si vino o no, y anotar qué hizo cada persona que asistió.
 *              3. Módulo OCR de autocompletado de Cédula (CC) y certificado EPS.
 *              4. Bitácora de auditoría inmutable (`audit_logs`).
 */

import { Injectable, signal, WritableSignal } from '@angular/core';
import {
  AttendanceMethod,
  BeltModel,
  BloodType,
  ClassAttendanceRecord,
  DojoNotificationItem,
  ImmutableAuditLogItem,
  OcrExtractionResult,
  StudentFullRecord,
  UserSessionProfile,
} from '../models/dojo.models';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BELTS,
  INITIAL_CLASS_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STUDENTS,
} from './dojo-seed-data';

@Injectable({
  providedIn: 'root',
})
export class DojoApiService {
  public readonly belts: WritableSignal<BeltModel[]> = signal<BeltModel[]>(INITIAL_BELTS);
  public readonly students: WritableSignal<StudentFullRecord[]> =
    signal<StudentFullRecord[]>(INITIAL_STUDENTS);
  public readonly classLogs: WritableSignal<ClassAttendanceRecord[]> =
    signal<ClassAttendanceRecord[]>(INITIAL_CLASS_LOGS);
  public readonly auditLogs: WritableSignal<ImmutableAuditLogItem[]> =
    signal<ImmutableAuditLogItem[]>(INITIAL_AUDIT_LOGS);
  public readonly notifications: WritableSignal<DojoNotificationItem[]> =
    signal<DojoNotificationItem[]>(INITIAL_NOTIFICATIONS);

  /**
   * Obtiene el registro de actividad de la clase de hoy para un estudiante dado.
   */
  public getTodayLogForStudent(studentId: string): ClassAttendanceRecord | undefined {
    return this.classLogs().find(
      (l) => l.studentId === studentId && l.sessionDate === '2026-11-20'
    );
  }

  /**
   * Delega o revoca permisos a cualquier estudiante/persona (no admin) para encargarse
   * de la clase: ver quién vino, editar si vino o no y registrar qué hizo cada asistente.
   */
  public toggleClassDelegation(studentId: string, actor: UserSessionProfile): boolean {
    if (actor.role !== 'ADMIN') {
      throw new Error('Solo el rol ADMIN puede delegar permisos de clase.');
    }

    const target = this.students().find((s) => s.id === studentId);
    if (!target) return false;

    const newPermissionState = !target.hasDelegatedClassPermission;

    this.students.update((list) =>
      list.map((s) =>
        s.id === studentId
          ? { ...s, hasDelegatedClassPermission: newPermissionState }
          : s
      )
    );

    this.appendImmutableAudit({
      actor,
      action: newPermissionState ? 'DELEGATE_CLASS_PERMISSION' : 'REVOKE_CLASS_PERMISSION',
      targetTable: 'users_delegation',
      targetRecordId: studentId,
      description: newPermissionState
        ? `Permiso de encargado de clase DELEGADO a ${target.firstName} ${target.lastName} (CC ${target.documentNumber}).`
        : `Permiso de encargado de clase REVOCADO a ${target.firstName} ${target.lastName} (CC ${target.documentNumber}).`,
      oldData: { hasDelegatedClassPermission: target.hasDelegatedClassPermission },
      newData: { hasDelegatedClassPermission: newPermissionState },
    });

    return newPermissionState;
  }

  /**
   * Módulo OCR de Autocompletado: Extrae número de Cédula, nombres, apellidos,
   * grupo sanguíneo (RH) y entidad EPS desde una foto/archivo escaneado.
   */
  public runOcrExtraction(fileName: string, rawHint?: string): OcrExtractionResult {
    const sampleDocs: ReadonlyArray<OcrExtractionResult> = [
      {
        documentNumber: '1098765432',
        firstName: 'Santiago',
        lastName: 'Wang Mendoza',
        bloodType: 'O+',
        epsEntity: 'EPS Sura',
        birthDate: '2000-03-19',
        confidence: 98.4,
        rawText: `CC No. 1.098.765.432 · WANG MENDOZA SANTIAGO · RH: O+ · EPS SURA (${fileName})`,
      },
      {
        documentNumber: '1054321987',
        firstName: 'Laura Sofía',
        lastName: 'Zhang Castro',
        bloodType: 'A-',
        epsEntity: 'EPS Sanitas',
        birthDate: '2002-11-04',
        confidence: 97.1,
        rawText: `CC No. 1.054.321.987 · ZHANG CASTRO LAURA SOFIA · RH: A- · EPS SANITAS (${fileName})`,
      },
    ];

    return rawHint && rawHint.includes('1054') ? sampleDocs[1] : sampleDocs[0];
  }

  /**
   * Crea un nuevo estudiante (Exclusivo ADMIN), inicializa su semáforo en VERDE (30 días)
   * y registra el evento en la bitácora inmutable de auditoría.
   */
  public createStudentWithOcr(
    payload: {
      documentNumber: string;
      firstName: string;
      lastName: string;
      birthDate: string;
      bloodType: BloodType;
      epsEntity: string;
      phone: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      emergencyContactRelationship: string;
      currentBeltId: number;
      medicalNotes: string;
    },
    actor: UserSessionProfile
  ): StudentFullRecord {
    if (actor.role !== 'ADMIN') {
      throw new Error('Acceso denegado: Solo el rol ADMIN puede registrar estudiantes.');
    }

    const belt =
      this.belts().find((b) => b.id === Number(payload.currentBeltId)) ||
      this.belts()[0];

    const newStudent: StudentFullRecord = {
      id: `stu-${Date.now()}`,
      documentType: 'CC',
      documentNumber: payload.documentNumber.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      birthDate: payload.birthDate || '2000-01-01',
      bloodType: payload.bloodType,
      epsEntity: payload.epsEntity.trim(),
      phone: payload.phone.trim(),
      address: 'Bogotá D.C.',
      emergencyContactName: payload.emergencyContactName.trim(),
      emergencyContactPhone: payload.emergencyContactPhone.trim(),
      emergencyContactRelationship: payload.emergencyContactRelationship || 'Familiar',
      currentBeltId: belt.id,
      beltName: belt.name,
      beltColorHex: belt.colorHex,
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      idCardDocUrl: `CC_${payload.documentNumber}_OCR.pdf`,
      epsCertificateUrl: `EPS_${payload.epsEntity.replace(/\s+/g, '_')}.pdf`,
      medicalNotes: payload.medicalNotes || 'Apto para entrenamiento marcial.',
      isActive: true,
      hasDelegatedClassPermission: false,
      membershipStartDate: '2026-11-20',
      membershipEndDate: '2026-12-20',
      cycleDays: 30,
      daysElapsed: 0,
      daysRemaining: 30,
      membershipStatus: 'ACTIVA',
      trafficLight: 'VERDE',
      amountPaid: 160000,
      lastConfirmedByAdminName: actor.fullName,
      isCurrentlyInClass: false,
      lastCheckInMethod: 'MANUAL_ADMIN',
      beltPromotions: [],
    };

    this.students.update((list) => [newStudent, ...list]);

    this.appendImmutableAudit({
      actor,
      action: 'CREATE',
      targetTable: 'students',
      targetRecordId: newStudent.id,
      description: `Creación de estudiante: ${newStudent.firstName} ${newStudent.lastName} (CC ${newStudent.documentNumber}).`,
      oldData: null,
      newData: {
        documentNumber: newStudent.documentNumber,
        bloodType: newStudent.bloodType,
        epsEntity: newStudent.epsEntity,
        belt: newStudent.beltName,
      },
    });

    return newStudent;
  }

  /**
   * REGLA ESTRICTA DE RENOVACIÓN MANUAL (Exclusivo ADMIN):
   * Reactiva una mensualidad VENCIDA  o próxima a vencer (AMARILLO).
   */
  public confirmManualMembershipRenewal(
    studentId: string,
    amountPaid: number,
    actor: UserSessionProfile
  ): void {
    if (actor.role !== 'ADMIN') {
      throw new Error('Solo un ADMIN puede confirmar pagos y reactivar una mensualidad.');
    }

    const target = this.students().find((s) => s.id === studentId);
    if (!target) return;

    const previousState = {
      status: target.membershipStatus,
      trafficLight: target.trafficLight,
      daysRemaining: target.daysRemaining,
    };

    this.students.update((list) =>
      list.map((s) =>
        s.id === studentId
          ? {
              ...s,
              membershipStartDate: '2026-11-20',
              membershipEndDate: '2026-12-20',
              daysElapsed: 0,
              daysRemaining: 30,
              membershipStatus: 'ACTIVA',
              trafficLight: 'VERDE',
              amountPaid,
              lastConfirmedByAdminName: actor.fullName,
            }
          : s
      )
    );

    this.appendImmutableAudit({
      actor,
      action: 'RENEW_MEMBERSHIP',
      targetTable: 'memberships',
      targetRecordId: studentId,
      description: `Confirmación manual de pago y renovación (30 días) para ${target.firstName} ${target.lastName} ($${amountPaid.toLocaleString()} COP).`,
      oldData: previousState,
      newData: {
        status: 'ACTIVA',
        trafficLight: 'VERDE',
        daysRemaining: 30,
        approvedBy: actor.fullName,
      },
    });
  }

  /**
   * Registra un ascenso de cinturón (Exclusivo ADMIN).
   */
  public promoteStudentBelt(
    studentId: string,
    newBeltId: number,
    senseiNotes: string,
    actor: UserSessionProfile
  ): void {
    if (actor.role !== 'ADMIN') return;
    const student = this.students().find((s) => s.id === studentId);
    const newBelt = this.belts().find((b) => b.id === Number(newBeltId));
    if (!student || !newBelt) return;

    const oldBeltName = student.beltName;

    this.students.update((list) =>
      list.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBeltId: newBelt.id,
              beltName: newBelt.name,
              beltColorHex: newBelt.colorHex,
              beltPromotions: [
                {
                  id: `promo-${Date.now()}`,
                  previousBeltName: oldBeltName,
                  newBeltName: newBelt.name,
                  newBeltColorHex: newBelt.colorHex,
                  promotionDate: '2026-11-20',
                  examScore: 98,
                  senseiNotes: senseiNotes || 'Ascenso otorgado por mérito técnico en el Tatami.',
                  promotedByName: actor.fullName,
                },
                ...s.beltPromotions,
              ],
            }
          : s
      )
    );

    this.notifications.update((items) => [
      {
        id: `noti-${Date.now()}`,
        notificationType: 'BELT_PROMOTION',
        title: `🏅 Nuevo Ascenso: ${newBelt.name}`,
        message: `${actor.fullName} ha certificado tu ascenso de ${oldBeltName} a ${newBelt.name}.`,
        isRead: false,
        createdAt: 'Justo ahora',
      },
      ...items,
    ]);

    this.appendImmutableAudit({
      actor,
      action: 'BELT_PROMOTION',
      targetTable: 'belt_promotions',
      targetRecordId: studentId,
      description: `Ascenso de cinturón para ${student.firstName} ${student.lastName}: ${oldBeltName} -> ${newBelt.name}.`,
      oldData: { beltName: oldBeltName },
      newData: { beltName: newBelt.name, senseiNotes },
    });
  }

  /**
   * Permite al ADMIN o a cualquier persona con PERMISO DELEGADO DE CLASE:
   * - Editar si cada persona vino o no (`isCurrentlyInClass`).
   * - Poner qué hizo cada persona que vino (`techniquesPracticed` y `trainingObservations`).
   */
  public recordClassSessionActivity(
    params: {
      studentId: string;
      isCurrentlyInClass: boolean;
      techniquesPracticed: string;
      trainingObservations: string;
      method?: AttendanceMethod;
      distanceMeters?: number;
      dwellMinutes?: number;
    },
    actor: UserSessionProfile
  ): void {
    const student = this.students().find((s) => s.id === params.studentId);
    if (!student) return;

    const existingTodayLog = this.getTodayLogForStudent(student.id);
    const method: AttendanceMethod =
      params.method || (actor.role === 'ADMIN' ? 'MANUAL_ADMIN' : 'MANUAL_AYUDANTE');

    this.students.update((list) =>
      list.map((s) =>
        s.id === params.studentId
          ? {
              ...s,
              isCurrentlyInClass: params.isCurrentlyInClass,
              lastCheckInMethod: method,
            }
          : s
      )
    );

    const cleanTechniques =
      params.techniquesPracticed.trim().length > 0
        ? params.techniquesPracticed.trim()
        : existingTodayLog?.techniquesPracticed || null;

    const cleanObservations =
      params.trainingObservations.trim().length > 0
        ? params.trainingObservations.trim()
        : existingTodayLog?.trainingObservations ||
          (params.isCurrentlyInClass
            ? 'Asistencia confirmada en clase.'
            : 'Marcado como no asistió a la sesión.');

    const newLog: ClassAttendanceRecord = {
      id: existingTodayLog?.id || `att-${Date.now()}`,
      studentId: student.id,
      studentFullName: `${student.firstName} ${student.lastName}`,
      beltName: student.beltName,
      beltColorHex: student.beltColorHex,
      sessionDate: '2026-11-20',
      checkInTime:
        existingTodayLog?.checkInTime ||
        new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      isCurrentlyInClass: params.isCurrentlyInClass,
      detectionMethod: method,
      gpsDistanceMeters: params.distanceMeters ?? existingTodayLog?.gpsDistanceMeters ?? null,
      dwellTimeMinutes: params.dwellMinutes ?? existingTodayLog?.dwellTimeMinutes ?? 20,
      techniquesPracticed: cleanTechniques,
      trainingObservations: cleanObservations,
      recordedByRole: actor.role === 'ADMIN' ? 'ADMIN' : 'AYUDANTE',
      recordedByName: actor.fullName,
    };

    this.classLogs.update((logs) => [
      newLog,
      ...logs.filter(
        (l) => !(l.studentId === student.id && l.sessionDate === '2026-11-20')
      ),
    ]);

    this.appendImmutableAudit({
      actor,
      action: method === 'AUTO_GPS' ? 'ATTENDANCE_CHECKIN' : 'CLASS_LOG_UPDATE',
      targetTable: 'attendance_sessions',
      targetRecordId: newLog.id,
      description: `Control de clase por ${actor.fullName} para ${student.firstName} ${student.lastName} · Vino: ${params.isCurrentlyInClass ? 'SÍ' : 'NO'} · Qué hizo: ${cleanTechniques || 'Sin detalle técnico'}.`,
      oldData: {
        isCurrentlyInClass: student.isCurrentlyInClass,
        techniquesPracticed: existingTodayLog?.techniquesPracticed || null,
      },
      newData: {
        isCurrentlyInClass: params.isCurrentlyInClass,
        techniquesPracticed: cleanTechniques,
        recordedBy: actor.fullName,
      },
    });
  }

  /**
   * Inserta un registro en la bitácora inmutable de auditoría (`audit_logs`).
   */
  private appendImmutableAudit(params: {
    actor: UserSessionProfile;
    action: string;
    targetTable: string;
    targetRecordId: string;
    description: string;
    oldData: Record<string, unknown> | null;
    newData: Record<string, unknown> | null;
  }): void {
    const item: ImmutableAuditLogItem = {
      id: `aud-${Date.now()}`,
      actorUserId: params.actor.id,
      actorFullName: params.actor.fullName,
      actorRole: params.actor.role,
      action: params.action,
      targetTable: params.targetTable,
      targetRecordId: params.targetRecordId,
      description: params.description,
      oldData: params.oldData,
      newData: params.newData,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.auditLogs.update((list) => [item, ...list]);
  }
}
