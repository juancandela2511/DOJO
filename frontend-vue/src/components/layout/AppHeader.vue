<template>
  <header class="dojo-header sticky top-0 z-40 px-4 sm:px-6 h-15 flex items-center bg-[#0b0d13]/80 backdrop-blur-xl border-b border-white/10 text-white">
    <div class="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4 py-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-pink-200">
          <AppIcon name="lotus" :size="18" />
        </span>
        <span class="text-[16.5px] font-semibold tracking-tight text-white">Kung Fu Dojo</span>
        <span v-if="store.isAuthenticated.value" class="hidden md:inline-block text-[13px] text-zinc-400 ml-2">
          | <strong class="text-white">{{ store.currentUser.value.fullName }}</strong> (CC {{ store.currentUser.value.documentNumber }})
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="store.toggleTheme()"
          class="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] font-medium transition inline-flex items-center gap-1.5"
        >
          <AppIcon :name="store.theme.value === 'dark' ? 'sun' : 'moon'" :size="14" />
          <span class="hidden sm:inline">{{ store.theme.value === 'dark' ? 'Claro' : 'Oscuro' }}</span>
        </button>

        <template v-if="store.isAuthenticated.value">
          <div
            v-if="store.currentUser.value.role !== 'ADMIN' && store.canManageClass.value"
            class="inline-flex p-0.5 rounded-full bg-white/10 border border-white/15"
          >
            <button
              type="button"
              @click="store.activeWorkspaceView.value = 'ESTUDIANTE'"
              class="px-3 py-1 rounded-full text-[12px] inline-flex items-center gap-1.5"
              :class="store.activeWorkspaceView.value === 'ESTUDIANTE' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-300'"
            >
              <AppIcon name="user" :size="13" />
              <span>Mi Perfil</span>
            </button>
            <button
              type="button"
              @click="store.activeWorkspaceView.value = 'CLASE'"
              class="px-3 py-1 rounded-full text-[12px] inline-flex items-center gap-1.5"
              :class="store.activeWorkspaceView.value === 'CLASE' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-300'"
            >
              <AppIcon name="calendar" :size="13" />
              <span>Dar Clase</span>
            </button>
          </div>

          <button
            type="button"
            @click="$emit('open-login', 'ESTUDIANTE')"
            class="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-[12px] font-medium border border-white/15"
          >
            Cambiar Cuenta
          </button>
          <button
            type="button"
            @click="store.logout()"
            class="px-3.5 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/25 text-[12px] font-medium inline-flex items-center gap-1.5"
          >
            <AppIcon name="logout" :size="13" />
            <span>Salir</span>
          </button>
        </template>

        <button
          v-else
          type="button"
          @click="$emit('open-login', 'ESTUDIANTE')"
          class="lotus-primary-pill px-5 py-1.5 text-[13px]"
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

defineEmits<{ (e: 'open-login', tab: 'ESTUDIANTE' | 'ADMIN'): void }>();
const store = useDojoStore();
</script>
