<template>
  <div v-if="activeSection === 'HOME'" class="fixed inset-0 z-0 pointer-events-none">
    <OceanSwell />
  </div>

  <section class="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
    <div class="flex flex-col lg:flex-row gap-5 items-start">
      <AdminCompactNav
        v-model="activeSection"
        :tabs="tabs"
        @create="showCreateModal = true"
      />

      <div class="flex-1 min-w-0 w-full space-y-6">
        <div
          v-if="feedbackMsg"
          class="lotus-glass-card px-5 py-3 text-zinc-100 text-[13px] font-medium flex items-center justify-between animate-dojo-tab"
        >
          <span>{{ feedbackMsg }}</span>
          <button type="button" @click="feedbackMsg = ''" class="opacity-75 hover:opacity-100">
            <AppIcon name="x" :size="15" />
          </button>
        </div>

        <AdminHomeSection
          v-if="activeSection === 'HOME'"
          @navigate="activeSection = $event"
          @select-student="selectedStudentId = $event"
        />

        <div v-else-if="activeSection === 'ESTUDIANTES'" class="lotus-glass-card p-6 sm:p-7 space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <h3 class="text-[21px] font-semibold tracking-tight text-white">Estudiantes</h3>
              <p class="text-[13px] text-zinc-400 mt-0.5">
                Haz clic en una tarjeta para abrir su menú lateral, ruta de aprendizaje, datos y mensualidad.
              </p>
            </div>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar nombre o cédula..."
              class="lotus-glass-input px-4 py-2 text-[13.5px] w-full sm:w-64"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="f in statusFilters"
                :key="f.id"
                type="button"
                @click="activeFilter = f.id"
                class="px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition"
                :class="activeFilter === f.id ? 'bg-white text-zinc-950 border-white font-semibold' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'"
              >
                {{ f.label }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-3.5 text-[11.5px] text-zinc-400">
              <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#2E7D5B]"></span> Paga</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#D4A017]"></span> Por vencer</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#C0392B]"></span> Vencida</span>
              <span class="inline-flex items-center gap-1.5"><AppIcon name="star" :size="12" class="text-amber-400" /> Permiso clase</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 pt-2">
            <StudentBeltCard
              v-for="student in filteredStudents"
              :key="student.id"
              :student="student"
              @select="selectedStudentId = $event.id"
            />

            <button type="button" @click="showCreateModal = true" class="group relative w-full text-left pt-5 focus:outline-none">
              <div class="belt-patch-card h-full min-h-[268px] rounded-[24px] p-[10px] bg-white/[0.04] border-2 border-dashed border-white/25 hover:border-white/60 transition flex">
                <div class="w-full rounded-[15px] bg-black/25 group-hover:bg-black/35 transition flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div class="w-16 h-16 rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-white group-hover:scale-110 transition">
                    <AppIcon name="plus" :size="28" />
                  </div>
                  <div>
                    <h4 class="text-[16px] font-semibold text-white">Crear Nuevo Estudiante</h4>
                    <p class="text-[12px] text-zinc-400 mt-1">Escanear datos (OCR) o llenar manualmente</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <AssistantClassLogView v-else-if="activeSection === 'CLASE_HOY'" />
        <AuditViewerView v-else-if="activeSection === 'AUDITORIA'" />
        <AdminSettingsView v-else />
      </div>
    </div>

    <StudentDetailModal v-if="selectedStudent" :student="selectedStudent" @close="selectedStudentId = null" />
    <CreateStudentModal v-if="showCreateModal" :is-modal="true" @close="showCreateModal = false" @created="onCreated" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon, { type IconName } from '../components/AppIcon.vue';
import OceanSwell from '../components/OceanSwell.vue';
import AdminCompactNav, { type AdminTab } from '../components/admin/AdminCompactNav.vue';
import AdminHomeSection from '../components/admin/AdminHomeSection.vue';
import StudentBeltCard from '../components/StudentBeltCard.vue';
import StudentDetailModal from '../components/StudentDetailModal.vue';
import CreateStudentModal from '../components/CreateStudentModal.vue';
import AssistantClassLogView from './AssistantClassLogView.vue';
import AuditViewerView from './AuditViewerView.vue';
import AdminSettingsView from './AdminSettingsView.vue';

type StatusFilter = 'TODOS' | 'VERDE' | 'AMARILLO' | 'ROJO' | 'ESTRELLA';

const store = useDojoStore();
const activeSection = ref<AdminTab>('ESTUDIANTES');
const activeFilter = ref<StatusFilter>('TODOS');
const searchTerm = ref('');
const selectedStudentId = ref<string | null>(null);
const showCreateModal = ref(false);
const feedbackMsg = ref('');

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'VERDE', label: 'Pagas' },
  { id: 'AMARILLO', label: 'Por vencer' },
  { id: 'ROJO', label: 'Vencidas' },
  { id: 'ESTRELLA', label: 'Con permiso' },
];

const tabs = computed<{ id: AdminTab; icon: IconName; label: string; badge?: number }[]>(() => [
  { id: 'HOME', icon: 'home', label: 'Home' },
  { id: 'ESTUDIANTES', icon: 'users', label: 'Estudiantes', badge: store.students.value.length },
  { id: 'CLASE_HOY', icon: 'calendar', label: 'Clase Hoy', badge: store.inClassCount.value },
  { id: 'AUDITORIA', icon: 'shield', label: 'Auditoría', badge: store.inClassCount.value },
  { id: 'CONFIGURACION', icon: 'settings', label: 'Configuración' },
]);

const filteredStudents = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  return store.students.value.filter((s) => {
    if (activeFilter.value === 'VERDE' && s.trafficLight !== 'VERDE') return false;
    if (activeFilter.value === 'AMARILLO' && s.trafficLight !== 'AMARILLO') return false;
    if (activeFilter.value === 'ROJO' && s.trafficLight !== 'ROJO') return false;
    if (activeFilter.value === 'ESTRELLA' && !s.hasDelegatedClassPermission) return false;
    if (!term) return true;
    return `${s.firstName} ${s.lastName} ${s.documentNumber}`.toLowerCase().includes(term);
  });
});

const selectedStudent = computed(() => store.students.value.find((s) => s.id === selectedStudentId.value) || null);

function onCreated(fullName: string): void {
  showCreateModal.value = false;
  feedbackMsg.value = `Estudiante ${fullName} creado y añadido al catálogo.`;
}
</script>
