<template>
  <div class="sm:col-span-3 lotus-glass-subcard p-4 flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3.5">
      <div class="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-zinc-400">
        <img v-if="modelValue" :src="modelValue" alt="Vista previa foto" class="w-full h-full object-cover" />
        <AppIcon v-else name="user" :size="24" />
      </div>
      <div>
        <span class="block text-[13px] font-semibold text-white">Foto del Estudiante</span>
        <span class="text-[12px] text-zinc-400">Sube una foto desde tu dispositivo o cámara.</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <label class="lotus-primary-pill px-4 py-2 text-[12.5px] cursor-pointer inline-flex items-center gap-1.5">
        <AppIcon name="camera" :size="14" />
        <span>Subir Foto</span>
        <input type="file" accept="image/*" class="hidden" @change="onSelect" />
      </label>
      <button
        v-if="modelValue"
        type="button"
        @click="$emit('update:modelValue', '')"
        class="px-3 py-2 rounded-full bg-white/10 hover:bg-rose-500/25 text-zinc-200 text-[12px]"
      >
        Quitar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '../AppIcon.vue';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

function onSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') emit('update:modelValue', reader.result);
  };
  reader.readAsDataURL(file);
}
</script>
