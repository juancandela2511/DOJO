<template>
  <div class="space-y-4">
    <div class="lotus-glass-subcard p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Grado y Cinturón</span>
        <p class="text-[15px] font-semibold text-white mt-0.5">{{ student.beltName }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="student.currentBeltId <= 1"
          @click="handleBelt('DESCENSO')"
          class="px-3.5 py-2 rounded-xl text-[12.5px] font-semibold border border-rose-400/30 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 disabled:opacity-35 inline-flex items-center gap-1.5"
        >
          <AppIcon name="arrow-down" :size="14" />
          <span>Descender</span>
        </button>
        <button
          type="button"
          :disabled="student.currentBeltId >= store.belts.value.length"
          @click="handleBelt('ASCENSO')"
          class="px-3.5 py-2 rounded-xl text-[12.5px] font-semibold border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 disabled:opacity-35 inline-flex items-center gap-1.5"
        >
          <AppIcon name="arrow-up" :size="14" />
          <span>Ascender</span>
        </button>
      </div>
    </div>

    <div class="lotus-glass-subcard p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">Asistencia de Hoy</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="setAttendance(true)"
            :class="student.isCurrentlyInClass ? 'px-3.5 py-1.5 rounded-full bg-[#2E7D5B] text-white text-[12px] font-semibold inline-flex items-center gap-1' : 'px-3.5 py-1.5 rounded-full bg-white/10 text-zinc-300 text-[12px] inline-flex items-center gap-1'"
          >
            <AppIcon name="check" :size="13" />
            <span>Vino</span>
          </button>
          <button
            type="button"
            @click="setAttendance(false)"
            :class="!student.isCurrentlyInClass ? 'px-3.5 py-1.5 rounded-full bg-[#C0392B] text-white text-[12px] font-semibold inline-flex items-center gap-1' : 'px-3.5 py-1.5 rounded-full bg-white/10 text-zinc-300 text-[12px] inline-flex items-center gap-1'"
          >
            <AppIcon name="x" :size="13" />
            <span>No vino</span>
          </button>
        </div>
      </div>

      <input v-model="techniques" type="text" placeholder="Técnicas practicadas hoy..." class="lotus-glass-input w-full px-3.5 py-2 text-[13px]" />
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model="observations" type="text" placeholder="Observaciones..." class="lotus-glass-input flex-1 px-3.5 py-2 text-[13px]" />
        <button type="button" @click="saveActivity" class="lotus-primary-pill px-5 py-2 text-[12.5px]">Guardar</button>
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">Historial</h4>
      <div v-if="history.length > 0" class="space-y-2">
        <div v-for="log in history" :key="log.id" class="p-3 rounded-xl bg-white/5 border border-white/10 text-[12.5px]">
          <div class="flex justify-between text-zinc-400 mb-1">
            <span>{{ log.sessionDate }} · {{ log.checkInTime }}</span>
            <span :class="log.isCurrentlyInClass ? 'text-emerald-300 font-semibold' : 'text-rose-300'">
              {{ log.isCurrentlyInClass ? 'Asistió' : 'Ausente' }}
            </span>
          </div>
          <p class="text-white">{{ log.techniquesPracticed || 'Asistencia confirmada' }}</p>
        </div>
      </div>
      <p v-else class="text-[12.5px] text-zinc-400">Sin sesiones registradas.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StudentFullRecord } from '../../types/dojo';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ student: StudentFullRecord }>();
const emit = defineEmits<{ (e: 'notify', msg: string): void }>();

const store = useDojoStore();
const techniques = ref('');
const observations = ref('');
const history = computed(() => store.getStudentClassHistory(props.student.id));

watch(
  () => props.student.id,
  () => {
    const log = store.getTodayLogForStudent(props.student.id);
    techniques.value = log?.techniquesPracticed || '';
    observations.value = log?.trainingObservations || '';
  },
  { immediate: true }
);

function handleBelt(dir: 'ASCENSO' | 'DESCENSO'): void {
  const b = store.changeStudentBelt(props.student.id, dir);
  if (b) emit('notify', `${dir === 'ASCENSO' ? 'Ascendido' : 'Descendido'} a ${b.name}.`);
}

function setAttendance(attended: boolean): void {
  store.recordClassSessionActivity({ studentId: props.student.id, isCurrentlyInClass: attended, techniquesPracticed: techniques.value, trainingObservations: observations.value });
  emit('notify', attended ? 'Marcado como presente.' : 'Marcado como ausente.');
}

function saveActivity(): void {
  store.recordClassSessionActivity({ studentId: props.student.id, isCurrentlyInClass: true, techniquesPracticed: techniques.value, trainingObservations: observations.value });
  emit('notify', 'Actividad de clase guardada.');
}
</script>
