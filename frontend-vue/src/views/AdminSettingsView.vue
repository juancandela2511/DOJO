<template>
  <div class="lotus-glass-card p-6 sm:p-7 space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
      <div class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
          <AppIcon name="settings" :size="20" />
        </span>
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 block">
            Configuración de Administrador
          </span>
          <h3 class="text-[21px] font-semibold text-white">Rutas de Aprendizaje por Cinturón</h3>
        </div>
      </div>
      <p class="text-[12.5px] text-zinc-400 max-w-md">
        La ruta que configures aquí aplica a todos los estudiantes de ese cinturón. Al cambiar de cinturón, cada alumno pasa automáticamente a la ruta del nuevo grado.
      </p>
    </div>

    <!-- Selector de Cinturón -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="belt in store.belts.value"
        :key="belt.id"
        type="button"
        @click="selectedBeltId = belt.id"
        class="px-3.5 py-2 rounded-xl text-[12.5px] font-medium border transition flex items-center gap-2"
        :class="
          selectedBeltId === belt.id
            ? 'bg-white text-zinc-950 border-white font-semibold shadow-sm'
            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
        "
      >
        <span
          class="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
          :style="{ backgroundColor: belt.colorHex }"
        ></span>
        <span>{{ belt.name }}</span>
      </button>
    </div>

    <!-- Formulario para agregar una meta a la ruta del cinturón seleccionado -->
    <form @submit.prevent="addMilestone" class="lotus-glass-subcard p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div class="md:col-span-4">
        <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Nombre de la Meta *</label>
        <input
          v-model="newTitle"
          type="text"
          required
          placeholder="Ej. Dominar postura Ma Bu"
          class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]"
        />
      </div>
      <div class="md:col-span-6">
        <label class="block text-[11.5px] font-semibold text-zinc-300 mb-1">Descripción / Requisitos</label>
        <input
          v-model="newDescription"
          type="text"
          placeholder="Detalle técnico que debe aprobar el estudiante..."
          class="lotus-glass-input w-full px-3.5 py-2 text-[13.5px]"
        />
      </div>
      <div class="md:col-span-2">
        <button type="submit" class="w-full lotus-primary-pill py-2 px-4 text-[13px] flex items-center justify-center gap-1.5">
          <AppIcon name="plus" :size="15" />
          <span>Agregar</span>
        </button>
      </div>
    </form>

    <!-- Lista de metas configuradas para este cinturón -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-[14px] font-semibold text-white">
          Pasos de la ruta: {{ selectedBelt.name }} ({{ currentMilestones.length }})
        </h4>
        <span class="text-[12px] text-zinc-400">
          Meta final automática: Cambio de cinturón con contraseña
        </span>
      </div>

      <div v-if="currentMilestones.length > 0" class="space-y-2.5">
        <div
          v-for="(item, idx) in currentMilestones"
          :key="item.id"
          class="lotus-glass-subcard p-4 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <span
              class="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 border border-white/20"
              :style="{
                backgroundColor: selectedBelt.colorHex,
                color: ['#F5F5F4', '#FFFFFF', '#D4A017'].includes(selectedBelt.colorHex.toUpperCase()) ? '#18181b' : '#ffffff',
              }"
            >
              {{ idx + 1 }}
            </span>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold text-white truncate">{{ item.title }}</p>
              <p class="text-[12px] text-zinc-400 truncate">{{ item.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              :disabled="idx === 0"
              @click="store.moveMilestoneInBelt(selectedBeltId, idx, -1)"
              class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-zinc-200"
              title="Subir paso"
            >
              <AppIcon name="arrow-up" :size="14" />
            </button>
            <button
              type="button"
              :disabled="idx === currentMilestones.length - 1"
              @click="store.moveMilestoneInBelt(selectedBeltId, idx, 1)"
              class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-zinc-200"
              title="Bajar paso"
            >
              <AppIcon name="arrow-down" :size="14" />
            </button>
            <button
              type="button"
              @click="store.removeMilestoneFromBelt(selectedBeltId, item.id)"
              class="w-8 h-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 flex items-center justify-center text-rose-300"
              title="Eliminar meta"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>

      <p v-else class="text-[13px] text-zinc-400 py-4 text-center">
        No hay metas configuradas para este cinturón. Agrega la primera arriba.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon from '../components/AppIcon.vue';

const store = useDojoStore();
const selectedBeltId = ref<number>(1);
const newTitle = ref('');
const newDescription = ref('');

const selectedBelt = computed(() => store.getBeltById(selectedBeltId.value));
const currentMilestones = computed(() => store.getBeltPath(selectedBeltId.value));

function addMilestone(): void {
  if (!newTitle.value.trim()) return;
  store.addMilestoneToBelt(selectedBeltId.value, newTitle.value, newDescription.value);
  newTitle.value = '';
  newDescription.value = '';
}
</script>
