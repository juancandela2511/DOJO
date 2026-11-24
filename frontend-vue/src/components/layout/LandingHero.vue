<template>
  <div class="dojo-landing relative z-10 min-h-[calc(100vh-57px)] text-white overflow-hidden flex flex-col justify-between">
    <div class="relative z-10 pointer-events-none max-w-7xl w-full mx-auto px-6 pt-16 pb-16 flex-1 flex flex-col justify-between gap-14">
      <div class="max-w-3xl pt-4">
        <span class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-pink-200 text-[12px] font-semibold mb-5 bg-white/10 border border-white/15 backdrop-blur-md">
          <AppIcon name="lotus" :size="14" />
          <span>Templo · Entrenamiento, Asistencia y Mensualidades</span>
        </span>
        <h1 class="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-tight">
          Cae siete veces, levántate ocho.
        </h1>
        <p class="text-zinc-300 text-[17px] mt-4 max-w-xl leading-relaxed">
          Consulta tu ruta de aprendizaje y mensualidad con tu cédula, registra la asistencia o administra el Dojo bajo una experiencia serena y moderna.
        </p>

        <div class="mt-8 pointer-events-auto inline-flex flex-wrap items-center gap-4 p-2 pl-5 rounded-full bg-[#12141a]/80 backdrop-blur-xl border border-white/15 shadow-2xl">
          <span class="text-[14px] font-medium text-zinc-300">
            En el tatami hoy: <strong class="text-white">{{ inClassCount }} discípulos</strong>
          </span>
          <button type="button" @click="$emit('open-login', 'ESTUDIANTE')" class="lotus-primary-pill px-6 py-2.5 text-[14px] inline-flex items-center gap-1.5">
            <span>Iniciar Sesión</span>
            <AppIcon name="chevron-right" :size="15" />
          </button>
        </div>
      </div>

      <div class="pointer-events-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        <div @click="$emit('open-login', 'ESTUDIANTE')" class="rounded-[24px] p-6 cursor-pointer transition-all hover:-translate-y-1 bg-[#12141a]/80 backdrop-blur-xl border border-white/12">
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-zinc-200 text-[11px] font-semibold mb-3">
            <AppIcon name="user" :size="12" />
            <span>Solo Cédula</span>
          </span>
          <h3 class="text-[19px] font-semibold text-white mb-2">Estudiantes</h3>
          <p class="text-[13.5px] text-zinc-400">
            Ingresa tu número de cédula para ver tu ruta de aprendizaje, cinturón y mensualidad.
          </p>
        </div>

        <div @click="$emit('open-login', 'ESTUDIANTE')" class="rounded-[24px] p-6 cursor-pointer transition-all hover:-translate-y-1 bg-[#12141a]/80 backdrop-blur-xl border border-white/12">
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 text-amber-200 text-[11px] font-semibold mb-3">
            <AppIcon name="star" :size="12" />
            <span>Permiso Delegado</span>
          </span>
          <h3 class="text-[19px] font-semibold text-white mb-2">Dar la Clase</h3>
          <p class="text-[13.5px] text-zinc-400">
            Si tienes permiso con estrella, ingresa con tu cédula para tomar asistencia y registrar actividades.
          </p>
        </div>

        <div @click="$emit('open-login', 'ADMIN')" class="rounded-[24px] p-6 cursor-pointer transition-all hover:-translate-y-1 bg-[#12141a]/80 backdrop-blur-xl border border-white/12">
          <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-zinc-200 text-[11px] font-semibold mb-3">
            <AppIcon name="lock" :size="12" />
            <span>Cédula + Contraseña</span>
          </span>
          <h3 class="text-[19px] font-semibold text-white mb-2">Administración</h3>
          <p class="text-[13.5px] text-zinc-400">
            Catálogo de discípulos, rutas por cinturón, OCR, mensualidades y presencia en vivo.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '../AppIcon.vue';

defineProps<{ inClassCount: number }>();
defineEmits<{ (e: 'open-login', tab: 'ESTUDIANTE' | 'ADMIN'): void }>();
</script>
