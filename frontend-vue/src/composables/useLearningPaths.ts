import type { LearningMilestone } from '../types/dojo';
import {
  appendAudit,
  beltLearningPaths,
  belts,
  getBeltById,
  students,
} from './dojoState';
import { changeStudentBelt } from './useStudents';

export function getBeltPath(beltId: number): LearningMilestone[] {
  return beltLearningPaths.value[beltId] || [];
}

export function addMilestoneToBelt(beltId: number, title: string, description: string): void {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;
  const current = beltLearningPaths.value[beltId] || [];
  beltLearningPaths.value[beltId] = [
    ...current,
    {
      id: `b${beltId}-m-${Date.now()}`,
      title: cleanTitle,
      description: description.trim() || 'Meta técnica de la ruta de aprendizaje.',
    },
  ];
  appendAudit({
    action: 'ADD_LEARNING_MILESTONE',
    targetTable: 'belt_learning_paths',
    targetRecordId: String(beltId),
    description: `Nueva meta agregada a ${getBeltById(beltId).name}: "${cleanTitle}".`,
    oldData: null,
    newData: { beltId, title: cleanTitle },
  });
}

export function removeMilestoneFromBelt(beltId: number, milestoneId: string): void {
  const current = beltLearningPaths.value[beltId] || [];
  beltLearningPaths.value[beltId] = current.filter((m) => m.id !== milestoneId);
}

export function moveMilestoneInBelt(beltId: number, index: number, direction: -1 | 1): void {
  const list = [...(beltLearningPaths.value[beltId] || [])];
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= list.length) return;
  const temp = list[index];
  list[index] = list[targetIdx];
  list[targetIdx] = temp;
  beltLearningPaths.value[beltId] = list;
}

export function getCompletedMilestones(studentId: string, beltId: number): string[] {
  const student = students.value.find((s) => s.id === studentId);
  if (!student) return [];
  return student.completedMilestonesByBelt[beltId] || [];
}

export function completeStudentMilestone(studentId: string, milestoneId: string): boolean {
  const student = students.value.find((s) => s.id === studentId);
  if (!student) return false;
  const beltId = student.currentBeltId;
  const path = getBeltPath(beltId);
  const idx = path.findIndex((m) => m.id === milestoneId);
  if (idx === -1) return false;

  const done = [...(student.completedMilestonesByBelt[beltId] || [])];
  if (done.includes(milestoneId)) return true;
  if (idx > 0 && !done.includes(path[idx - 1].id)) return false;

  done.push(milestoneId);
  student.completedMilestonesByBelt = { ...student.completedMilestonesByBelt, [beltId]: done };
  appendAudit({
    action: 'COMPLETE_MILESTONE',
    targetTable: 'student_learning_progress',
    targetRecordId: studentId,
    description: `${student.firstName} ${student.lastName} completó "${path[idx].title}".`,
    oldData: null,
    newData: { beltId, milestoneId },
  });
  return true;
}

export function promoteStudentViaPath(
  studentId: string,
  password: string
): { ok: boolean; message: string } {
  const student = students.value.find((s) => s.id === studentId);
  if (!student) return { ok: false, message: 'Estudiante no encontrado.' };

  const path = getBeltPath(student.currentBeltId);
  const done = getCompletedMilestones(studentId, student.currentBeltId);
  if (!path.every((m) => done.includes(m.id))) {
    return { ok: false, message: 'Debes completar todas las metas anteriores.' };
  }
  if (!['AdminDojo2026!', 'admin123', 'demo'].includes(password.trim())) {
    return { ok: false, message: 'Contraseña de administrador incorrecta.' };
  }
  if (student.currentBeltId >= belts.value.length) {
    return { ok: false, message: 'Este discípulo ya alcanzó el grado máximo.' };
  }

  const nextBelt = changeStudentBelt(studentId, 'ASCENSO', 'Ruta aprobada con contraseña.');
  if (!nextBelt) return { ok: false, message: 'No fue posible realizar el ascenso.' };
  return { ok: true, message: `Ascenso aprobado a ${nextBelt.name}.` };
}
