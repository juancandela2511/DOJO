import { ref } from 'vue';
import {
  activeWorkspaceView,
  currentUser,
  isAuthenticated,
  students,
} from './dojoState';

export interface AdminAccount {
  id: string;
  username: string;
  fullName: string;
  password: string;
}

export const adminAccounts = ref<AdminAccount[]>([
  {
    id: '11111111-1111-4111-8111-111111111111',
    username: '1000100100',
    fullName: 'Shifu Administrador Principal',
    password: 'AdminDojo2026!',
  },
]);

export function verifyAdminPassword(password: string): boolean {
  const clean = password.trim();
  return adminAccounts.value.some((a) => a.password === clean);
}

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

export function loginAdmin(username: string, password: string): string | null {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();
  const matched = adminAccounts.value.find(
    (a) =>
      (a.username.toLowerCase() === cleanUser || (cleanUser === 'admin' && a.id === '11111111-1111-4111-8111-111111111111')) &&
      a.password === cleanPass
  );

  if (!matched) {
    return 'Credenciales de Administrador inválidas.';
  }

  currentUser.value = {
    id: matched.id,
    username: matched.username,
    documentNumber: matched.username,
    email: null,
    fullName: matched.fullName,
    role: 'ADMIN',
    isActive: true,
    studentId: null,
    hasDelegatedClassPermission: true,
  };
  activeWorkspaceView.value = 'ADMIN';
  isAuthenticated.value = true;
  return null;
}

export function updateCurrentAdminCredentials(params: {
  newUsername: string;
  newFullName: string;
  currentPassword: string;
  newPassword: string;
}): { ok: boolean; message: string } {
  const account = adminAccounts.value.find((a) => a.id === currentUser.value.id);
  if (!account) return { ok: false, message: 'No se encontró la cuenta activa.' };

  if (account.password !== params.currentPassword.trim()) {
    return { ok: false, message: 'La contraseña actual es incorrecta.' };
  }

  const cleanUser = params.newUsername.trim();
  const cleanName = params.newFullName.trim();
  const cleanPass = params.newPassword.trim();

  if (!cleanUser || !cleanName) {
    return { ok: false, message: 'El usuario y el nombre son obligatorios.' };
  }

  const duplicate = adminAccounts.value.some(
    (a) => a.id !== account.id && a.username.toLowerCase() === cleanUser.toLowerCase()
  );
  if (duplicate) {
    return { ok: false, message: 'Ya existe otro administrador con ese usuario.' };
  }

  account.username = cleanUser;
  account.fullName = cleanName;
  if (cleanPass.length > 0) {
    account.password = cleanPass;
  }

  currentUser.value.username = account.username;
  currentUser.value.documentNumber = account.username;
  currentUser.value.fullName = account.fullName;

  return { ok: true, message: 'Usuario y contraseña actualizados correctamente.' };
}

export function createAdminAccount(params: {
  fullName: string;
  username: string;
  password: string;
}): { ok: boolean; message: string } {
  const cleanName = params.fullName.trim();
  const cleanUser = params.username.trim();
  const cleanPass = params.password.trim();

  if (!cleanName || !cleanUser || cleanPass.length < 4) {
    return { ok: false, message: 'Completa nombre, usuario y una contraseña de al menos 4 caracteres.' };
  }

  if (adminAccounts.value.some((a) => a.username.toLowerCase() === cleanUser.toLowerCase())) {
    return { ok: false, message: 'Ese usuario administrador ya existe.' };
  }

  adminAccounts.value = [
    ...adminAccounts.value,
    {
      id: `admin-${Date.now()}`,
      fullName: cleanName,
      username: cleanUser,
      password: cleanPass,
    },
  ];
  return { ok: true, message: `Administrador "${cleanName}" creado correctamente.` };
}

export function deleteAdminAccount(adminId: string): { ok: boolean; message: string } {
  if (adminId === currentUser.value.id) {
    return { ok: false, message: 'No puedes eliminar la cuenta con la que estás conectado.' };
  }
  if (adminAccounts.value.length <= 1) {
    return { ok: false, message: 'Debe existir al menos un administrador.' };
  }
  adminAccounts.value = adminAccounts.value.filter((a) => a.id !== adminId);
  return { ok: true, message: 'Administrador eliminado.' };
}

export function logout(): void {
  isAuthenticated.value = false;
}
