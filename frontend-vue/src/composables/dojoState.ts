import { computed, ref } from 'vue';
import type {
  BeltModel,
  ClassAttendanceRecord,
  DojoNotificationItem,
  ImmutableAuditLogItem,
  LearningMilestone,
  StudentFullRecord,
  UserSessionProfile,
  WorkspaceView,
} from '../types/dojo';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BELTS,
  INITIAL_BELT_LEARNING_PATHS,
  INITIAL_CLASS_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STUDENTS,
} from '../data/dojoSeedData';

export const TODAY_ISO = '2026-11-24';

export const belts = ref<BeltModel[]>([...INITIAL_BELTS]);
export const beltLearningPaths = ref<Record<number, LearningMilestone[]>>(
  Object.fromEntries(
    Object.entries(INITIAL_BELT_LEARNING_PATHS).map(([k, list]) => [
      Number(k),
      list.map((m) => ({ ...m })),
    ])
  )
);
export const students = ref<StudentFullRecord[]>(
  INITIAL_STUDENTS.map((s) => ({
    ...s,
    beltPromotions: [...s.beltPromotions],
    completedMilestonesByBelt: { ...s.completedMilestonesByBelt },
  }))
);
export const classLogs = ref<ClassAttendanceRecord[]>([...INITIAL_CLASS_LOGS]);
export const auditLogs = ref<ImmutableAuditLogItem[]>([...INITIAL_AUDIT_LOGS]);
export const notifications = ref<DojoNotificationItem[]>([...INITIAL_NOTIFICATIONS]);

export const isAuthenticated = ref(false);
export const activeWorkspaceView = ref<WorkspaceView>('ESTUDIANTE');
export const gpsDistanceMeters = ref<number>(12.4);

export const currentUser = ref<UserSessionProfile>({
  id: 'guest',
  username: 'guest',
  documentNumber: '',
  email: null,
  fullName: 'Invitado',
  role: 'ESTUDIANTE',
  isActive: true,
  studentId: null,
  hasDelegatedClassPermission: false,
});

export const inClassCount = computed(() => students.value.filter((s) => s.isCurrentlyInClass).length);

export const currentStudentProfile = computed(
  () =>
    students.value.find(
      (s) => s.id === currentUser.value.studentId || s.documentNumber === currentUser.value.documentNumber
    ) || null
);

export const canManageClass = computed(() => {
  if (currentUser.value.role === 'ADMIN') return true;
  return Boolean(currentStudentProfile.value?.hasDelegatedClassPermission);
});

export function getBeltById(beltId: number): BeltModel {
  return belts.value.find((b) => b.id === beltId) || belts.value[0];
}

export function appendAudit(params: {
  action: string;
  targetTable: string;
  targetRecordId: string;
  description: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}): void {
  const actor = currentUser.value;
  auditLogs.value = [
    {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      actorUserId: actor.id,
      actorFullName: actor.fullName,
      actorRole: actor.role,
      action: params.action,
      targetTable: params.targetTable,
      targetRecordId: params.targetRecordId,
      description: params.description,
      oldData: params.oldData,
      newData: params.newData,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    },
    ...auditLogs.value,
  ];
}
