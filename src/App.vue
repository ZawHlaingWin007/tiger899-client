<script setup>
import { RouterView } from "vue-router";

import { computed } from 'vue';
import { useStore } from 'vuex';
import LoginModal from "./components/LoginModal.vue";
import RegisterModal from "./components/RegisterModal.vue";
import FloatingQuickBar from "./components/FloatingQuickBar.vue";

const store = useStore();
const isLoginModalOpen = computed(() => store.state.isLoginModalOpen);
const isRegisterModalOpen = computed(() => store.state.isRegisterModalOpen);

const handleCloseModal = () => {
  store.dispatch('closeLoginModal');
};

const handleCloseRegisterModal = () => {
  store.dispatch('closeRegisterModal');
};

const handleOpenLoginFromRegister = () => {
  store.dispatch('closeRegisterModal');
  store.dispatch('openLoginModal');
};
</script>

<template>
  <RouterView />
  <FloatingQuickBar />
  <LoginModal
    :isOpen="isLoginModalOpen"
    @close="handleCloseModal"
  />
  <RegisterModal
    :isOpen="isRegisterModalOpen"
    @close="handleCloseRegisterModal"
    @openLogin="handleOpenLoginFromRegister"
  />
</template>

<style>
body {
  background-color: #16062b;
  /* Padauk loaded async in index.html; system fallback avoids invisible text (CLS) */
  font-family: 'Padauk', system-ui, -apple-system, sans-serif;
}
</style>
