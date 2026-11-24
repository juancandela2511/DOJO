import {
  activeWorkspaceView,
  currentUser,
  isAuthenticated,
  students,
} from './dojoState';

export function loginStudentByCedula(cedula: string): string | null {
  const clean = cedula.trim();
  const found = students.value.find((s) => s.documentNumber === clean);
  if (!found) {
    return 'Cédula no encontrada. Prueba con 1020304050, 1032456789 o 1018990112.';
  }
  currentUser.value = {
    id: found.id,
    username: found.documentNumber,
    documentNumber: found.documentNumber,
    email: null,
    fullName: `${found.firstName} ${found.lastName}`,
    role: 'ESTUDIANTE',
    isActive: true,
    studentId: found.id,
    hasDelegatedClassPermission: found.hasDelegatedClassPermission,
  };
  activeWorkspaceView.value = 'ESTUDIANTE';
  isAuthenticated.value = true;
  return null;
}

export function loginAdmin(cedula: string, password: string): string | null {
  const cleanId = cedula.trim().toLowerCase();
  const cleanPass = password.trim();
  if (
    ['1000100100', 'admin'].includes(cleanId) &&
    ['AdminDojo2026!', 'admin123', 'demo'].includes(cleanPass)
  ) {
    currentUser.value = {
      id: '11111111-1111-4111-8111-111111111111',
      username: 'admin',
      documentNumber: '1000100100',
      email: 'admin@dojo.com',
      fullName: 'Shifu Administrador Principal',
      role: 'ADMIN',
      isActive: true,
      studentId: null,
      hasDelegatedClassPermission: true,
    };
    activeWorkspaceView.value = 'ADMIN';
    isAuthenticated.value = true;
    return null;
  }
  return 'Credenciales de Administrador inválidas.';
}

export function logout(): void {
  isAuthenticated.value = false;
}
