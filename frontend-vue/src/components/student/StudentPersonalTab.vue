<template>
  <div class="space-y-4">
    <div class="lotus-glass-subcard p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <span class="block text-[13px] font-semibold text-white">Foto de Perfil</span>
        <span class="text-[11.5px] text-zinc-400">Sube una imagen para actualizar la tarjeta</span>
      </div>
      <label class="lotus-primary-pill px-4 py-1.5 text-[12px] cursor-pointer inline-flex items-center gap-1.5">
        <AppIcon name="camera" :size="14" />
        <span>Cambiar Foto</span>
        <input type="file" accept="image/*" class="hidden" @change="onChangePhoto" />
      </label>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Documento</span>
        <strong class="text-white">{{ student.documentType }} {{ student.documentNumber }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Fecha de Nacimiento</span>
        <strong class="text-white">{{ student.birthDate }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Grupo Sanguíneo (RH)</span>
        <strong class="text-white">{{ student.bloodType }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Entidad EPS</span>
        <strong class="text-white">{{ student.epsEntity }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Teléfono</span>
        <strong class="text-white">{{ student.phone }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5">
        <span class="text-[11px] text-zinc-400 block">Dirección</span>
        <strong class="text-white">{{ student.address }}</strong>
      </div>
      <div class="lotus-glass-subcard p-3.5 sm:col-span-2">
        <span class="text-[11px] text-zinc-400 block">Contacto de Emergencia</span>
        <strong class="text-white">
          {{ student.emergencyContactName }} ({{ student.emergencyContactRelationship }}) — {{ student.emergencyContactPhone }}
        </strong>
      </div>
      <div class="lotus-glass-subcard p-3.5 sm:col-span-2">
        <span class="text-[11px] text-zinc-400 block">Observaciones Médicas</span>
        <p class="text-zinc-200 mt-0.5">{{ student.medicalNotes }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudentFullRecord } from '../../types/dojo';
import { useDojoStore } from '../../composables/useDojoStore';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ student: StudentFullRecord }>();
const emit = defineEmits<{ (e: 'notify', msg: string): void }>();
const store = useDojoStore();

function onChangePhoto(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      store.updateStudentPhoto(props.student.id, reader.result);
      emit('notify', 'Foto de perfil actualizada.');
    }
  };
  reader.readAsDataURL(file);
}
</script>
