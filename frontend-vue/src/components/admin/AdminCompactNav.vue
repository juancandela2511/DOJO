<template>
  <aside
    class="lotus-glass-card p-2.5 flex lg:flex-col justify-between gap-2 lg:sticky lg:top-20 transition-all duration-200 shrink-0 w-full"
    :class="expanded ? 'lg:w-[220px]' : 'lg:w-[68px]'"
  >
    <div class="flex lg:flex-col items-center lg:items-stretch gap-1.5 w-full overflow-x-auto lg:overflow-visible">
      <button
        type="button"
        @click="expanded = !expanded"
        class="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition"
        :class="expanded ? 'justify-between' : 'justify-center'"
        :title="expanded ? 'Contraer menú' : 'Desplegar menú'"
      >
        <span v-if="expanded" class="text-[11px] font-semibold uppercase tracking-[0.16em]">Menú</span>
        <AppIcon :name="expanded ? 'chevron-left' : 'menu'" :size="18" />
      </button>

      <div class="hidden lg:block h-px bg-white/10 my-1"></div>

      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="$emit('update:modelValue', tab.id)"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition shrink-0"
        :class="[
          expanded ? 'lg:justify-between' : 'lg:justify-center',
          modelValue === tab.id ? 'bg-white text-zinc-950 font-semibold shadow-sm' : 'text-zinc-300 hover:bg-white/10 hover:text-white font-medium',
        ]"
        :title="tab.label"
      >
        <span class="flex items-center gap-3">
          <AppIcon :name="tab.icon" :size="18" />
          <span :class="expanded ? 'inline' : 'inline lg:hidden'">{{ tab.label }}</span>
        </span>
        <span
          v-if="expanded && tab.badge !== undefined"
          class="hidden lg:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
          :class="modelValue === tab.id ? 'bg-zinc-900/12 text-zinc-900' : 'bg-white/10 text-zinc-200'"
        >
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <button
      type="button"
      @click="$emit('create')"
      class="hidden lg:flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white text-white hover:text-zinc-950 border border-white/15 text-[12.5px] font-semibold transition mt-2"
      title="Crear nuevo estudiante"
    >
      <AppIcon name="plus" :size="17" />
      <span v-if="expanded">Nuevo</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppIcon, { type IconName } from '../AppIcon.vue';

export type AdminTab = 'HOME' | 'ESTUDIANTES' | 'CLASE_HOY' | 'CONFIGURACION';

defineProps<{
  modelValue: AdminTab;
  tabs: { id: AdminTab; icon: IconName; label: string; badge?: number }[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: AdminTab): void;
  (e: 'create'): void;
}>();

const expanded = ref(false);
</script>
