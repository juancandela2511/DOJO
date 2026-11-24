<template>
  <div class="lotus-glass-card p-6 space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
      <div class="flex items-center gap-2.5">
        <span class="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
          <AppIcon name="route" :size="17" />
        </span>
        <div>
          <span class="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-400 block">
            Mi Curva de Aprendizaje · Solo Lectura
          </span>
          <h3 class="text-[17px] font-semibold text-white">{{ student.beltName }}</h3>
        </div>
      </div>

      <span class="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[12px] font-semibold text-zinc-200">
        {{ completedIds.length }} / {{ milestones.length }} metas
      </span>
    </div>

    <div class="relative py-1">
      <div class="absolute left-5 top-4 bottom-6 w-[2px] bg-white/15"></div>

      <div class="space-y-3.5">
        <div v-for="(step, idx) in milestones" :key="step.id" class="relative grid grid-cols-[40px_1fr] items-center gap-3">
          <div class="flex justify-center relative z-10">
            <span
              class="w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-bold border-2"
              :class="circleClass(step.id, idx)"
              :style="isCompleted(step.id) ? { backgroundColor: student.beltColorHex, borderColor: '#ffffff' } : {}"
            >
              <AppIcon v-if="isCompleted(step.id)" name="check" :size="15" />
              <AppIcon v-else-if="!isUnlocked(idx)" name="lock" :size="13" />
              <span v-else>{{ idx + 1 }}</span>
            </span>
          </div>

          <div
            class="p-3.5 rounded-2xl border"
            :class="
              isCompleted(step.id)
                ? 'bg-emerald-500/10 border-emerald-400/30'
                : isUnlocked(idx)
                  ? 'bg-white/[0.06] border-white/20'
                  : 'bg-white/[0.02] border-white/5 opacity-50'
            "
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-[13.5px] font-semibold text-white">{{ step.title }}</span>
              <span
                class="text-[10.5px] font-semibold shrink-0"
                :class="isCompleted(step.id) ? 'text-emerald-300' : isUnlocked(idx) ? 'text-amber-300' : 'text-zinc-500'"
              >
                {{ isCompleted(step.id) ? 'Completada' : isUnlocked(idx) ? 'En progreso' : 'Bloqueada' }}
              </span>
            </div>
            <p class="text-[12px] text-zinc-400 mt-0.5">{{ step.description }}</p>
          </div>
        </div>

        <!-- Meta final informativa -->
        <div class="relative grid grid-cols-[40px_1fr] items-center gap-3 pt-1">
          <div class="flex justify-center relative z-10">
            <span class="w-9 h-9 rounded-full bg-white/10 border border-white/25 text-white flex items-center justify-center">
              <AppIcon name="award" :size="16" />
            </span>
          </div>
          <div class="p-3.5 rounded-2xl bg-white/[0.05] border border-white/15">
            <span class="text-[10.5px] uppercase tracking-wider text-zinc-400 block">Meta Final</span>
            <strong class="text-[13.5px] text-white">
              {{ nextBelt ? `Ascenso a ${nextBelt.name} (aprobado por el Shifu)` : 'Grado Máximo Alcanzado' }}
            </strong>
          </div>
        </div>
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
const store = useDojoStore();

const milestones = computed(() => store.getBeltPath(props.student.currentBeltId));
const completedIds = computed(() => store.getCompletedMilestones(props.student.id, props.student.currentBeltId));
const nextBelt = computed(() => store.belts.value.find((b) => b.id === props.student.currentBeltId + 1) || null);

const isCompleted = (id: string) => completedIds.value.includes(id);
const isUnlocked = (idx: number) => idx === 0 || Boolean(milestones.value[idx - 1] && isCompleted(milestones.value[idx - 1].id));
const circleClass = (id: string, idx: number) =>
  isCompleted(id)
    ? 'text-white'
    : isUnlocked(idx)
      ? 'bg-white text-zinc-950 border-white'
      : 'bg-[#12141a] text-zinc-500 border-white/15';
</script>
