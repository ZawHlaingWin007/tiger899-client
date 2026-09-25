<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import LoginModal from "./LoginModal.vue";
import RegisterModal from "./RegisterModal.vue";
import ProfileDropdown from "./ProfileDropdown.vue";
import { useModal } from "../composables/useModal";
import { useTranslation } from "../composables/useTranslation";
import { useFormatAmount } from "../composables/useFormatAmount";
import { getProfileImageUrl } from "../composables/useProfileImage";
import { useQuickLogin } from "../composables/useQuickLogin";

const router = useRouter();
const { isQuickLogin, quickLogin } = useQuickLogin();
const store = useStore();
const { openDepositModal, openWithdrawModal, openDownloadModal } = useModal();
const { t } = useTranslation();

const isLoginModalOpen = ref(false);
const isRegisterModalOpen = ref(false);
const isTopHeaderVisible = ref(true);
const isProfileDropdownOpen = ref(false);
const profileButtonRef = ref(null);
const emit = defineEmits(["toggleSidebar"]);

// Check if user is logged in
const isLoggedIn = computed(() => {
  const authUser = store?.state?.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const { formatAmount } = useFormatAmount();
// Get user balance from store (formatted with commas)
const userBalanceFormatted = computed(() =>
  formatAmount(store?.state?.amount || 0, 2)
);

// Get user profile image from store (CDN URL from authUser.profile_image 1–12)
const userProfileImage = computed(() => {
  return getProfileImageUrl(store?.state?.authUser) || "/logo-profile.png";
});

const hideTopHeader = () => {
  isTopHeaderVisible.value = false;
};

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

const isBalanceLoading = ref(false);

const refreshBalance = async () => {
  if (isBalanceLoading.value) return;
  isBalanceLoading.value = true;
  try {
    await store.dispatch("fetchUser");
  } finally {
    isBalanceLoading.value = false;
  }
};

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value;
};

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false;
};

// Language selection (same logic as Sidebar)
const language = computed(() => store.state.language || "mm");
const showLanguagePopup = ref(false);

const languageOptions = [
  {
    text: "English",
    value: "en",
    flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/united-kingdom.png",
  },
  {
    text: "中文",
    value: "cn",
    flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/china.png",
  },
  {
    text: "ไทย",
    value: "th",
    flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/thailand.png",
  },
  {
    text: "မြန်မာ",
    value: "mm",
    flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/myanmar.png",
  },
];

const currentLanguageOption = computed(
  () => languageOptions.find((opt) => opt.value === language.value) || languageOptions[3]
);

const setLanguage = (lang) => {
  store.commit("setLanguage", lang);
  showLanguagePopup.value = false;
};

const openLanguagePopup = () => {
  showLanguagePopup.value = true;
};
</script>

<template>
  <div class="md:hidden sticky top-0 z-50">
    <div class="header-ixmm px-3 py-2 flex items-center justify-between">
      <router-link to="/" class="flex items-center no-underline shrink-0">
        <img src="@/assets/tiger899-logo.png" alt="Tiger899" class="h-12 w-12 rounded-full object-cover" />
      </router-link>

      <div v-if="isLoggedIn" class="flex items-center gap-2">
        <div
          class="relative flex items-center gap-1.5 rounded-full bg-black/25 border border-white/10 pl-1 pr-2 py-0.5 shrink-0 min-w-0"
        >
          <button
            ref="profileButtonRef"
            @click.stop="toggleProfileDropdown"
            class="profile-trigger touch-manipulation flex items-center gap-1.5 min-w-0"
            aria-label="Account"
          >
            <img
              :src="userProfileImage"
              alt="Profile"
              class="w-8 h-8 rounded-full object-cover border border-white/20 bg-[#16062b] shrink-0"
            />
          </button>
          <div class="flex items-center gap-1 min-w-0">
            <span
              class="text-white font-semibold text-xs tabular-nums whitespace-nowrap overflow-x-auto overflow-y-hidden min-w-0"
            >
              <template v-if="isBalanceLoading">***</template>
              <template v-else>{{ userBalanceFormatted }}</template>
              <span class="text-[#facc15]">K</span>
            </span>
            <button
              type="button"
              :disabled="isBalanceLoading"
              @click="refreshBalance"
              class="text-white hover:text-gray-300 transition-colors p-1 touch-manipulation disabled:opacity-70 disabled:pointer-events-none"
              aria-label="Refresh Balance"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                class="transition-transform duration-300"
                :class="{ 'animate-spin': isBalanceLoading }"
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
          <ProfileDropdown
            :isOpen="isProfileDropdownOpen"
            @close="closeProfileDropdown"
          />
        </div>
        <button
          type="button"
          class="shrink-0 w-5 h-5 rounded-full overflow-hidden touch-manipulation"
          aria-label="Language"
          @click="openLanguagePopup"
        >
          <img
            :src="currentLanguageOption.flag"
            :alt="currentLanguageOption.text"
            class="w-full h-full object-cover"
          />
        </button>
      </div>

      <div v-else class="flex items-center gap-1.5">
        <button
          type="button"
          class="btn-ixmm-quick-login w-8 h-8 flex items-center justify-center shrink-0"
          :aria-label="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
          :title="t('Quick Login', 'အမြန်ဝင်မည်', '快速登录', 'เข้าสู่ระบบด่วน')"
          :disabled="isQuickLogin"
          @click="quickLogin()"
        >
          <svg
            v-if="!isQuickLogin"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15L11 21z" />
          </svg>
          <svg
            v-else
            class="animate-spin h-3.5 w-3.5 text-[#1a1200]"
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
          class="btn-ixmm-login px-3 py-1 text-[12px] font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Login", "လော့ဂ်အင်", "登录", "เข้าสู่ระบบ") }}
        </button>
        <button
          type="button"
          @click="openRegisterModal"
          class="btn-ixmm-register px-3 py-1 text-[12px] font-['Pyidaungsu','Padauk',sans-serif]"
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

    <!-- Language selection (custom overlay, dropdown from top-right) -->
    <Teleport to="body">
      <Transition name="language-fade">
        <div
          v-show="showLanguagePopup"
          class="fixed inset-0 z-[9999] flex items-start justify-end pt-24 pr-3 sm:pr-4 bg-black/40"
          @click.self="showLanguagePopup = false"
        >
          <div
            class="w-[280px] max-w-[calc(100vw-24px)] bg-[#080E1E] rounded-2xl overflow-hidden"
            @click.stop
          >
            <div class="py-2 px-1">
              <button
                v-for="opt in languageOptions"
                :key="opt.value"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-['Pyidaungsu','Padauk',sans-serif] text-sm text-white transition-colors mx-1"
                :class="language === opt.value ? 'bg-[#1986E1]/30 text-white' : 'hover:bg-white/8 active:bg-white/12'"
                @click="setLanguage(opt.value)"
              >
                <img
                  :src="opt.flag"
                  :alt="opt.text"
                  class="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white/10"
                />
                <span class="font-medium">{{ opt.text }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
  transform-origin: top;
}

.slide-up-enter-from {
  opacity: 1;
  transform: translateY(0);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* Custom language overlay transition */
.language-fade-enter-active,
.language-fade-leave-active {
  transition: opacity 0.2s ease;
}
.language-fade-enter-from,
.language-fade-leave-to {
  opacity: 0;
}

.heart-beat-animation {
  animation: heartbeat 1s infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1);
  }
  60% {
    transform: scale(1.2);
  }
  80% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
