<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="lotus-glass-subcard p-4">
        <span class="text-[11px] uppercase tracking-wider text-zinc-400 block">Estado</span>
        <div class="flex items-center gap-2 mt-2">
          <span
            class="w-3 h-3 rounded-full"
            :class="{
              'bg-[#2E7D5B]': student.trafficLight === 'VERDE',
              'bg-[#D4A017]': student.trafficLight === 'AMARILLO',
              'bg-[#C0392B]': student.trafficLight === 'ROJO',
            }"
          ></span>
          <strong class="text-[15px] text-white">
            {{ student.trafficLight === 'VERDE' ? 'Paga' : student.trafficLight === 'AMARILLO' ? 'Por vencer' : 'Vencida' }}
          </strong>
        </div>
      </div>

      <div class="lotus-glass-subcard p-4">
        <span class="text-[11px] uppercase tracking-wider text-zinc-400 block">Días Restantes</span>
        <p class="text-[22px] font-bold mt-1 leading-none" :class="student.daysRemaining >= 0 ? 'text-white' : 'text-rose-300'">
          {{ student.daysRemaining >= 0 ? `${student.daysRemaining} días` : `-${-student.daysRemaining} días` }}
        </p>
      </div>

      <div class="lotus-glass-subcard p-4">
        <span class="text-[11px] uppercase tracking-wider text-zinc-400 block">Renovación</span>
        <p class="text-[14px] font-semibold mt-2" :class="student.isPaymentRenewed ? 'text-emerald-300' : 'text-amber-300'">
          {{ student.isPaymentRenewed ? 'Pago renovado' : 'No renovado' }}
        </p>
      </div>
    </div>

    <div class="lotus-glass-subcard p-4 space-y-3">
      <div class="flex items-center justify-between text-[12px] text-zinc-400">
        <span>Ciclo de {{ student.cycleDays }} días</span>
        <span>Valor: <strong class="text-white">${{ student.amountPaid.toLocaleString() }} COP</strong></span>
      </div>
      <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          class="h-full rounded-full"
          :class="{
            'bg-[#2E7D5B]': student.trafficLight === 'VERDE',
            'bg-[#D4A017]': student.trafficLight === 'AMARILLO',
            'bg-[#C0392B]': student.trafficLight === 'ROJO',
          }"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2 text-[12px] text-zinc-400">
        <span>Inicio: <strong class="text-white">{{ student.membershipStartDate }}</strong></span>
        <span>Corte: <strong class="text-white">{{ student.membershipEndDate }}</strong></span>
      </div>
      <div v-if="isAdmin" class="pt-2 flex justify-end">
        <button
          type="button"
          @click="renew"
          class="lotus-primary-pill px-5 py-2 text-[12.5px] inline-flex items-center gap-2"
        >
          <AppIcon name="credit-card" :size="15" />
          <span>Confirmar y Renovar (30 días)</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StudentFullRecord } from '../../types/dojo';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ student: StudentFullRecord }>();
const emit = defineEmits<{ (e: 'notify', msg: string): void }>();
const store = useDojoStore();

const isAdmin = computed(() => store.currentUser.value.role === 'ADMIN');
const progressPercent = computed(() => {
  if (props.student.trafficLight === 'ROJO') return 100;
  return Math.max(8, Math.min(100, Math.round((props.student.daysRemaining / props.student.cycleDays) * 100)));
});

function renew(): void {
  store.confirmManualMembershipRenewal(props.student.id, 160000);
  emit('notify', 'Pago confirmado y mensualidad renovada por 30 días.');
}
</script>
