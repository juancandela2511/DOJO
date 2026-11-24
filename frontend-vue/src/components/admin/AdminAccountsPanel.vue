<template>
  <div class="space-y-6">
    <div
      v-if="feedback"
      class="px-4 py-3 rounded-xl border text-[13px] flex items-center justify-between animate-dojo-tab"
      :class="isError ? 'bg-rose-500/15 border-rose-400/35 text-rose-200' : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'"
    >
      <span>{{ feedback }}</span>
      <button type="button" @click="feedback = ''" class="opacity-75 hover:opacity-100">
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 1. Cambiar mi usuario y contraseña -->
      <form @submit.prevent="saveMyCredentials" class="lotus-glass-subcard p-5 space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <AppIcon name="key" :size="17" />
          </span>
          <div>
            <h4 class="text-[15.5px] font-semibold text-white">Mi Usuario y Contraseña</h4>
            <p class="text-[12px] text-zinc-400">Actualiza tus credenciales de acceso y aprobación.</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Nombre Completo *</label>
            <input v-model="editForm.newFullName" type="text" required class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Usuario / Cédula *</label>
            <input v-model="editForm.newUsername" type="text" required class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Contraseña Actual *</label>
            <input v-model="editForm.currentPassword" type="password" required placeholder="Ingresa tu contraseña actual" class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Nueva Contraseña (opcional)</label>
            <input v-model="editForm.newPassword" type="password" placeholder="Déjalo vacío para mantener la actual" class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
          </div>
        </div>

        <button type="submit" class="w-full lotus-primary-pill py-2.5 px-4 text-[13px]">
          Guardar Cambios
        </button>
      </form>

      <!-- 2. Crear otro usuario administrador -->
      <div class="lotus-glass-subcard p-5 space-y-4">
        <div class="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <AppIcon name="users" :size="17" />
          </span>
          <div>
            <h4 class="text-[15.5px] font-semibold text-white">Crear Otro Administrador</h4>
            <p class="text-[12px] text-zinc-400">Agrega otro Shifu o administrador al sistema.</p>
          </div>
        </div>

        <form @submit.prevent="createAdmin" class="space-y-3">
          <div>
            <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Nombre del Administrador *</label>
            <input v-model="newAdmin.fullName" type="text" required placeholder="Ej. Sensei Alejandro" class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Usuario / Cédula *</label>
              <input v-model="newAdmin.username" type="text" required placeholder="Ej. 1000200300" class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Contraseña *</label>
              <input v-model="newAdmin.password" type="password" required placeholder="Mínimo 4 caracteres" class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]" />
            </div>
          </div>
          <button type="submit" class="w-full lotus-primary-pill py-2.5 px-4 text-[13px] inline-flex items-center justify-center gap-1.5">
            <AppIcon name="plus" :size="15" />
            <span>Crear Administrador</span>
          </button>
        </form>

        <!-- Lista de administradores activos -->
        <div class="pt-3 border-t border-white/10 space-y-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
            Administradores Registrados ({{ store.adminAccounts.value.length }})
          </span>
          <div
            v-for="adm in store.adminAccounts.value"
            :key="adm.id"
            class="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="text-[13.5px] font-semibold text-white truncate">{{ adm.fullName }}</p>
              <p class="text-[11.5px] text-zinc-400 truncate">Usuario: {{ adm.username }}</p>
            </div>
            <span
              v-if="adm.id === store.currentUser.value.id"
              class="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-200 text-[11px] font-semibold shrink-0"
            >
              Actual
            </span>
            <button
              v-else
              type="button"
              @click="removeAdmin(adm.id)"
              class="w-8 h-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0"
              title="Eliminar administrador"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const store = useDojoStore();
const feedback = ref('');
const isError = ref(false);

const editForm = reactive({
  newFullName: store.currentUser.value.fullName,
  newUsername: store.currentUser.value.username,
  currentPassword: '',
  newPassword: '',
});

const newAdmin = reactive({
  fullName: '',
  username: '',
  password: '',
});

function showResult(res: { ok: boolean; message: string }): void {
  isError.value = !res.ok;
  feedback.value = res.message;
}

function saveMyCredentials(): void {
  const res = store.updateCurrentAdminCredentials({ ...editForm });
  showResult(res);
  if (res.ok) {
    editForm.currentPassword = '';
    editForm.newPassword = '';
  }
}

function createAdmin(): void {
  const res = store.createAdminAccount({ ...newAdmin });
  showResult(res);
  if (res.ok) {
    newAdmin.fullName = '';
    newAdmin.username = '';
    newAdmin.password = '';
  }
}

function removeAdmin(id: string): void {
  showResult(store.deleteAdminAccount(id));
}
</script>
