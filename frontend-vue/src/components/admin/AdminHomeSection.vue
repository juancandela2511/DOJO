<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="lotus-glass-card p-5 relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[3px] bg-[#2E7D5B]"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">En Clase Hoy</span>
          <span class="w-8 h-8 rounded-xl bg-white/10 text-zinc-200 flex items-center justify-center">
            <AppIcon name="calendar" :size="16" />
          </span>
        </div>
        <p class="text-[32px] font-bold text-white mt-2 leading-none">{{ store.inClassCount.value }}</p>
        <p class="text-[11.5px] text-zinc-400 mt-1.5">de {{ store.students.value.length }} estudiantes</p>
      </div>

      <div class="lotus-glass-card p-5 relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[3px] bg-[#2E7D5B]"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pagas</span>
          <span class="w-8 h-8 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center">
            <AppIcon name="check" :size="16" />
          </span>
        </div>
        <p class="text-[32px] font-bold text-white mt-2 leading-none">{{ greenCount }}</p>
        <p class="text-[11.5px] text-zinc-400 mt-1.5">{{ pct(greenCount) }}% al día</p>
      </div>

      <div class="lotus-glass-card p-5 relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[3px] bg-[#C0392B]"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pendientes</span>
          <span class="w-8 h-8 rounded-xl bg-white/10 text-rose-300 flex items-center justify-center">
            <AppIcon name="credit-card" :size="16" />
          </span>
        </div>
        <p class="text-[32px] font-bold text-white mt-2 leading-none">{{ yellowCount + redCount }}</p>
        <p class="text-[11.5px] text-zinc-400 mt-1.5">{{ yellowCount }} por vencer · {{ redCount }} vencidas</p>
      </div>

      <div class="lotus-glass-card p-5 relative overflow-hidden">
        <div class="absolute inset-x-0 top-0 h-[3px] bg-[#D4A017]"></div>
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Permiso Clase</span>
          <span class="w-8 h-8 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
            <AppIcon name="star" :size="16" />
          </span>
        </div>
        <p class="text-[32px] font-bold text-white mt-2 leading-none">{{ delegatedCount }}</p>
        <p class="text-[11.5px] text-zinc-400 mt-1.5">instructores delegados</p>
      </div>
    </div>

    <div class="lotus-glass-card p-6 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h3 class="text-[19px] font-semibold text-white">Estudiantes Recientes</h3>
          <p class="text-[12.5px] text-zinc-400">Toca cualquier tarjeta para abrir su ruta de aprendizaje y menú.</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="$emit('navigate', 'CONFIGURACION')"
            class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 text-[12.5px] font-medium inline-flex items-center gap-2"
          >
            <AppIcon name="settings" :size="15" />
            <span>Rutas por Cinturón</span>
          </button>
          <button
            type="button"
            @click="$emit('navigate', 'ESTUDIANTES')"
            class="lotus-primary-pill px-4 py-2 text-[12.5px] inline-flex items-center gap-1.5"
          >
            <span>Ver Todos</span>
            <AppIcon name="chevron-right" :size="15" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pt-2">
        <StudentBeltCard
          v-for="student in store.students.value"
          :key="student.id"
          :student="student"
          @select="$emit('select-student', $event.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';
import StudentBeltCard from '../StudentBeltCard.vue';
import type { AdminTab } from './AdminCompactNav.vue';

defineEmits<{
  (e: 'navigate', tab: AdminTab): void;
  (e: 'select-student', studentId: string): void;
}>();

const store = useDojoStore();
const greenCount = computed(() => store.students.value.filter((s) => s.trafficLight === 'VERDE').length);
const yellowCount = computed(() => store.students.value.filter((s) => s.trafficLight === 'AMARILLO').length);
const redCount = computed(() => store.students.value.filter((s) => s.trafficLight === 'ROJO').length);
const delegatedCount = computed(() => store.students.value.filter((s) => s.hasDelegatedClassPermission).length);
const pct = (n: number) => (store.students.value.length ? Math.round((n / store.students.value.length) * 100) : 0);
</script>
