<template>
  <div class="lotus-glass-card p-6 sm:p-7 space-y-6">
    <!-- Encabezado simple y directo -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
      <div>
        <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          <AppIcon name="shield" :size="13" />
          <span>Auditoría de Presencia en Vivo</span>
        </span>
        <h3 class="text-[21px] font-semibold text-white mt-1">Quién está en el Tatami</h3>
        <p class="text-[13px] text-zinc-400 mt-0.5">
          Saca a quien el sistema registró por error o ingresa manualmente a quien no fue detectado.
        </p>
      </div>

      <input
        v-model="searchTerm"
        type="text"
        placeholder="Buscar estudiante..."
        class="lotus-glass-input px-4 py-2 text-[13.5px] w-full sm:w-64"
      />
    </div>

    <div
      v-if="feedbackMsg"
      class="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-zinc-100 text-[13px] flex items-center justify-between animate-dojo-tab"
    >
      <span>{{ feedbackMsg }}</span>
      <button type="button" @click="feedbackMsg = ''" class="opacity-75 hover:opacity-100">
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <!-- Dos columnas claras: Están en clase / No están en clase -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- COLUMNA 1: ESTÁN EN CLASE -->
      <div class="lotus-glass-subcard p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]"></span>
            <h4 class="text-[15px] font-semibold text-white">Están en clase ({{ presentStudents.length }})</h4>
          </div>
          <span class="text-[11px] text-zinc-400">Sacar si fue error</span>
        </div>

        <div v-if="presentStudents.length > 0" class="space-y-2.5">
          <div
            v-for="student in presentStudents"
            :key="student.id"
            class="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                :src="student.profilePhotoUrl"
                :alt="student.firstName"
                class="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
              />
              <div class="min-w-0">
                <p class="text-[14px] font-semibold text-white truncate">
                  {{ student.firstName }} {{ student.lastName }}
                </p>
                <p class="text-[11.5px] text-zinc-400 truncate">
                  {{ student.beltName }} · {{ student.lastCheckInMethod === 'AUTO_GPS' ? 'Detectado por GPS' : 'Ingreso manual' }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="removeFromClass(student.id, `${student.firstName} ${student.lastName}`)"
              class="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[12px] font-semibold inline-flex items-center gap-1.5 shrink-0 transition"
            >
              <AppIcon name="x" :size="13" />
              <span>Sacar</span>
            </button>
          </div>
        </div>
        <p v-else class="text-[13px] text-zinc-400 py-4 text-center">
          No hay estudiantes registrados en clase ahora.
        </p>
      </div>

      <!-- COLUMNA 2: NO ESTÁN EN CLASE -->
      <div class="lotus-glass-subcard p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-500"></span>
            <h4 class="text-[15px] font-semibold text-white">No están en clase ({{ absentStudents.length }})</h4>
          </div>
          <span class="text-[11px] text-zinc-400">Ingresar si no lo detectó</span>
        </div>

        <div v-if="absentStudents.length > 0" class="space-y-2.5">
          <div
            v-for="student in absentStudents"
            :key="student.id"
            class="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <img
                :src="student.profilePhotoUrl"
                :alt="student.firstName"
                class="w-10 h-10 rounded-full object-cover border border-white/15 opacity-80 shrink-0"
              />
              <div class="min-w-0">
                <p class="text-[14px] font-semibold text-white truncate">
                  {{ student.firstName }} {{ student.lastName }}
                </p>
                <p class="text-[11.5px] text-zinc-400 truncate">
                  {{ student.beltName }} · CC {{ student.documentNumber }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="addToClass(student.id, `${student.firstName} ${student.lastName}`)"
              class="px-3.5 py-1.5 rounded-xl bg-[#2E7D5B]/25 hover:bg-[#2E7D5B]/45 border border-emerald-400/35 text-emerald-200 text-[12px] font-semibold inline-flex items-center gap-1.5 shrink-0 transition"
            >
              <AppIcon name="plus" :size="13" />
              <span>Ingresar</span>
            </button>
          </div>
        </div>
        <p v-else class="text-[13px] text-zinc-400 py-4 text-center">
          Todos los estudiantes están en clase.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon from '../components/AppIcon.vue';

const store = useDojoStore();
const searchTerm = ref('');
const feedbackMsg = ref('');

const matchingStudents = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return store.students.value;
  return store.students.value.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.documentNumber}`.toLowerCase().includes(term)
  );
});

const presentStudents = computed(() =>
  matchingStudents.value.filter((s) => s.isCurrentlyInClass)
);

const absentStudents = computed(() =>
  matchingStudents.value.filter((s) => !s.isCurrentlyInClass)
);

function removeFromClass(studentId: string, fullName: string): void {
  store.recordClassSessionActivity({
    studentId,
    isCurrentlyInClass: false,
    techniquesPracticed: '',
    trainingObservations: 'Retirado manualmente en auditoría de presencia.',
  });
  feedbackMsg.value = `${fullName} fue sacado de la lista de presentes.`;
}

function addToClass(studentId: string, fullName: string): void {
  store.recordClassSessionActivity({
    studentId,
    isCurrentlyInClass: true,
    techniquesPracticed: '',
    trainingObservations: 'Ingresado manualmente en auditoría de presencia.',
  });
  feedbackMsg.value = `${fullName} fue ingresado a la clase de hoy.`;
}
</script>
