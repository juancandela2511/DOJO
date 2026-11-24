<template>
  <div
    class="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <OceanSwell />

    <div
      class="relative z-10 w-full max-w-md rounded-[28px] p-6 sm:p-8 my-auto overflow-hidden animate-dojo-tab"
      style="
        background: linear-gradient(145deg, rgba(13, 21, 42, 0.78) 0%, rgba(8, 13, 26, 0.86) 100%);
        backdrop-filter: blur(22px) saturate(160%);
        border: 1px solid rgba(251, 208, 224, 0.22);
        box-shadow: 0 28px 80px rgba(3, 6, 15, 0.85), 0 0 45px rgba(248, 187, 208, 0.10);
      "
    >
      <button
        type="button"
        @click="$emit('close')"
        class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-pink-200/20 text-blue-100 flex items-center justify-center"
      >
        <AppIcon name="x" :size="15" />
      </button>

      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 bg-pink-300/15 border border-pink-200/35 text-pink-200">
          <AppIcon name="lotus" :size="22" />
        </div>
        <h2 class="text-[24px] font-semibold text-white">Iniciar Sesión</h2>
        <p class="text-[13px] text-blue-200/75 mt-0.5">Templo · Kung Fu Dojo</p>
      </div>

      <div class="grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] mb-6 bg-[#060a14]/75 border border-white/10">
        <button
          type="button"
          @click="tab = 'ESTUDIANTE'; errorMsg = ''"
          class="py-2.5 px-3 rounded-[10px] text-[13px] inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'ESTUDIANTE' ? 'bg-gradient-to-r from-[#1e2d4f] to-[#2d2346] text-pink-100 border border-pink-300/30 font-semibold' : 'text-blue-200/65'"
        >
          <AppIcon name="user" :size="14" />
          <span>Usuario</span>
        </button>
        <button
          type="button"
          @click="tab = 'ADMIN'; errorMsg = ''"
          class="py-2.5 px-3 rounded-[10px] text-[13px] inline-flex items-center justify-center gap-1.5 transition"
          :class="tab === 'ADMIN' ? 'bg-gradient-to-r from-[#1e2d4f] to-[#2d2346] text-pink-100 border border-pink-300/30 font-semibold' : 'text-blue-200/65'"
        >
          <AppIcon name="lock" :size="14" />
          <span>Administrador</span>
        </button>
      </div>

      <form v-if="tab === 'ESTUDIANTE'" @submit.prevent="submitStudent" class="space-y-4">
        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1.5">Número de Cédula</label>
          <input v-model="cedula" type="text" required placeholder="Ej. 1020304050" class="lotus-glass-input w-full px-4 py-3 text-[15px]" />
        </div>
        <button
          type="submit"
          class="w-full py-3 px-5 rounded-full text-[15px] font-semibold text-[#090d1a]"
          style="background: linear-gradient(135deg, #fbd0e0 0%, #c4b5fd 52%, #93c5fd 100%);"
        >
          Ingresar con mi Cédula
        </button>
      </form>

      <form v-else @submit.prevent="submitAdmin" class="space-y-3.5">
        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1">Cédula de Administrador</label>
          <input v-model="adminCedula" type="text" required placeholder="Ej. 1000100100" class="lotus-glass-input w-full px-4 py-2.5 text-[15px]" />
        </div>
        <div>
          <label class="block text-[12px] font-semibold text-pink-100/90 mb-1">Contraseña</label>
          <input v-model="adminPass" type="password" required placeholder="Ingresa tu contraseña" class="lotus-glass-input w-full px-4 py-2.5 text-[15px]" />
        </div>
        <button
          type="submit"
          class="w-full py-3 px-5 rounded-full text-[15px] font-semibold text-[#090d1a]"
          style="background: linear-gradient(135deg, #fbd0e0 0%, #c4b5fd 52%, #93c5fd 100%);"
        >
          Iniciar Sesión como Administrador
        </button>
      </form>

      <p v-if="errorMsg" class="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-[13px]">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDojoStore } from '../../composables/useDojoStore';
import OceanSwell from '../OceanSwell.vue';
import AppIcon from '../AppIcon.vue';

const props = defineProps<{ initialTab: 'ESTUDIANTE' | 'ADMIN' }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'authenticated', payload: { beltColor: string; secondaryColor: string | null; beltName: string; userName: string }): void;
}>();

const store = useDojoStore();
const tab = ref<'ESTUDIANTE' | 'ADMIN'>(props.initialTab);
const cedula = ref('');
const adminCedula = ref('1000100100');
const adminPass = ref('AdminDojo2026!');
const errorMsg = ref('');

function submitStudent(): void {
  const err = store.loginStudentByCedula(cedula.value);
  if (err) { errorMsg.value = err; return; }
  const student = store.currentStudentProfile.value;
  if (student) {
    const belt = store.getBeltById(student.currentBeltId);
    emit('authenticated', { beltColor: belt.colorHex, secondaryColor: belt.secondaryColorHex, beltName: belt.name, userName: student.firstName });
  }
}

function submitAdmin(): void {
  const err = store.loginAdmin(adminCedula.value, adminPass.value);
  if (err) { errorMsg.value = err; return; }
  emit('authenticated', { beltColor: '#18181B', secondaryColor: '#FFFFFF', beltName: 'Shifu · Administración', userName: 'Shifu' });
}
</script>
