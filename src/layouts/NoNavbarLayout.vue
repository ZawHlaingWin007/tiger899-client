<script setup>
import { computed, watch } from "vue";
import { RouterView, useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import LoginModal from "../components/LoginModal.vue";
import DepositModal from "../components/DepositModal.vue";
import WithdrawModal from "../components/WithdrawModal.vue";
import BettingHistoryModal from "../components/BettingHistoryModal.vue";
import DownloadModal from "../components/DownloadModal.vue";
import DepositHistoryModal from "../components/DepositHistoryModal.vue";
import WithdrawHistoryModal from "../components/WithdrawHistoryModal.vue";
import ProfileEditModal from "../components/ProfileEditModal.vue";
import { useModal } from "../composables/useModal";

const router = useRouter();
const route = useRoute();
const store = useStore();

const profileModalOpen = computed({
  get: () => store.state.profileModalOpen,
  set: (value) => store.commit("setProfileModalOpen", value),
});

// Close profile modal when route changes or when layout mounts (e.g. back from account)
watch(
  () => route.path,
  () => {
    if (store.state.profileModalOpen) {
      store.commit("setProfileModalOpen", false);
    }
  },
  { immediate: true },
);

// Modal State
const {
  isDepositModalOpen,
  closeDepositModal,
  isBettingHistoryModalOpen,
  closeBettingHistoryModal,
  isLoginModalOpen,
  closeLoginModal,
  isWithdrawModalOpen,
  closeWithdrawModal,
  isDownloadModalOpen,
  closeDownloadModal,
  isDepositHistoryModalOpen,
  closeDepositHistoryModal,
  isWithdrawHistoryModalOpen,
  closeWithdrawHistoryModal,
} = useModal();

const handleDepositSubmit = (depositData) => {
  // Handle deposit submission here
  console.log("Deposit submitted:", depositData);
  closeDepositModal();
};

const handleDownloadConfirm = () => {
  closeDownloadModal();
  router.push({ name: "download" });
};
</script>

<template>
  <div class="min-h-screen bg-[#172240]">
    <RouterView />

    <!-- Deposit Modal -->
    <DepositModal
      :isOpen="isDepositModalOpen"
      @close="closeDepositModal"
      @submit="handleDepositSubmit"
    />

    <!-- Betting History Modal -->
    <BettingHistoryModal
      :isOpen="isBettingHistoryModalOpen"
      @close="closeBettingHistoryModal"
    />

    <!-- Login Modal -->
    <LoginModal
      :isOpen="isLoginModalOpen"
      @close="closeLoginModal"
      @openRegister="
        () => {
          closeLoginModal();
          store.dispatch('openRegisterModal');
        }
      "
    />

    <!-- Withdraw Modal -->
    <WithdrawModal :isOpen="isWithdrawModalOpen" @close="closeWithdrawModal" />

    <!-- Download Modal -->
    <DownloadModal
      :show="isDownloadModalOpen"
      @close="closeDownloadModal"
      @download="handleDownloadConfirm"
    />

    <DepositHistoryModal
      :isOpen="isDepositHistoryModalOpen"
      @close="closeDepositHistoryModal"
    />
    <WithdrawHistoryModal
      :isOpen="isWithdrawHistoryModalOpen"
      @close="closeWithdrawHistoryModal"
    />

    <ProfileEditModal v-model="profileModalOpen" />
  </div>
</template>
