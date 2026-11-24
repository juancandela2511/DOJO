<template>
  <div
    :class="isModal ? 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto' : ''"
    @click.self="isModal && $emit('close')"
  >
    <div class="lotus-glass-card w-full max-w-3xl p-6 sm:p-7 my-auto animate-dojo-tab relative">
      <button
        v-if="isModal"
        type="button"
        @click="$emit('close')"
        class="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
        aria-label="Cerrar"
      >
        <AppIcon name="x" :size="16" />
      </button>

      <div class="mb-6 pr-10">
        <span class="inline-block px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 text-[11px] font-semibold mb-1.5">
          Registro de Nuevo Discípulo
        </span>
        <h3 class="text-[22px] font-semibold text-white">Crear Nuevo Estudiante</h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          @click="entryMode = 'OCR'"
          class="p-4 rounded-[18px] border text-left transition flex items-start gap-3"
          :class="entryMode === 'OCR' ? 'bg-white/12 border-white/45' : 'bg-black/30 border-white/10 hover:border-white/25'"
        >
          <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <AppIcon name="upload" :size="18" />
          </span>
          <div>
            <strong class="block text-[14px] text-white">Escanear / Subir Datos (OCR)</strong>
            <span class="text-[12px] text-zinc-400">Autocompleta campos desde Cédula o EPS.</span>
          </div>
        </button>

        <button
          type="button"
          @click="entryMode = 'MANUAL'; bannerMessage = ''"
          class="p-4 rounded-[18px] border text-left transition flex items-start gap-3"
          :class="entryMode === 'MANUAL' ? 'bg-white/12 border-white/45' : 'bg-black/30 border-white/10 hover:border-white/25'"
        >
          <span class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <AppIcon name="edit" :size="18" />
          </span>
          <div>
            <strong class="block text-[14px] text-white">Llenar Datos Manualmente</strong>
            <span class="text-[12px] text-zinc-400">Escribe tú mismo todos los datos.</span>
          </div>
        </button>
      </div>

      <div v-if="entryMode === 'OCR'" class="mb-5 p-4 lotus-glass-subcard flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[13px] font-semibold text-white">Subir Cédula o certificado EPS</p>
          <p class="text-[12px] text-zinc-400">Imagen o PDF para extracción automática.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <label class="lotus-primary-pill px-4 py-2 text-[12.5px] cursor-pointer inline-flex items-center gap-1.5">
            <AppIcon name="upload" :size="14" />
            <span>Subir Archivo</span>
            <input type="file" accept="image/*,.pdf" class="hidden" @change="onFileSelected" />
          </label>
          <button type="button" @click="triggerDemoOcr" class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 text-[12.5px]">
            Demo OCR
          </button>
        </div>
      </div>

      <div v-if="bannerMessage" class="mb-5 p-3 rounded-xl bg-white/10 border border-white/20 text-zinc-100 text-[12.5px]">
        <strong class="block">{{ bannerTitle }}</strong>
        <span class="font-mono opacity-85">{{ bannerMessage }}</span>
      </div>

      <form @submit.prevent="submitStudent" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StudentPhotoPicker v-model="form.profilePhotoUrl" />

        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Cédula (CC) *</label>
          <input v-model="form.documentNumber" type="text" required placeholder="Ej. 1098765432" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Nombres *</label>
          <input v-model="form.firstName" type="text" required placeholder="Nombres" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Apellidos *</label>
          <input v-model="form.lastName" type="text" required placeholder="Apellidos" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">RH *</label>
          <select v-model="form.bloodType" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]">
            <option v-for="rh in bloodTypes" :key="rh" :value="rh" class="bg-[#0a1020] text-white">{{ rh }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Entidad EPS *</label>
          <input v-model="form.epsEntity" type="text" required placeholder="Ej. EPS Sura" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Cinturón Inicial *</label>
          <select v-model.number="form.currentBeltId" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]">
            <option v-for="belt in store.belts.value" :key="belt.id" :value="belt.id" class="bg-[#0a1020] text-white">{{ belt.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Teléfono</label>
          <input v-model="form.phone" type="text" placeholder="Ej. 3001234567" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Contacto Emergencia *</label>
          <input v-model="form.emergencyContactName" type="text" required placeholder="Nombre familiar" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Tel. Emergencia *</label>
          <input v-model="form.emergencyContactPhone" type="text" required placeholder="Ej. 3109876543" class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-[12px] font-semibold text-zinc-300 mb-1">Observaciones Médicas</label>
          <input v-model="form.medicalNotes" type="text" placeholder="Alergias o notas..." class="lotus-glass-input w-full px-3.5 py-2 text-[14px]" />
        </div>
        <div class="flex items-end">
          <button type="submit" class="w-full lotus-primary-pill py-2.5 px-5 text-[14px]">Guardar Discípulo</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { BloodType } from '../types/dojo';
import { useDojoStore } from '../composables/useDojoStore';
import AppIcon from './AppIcon.vue';
import StudentPhotoPicker from './student/StudentPhotoPicker.vue';

withDefaults(defineProps<{ isModal?: boolean }>(), { isModal: false });
const emit = defineEmits<{ (e: 'close'): void; (e: 'created', fullName: string): void }>();

const store = useDojoStore();
const entryMode = ref<'OCR' | 'MANUAL'>('OCR');
const bannerTitle = ref('');
const bannerMessage = ref('');
const bloodTypes: BloodType[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const form = reactive({
  documentNumber: '', firstName: '', lastName: '', birthDate: '2000-03-19',
  bloodType: 'O+' as BloodType, epsEntity: '', phone: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: 'Familiar',
  currentBeltId: 1, medicalNotes: '', profilePhotoUrl: '',
});

function applyOcr(fileName: string, hint: string): void {
  const res = store.runOcrExtraction(fileName, hint);
  Object.assign(form, {
    documentNumber: res.documentNumber, firstName: res.firstName, lastName: res.lastName,
    bloodType: res.bloodType, epsEntity: res.epsEntity, birthDate: res.birthDate,
    phone: form.phone || '3014455667', emergencyContactName: form.emergencyContactName || 'Elena Mendoza',
    emergencyContactPhone: form.emergencyContactPhone || '3147788990',
    medicalNotes: `Documentos verificados por OCR (${fileName})`,
  });
  bannerTitle.value = `OCR completado (${res.confidence}%)`;
  bannerMessage.value = res.rawText;
}

function onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  applyOcr(file ? file.name : 'Cedula_EPS.jpg', file?.name || '');
}

function triggerDemoOcr(): void {
  applyOcr('Scan_CC_EPS.jpg', form.documentNumber === '1098765432' ? '1054' : '1098');
}

function submitStudent(): void {
  if (!form.documentNumber.trim() || !form.firstName.trim() || !form.lastName.trim()) return;
  const created = store.createStudentWithOcr({ ...form });
  const fullName = `${created.firstName} ${created.lastName}`;
  Object.assign(form, { documentNumber: '', firstName: '', lastName: '', epsEntity: '', phone: '', emergencyContactName: '', emergencyContactPhone: '', medicalNotes: '', profilePhotoUrl: '' });
  emit('created', fullName);
}
</script>
