<template>
  <div class="relative pt-3 flex flex-col items-center">
    <button
      type="button"
      :disabled="!canPromote || !nextBelt"
      @click="showBox = !showBox"
      class="relative z-10 flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition"
      :class="
        canPromote && nextBelt
          ? 'bg-white text-zinc-950 border-white shadow-[0_0_24px_rgba(255,255,255,0.28)] hover:scale-[1.02]'
          : 'bg-white/[0.04] text-zinc-500 border-white/10 cursor-not-allowed'
      "
    >
      <AppIcon :name="canPromote && nextBelt ? 'award' : 'lock'" :size="18" />
      <div class="text-left">
        <span class="block text-[10px] font-bold uppercase tracking-[0.16em] opacity-75">Meta Final</span>
        <span class="block text-[13.5px] font-semibold">
          {{ nextBelt ? `Cambio a ${nextBelt.name}` : 'Grado Máximo Alcanzado' }}
        </span>
      </div>
    </button>

    <form
      v-if="showBox && canPromote && nextBelt"
      @submit.prevent="submit"
      class="mt-4 w-full max-w-sm p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3 animate-dojo-tab"
    >
      <div class="flex items-center gap-2 text-[12px] font-semibold text-zinc-200">
        <AppIcon name="key" :size="15" />
        <span>Contraseña del Admin para cambiar de cinturón</span>
      </div>
      <input
        v-model="password"
        type="password"
        required
        placeholder="Contraseña de administrador"
        class="lotus-glass-input w-full px-3.5 py-2 text-[13px]"
      />
      <div class="flex justify-end gap-2">
        <button type="button" @click="showBox = false" class="px-3.5 py-1.5 rounded-full bg-white/10 text-zinc-300 text-[12px]">
          Cancelar
        </button>
        <button type="submit" class="lotus-primary-pill px-4 py-1.5 text-[12px]">Confirmar Cambio</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { BeltModel } from '../../types/dojo';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{
  studentId: string;
  currentBeltId: number;
  canPromote: boolean;
  nextBelt: BeltModel | null;
}>();

const emit = defineEmits<{ (e: 'result', payload: { ok: boolean; message: string }): void }>();
const store = useDojoStore();
const showBox = ref(false);
const password = ref('');

watch(
  () => [props.studentId, props.currentBeltId],
  () => {
    showBox.value = false;
    password.value = '';
  }
);

function submit(): void {
  const res = store.promoteStudentViaPath(props.studentId, password.value);
  emit('result', res);
  if (res.ok) {
    password.value = '';
    showBox.value = false;
  }
}
</script>
