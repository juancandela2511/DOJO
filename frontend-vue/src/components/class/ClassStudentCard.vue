<template>
  <div
    class="lotus-glass-card p-5 flex flex-col justify-between gap-4 transition"
    :class="student.isCurrentlyInClass ? 'border-emerald-400/25' : 'opacity-80'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 cursor-pointer" @click="$emit('open-profile', student.id)">
        <div
          class="w-12 h-12 rounded-full p-[2px] shrink-0"
          :style="{
            backgroundColor: student.beltColorHex,
            border: ['#18181B', '#1D1D1F'].includes(student.beltColorHex.toUpperCase()) ? '1.5px solid #ffffff' : 'none',
          }"
        >
          <img :src="student.profilePhotoUrl" :alt="student.firstName" class="w-full h-full rounded-full object-cover" />
        </div>
        <div class="min-w-0">
          <h3 class="text-[15.5px] font-semibold text-white truncate hover:underline">
            {{ student.firstName }} {{ student.lastName }}
          </h3>
          <div class="flex flex-wrap items-center gap-2 mt-0.5 text-[11.5px] text-zinc-400">
            <span class="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
              <span class="w-2.5 h-2.5 rounded-full border border-white/30" :style="{ backgroundColor: student.beltColorHex }"></span>
              {{ student.beltName }}
            </span>
            <span>· CC {{ student.documentNumber }}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        @click="$emit('open-profile', student.id)"
        class="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-zinc-200 text-[11.5px] font-medium shrink-0"
      >
        Ver Ficha
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/30 border border-white/10">
      <button
        type="button"
        @click="$emit('set-attendance', student.id, true)"
        class="py-2 rounded-lg text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
        :class="student.isCurrentlyInClass ? 'bg-[#2E7D5B] text-white shadow-sm' : 'text-zinc-400 hover:text-white'"
      >
        <AppIcon name="check" :size="14" />
        <span>Vino a clase</span>
      </button>
      <button
        type="button"
        @click="$emit('set-attendance', student.id, false)"
        class="py-2 rounded-lg text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition"
        :class="!student.isCurrentlyInClass ? 'bg-[#C0392B] text-white shadow-sm' : 'text-zinc-400 hover:text-white'"
      >
        <AppIcon name="x" :size="14" />
        <span>No vino</span>
      </button>
    </div>

    <div v-if="student.isCurrentlyInClass" class="space-y-3 pt-2 border-t border-white/10">
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in quickTags"
          :key="tag"
          type="button"
          @click="$emit('add-tag', student.id, tag)"
          class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/12 border border-white/10 text-zinc-300 text-[11px] transition"
        >
          + {{ tag }}
        </button>
      </div>

      <div class="space-y-2">
        <input
          :value="draft.techniques"
          @input="$emit('update-techniques', student.id, ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Ejercicios o formas practicadas hoy..."
          class="lotus-glass-input w-full px-3.5 py-2 text-[13px]"
        />
        <div class="flex gap-2">
          <input
            :value="draft.observations"
            @input="$emit('update-observations', student.id, ($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Observaciones..."
            class="lotus-glass-input flex-1 px-3.5 py-2 text-[13px]"
          />
          <button
            type="button"
            @click="$emit('save', student.id, `${student.firstName} ${student.lastName}`)"
            class="lotus-primary-pill px-5 py-2 text-[12.5px] shrink-0"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudentFullRecord } from '../../types/dojo';
import AppIcon from '../AppIcon.vue';

defineProps<{
  student: StudentFullRecord;
  draft: { techniques: string; observations: string };
  quickTags: string[];
}>();

defineEmits<{
  (e: 'open-profile', studentId: string): void;
  (e: 'set-attendance', studentId: string, attended: boolean): void;
  (e: 'add-tag', studentId: string, tag: string): void;
  (e: 'update-techniques', studentId: string, val: string): void;
  (e: 'update-observations', studentId: string, val: string): void;
  (e: 'save', studentId: string, fullName: string): void;
}>();
</script>
