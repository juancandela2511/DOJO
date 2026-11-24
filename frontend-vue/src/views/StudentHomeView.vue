<template>
  <section v-if="student" class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
    <!-- Banner permiso delegado (si el admin le dio estrella) -->
    <div
      v-if="student.hasDelegatedClassPermission"
      class="lotus-glass-card p-4 border-amber-300/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
          <AppIcon name="star" :size="18" />
        </span>
        <div>
          <h3 class="text-[15.5px] font-semibold text-white">Permiso Delegado Activo</h3>
          <p class="text-[12.5px] text-zinc-400">Puedes abrir el control de clase de hoy.</p>
        </div>
      </div>
      <button
        type="button"
        @click="store.activeWorkspaceView.value = 'CLASE'"
        class="lotus-primary-pill px-4 py-2 text-[12.5px] inline-flex items-center gap-1.5 self-start sm:self-center"
      >
        <AppIcon name="calendar" :size="14" />
        <span>Abrir Control de Clase</span>
      </button>
    </div>

    <!-- Alerta automática cada 12h cuando quedan <= 5 días -->
    <div
      v-if="student.daysRemaining <= 5"
      class="lotus-glass-card p-4 border-rose-400/40 bg-rose-500/10 flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-3">
        <span class="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
          <AppIcon name="credit-card" :size="17" />
        </span>
        <div>
          <p class="text-[13.5px] font-semibold text-white">
            {{ student.daysRemaining > 0 ? `Te quedan ${student.daysRemaining} días de mensualidad` : 'Tu mensualidad está vencida' }}
          </p>
          <p class="text-[12px] text-rose-200/80">
            Recordatorio automático activo cada 12 horas hasta confirmar tu pago.
          </p>
        </div>
      </div>
    </div>

    <!-- Fila Principal: Tarjeta de Cinturón + Tiempo Restante y Estado GPS -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      <div class="md:col-span-4">
        <StudentBeltCard :student="student" @select="activeTab = 'DATOS'" />
      </div>

      <div class="md:col-span-8 space-y-4">
        <!-- Estado GPS automático "En Clase" -->
        <div class="lotus-glass-card p-5 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span
              class="w-11 h-11 rounded-2xl flex items-center justify-center border"
              :class="student.isCurrentlyInClass ? 'bg-[#2E7D5B]/25 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/10 text-zinc-400'"
            >
              <AppIcon name="map-pin" :size="20" />
            </span>
            <div>
              <span class="text-[11px] uppercase tracking-wider text-zinc-400 block">Ubicación Automática GPS</span>
              <h3 class="text-[17px] font-semibold text-white">
                {{ student.isCurrentlyInClass ? 'Estás en clase ahora' : 'Fuera del Dojo' }}
              </h3>
              <p class="text-[12px] text-zinc-400">
                Distancia al Dojo: <strong class="text-zinc-200">{{ store.gpsDistanceMeters.value }}m</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="store.simulateGpsCheckIn(student.id)"
            class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <AppIcon name="map-pin" :size="14" />
            <span>Actualizar GPS</span>
          </button>
        </div>

        <!-- Tiempo restante de mensualidad -->
        <div class="lotus-glass-card p-5 space-y-3.5">
          <div class="flex items-center justify-between">
            <span class="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-400">Tiempo de Mensualidad</span>
            <span class="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="{
                  'bg-[#2E7D5B]': student.trafficLight === 'VERDE',
                  'bg-[#D4A017]': student.trafficLight === 'AMARILLO',
                  'bg-[#C0392B]': student.trafficLight === 'ROJO',
                }"
              ></span>
              {{ student.trafficLight === 'VERDE' ? 'Paga' : student.trafficLight === 'AMARILLO' ? 'Por vencer' : 'Vencida' }}
            </span>
          </div>

          <div class="flex items-baseline justify-between gap-2">
            <p class="text-[34px] font-bold leading-none" :class="student.daysRemaining >= 0 ? 'text-white' : 'text-rose-300'">
              {{ student.daysRemaining >= 0 ? `${student.daysRemaining} días` : `Vencida (${-student.daysRemaining}d)` }}
            </p>
            <span class="text-[12.5px] text-zinc-400">Corte: <strong class="text-white">{{ student.membershipEndDate }}</strong></span>
          </div>

          <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="{
                'bg-[#2E7D5B]': student.trafficLight === 'VERDE',
                'bg-[#D4A017]': student.trafficLight === 'AMARILLO',
                'bg-[#C0392B]': student.trafficLight === 'ROJO',
              }"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selector compacto de Solo Lectura: Curva de Aprendizaje / Mis Datos -->
    <div class="inline-flex p-1 rounded-xl bg-[#12141a]/90 border border-white/10">
      <button
        type="button"
        @click="activeTab = 'RUTA'"
        class="px-4 py-2 rounded-lg text-[13px] inline-flex items-center gap-2 transition"
        :class="activeTab === 'RUTA' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'"
      >
        <AppIcon name="route" :size="15" />
        <span>Curva de Aprendizaje</span>
      </button>
      <button
        type="button"
        @click="activeTab = 'DATOS'"
        class="px-4 py-2 rounded-lg text-[13px] inline-flex items-center gap-2 transition"
        :class="activeTab === 'DATOS' ? 'bg-white text-zinc-950 font-semibold' : 'text-zinc-400 hover:text-white'"
      >
        <AppIcon name="user" :size="15" />
        <span>Mis Datos</span>
      </button>
    </div>

    <!-- Contenido Solo Lectura -->
    <LearningPathReadOnly v-if="activeTab === 'RUTA'" :student="student" />

    <div v-else class="lotus-glass-card p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">Documento</span><strong class="text-white">{{ student.documentType }} {{ student.documentNumber }}</strong></div>
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">Grado Actual</span><strong class="text-white">{{ student.beltName }}</strong></div>
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">RH / Sangre</span><strong class="text-white">{{ student.bloodType }}</strong></div>
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">EPS</span><strong class="text-white">{{ student.epsEntity }}</strong></div>
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">Teléfono</span><strong class="text-white">{{ student.phone }}</strong></div>
      <div class="lotus-glass-subcard p-3.5"><span class="text-[11px] text-zinc-400 block">Dirección</span><strong class="text-white">{{ student.address }}</strong></div>
      <div class="lotus-glass-subcard p-3.5 sm:col-span-2"><span class="text-[11px] text-zinc-400 block">Emergencia</span><strong class="text-white">{{ student.emergencyContactName }} ({{ student.emergencyContactRelationship }}) — {{ student.emergencyContactPhone }}</strong></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import { useMobileNative } from '../composables/useMobileNative';
import AppIcon from '../components/AppIcon.vue';
import StudentBeltCard from '../components/StudentBeltCard.vue';
import LearningPathReadOnly from '../components/student/LearningPathReadOnly.vue';

const store = useDojoStore();
const mobile = useMobileNative();
const activeTab = ref<'RUTA' | 'DATOS'>('RUTA');

const student = computed(() => store.currentStudentProfile.value);
const progressPercent = computed(() => {
  if (!student.value) return 0;
  if (student.value.trafficLight === 'ROJO') return 100;
  return Math.max(8, Math.min(100, Math.round((student.value.daysRemaining / student.value.cycleDays) * 100)));
});

onMounted(() => {
  if (student.value) {
    mobile.startAutoDojoGeofence(student.value);
    mobile.syncPaymentReminders(student.value);
  }
});

onBeforeUnmount(() => {
  mobile.stopAutoDojoGeofence();
});
</script>
