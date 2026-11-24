<template>
  <div
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl belt-overlay-fade"
    :class="isLight ? 'bg-[#f5f7fb]/92 text-[#1d1d1f]' : 'bg-[#070a14]/92 text-white'"
  >
    <div class="relative w-full max-w-lg px-6 flex flex-col items-center">
      <!-- Cinturón animado que se aprieta al ingresar -->
      <svg
        viewBox="0 0 360 170"
        class="w-full max-w-[340px] h-auto overflow-visible drop-shadow-[0_14px_28px_rgba(0,0,0,0.45)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Banda izquierda tirando hacia el centro -->
        <g class="belt-pull-left">
          <rect
            x="10"
            y="42"
            width="175"
            height="34"
            rx="10"
            :fill="beltColor"
            :stroke="edgeStroke"
            stroke-width="2.5"
          />
          <rect x="14" y="66" width="168" height="8" rx="4" fill="#000000" opacity="0.16" />
        </g>

        <!-- Banda derecha tirando hacia el centro -->
        <g class="belt-pull-right">
          <rect
            x="175"
            y="42"
            width="175"
            height="34"
            rx="10"
            :fill="beltColor"
            :stroke="edgeStroke"
            stroke-width="2.5"
          />
          <rect x="178" y="66" width="168" height="8" rx="4" fill="#000000" opacity="0.16" />
        </g>

        <!-- Cola izquierda cayendo y tensándose -->
        <g class="belt-tail-left">
          <path
            d="M164 68L114 146C112 149 113.5 153 117 154L140 160C143 161 146 159.5 147.5 157L183 78Z"
            :fill="beltColor"
            :stroke="edgeStroke"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
        </g>

        <!-- Cola derecha cayendo y tensándose -->
        <g class="belt-tail-right">
          <path
            d="M196 68L246 146C248 149 246.5 153 243 154L220 160C217 161 214 159.5 212.5 157L177 78Z"
            :fill="beltColor"
            :stroke="edgeStroke"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <path
            v-if="secondaryColor"
            d="M222 122L239 147L218 153L202 128Z"
            :fill="secondaryColor"
          />
        </g>

        <!-- Nudo central que se aprieta con pulso -->
        <g class="belt-knot-cinch">
          <rect
            x="152"
            y="34"
            width="56"
            height="50"
            rx="15"
            :fill="beltColor"
            :stroke="edgeStroke"
            stroke-width="3"
          />
          <rect
            x="160"
            y="41"
            width="40"
            height="7"
            rx="3.5"
            fill="#FFFFFF"
            opacity="0.24"
          />
        </g>
      </svg>

      <div class="mt-4 text-center belt-text-reveal">
        <p class="text-[12px] font-semibold uppercase tracking-[0.22em] opacity-70">
          {{ beltName }}
        </p>
        <h3 class="text-[24px] sm:text-[28px] font-semibold tracking-tight mt-1">
          ¡Bienvenido, {{ userName }}!
        </h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';

const props = withDefaults(
  defineProps<{
    beltColor: string;
    secondaryColor?: string | null;
    beltName: string;
    userName: string;
  }>(),
  {
    secondaryColor: null,
  }
);

const store = useDojoStore();
const isLight = computed(() => store.theme.value === 'light');

const edgeStroke = computed(() => {
  const c = props.beltColor.toUpperCase();
  if (c === '#1D1D1F' || c === '#18181B') return '#FFFFFF';
  if (c === '#FFFFFF' || c === '#F5F5F4') return '#94A3B8';
  return 'rgba(0, 0, 0, 0.25)';
});
</script>
