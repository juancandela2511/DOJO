/**
 * @file dojo.ts
 * @description Modelos estrictamente tipados para la aplicación Vue 3 del Dojo.
 */

export type UserRole = 'ADMIN' | 'AYUDANTE' | 'ESTUDIANTE';
export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
export type TrafficLightColor = 'VERDE' | 'AMARILLO' | 'ROJO';
export type MembershipStatus = 'ACTIVA' | 'POR_VENCER' | 'VENCIDA' | 'SUSPENDIDA';
export type AttendanceMethod = 'AUTO_GPS' | 'MANUAL_ADMIN' | 'MANUAL_AYUDANTE';
export type WorkspaceView = 'ADMIN' | 'CLASE' | 'ESTUDIANTE';

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

export interface BeltModel {
  id: number;
  name: string;
  colorHex: string;
  secondaryColorHex: string | null;
  rankOrder: number;
  description: string;
}

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
}

export interface BeltPromotionRecord {
  id: string;
  direction: 'ASCENSO' | 'DESCENSO';
  previousBeltName: string | null;
  newBeltName: string;
  newBeltColorHex: string;
  promotionDate: string;
  examScore: number | null;
  senseiNotes: string | null;
  promotedByName: string;
}

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
  hasDelegatedClassPermission: boolean;
  membershipStartDate: string;
  membershipEndDate: string;
  cycleDays: number;
  daysElapsed: number;
  daysRemaining: number;
  membershipStatus: MembershipStatus;
  trafficLight: TrafficLightColor;
  amountPaid: number;
  isPaymentRenewed: boolean;
  lastConfirmedByAdminName: string;
  isCurrentlyInClass: boolean;
  lastCheckInMethod: AttendanceMethod;
  beltPromotions: BeltPromotionRecord[];
  completedMilestonesByBelt: Record<number, string[]>;
}

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

export interface DojoNotificationItem {
  id: string;
  notificationType: 'IN_CLASS_GPS' | 'MEMBERSHIP_WARNING' | 'MEMBERSHIP_EXPIRED' | 'BELT_PROMOTION';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
