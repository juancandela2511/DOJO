<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-2xl my-auto pl-4 sm:pl-6 animate-dojo-tab">
      <!-- Pestaña vertical de menú en la esquina superior izquierda -->
      <div class="absolute left-0 sm:left-1 top-6 z-40">
        <button
          type="button"
          @click="menuOpen = !menuOpen"
          class="w-10 h-16 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/25 transition hover:scale-105"
          :class="menuOpen ? 'bg-white text-zinc-950' : 'bg-[#D4A017] text-zinc-950'"
          title="Abrir menú de la tarjeta"
        >
          <AppIcon :name="menuOpen ? 'x' : 'menu'" :size="18" />
        </button>

        <div
          v-if="menuOpen"
          class="mt-2 w-48 rounded-2xl bg-[#14161d] border border-white/15 p-1.5 shadow-2xl space-y-1 animate-dojo-tab"
        >
          <button
            v-for="item in menuItems"
            :key="item.id"
            type="button"
            @click="selectSection(item.id)"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition"
            :class="activeTab === item.id ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-300 hover:bg-white/10 hover:text-white'"
          >
            <AppIcon :name="item.icon" :size="16" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- Marco exterior del color del cinturón -->
      <div class="relative rounded-[30px] p-[5px] shadow-2xl" :style="frameStyle">
        <div class="rounded-[26px] bg-[#12141a] text-white p-5 sm:p-6 space-y-5">
          <button
            type="button"
            @click="$emit('close')"
            class="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center transition"
            aria-label="Cerrar tarjeta"
          >
            <AppIcon name="x" :size="16" />
          </button>

          <!-- Fila superior: Nombre a la izquierda + Círculo Foto a la derecha -->
          <div class="grid grid-cols-[1fr_auto] items-center gap-4 pr-8">
            <div class="rounded-[22px] bg-white/[0.06] border border-white/10 px-5 py-4 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  {{ activeSectionLabel }}
                </span>
                <h3 class="text-[20px] sm:text-[22px] font-semibold text-white leading-tight truncate mt-0.5">
                  {{ student.firstName }} {{ student.lastName }}
                </h3>
                <p class="text-[12.5px] text-zinc-400 mt-0.5 truncate">
                  {{ student.beltName }} · Nivel {{ student.currentBeltId }} / {{ store.belts.value.length }}
                </p>
              </div>
              <MiniBeltSvg
                :color-hex="student.beltColorHex"
                :secondary-color-hex="currentBelt.secondaryColorHex"
                :width="56"
                :height="30"
                class="hidden sm:block shrink-0"
              />
            </div>

            <div class="relative shrink-0">
              <div class="w-20 h-20 rounded-full p-[3px] shadow-lg" :style="frameStyle">
                <img :src="student.profilePhotoUrl" :alt="student.firstName" class="w-full h-full rounded-full object-cover bg-zinc-900" />
              </div>
              <span
                class="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-[#12141a]"
                :class="{
                  'bg-[#2E7D5B]': student.trafficLight === 'VERDE',
                  'bg-[#D4A017]': student.trafficLight === 'AMARILLO',
                  'bg-[#C0392B]': student.trafficLight === 'ROJO',
                }"
              ></span>
            </div>
          </div>

          <div v-if="feedbackMsg" class="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-zinc-100 text-[12.5px] flex items-center justify-between">
            <span>{{ feedbackMsg }}</span>
            <button type="button" @click="feedbackMsg = ''" class="opacity-75 hover:opacity-100">
              <AppIcon name="x" :size="14" />
            </button>
          </div>

          <!-- Panel inferior de contenido -->
          <div class="rounded-[22px] bg-white/[0.04] border border-white/10 p-5 max-h-[60vh] overflow-y-auto">
            <LearningPathTimeline v-if="activeTab === 'RUTA'" :student="student" />
            <StudentClassTab v-else-if="activeTab === 'CLASES'" :student="student" @notify="feedbackMsg = $event" />
            <StudentPersonalTab v-else-if="activeTab === 'DATOS'" :student="student" @notify="feedbackMsg = $event" />
            <StudentMembershipTab v-else-if="activeTab === 'MENSUALIDAD'" :student="student" @notify="feedbackMsg = $event" />
            <StudentPermissionsTab v-else :student="student" @notify="feedbackMsg = $event" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { StudentFullRecord } from '../types/dojo';
import { useDojoStore } from '../composables/useDojoStore';
import MiniBeltSvg from './MiniBeltSvg.vue';
import LearningPathTimeline from './LearningPathTimeline.vue';
import AppIcon, { type IconName } from './AppIcon.vue';
import StudentClassTab from './student/StudentClassTab.vue';
import StudentPersonalTab from './student/StudentPersonalTab.vue';
import StudentMembershipTab from './student/StudentMembershipTab.vue';
import StudentPermissionsTab from './student/StudentPermissionsTab.vue';

type ModalSection = 'RUTA' | 'CLASES' | 'DATOS' | 'MENSUALIDAD' | 'PERMISOS';

const props = defineProps<{ student: StudentFullRecord }>();
defineEmits<{ (e: 'close'): void }>();

const store = useDojoStore();
const activeTab = ref<ModalSection>('RUTA');
const menuOpen = ref(false);
const feedbackMsg = ref('');

const menuItems: { id: ModalSection; label: string; icon: IconName }[] = [
  { id: 'RUTA', label: 'Ruta de Aprendizaje', icon: 'route' },
  { id: 'CLASES', label: 'Clases', icon: 'calendar' },
  { id: 'DATOS', label: 'Datos Personales', icon: 'user' },
  { id: 'MENSUALIDAD', label: 'Mensualidad', icon: 'credit-card' },
  { id: 'PERMISOS', label: 'Permisos', icon: 'star' },
];

const activeSectionLabel = computed(() => menuItems.find((i) => i.id === activeTab.value)?.label || '');
const currentBelt = computed(() => store.getBeltById(props.student.currentBeltId));
const frameStyle = computed(() => ({
  backgroundColor: props.student.beltColorHex,
  border: ['#18181B', '#1D1D1F'].includes(props.student.beltColorHex.toUpperCase()) ? '2px solid #FFFFFF' : 'none',
}));

watch(() => props.student.id, () => {
  feedbackMsg.value = '';
  menuOpen.value = false;
});

function selectSection(section: ModalSection): void {
  activeTab.value = section;
  menuOpen.value = false;
}
</script>
