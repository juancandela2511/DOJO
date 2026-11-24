<template>
  <div class="space-y-5">
    <div class="lotus-glass-card p-6 space-y-5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <AppIcon name="calendar" :size="13" />
            <span>Control de Clase · {{ store.currentUser.value.fullName }}</span>
          </span>
          <h2 class="text-[22px] font-semibold text-white mt-1">Asistencia y Actividades de Hoy</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            v-if="store.currentUser.value.role !== 'ADMIN'"
            type="button"
            @click="store.activeWorkspaceView.value = 'ESTUDIANTE'"
            class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-[12px] font-medium border border-white/10 inline-flex items-center gap-1.5"
          >
            <AppIcon name="chevron-left" :size="14" />
            <span>Mi Perfil</span>
          </button>

          <div class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2E7D5B]/20 border border-[#2E7D5B]/45">
            <span class="text-[18px] font-bold text-emerald-300 leading-none">{{ attendedCount }}</span>
            <span class="text-[11.5px] text-emerald-200/90 font-medium">Vinieron</span>
          </div>
          <div class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/12">
            <span class="text-[18px] font-bold text-zinc-200 leading-none">{{ absentCount }}</span>
            <span class="text-[11.5px] text-zinc-400 font-medium">Ausentes</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
        <div class="inline-flex p-1 rounded-xl bg-black/35 border border-white/10 self-start">
          <button type="button" @click="filterMode = 'TODOS'" class="px-3.5 py-1.5 rounded-lg text-[12.5px] transition" :class="filterMode === 'TODOS' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'">
            Todos ({{ store.students.value.length }})
          </button>
          <button type="button" @click="filterMode = 'VINIERON'" class="px-3.5 py-1.5 rounded-lg text-[12.5px] transition" :class="filterMode === 'VINIERON' ? 'bg-[#2E7D5B] text-white font-semibold' : 'text-zinc-400 hover:text-white'">
            Vinieron ({{ attendedCount }})
          </button>
          <button type="button" @click="filterMode = 'NO_VINIERON'" class="px-3.5 py-1.5 rounded-lg text-[12.5px] transition" :class="filterMode === 'NO_VINIERON' ? 'bg-[#C0392B] text-white font-semibold' : 'text-zinc-400 hover:text-white'">
            Ausentes ({{ absentCount }})
          </button>
        </div>

        <input v-model="searchTerm" type="text" placeholder="Buscar por nombre o cédula..." class="lotus-glass-input px-4 py-2 text-[13.5px] w-full sm:w-64" />
      </div>
    </div>

    <div v-if="feedbackBanner" class="lotus-glass-card px-4 py-3 text-zinc-100 text-[13px] flex items-center justify-between animate-dojo-tab">
      <span>{{ feedbackBanner }}</span>
      <button type="button" @click="feedbackBanner = ''" class="opacity-75 hover:opacity-100">
        <AppIcon name="x" :size="15" />
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ClassStudentCard
        v-for="student in filteredStudents"
        :key="student.id"
        :student="student"
        :draft="drafts[student.id]"
        :quick-tags="quickTags"
        @open-profile="selectedStudentId = $event"
        @set-attendance="setAttendance"
        @add-tag="appendQuickTag"
        @update-techniques="(id, v) => (drafts[id].techniques = v)"
        @update-observations="(id, v) => (drafts[id].observations = v)"
        @save="saveActivity"
      />
    </div>

    <StudentDetailModal v-if="selectedStudent" :student="selectedStudent" @close="selectedStudentId = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon from '../components/AppIcon.vue';
import ClassStudentCard from '../components/class/ClassStudentCard.vue';
import StudentDetailModal from '../components/StudentDetailModal.vue';

const store = useDojoStore();
const filterMode = ref<'TODOS' | 'VINIERON' | 'NO_VINIERON'>('TODOS');
const searchTerm = ref('');
const feedbackBanner = ref('');
const selectedStudentId = ref<string | null>(null);
const quickTags = ['Calentamiento y Ma Bu', 'Taolu Changquan', 'Defensa y Sanda', 'Espada Jian Shu', 'Flexibilidad'];
const drafts = reactive<Record<string, { techniques: string; observations: string }>>({});

watchEffect(() => {
  for (const s of store.students.value) {
    if (!drafts[s.id]) {
      const log = store.getTodayLogForStudent(s.id);
      drafts[s.id] = { techniques: log?.techniquesPracticed || '', observations: log?.trainingObservations || '' };
    }
  }
});

const attendedCount = computed(() => store.students.value.filter((s) => s.isCurrentlyInClass).length);
const absentCount = computed(() => store.students.value.filter((s) => !s.isCurrentlyInClass).length);
const filteredStudents = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  return store.students.value.filter((s) => {
    if (filterMode.value === 'VINIERON' && !s.isCurrentlyInClass) return false;
    if (filterMode.value === 'NO_VINIERON' && s.isCurrentlyInClass) return false;
    return !term || `${s.firstName} ${s.lastName} ${s.documentNumber}`.toLowerCase().includes(term);
  });
});
const selectedStudent = computed(() => store.students.value.find((s) => s.id === selectedStudentId.value) || null);

function appendQuickTag(studentId: string, tag: string): void {
  const cur = drafts[studentId]?.techniques || '';
  drafts[studentId].techniques = cur ? `${cur}, ${tag}` : tag;
}

function setAttendance(studentId: string, attended: boolean): void {
  const d = drafts[studentId] || { techniques: '', observations: '' };
  store.recordClassSessionActivity({ studentId, isCurrentlyInClass: attended, techniquesPracticed: d.techniques, trainingObservations: d.observations });
  feedbackBanner.value = attended ? 'Asistencia confirmada.' : 'Marcado como ausente.';
}

function saveActivity(studentId: string, fullName: string): void {
  const d = drafts[studentId] || { techniques: '', observations: '' };
  store.recordClassSessionActivity({ studentId, isCurrentlyInClass: true, techniquesPracticed: d.techniques, trainingObservations: d.observations });
  feedbackBanner.value = `Actividad guardada para ${fullName}.`;
}
</script>
