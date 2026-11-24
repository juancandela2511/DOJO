import type {
  AttendanceMethod,
  BeltModel,
  BloodType,
  ClassAttendanceRecord,
  OcrExtractionResult,
  StudentFullRecord,
} from '../types/dojo';
import {
  TODAY_ISO,
  appendAudit,
  belts,
  classLogs,
  currentUser,
  getBeltById,
  gpsDistanceMeters,
  students,
} from './dojoState';

export function getTodayLogForStudent(studentId: string): ClassAttendanceRecord | undefined {
  return classLogs.value.find((l) => l.studentId === studentId && l.sessionDate === TODAY_ISO);
}

export function getStudentClassHistory(studentId: string): ClassAttendanceRecord[] {
  return classLogs.value.filter((l) => l.studentId === studentId);
}

export function changeStudentBelt(
  studentId: string,
  direction: 'ASCENSO' | 'DESCENSO',
  senseiNotes?: string
): BeltModel | null {
  const student = students.value.find((s) => s.id === studentId);
  if (!student) return null;

  const delta = direction === 'ASCENSO' ? 1 : -1;
  const targetBeltId = Math.max(1, Math.min(belts.value.length, student.currentBeltId + delta));
  if (targetBeltId === student.currentBeltId) return null;

  const newBelt = getBeltById(targetBeltId);
  const oldBeltName = student.beltName;

  student.currentBeltId = newBelt.id;
  student.beltName = newBelt.name;
  student.beltColorHex = newBelt.colorHex;
  student.beltPromotions.unshift({
    id: `belt-${Date.now()}`,
    direction,
    previousBeltName: oldBeltName,
    newBeltName: newBelt.name,
    newBeltColorHex: newBelt.colorHex,
    promotionDate: TODAY_ISO,
    examScore: direction === 'ASCENSO' ? 98 : null,
    senseiNotes: senseiNotes || 'Actualización de grado.',
    promotedByName: currentUser.value.fullName,
  });

  classLogs.value.forEach((log) => {
    if (log.studentId === studentId) {
      log.beltName = newBelt.name;
      log.beltColorHex = newBelt.colorHex;
    }
  });
  return newBelt;
}

export function toggleClassDelegation(studentId: string): boolean {
  const target = students.value.find((s) => s.id === studentId);
  if (!target) return false;
  target.hasDelegatedClassPermission = !target.hasDelegatedClassPermission;
  return target.hasDelegatedClassPermission;
}

export function confirmManualMembershipRenewal(studentId: string, amountPaid = 160000): void {
  const target = students.value.find((s) => s.id === studentId);
  if (!target) return;
  target.membershipStartDate = TODAY_ISO;
  target.membershipEndDate = '2026-12-24';
  target.daysElapsed = 0;
  target.daysRemaining = 30;
  target.membershipStatus = 'ACTIVA';
  target.trafficLight = 'VERDE';
  target.amountPaid = amountPaid;
  target.isPaymentRenewed = true;
  target.lastConfirmedByAdminName = currentUser.value.fullName;
}

export function recordClassSessionActivity(params: {
  studentId: string;
  isCurrentlyInClass: boolean;
  techniquesPracticed: string;
  trainingObservations: string;
  method?: AttendanceMethod;
  distanceMeters?: number;
}): void {
  const student = students.value.find((s) => s.id === params.studentId);
  if (!student) return;
  const existing = getTodayLogForStudent(student.id);
  const method: AttendanceMethod =
    params.method || (currentUser.value.role === 'ADMIN' ? 'MANUAL_ADMIN' : 'MANUAL_AYUDANTE');

  student.isCurrentlyInClass = params.isCurrentlyInClass;
  student.lastCheckInMethod = method;

  const newLog: ClassAttendanceRecord = {
    id: existing?.id || `att-${Date.now()}`,
    studentId: student.id,
    studentFullName: `${student.firstName} ${student.lastName}`,
    beltName: student.beltName,
    beltColorHex: student.beltColorHex,
    sessionDate: TODAY_ISO,
    checkInTime: existing?.checkInTime || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    isCurrentlyInClass: params.isCurrentlyInClass,
    detectionMethod: method,
    gpsDistanceMeters: params.distanceMeters ?? existing?.gpsDistanceMeters ?? null,
    dwellTimeMinutes: existing?.dwellTimeMinutes ?? 20,
    techniquesPracticed: params.techniquesPracticed.trim() || existing?.techniquesPracticed || null,
    trainingObservations: params.trainingObservations.trim() || existing?.trainingObservations || null,
    recordedByRole: currentUser.value.role === 'ADMIN' ? 'ADMIN' : 'AYUDANTE',
    recordedByName: currentUser.value.fullName,
  };

  classLogs.value = [
    newLog,
    ...classLogs.value.filter((l) => !(l.studentId === student.id && l.sessionDate === TODAY_ISO)),
  ];
}

