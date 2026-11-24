<template>
  <div class="lotus-glass-subcard p-5 space-y-4">
    <div class="flex items-center gap-3">
      <div
        class="w-11 h-11 rounded-2xl flex items-center justify-center border"
        :class="
          student.hasDelegatedClassPermission
            ? 'bg-amber-400/20 border-amber-300/40 text-amber-300'
            : 'bg-white/5 border-white/10 text-zinc-400'
        "
      >
        <AppIcon name="star" :size="20" />
      </div>
      <div>
        <span class="text-[11px] uppercase tracking-wider text-zinc-400 block">Permiso para Dar Clase</span>
        <h4 class="text-[16px] font-semibold text-white">
          {{ student.hasDelegatedClassPermission ? 'Permiso Activo' : 'Sin permiso de clase' }}
        </h4>
      </div>
    </div>
    <p class="text-[13px] text-zinc-400 leading-relaxed">
      Al activar este permiso, aparece la estrella dorada en la esquina superior izquierda de la tarjeta y el estudiante puede dirigir la clase ingresando con su cédula.
    </p>
    <div v-if="isAdmin" class="flex justify-end">
      <button
        type="button"
        @click="toggle"
        class="px-5 py-2 rounded-full text-[13px] font-semibold inline-flex items-center gap-2 transition"
        :class="
          student.hasDelegatedClassPermission
            ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/35 text-rose-200'
            : 'bg-[#D4A017] hover:opacity-90 text-zinc-950'
        "
      >
        <AppIcon :name="student.hasDelegatedClassPermission ? 'x' : 'star'" :size="15" />
        <span>{{ student.hasDelegatedClassPermission ? 'Quitar Permiso' : 'Dar Permiso de Clase' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StudentFullRecord } from '../../types/dojo';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ student: StudentFullRecord }>();
const emit = defineEmits<{ (e: 'notify', msg: string): void }>();
const store = useDojoStore();
const isAdmin = computed(() => store.currentUser.value.role === 'ADMIN');

function toggle(): void {
  const granted = store.toggleClassDelegation(props.student.id);
  emit('notify', granted ? 'Permiso de clase otorgado.' : 'Permiso de clase revocado.');
}
</script>
