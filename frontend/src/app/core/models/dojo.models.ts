/**
 * @file dojo.models.ts
 * @description Interfaces y modelos estrictamente tipados para el cliente híbrido
 *              Angular + Capacitor Android (Roles, Delegación de Clase, Estudiantes,
 *              OCR, Semáforo, Geofencing GPS y Bitácora de Auditoría Inmutable).
 */

export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type TrafficLightColor = 'VERDE' | 'AMARILLO' | 'ROJO';
export type MembershipStatus = 'ACTIVA' | 'POR_VENCER' | 'VENCIDA' | 'SUSPENDIDA';
export type AttendanceMethod = 'AUTO_GPS' | 'MANUAL_ADMIN' | 'MANUAL_AYUDANTE';

/**
 * Perfil del usuario con sesión iniciada en Web o Android.
 */
export interface UserSessionProfile {
  id: string;
  username: string;
  documentNumber: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  studentId: string | null;
  hasDelegatedClassPermission: boolean;
}

/**
 * Cinturón del catálogo jerárquico del Dojo.
 */
export interface BeltModel {
  id: number;
  name: string;
  colorHex: string;
  secondaryColorHex: string | null;
  rankOrder: number;
  description: string;
}

/**
 * Historial de un ascenso de cinturón.
 */
export interface BeltPromotionRecord {
  id: string;
  previousBeltName: string | null;
  newBeltName: string;
  newBeltColorHex: string;
  promotionDate: string;
  examScore: number | null;
  senseiNotes: string | null;
  promotedByName: string;
}

/**
 * Ficha integral de un estudiante del Dojo con su semáforo de mensualidad,
 * estado de asistencia en clase y permiso delegado para dirigir clase.
 */
export interface StudentFullRecord {
  id: string;
  documentType: 'CC' | 'TI' | 'CE' | 'PASAPORTE';
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  bloodType: BloodType;
  epsEntity: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  currentBeltId: number;
  beltName: string;
  beltColorHex: string;
  profilePhotoUrl: string;
  idCardDocUrl: string | null;
  epsCertificateUrl: string | null;
  medicalNotes: string;
  isActive: boolean;
  // Permiso delegado por el ADMIN para tomar asistencia y anotar actividades de la clase
  hasDelegatedClassPermission: boolean;
  // Datos calculados del semáforo de mensualidad
  membershipStartDate: string;
  membershipEndDate: string;
  cycleDays: number;
  daysElapsed: number;
  daysRemaining: number;
  membershipStatus: MembershipStatus;
  trafficLight: TrafficLightColor;
  amountPaid: number;
  lastConfirmedByAdminName: string;
  // Estado en tiempo real en el tatami
  isCurrentlyInClass: boolean;
  lastCheckInMethod: AttendanceMethod;
  beltPromotions: BeltPromotionRecord[];
}

/**
 * Registro de una sesión de clase tomada por un estudiante y técnicas practicadas.
 */
export interface ClassAttendanceRecord {
  id: string;
  studentId: string;
  studentFullName: string;
  beltName: string;
  beltColorHex: string;
  sessionDate: string;
  checkInTime: string;
  isCurrentlyInClass: boolean;
  detectionMethod: AttendanceMethod;
  gpsDistanceMeters: number | null;
  dwellTimeMinutes: number;
  techniquesPracticed: string | null;
  trainingObservations: string | null;
  recordedByRole: UserRole;
  recordedByName: string;
}

/**
 * Campos extraídos automáticamente por el módulo OCR al escanear Cédula o EPS.
 */
export interface OcrExtractionResult {
  documentNumber: string;
  firstName: string;
  lastName: string;
  bloodType: BloodType;
  epsEntity: string;
  birthDate: string;
  confidence: number;
  rawText: string;
}

/**
 * Registro inmutable de la bitácora de auditoría (`audit_logs`).
 */
export interface ImmutableAuditLogItem {
  id: string;
  actorUserId: string;
  actorFullName: string;
  actorRole: UserRole;
  action: string;
  targetTable: string;
  targetRecordId: string;
  description: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Notificación local o push recibida en la App Android del estudiante.
 */
export interface DojoNotificationItem {
  id: string;
  notificationType: 'IN_CLASS_GPS' | 'MEMBERSHIP_WARNING' | 'MEMBERSHIP_EXPIRED' | 'BELT_PROMOTION';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
