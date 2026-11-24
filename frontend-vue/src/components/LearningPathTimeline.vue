<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
      <div class="flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-xl flex items-center justify-center border border-white/15 bg-white/10 text-white">
          <AppIcon name="route" :size="16" />
        </span>
        <div>
          <span class="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400 block">Ruta a Seguir</span>
          <h4 class="text-[15px] font-semibold text-white">{{ student.beltName }}</h4>
        </div>
      </div>

      <span class="px-3 py-1 rounded-full bg-white/8 border border-white/12 text-[12px] font-semibold text-zinc-200">
        {{ completedIds.length }} / {{ milestones.length }} metas
      </span>
    </div>

    <div
      v-if="statusMsg"
      class="px-3.5 py-2.5 rounded-xl text-[12.5px] border flex items-center justify-between"
      :class="statusError ? 'bg-rose-500/15 border-rose-400/35 text-rose-200' : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'"
    >
      <span>{{ statusMsg }}</span>
      <button type="button" @click="statusMsg = ''" class="ml-2 opacity-75 hover:opacity-100">
        <AppIcon name="x" :size="14" />
      </button>
    </div>

    <div class="relative py-2">
      <div class="absolute left-1/2 top-4 bottom-8 w-[2px] -translate-x-1/2 bg-white/15 hidden sm:block"></div>
      <div class="absolute left-5 top-4 bottom-8 w-[2px] bg-white/15 sm:hidden"></div>

      <div class="space-y-4">
        <div
          v-for="(step, idx) in milestones"
          :key="step.id"
          class="relative grid grid-cols-[40px_1fr] sm:grid-cols-[1fr_52px_1fr] items-center gap-3"
        >
          <div class="hidden sm:block">
            <button
              v-if="idx % 2 === 0"
              type="button"
              :disabled="!isUnlocked(idx)"
              @click="onStepClick(step.id, idx)"
              class="w-full text-right p-3.5 rounded-2xl border transition"
              :class="cardClass(step.id, idx)"
            >
              <span class="block text-[13px] font-semibold text-white">{{ step.title }}</span>
              <span class="block text-[11.5px] text-zinc-400 mt-0.5">{{ step.description }}</span>
              <span class="inline-flex items-center gap-1 text-[10.5px] font-semibold mt-1.5" :class="labelClass(step.id, idx)">
                <AppIcon :name="stepIcon(step.id, idx)" :size="12" />
                {{ labelText(step.id, idx) }}
              </span>
            </button>
          </div>

          <div class="flex justify-center relative z-10">
            <button
              type="button"
              :disabled="!isUnlocked(idx)"
              @click="onStepClick(step.id, idx)"
              class="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition"
              :class="circleClass(step.id, idx)"
              :style="isCompleted(step.id) ? { backgroundColor: student.beltColorHex, borderColor: '#ffffff' } : {}"
            >
              <AppIcon v-if="isCompleted(step.id)" name="check" :size="16" />
              <AppIcon v-else-if="!isUnlocked(idx)" name="lock" :size="14" />
              <span v-else>{{ idx + 1 }}</span>
            </button>
          </div>

          <div>
            <button
              type="button"
              :disabled="!isUnlocked(idx)"
              @click="onStepClick(step.id, idx)"
              class="w-full text-left p-3.5 rounded-2xl border transition"
              :class="[idx % 2 === 0 ? 'sm:hidden' : '', cardClass(step.id, idx)]"
            >
              <span class="block text-[13px] font-semibold text-white">{{ step.title }}</span>
              <span class="block text-[11.5px] text-zinc-400 mt-0.5">{{ step.description }}</span>
              <span class="inline-flex items-center gap-1 text-[10.5px] font-semibold mt-1.5" :class="labelClass(step.id, idx)">
                <AppIcon :name="stepIcon(step.id, idx)" :size="12" />
                {{ labelText(step.id, idx) }}
              </span>
            </button>
          </div>
        </div>

        <LearningPathFinalGoal
          :student-id="student.id"
          :current-belt-id="student.currentBeltId"
          :can-promote="canPromote"
          :next-belt="nextBelt"
          @result="onPromotionResult"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { StudentFullRecord } from '../types/dojo';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon, { type IconName } from './AppIcon.vue';
import LearningPathFinalGoal from './student/LearningPathFinalGoal.vue';

const props = defineProps<{ student: StudentFullRecord }>();
const store = useDojoStore();
const statusMsg = ref('');
const statusError = ref(false);

const milestones = computed(() => store.getBeltPath(props.student.currentBeltId));
const completedIds = computed(() => store.getCompletedMilestones(props.student.id, props.student.currentBeltId));
const nextBelt = computed(() => store.belts.value.find((b) => b.id === props.student.currentBeltId + 1) || null);
const canPromote = computed(() => milestones.value.length > 0 && milestones.value.every((m) => completedIds.value.includes(m.id)));

const isCompleted = (id: string) => completedIds.value.includes(id);
const isUnlocked = (idx: number) => idx === 0 || Boolean(milestones.value[idx - 1] && isCompleted(milestones.value[idx - 1].id));
const stepIcon = (id: string, idx: number): IconName => (isCompleted(id) ? 'check' : isUnlocked(idx) ? 'unlock' : 'lock');
const labelText = (id: string, idx: number) => (isCompleted(id) ? 'Completada' : isUnlocked(idx) ? 'Disponible · Clic para completar' : 'Bloqueada');
const labelClass = (id: string, idx: number) => (isCompleted(id) ? 'text-emerald-300' : isUnlocked(idx) ? 'text-amber-300' : 'text-zinc-500');
const cardClass = (id: string, idx: number) =>
  isCompleted(id)
    ? 'bg-emerald-500/10 border-emerald-400/30'
    : isUnlocked(idx)
      ? 'bg-white/[0.07] border-white/25 hover:border-white/55 cursor-pointer'
      : 'bg-white/[0.02] border-white/5 opacity-45 cursor-not-allowed';
const circleClass = (id: string, idx: number) =>
  isCompleted(id)
    ? 'text-white shadow-md'
    : isUnlocked(idx)
      ? 'bg-white text-zinc-950 border-white shadow-[0_0_14px_rgba(255,255,255,0.45)] cursor-pointer hover:scale-105'
      : 'bg-[#12141a] text-zinc-500 border-white/15 cursor-not-allowed';

function onStepClick(milestoneId: string, idx: number): void {
  if (!isUnlocked(idx) || isCompleted(milestoneId)) return;
  if (store.completeStudentMilestone(props.student.id, milestoneId)) {
    statusError.value = false;
    statusMsg.value = 'Meta completada. Se desbloqueó el siguiente paso.';
  }
}

function onPromotionResult(res: { ok: boolean; message: string }): void {
  statusError.value = !res.ok;
  statusMsg.value = res.message;
}
</script>
