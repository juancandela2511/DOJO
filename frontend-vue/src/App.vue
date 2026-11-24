<template>
  <div class="dojo-backdrop-layer fixed inset-0 z-0 bg-[#090a0e]">
    <MoonlitPetals />
  </div>

  <BeltTightenOverlay
    v-if="showBeltIntro"
    :belt-color="introData.beltColor"
    :secondary-color="introData.secondaryColor"
    :belt-name="introData.beltName"
    :user-name="introData.userName"
  />

  <AppHeader @open-login="openLogin" />

  <LandingHero
    v-if="!store.isAuthenticated.value"
    :in-class-count="store.inClassCount.value"
    @open-login="openLogin"
  />

  <main v-else class="relative z-10 pb-12">
    <AdminDashboardView v-if="store.activeWorkspaceView.value === 'ADMIN'" />
    <AssistantClassLogView v-else-if="store.activeWorkspaceView.value === 'CLASE'" />
    <StudentHomeView v-else />
  </main>

  <LoginModal
    v-if="showLoginModal"
    :initial-tab="loginTab"
    @close="showLoginModal = false"
    @authenticated="onAuthenticated"
  />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useDojoStore } from './composables/useDojoStore';
import MoonlitPetals from './components/MoonlitPetals.vue';
import BeltTightenOverlay from './components/BeltTightenOverlay.vue';
import AppHeader from './components/layout/AppHeader.vue';
import LandingHero from './components/layout/LandingHero.vue';
import LoginModal from './components/auth/LoginModal.vue';
import AdminDashboardView from './views/AdminDashboardView.vue';
import AssistantClassLogView from './views/AssistantClassLogView.vue';
import StudentHomeView from './views/StudentHomeView.vue';

const store = useDojoStore();
const showLoginModal = ref(false);
const loginTab = ref<'ESTUDIANTE' | 'ADMIN'>('ESTUDIANTE');
const showBeltIntro = ref(false);

const introData = reactive<{
  beltColor: string;
  secondaryColor: string | null;
  beltName: string;
  userName: string;
}>({
  beltColor: '#18181B',
  secondaryColor: '#FFFFFF',
  beltName: 'Faja Negra (1er Duan)',
  userName: '',
});

function openLogin(tab: 'ESTUDIANTE' | 'ADMIN'): void {
  loginTab.value = tab;
  showLoginModal.value = true;
}

function onAuthenticated(payload: {
  beltColor: string;
  secondaryColor: string | null;
  beltName: string;
  userName: string;
}): void {
  showLoginModal.value = false;
  Object.assign(introData, payload);
  showBeltIntro.value = true;
  window.setTimeout(() => {
    showBeltIntro.value = false;
  }, 1450);
}
</script>
