<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 120 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="belt-svg drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] select-none"
    aria-hidden="true"
  >
    <!-- Banda sólida principal con ligera curvatura orgánica -->
    <path
      d="M8 15C8 12.2386 10.2386 10 13 10H107C109.761 10 112 12.2386 112 15V21C112 23.7614 109.761 26 107 26H13C10.2386 26 8 23.7614 8 21V15Z"
      :fill="colorHex"
      :stroke="edgeStroke"
      stroke-width="1.6"
    />
    <!-- Sombra sutil inferior de la banda para dar volumen -->
    <path
      d="M10 21.5H110V22.5C110 24.433 108.433 26 106.5 26H13.5C11.567 26 10 24.433 10 22.5V21.5Z"
      fill="#000000"
      opacity="0.16"
    />

    <!-- Cola izquierda caída natural -->
    <path
      d="M52 24L31 51.5C30.2 52.6 30.7 54.1 32 54.5L41.5 57.2C42.6 57.5 43.8 57 44.4 56L60 28Z"
      :fill="colorHex"
      :stroke="edgeStroke"
      stroke-width="1.6"
      stroke-linejoin="round"
    />

    <!-- Cola derecha caída natural -->
    <path
      d="M68 24L89 51.5C89.8 52.6 89.3 54.1 88 54.5L78.5 57.2C77.4 57.5 76.2 57 75.6 56L60 28Z"
      :fill="colorHex"
      :stroke="edgeStroke"
      stroke-width="1.6"
      stroke-linejoin="round"
    />

    <!-- Barra dorada/secundaria sólida en la punta derecha (ej. Faja Negra) -->
    <path
      v-if="secondaryColorHex"
      d="M78.5 42.5L85.8 52L77.8 54.4L70.8 44.8Z"
      :fill="secondaryColorHex"
    />

    <!-- Nudo central esculpido en color sólido -->
    <rect
      x="49"
      y="7"
      width="22"
      height="22"
      rx="7"
      :fill="colorHex"
      :stroke="edgeStroke"
      stroke-width="1.8"
    />
    <!-- Brillo superior suave en el nudo -->
    <rect
      x="52"
      y="9.5"
      width="16"
      height="3.5"
      rx="1.75"
      fill="#FFFFFF"
      :opacity="isWhiteBelt ? 0.5 : 0.22"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    colorHex: string;
    secondaryColorHex?: string | null;
    width?: number;
    height?: number;
  }>(),
  {
    secondaryColorHex: null,
    width: 84,
    height: 44,
  }
);

const isWhiteBelt = computed(() => ['#F5F5F4', '#FFFFFF'].includes(props.colorHex.toUpperCase()));
const isBlackBelt = computed(() => ['#18181B', '#1D1D1F'].includes(props.colorHex.toUpperCase()));

const edgeStroke = computed(() => {
  if (isBlackBelt.value) return '#FFFFFF';
  if (isWhiteBelt.value) return '#A1A1AA';
  return 'rgba(0, 0, 0, 0.22)';
});
</script>
