import { ref } from "vue";
import { useRouter } from "vue-router";
import store from "../store";

// Global modal state - shared across all components
const isDepositModalOpen = ref(false);
const isBettingHistoryModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const isWithdrawModalOpen = ref(false);
const isDownloadModalOpen = ref(false);
const isDepositHistoryModalOpen = ref(false);
const isWithdrawHistoryModalOpen = ref(false);
const isLuckySpinModalOpen = ref(false);
const isRegisterModalOpen = ref(false);

/**
 * Check if device is mobile (used for deposit, betting history, etc.)
 */
const isMobile = () => {
  return window.innerWidth < 768; // md breakpoint
};

/**
 * Stricter mobile check for withdraw: only redirect to full page on small screens.
 * This ensures the withdraw modal opens on desktop (768px+ and also 640–768).
 */
const isSmallMobile = () => {
  return window.innerWidth < 640;
};

/**
 * Composable for managing global modal state
 * 
 * Usage in any component:
 * ```javascript
 * import { useModal } from '@/composables/useModal';
 * 
 * const { openDepositModal, openBettingHistoryModal } = useModal();
 * 
 * // Open modals from anywhere
 * openDepositModal();
 * openBettingHistoryModal();
 * ```
 */
export const useModal = () => {
  const router = useRouter();

  const openDepositModal = () => {
    // On mobile: navigate to deposit page; on desktop: open 2-step modal
    if (isMobile()) {
      router.push({ name: "deposit-step-1" });
      return;
    }
    isDepositModalOpen.value = true;
  };

  const closeDepositModal = () => {
    isDepositModalOpen.value = false;
  };

  const openBettingHistoryModal = () => {
    // On mobile: navigate to betting-history page; on desktop: open modal
    if (isMobile()) {
      router.push({ name: "betting-history" });
      return;
    }
    isBettingHistoryModalOpen.value = true;
  };

  const closeBettingHistoryModal = () => {
    isBettingHistoryModalOpen.value = false;
  };

  const openLoginModal = () => {
    isLoginModalOpen.value = true;
  };

  const closeLoginModal = () => {
    isLoginModalOpen.value = false;
  };

  const openWithdrawModal = () => {
    // Only on small mobile: navigate to withdraw page; otherwise open modal (desktop/tablet)
    if (isSmallMobile()) {
      router.push({ name: "withdraw" });
      return;
    }
    isWithdrawModalOpen.value = true;
  };

  const closeWithdrawModal = () => {
    isWithdrawModalOpen.value = false;
  };

  const openDownloadModal = () => {
    // Redirect to dedicated download page (no modal)
    router.push({ name: "download" });
  };

  const closeDownloadModal = () => {
    isDownloadModalOpen.value = false;
  };

  const openDepositHistoryModal = () => {
    if (isMobile()) {
      router.push({ name: "deposit-history" });
      return;
    }
    isDepositHistoryModalOpen.value = true;
  };

  const closeDepositHistoryModal = () => {
    isDepositHistoryModalOpen.value = false;
  };

  const openWithdrawHistoryModal = () => {
    if (isMobile()) {
      router.push({ name: "withdraw-history" });
      return;
    }
    isWithdrawHistoryModalOpen.value = true;
  };

  const closeWithdrawHistoryModal = () => {
    isWithdrawHistoryModalOpen.value = false;
  };

  const openRegisterModal = () => {
    isLoginModalOpen.value = false;
    isRegisterModalOpen.value = true;
  };

  const closeRegisterModal = () => {
    isRegisterModalOpen.value = false;
  };

  const openLuckySpinModal = () => {
    isLoginModalOpen.value = false;
    isRegisterModalOpen.value = false;
    store.dispatch("closeLoginModal");
    isLuckySpinModalOpen.value = true;
  };

  const closeLuckySpinModal = () => {
    isLuckySpinModalOpen.value = false;
  };

  return {
    isDepositModalOpen,
    openDepositModal,
    closeDepositModal,
    isBettingHistoryModalOpen,
    openBettingHistoryModal,
    closeBettingHistoryModal,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    isWithdrawModalOpen,
    openWithdrawModal,
    closeWithdrawModal,
    isDownloadModalOpen,
    openDownloadModal,
    closeDownloadModal,
    isDepositHistoryModalOpen,
    openDepositHistoryModal,
    closeDepositHistoryModal,
    isWithdrawHistoryModalOpen,
    openWithdrawHistoryModal,
    closeWithdrawHistoryModal,
    isLuckySpinModalOpen,
    openLuckySpinModal,
    closeLuckySpinModal,
    isRegisterModalOpen,
    openRegisterModal,
    closeRegisterModal,
  };
};
