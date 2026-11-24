<template>
  <button
    type="button"
    @click="$emit('select', student)"
    class="group relative w-full text-left pt-5 focus:outline-none active:scale-[0.97] transition-transform duration-150"
  >
    <!-- Pequeño cinturón sólido FUERA del marco -->
    <div
      class="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 z-20 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-x-90 group-active:scale-y-105"
    >
      <MiniBeltSvg
        :color-hex="student.beltColorHex"
        :secondary-color-hex="beltSecondaryColor"
        :width="88"
        :height="46"
      />
    </div>

    <!-- Marco exterior SÓLIDO del color del cinturón -->
    <div
      class="belt-patch-card relative rounded-[24px] p-[10px]"
      :style="outerFrameStyle"
    >
      <!-- Estrella dorada en la esquina superior izquierda si tiene permiso para dar clase -->
      <span
        v-if="student.hasDelegatedClassPermission"
        class="absolute -top-2.5 -left-2.5 z-30 w-7 h-7 rounded-full bg-amber-400 border-[2.5px] border-white flex items-center justify-center shadow-[0_0_14px_rgba(251,191,36,0.85)]"
        title="Tiene permiso para dar clase"
        aria-label="Tiene permiso para dar clase"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d1d1f" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>

      <!-- Círculo semáforo en la esquina superior derecha de la tarjeta -->
      <span
        class="absolute -top-2 -right-2 z-30 w-6 h-6 rounded-full border-[2.5px] border-white shadow-lg"
        :class="trafficDotClass"
        :title="trafficDotTitle"
        :aria-label="trafficDotTitle"
      ></span>

      <!-- Contenido interno limpio: Foto arriba + Franja blanca abajo SOLO con el nombre -->
      <div class="overflow-hidden rounded-[15px] bg-white shadow-sm ring-1 ring-black/10">
        <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
          <img
            :src="student.profilePhotoUrl"
            :alt="`${student.firstName} ${student.lastName}`"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <!-- Parte blanca inferior con ÚNICAMENTE el nombre -->
        <div class="bg-white px-4 py-3.5 text-center">
          <h4 class="text-[16px] font-semibold tracking-tight text-[#1d1d1f] truncate">
            {{ student.firstName }} {{ student.lastName }}
          </h4>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StudentFullRecord } from '../types/dojo';
import { useDojoStore } from '../composables/useDojoStore';
import MiniBeltSvg from './MiniBeltSvg.vue';

const props = defineProps<{
  student: StudentFullRecord;
}>();

defineEmits<{
  (e: 'select', student: StudentFullRecord): void;
}>();

const store = useDojoStore();

const beltModel = computed(() => store.getBeltById(props.student.currentBeltId));
const beltSecondaryColor = computed(() => beltModel.value.secondaryColorHex);

const isBlackBelt = computed(() => ['#18181B', '#1D1D1F'].includes(props.student.beltColorHex.toUpperCase()));
const isWhiteBelt = computed(() => ['#F5F5F4', '#FFFFFF'].includes(props.student.beltColorHex.toUpperCase()));

const trafficDotClass = computed(() => {
  if (props.student.trafficLight === 'VERDE') {
    return 'bg-[#2E7D5B] shadow-[0_2px_10px_rgba(46,125,91,0.55)]';
  }
  if (props.student.trafficLight === 'AMARILLO') {
    return 'bg-[#D4A017] shadow-[0_2px_10px_rgba(212,160,23,0.55)]';
  }
  return 'bg-[#C0392B] shadow-[0_2px_10px_rgba(192,57,43,0.6)]';
});

const trafficDotTitle = computed(() => {
  if (props.student.trafficLight === 'VERDE') return 'Mensualidad paga (Al día)';
  if (props.student.trafficLight === 'AMARILLO') return 'Mensualidad por vencer';
  return 'Mensualidad vencida';
});

const outerFrameStyle = computed(() => ({
  backgroundColor: props.student.beltColorHex,
  border: isBlackBelt.value
    ? '2.5px solid #FFFFFF'
    : isWhiteBelt.value
      ? '2.5px solid #CBD5E1'
      : '2px solid rgba(0, 0, 0, 0.14)',
  boxShadow: isBlackBelt.value
    ? '0 16px 36px rgba(2, 6, 18, 0.55), 0 0 18px rgba(255, 255, 255, 0.22)'
    : `0 16px 36px rgba(2, 6, 18, 0.38), 0 0 22px ${props.student.beltColorHex}44`,
}));
</script>
