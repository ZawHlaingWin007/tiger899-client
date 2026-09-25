<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import LoginModal from "./LoginModal.vue";
import RegisterModal from "./RegisterModal.vue";
import ProfileDropdown from "./ProfileDropdown.vue";
import { useModal } from "../composables/useModal";
import { useTranslation } from "../composables/useTranslation";
import { useFormatAmount } from "../composables/useFormatAmount";
import { getProfileImageUrl } from "../composables/useProfileImage";
import { useQuickLogin } from "../composables/useQuickLogin";

const store = useStore();
const { isQuickLogin, quickLogin } = useQuickLogin();
const router = useRouter();
const { openDepositModal, openWithdrawModal } = useModal();
const { t } = useTranslation();

const isLoginModalOpen = ref(false);
const isRegisterModalOpen = ref(false);
const isProfileDropdownOpen = ref(false);
const profileButtonRef = ref(null);
const emit = defineEmits(["toggleFloatingMenu"]);

// Check if user is logged in
const isLoggedIn = computed(() => {
  const authUser = store?.state?.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const { formatAmount } = useFormatAmount();
// Get user balance from store (formatted with commas)
const userBalanceFormatted = computed(() =>
  formatAmount(store?.state?.amount || 0, 2),
);

// Get user profile image from store (CDN URL from authUser.profile_image 1–12)
const userProfileImage = computed(() => {
  return getProfileImageUrl(store?.state?.authUser) || "https://via.placeholder.com/30";
});

const openLoginModal = () => {
  isRegisterModalOpen.value = false;
  isLoginModalOpen.value = true;
};

const closeLoginModal = () => {
  isLoginModalOpen.value = false;
};

const openRegisterModal = () => {
  isLoginModalOpen.value = false;
  isRegisterModalOpen.value = true;
};

const closeRegisterModal = () => {
  isRegisterModalOpen.value = false;
};

const refreshBalance = () => {
  // Refresh balance - you can add API call here
  store.dispatch("fetchUser");
};

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value;
};

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false;
};

const handleQuickLogin = () => {
  quickLogin();
};
</script>

<template>
  <nav class="header-ixmm sticky top-0 z-50 flex justify-between items-center text-white px-5 lg:px-8 h-[76px]">
    <router-link
      to="/"
      class="flex items-center gap-2 no-underline shrink-0"
    >
      <img
        src="@/assets/tiger899-logo.png"
        class="h-[64px] w-[64px] object-cover rounded-full"
        alt="Tiger899 Logo"
      />
    </router-link>

    <div class="flex items-center gap-3 lg:gap-5">
      <div class="hidden lg:flex items-center gap-4">
        <router-link
          :to="{ name: 'promotion' }"
          class="flex flex-col items-center no-underline text-white/90 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
          </svg>
          <span class="text-[11px] font-semibold font-['Pyidaungsu','Padauk',sans-serif] leading-tight mt-0.5">
            {{ t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น") }}
          </span>
        </router-link>
        <router-link
          :to="{ name: 'rewards' }"
          class="flex flex-col items-center no-underline text-white/90 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 3h12l4 6-10 12L2 9z" />
            <path d="M2 9h20" />
          </svg>
          <span class="text-[11px] font-semibold font-['Pyidaungsu','Padauk',sans-serif] leading-tight mt-0.5">
            {{ t("Rewards", "အခွင့်အရေး", "奖励", "สิทธิพิเศษ") }}
          </span>
        </router-link>
      </div>

      <div
        v-if="isLoggedIn"
        class="flex items-center gap-2.5"
      >
        <div
          class="bg-black/25 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shrink-0 min-w-0 max-w-[200px] sm:max-w-[240px]"
        >
          <span class="text-white font-semibold text-sm whitespace-nowrap overflow-x-auto overflow-y-hidden min-w-0">
            {{ userBalanceFormatted }}<span class="text-[#facc15]">K</span>
          </span>
          <button
            type="button"
            @click="refreshBalance"
            class="text-white/50 hover:text-white transition-colors"
            aria-label="Refresh balance"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>

        <button
          type="button"
          @click="openWithdrawModal"
          class="btn-ixmm-ghost px-4 py-1.5 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน") }}
        </button>
        <button
          type="button"
          @click="openDepositModal"
          class="btn-ixmm-register px-4 py-1.5 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
        </button>

        <div class="relative">
          <button
            ref="profileButtonRef"
            @click.stop="toggleProfileDropdown"
            class="profile-trigger rounded-full overflow-hidden ring-2 ring-white/15 hover:ring-[#facc15] transition-all bg-[#260a4a]"
          >
            <img
              :src="userProfileImage"
              alt="Profile"
              class="w-9 h-9 object-cover"
            />
          </button>
          <ProfileDropdown
            :isOpen="isProfileDropdownOpen"
            @close="closeProfileDropdown"
          />
        </div>
      </div>

      <div
        v-else
        class="flex items-center gap-2.5"
      >
        <button
          type="button"
          class="btn-ixmm-quick-login w-9 h-9 flex items-center justify-center shrink-0"
          :aria-label="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
          :title="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
          :disabled="isQuickLogin"
          @click="handleQuickLogin"
        >
          <svg
            v-if="!isQuickLogin"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z" />
          </svg>
          <svg
            v-else
            class="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </button>
        <button
          type="button"
          @click="openLoginModal"
          class="btn-ixmm-login px-5 py-1.5 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Login", "လော့ဂ်အင်", "登录", "เข้าสู่ระบบ") }}
        </button>
        <button
          type="button"
          class="btn-ixmm-register px-5 py-1.5 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
          @click.prevent="openRegisterModal"
        >
          {{ t("Register", "အကောင့်ဖွင့်ရန်", "注册", "สมัครบัญชี") }}
        </button>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal
      :isOpen="isLoginModalOpen"
      @close="closeLoginModal"
      @openRegister="openRegisterModal"
    />

    <!-- Register Modal -->
    <RegisterModal
      :isOpen="isRegisterModalOpen"
      @close="closeRegisterModal"
      @openLogin="openLoginModal"
    />
  </nav>
</template>
