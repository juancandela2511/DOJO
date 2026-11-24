<template>
  <section v-if="student" class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    <!-- Banner si tiene permiso delegado -->
    <div
      v-if="student.hasDelegatedClassPermission"
      class="lotus-glass-card p-5 border-amber-300/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/35 text-amber-200 text-[11px] font-bold mb-1">
          <AppIcon name="star" :size="12" />
          <span>Permiso Delegado Activo</span>
        </span>
        <h3 class="text-[18px] font-semibold text-white">Tienes permiso para dirigir la clase de hoy</h3>
        <p class="text-[13px] text-zinc-400 mt-0.5">
          Puedes marcar quién asistió y anotar las técnicas practicadas en la sesión.
        </p>
      </div>
      <button
        type="button"
        @click="store.activeWorkspaceView.value = 'CLASE'"
        class="lotus-primary-pill px-5 py-2.5 text-[13px] whitespace-nowrap inline-flex items-center gap-2"
      >
        <AppIcon name="calendar" :size="15" />
        <span>Abrir Control de Clase</span>
      </button>
    </div>

    <!-- Tarjeta de perfil con marco del color del cinturón -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <div class="md:col-span-4">
        <StudentBeltCard :student="student" @select="showMyModal = true" />
        <p class="text-center text-[12px] text-blue-200/65 mt-3">
          Toca tu tarjeta para ver Clases, Datos y Mensualidad
        </p>
      </div>

      <div class="md:col-span-8 space-y-5">
        <!-- Estado de Mensualidad -->
        <div class="lotus-glass-card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[12px] font-semibold text-blue-200/65 uppercase tracking-wider">Estado de Mensualidad</span>
            <span
              class="px-3 py-0.5 rounded-full text-[12px] font-semibold"
              :class="{
                'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30': student.trafficLight === 'VERDE',
                'bg-amber-400/20 text-amber-200 border border-amber-400/30': student.trafficLight === 'AMARILLO',
                'bg-rose-400/20 text-rose-200 border border-rose-400/30': student.trafficLight === 'ROJO',
              }"
            >
              ● {{ student.trafficLight === 'VERDE' ? 'Paga' : student.trafficLight === 'AMARILLO' ? 'Por vencer' : 'Vencida' }}
            </span>
          </div>

          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="text-[34px] font-bold leading-none" :class="student.daysRemaining >= 0 ? 'text-white' : 'text-rose-300'">
              {{ student.daysRemaining >= 0 ? `${student.daysRemaining} días` : `Vencida (${-student.daysRemaining}d)` }}
            </p>
            <span class="text-[13px]" :class="student.isPaymentRenewed ? 'text-emerald-300 font-semibold' : 'text-amber-300 font-semibold'">
              {{ student.isPaymentRenewed ? '✓ Pago renovado' : '✕ Pendiente de renovación' }}
            </span>
          </div>

          <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="{
                'bg-emerald-400': student.trafficLight === 'VERDE',
                'bg-amber-400': student.trafficLight === 'AMARILLO',
                'bg-rose-500': student.trafficLight === 'ROJO',
              }"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

          <div class="flex flex-wrap items-center justify-between text-[12px] text-blue-200/70 pt-2 border-t border-white/10">
            <span>Inicio: <strong class="text-white">{{ student.membershipStartDate }}</strong></span>
            <span>Corte: <strong class="text-white">{{ student.membershipEndDate }}</strong></span>
            <span>GPS Dojo: <strong class="text-pink-200">{{ store.gpsDistanceMeters.value }}m</strong></span>
            <button
              type="button"
              @click="store.simulateGpsCheckIn(student.id)"
              class="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold inline-flex items-center gap-1.5"
            >
              <AppIcon name="map-pin" :size="13" />
              <span>Registrar Llegada GPS</span>
            </button>
          </div>
        </div>

        <!-- Mis clases -->
        <div class="lotus-glass-card p-6">
          <h3 class="text-[17px] font-semibold text-white mb-3">Mis Clases Recientes</h3>
          <div v-if="myHistory.length > 0" class="space-y-2.5">
            <div v-for="cls in myHistory" :key="cls.id" class="lotus-glass-subcard p-3.5 text-[13px]">
              <div class="flex justify-between text-[12px] text-zinc-400 mb-1">
                <span>{{ cls.sessionDate }} · {{ cls.checkInTime }}</span>
                <span :class="cls.isCurrentlyInClass ? 'text-emerald-300' : 'text-rose-300'">
                  {{ cls.isCurrentlyInClass ? 'Asistió' : 'Ausente' }}
                </span>
              </div>
              <p class="text-white">{{ cls.techniquesPracticed || 'Asistencia registrada en clase' }}</p>
            </div>
          </div>
          <p v-else class="text-[13px] text-blue-200/60">Aún no tienes sesiones registradas.</p>
        </div>
      </div>
    </div>

    <StudentDetailModal v-if="showMyModal" :student="student" @close="showMyModal = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon from '../components/AppIcon.vue';
import StudentBeltCard from '../components/StudentBeltCard.vue';
import StudentDetailModal from '../components/StudentDetailModal.vue';

const store = useDojoStore();
const showMyModal = ref(false);

const student = computed(() => store.currentStudentProfile.value);
const myHistory = computed(() => (student.value ? store.getStudentClassHistory(student.value.id) : []));
const progressPercent = computed(() => {
  if (!student.value) return 0;
  if (student.value.trafficLight === 'ROJO') return 100;
  const pct = Math.round((student.value.daysRemaining / student.value.cycleDays) * 100);
  return Math.max(8, Math.min(100, pct));
});
</script>