export function runOcrExtraction(fileName: string, rawHint?: string): OcrExtractionResult {
  const samples: OcrExtractionResult[] = [
    { documentNumber: '1098765432', firstName: 'Santiago', lastName: 'Wang Mendoza', bloodType: 'O+', epsEntity: 'EPS Sura', birthDate: '2000-03-19', confidence: 98.4, rawText: `CC 1098765432 · WANG MENDOZA SANTIAGO (${fileName})` },
    { documentNumber: '1054321987', firstName: 'Laura Sofía', lastName: 'Zhang Castro', bloodType: 'A-', epsEntity: 'EPS Sanitas', birthDate: '2002-11-04', confidence: 97.1, rawText: `CC 1054321987 · ZHANG CASTRO LAURA (${fileName})` },
  ];
  return rawHint && rawHint.includes('1054') ? samples[1] : samples[0];
}

export function createStudentWithOcr(payload: {
  documentNumber: string; firstName: string; lastName: string; birthDate: string;
  bloodType: BloodType; epsEntity: string; phone: string; emergencyContactName: string;
  emergencyContactPhone: string; emergencyContactRelationship: string;
  currentBeltId: number; medicalNotes: string; profilePhotoUrl?: string;
}): StudentFullRecord {
  const belt = getBeltById(Number(payload.currentBeltId));
  const newStudent: StudentFullRecord = {
    id: `stu-${Date.now()}`, documentType: 'CC', documentNumber: payload.documentNumber.trim(),
    firstName: payload.firstName.trim(), lastName: payload.lastName.trim(),
    birthDate: payload.birthDate || '2000-01-01', bloodType: payload.bloodType,
    epsEntity: payload.epsEntity.trim(), phone: payload.phone.trim(), address: 'Bogotá D.C.',
    emergencyContactName: payload.emergencyContactName.trim(),
    emergencyContactPhone: payload.emergencyContactPhone.trim(),
    emergencyContactRelationship: payload.emergencyContactRelationship || 'Familiar',
    currentBeltId: belt.id, beltName: belt.name, beltColorHex: belt.colorHex,
    profilePhotoUrl: payload.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
    idCardDocUrl: `CC_${payload.documentNumber}_OCR.pdf`, epsCertificateUrl: `EPS_${payload.epsEntity}.pdf`,
    medicalNotes: payload.medicalNotes || 'Apto para entrenamiento.', isActive: true,
    hasDelegatedClassPermission: false, membershipStartDate: TODAY_ISO, membershipEndDate: '2026-12-24',
    cycleDays: 30, daysElapsed: 0, daysRemaining: 30, membershipStatus: 'ACTIVA', trafficLight: 'VERDE',
    amountPaid: 160000, isPaymentRenewed: true, lastConfirmedByAdminName: currentUser.value.fullName,
    isCurrentlyInClass: false, lastCheckInMethod: 'MANUAL_ADMIN', beltPromotions: [], completedMilestonesByBelt: {},
  };
  students.value = [newStudent, ...students.value];
  appendAudit({ action: 'CREATE', targetTable: 'students', targetRecordId: newStudent.id, description: `Nuevo estudiante: ${newStudent.firstName} ${newStudent.lastName}.`, oldData: null, newData: { documentNumber: newStudent.documentNumber } });
  return newStudent;
}

export function updateStudentPhoto(studentId: string, photoDataUrl: string): void {
  const target = students.value.find((s) => s.id === studentId);
  if (target && photoDataUrl) target.profilePhotoUrl = photoDataUrl;
}

export function simulateGpsCheckIn(studentId: string): void {
  gpsDistanceMeters.value = 9.5;
  recordClassSessionActivity({ studentId, isCurrentlyInClass: true, techniquesPracticed: '', trainingObservations: 'Llegada GPS (9.5m).', method: 'AUTO_GPS', distanceMeters: 9.5 });
}
