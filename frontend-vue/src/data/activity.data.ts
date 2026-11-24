import type {
  ClassAttendanceRecord,
  DojoNotificationItem,
  ImmutableAuditLogItem,
} from '../types/dojo';

export const INITIAL_CLASS_LOGS: ClassAttendanceRecord[] = [
  {
    id: 'att-01',
    studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    studentFullName: 'Carlos Andrés Rodríguez Gómez',
    beltName: 'Faja Azul Imperial',
    beltColorHex: '#235A9C',
    sessionDate: '2026-11-24',
    checkInTime: '10:35 AM',
    isCurrentlyInClass: true,
    detectionMethod: 'AUTO_GPS',
    gpsDistanceMeters: 14.2,
    dwellTimeMinutes: 25,
    techniquesPracticed: 'Forma Lian Huan Quan, transición Ma Bu a Gong Bu y combinación de barrido Sanda.',
    trainingObservations: 'Excelente estabilidad en postura baja; corregir guardia al retroceder.',
    recordedByRole: 'AYUDANTE',
    recordedByName: 'Valentina Lin Chen (Delegada de Clase)',
  },
  {
    id: 'att-02',
    studentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    studentFullName: 'Valentina Lin Chen',
    beltName: 'Faja Negra (1er Duan)',
    beltColorHex: '#18181B',
    sessionDate: '2026-11-24',
    checkInTime: '10:20 AM',
    isCurrentlyInClass: true,
    detectionMethod: 'AUTO_GPS',
    gpsDistanceMeters: 8.6,
    dwellTimeMinutes: 40,
    techniquesPracticed: 'Rutina de espada Jian Shu y salto Tornado 540° (Xuanfengjiao).',
    trainingObservations: 'Aterrizaje limpio y velocidad explosiva.',
    recordedByRole: 'ADMIN',
    recordedByName: 'Shifu Administrador Principal',
  },
];

export const INITIAL_AUDIT_LOGS: ImmutableAuditLogItem[] = [
  {
    id: 'aud-9001',
    actorUserId: '33333333-3333-4333-8333-333333333333',
    actorFullName: 'Carlos Andrés Rodríguez Gómez',
    actorRole: 'ESTUDIANTE',
    action: 'ATTENDANCE_CHECKIN',
    targetTable: 'attendance_sessions',
    targetRecordId: 'att-01',
    description: 'Asistencia automática por Geofencing GPS (14.2m del tatami, 25 min continuos).',
    oldData: null,
    newData: { detectionMethod: 'AUTO_GPS', distanceMeters: 14.2 },
    createdAt: '2026-11-24 10:35:12',
  },
];

export const INITIAL_NOTIFICATIONS: DojoNotificationItem[] = [
  {
    id: 'noti-1',
    notificationType: 'IN_CLASS_GPS',
    title: 'Estás en clase (Geofencing Activo)',
    message: 'Ubicación detectada en el Templo/Dojo durante más de 15 minutos.',
    isRead: false,
    createdAt: 'Hace 15 min',
  },
];
