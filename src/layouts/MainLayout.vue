<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { RouterView, useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import Navbar from "../components/Navbar.vue";
import MobileNavbar from "../components/MobileNavbar.vue";
import MobileBottomNav from "../components/MobileBottomNav.vue";
import Sidebar from "../components/Sidebar.vue";
import SnowFall from "../components/SnowFall.vue";
import ConfettiEffect from "../components/seasonal/ConfettiEffect.vue";
import ChineseNewYearEffect from "../components/seasonal/ChineseNewYearEffect.vue";
import ValentineEffect from "../components/seasonal/ValentineEffect.vue";
import HalloweenEffect from "../components/seasonal/HalloweenEffect.vue";
import StPatricksEffect from "../components/seasonal/StPatricksEffect.vue";
import CherryBlossomEffect from "../components/seasonal/CherryBlossomEffect.vue";
import SongkranEffect from "../components/seasonal/SongkranEffect.vue";
import EasterEffect from "../components/seasonal/EasterEffect.vue";
import { useSeasonalEffect } from "../composables/useSeasonalEffect";
import WelcomeModal from "../components/WelcomeModal.vue";
import FloatingContactMenu from "../components/FloatingContactMenu.vue";
import FooterSection from "../components/FooterSection.vue";
import GuideModal from "../components/GuideModal.vue";
import CategoryPageHeader from "../components/CategoryPageHeader.vue";
import DepositModal from "../components/DepositModal.vue";
import BettingHistoryModal from "../components/BettingHistoryModal.vue";
import LoginModal from "../components/LoginModal.vue";
import WithdrawModal from "../components/WithdrawModal.vue";
import DownloadModal from "../components/DownloadModal.vue";
import RegisterModal from "../components/RegisterModal.vue";
import DepositHistoryModal from "../components/DepositHistoryModal.vue";
import WithdrawHistoryModal from "../components/WithdrawHistoryModal.vue";
import LuckySpinModal from "../components/LuckySpinModal.vue";
import ProfileEditModal from "../components/ProfileEditModal.vue";
import { useModal } from "../composables/useModal";
import { useTranslation } from "../composables/useTranslation";

const { t } = useTranslation();
const store = useStore();

const isUserLoggedIn = computed(() => {
  const u = store.state.authUser;
  return !!(u && Object.keys(u).length > 0 && u.id);
});

const profileModalOpen = computed({
  get: () => store.state.profileModalOpen,
  set: (value) => store.commit("setProfileModalOpen", value),
});

const route = useRoute();
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

const seasonalEffectKey = computed(() => useSeasonalEffect(new Date()));
// const seasonalEffectKey = ref("halloween");
const isWelcomeModalOpen = ref(false);
const isFloatingMenuOpen = ref(true);
const isGuideModalOpen = ref(false);
const guideSelectedKey = ref("privacy");
const isMobileSidebarOpen = ref(false);
const router = useRouter();

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
  isLuckySpinModalOpen,
  openLuckySpinModal,
  closeLuckySpinModal,
  isRegisterModalOpen,
  closeRegisterModal,
  openRegisterModal,
  openLoginModal,
} = useModal();
const MOCK_WELCOME_IMAGES = [
  {
    title: "Welcome",
    imageUrl: "/cards/welcome1.png",
  },
];

const announcements = MOCK_WELCOME_IMAGES;

const welcomeImages = ref([]);
const popupSlides = computed(() =>
  (welcomeImages.value || [])
    .map((item, index) => ({
      title: item?.title || item?.name || `Welcome ${index + 1}`,
      imageUrl:
        item?.imageUrl ||
        item?.image_url ||
        item?.image ||
        item?.thumbnail ||
        item?.url ||
        "",
    }))
    .filter((item) => item.imageUrl),
);

const fetchWelcomeImages = async () => {
  try {
    const res = await axios.get("/welcome-images");
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    welcomeImages.value = list.length > 0 ? list : MOCK_WELCOME_IMAGES;
  }
  catch (error) {
    console.error("Failed to fetch", error);
    welcomeImages.value = MOCK_WELCOME_IMAGES;
  }
};


// Show welcome modal on mount (you can add logic to show only once per session)
onMounted(() => {
  // Check if user has seen the modal in this session
  const hasSeenModal = sessionStorage.getItem("hasSeenWelcomeModal");
  if (!hasSeenModal) {
    isWelcomeModalOpen.value = true;
  }
});

// Lucky Spin: open on home only when logged in (first load + return to home).
// Skip with `?noLuckySpin=1` (e.g. while developing).
watch(
  () => [route.name, route.query.noLuckySpin, isUserLoggedIn.value],
  () => {
    if (route.name !== "home") return;
    if (!isUserLoggedIn.value) return;
    const skip = route.query.noLuckySpin;
    if (skip === "1" || skip === "true") return;
    nextTick(() => {
      openLuckySpinModal();
    });
  },
  { immediate: true },
);

const closeWelcomeModal = () => {
  isWelcomeModalOpen.value = false;
  sessionStorage.setItem("hasSeenWelcomeModal", "true");
};

const toggleFloatingMenu = () => {
  window.open(
    "https://j5wxcf.7mmon3ss.com/chatwindow.aspx?siteId=65003042&planId=dff75a9d-59be-41b0-993f-d640215cd304",
  );
  // isFloatingMenuOpen.value = !isFloatingMenuOpen.value;
};

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

const categoryPageNames = [
  "slots",
  "fish-shooting",
  "card-games",
  "buffalo",
  "live",
  "lottery",
  "sports",
  "cockfighting",
  "e-sports",
];
const isCategoryPage = computed(() =>
  categoryPageNames.includes(route.name),
);
const isHome = computed(() => route.name === "home");

const openGuideModal = (key) => {
  guideSelectedKey.value = key;
  isGuideModalOpen.value = true;
};

const closeGuideModal = () => {
  isGuideModalOpen.value = false;
};

const handleDepositSubmit = (depositData) => {
  // Handle deposit submission here
  console.log("Deposit submitted:", depositData);
  // You can add API call here
  closeDepositModal();
};

const handleDownloadConfirm = () => {
  closeDownloadModal();
  router.push({ name: "download" });
};

import registrationImg from "@/assets/Yuopenaccount.jpg";
import depositImg from "@/assets/Yudeposit.jpg";
import withdrawalImg from "@/assets/Yuwithdraw.jpg";
import {
  gamesOverviewContent,
  termsContent,
  privacyContent,
  faqContent,
} from "@/data/guideContent";

const guideItems = computed(() => [
  {
    key: "registration",
    title: t(
      "Registration Tutorial",
      "စာရင်းသွင်းနည်း",
      "注册教程",
      "วิธีลงทะเบียน",
    ),
    imageUrl: registrationImg,
    children: [
      {
        key: "registration-child",
        title: t(
          "How to open game account",
          "ဂိမ်းအကောင့်ဖွင့်နည်း",
          "如何开设游戏账户",
          "วิธีเปิดบัญชีเกม",
        ),
        imageUrl: registrationImg,
      },
    ],
  },
  {
    key: "deposit",
    title: t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน"),
    imageUrl: depositImg,
    children: [
      {
        key: "deposit-step-1",
        title: t(
          "Deposit Tutorial",
          "ငွေသွင်းနည်းလမ်း",
          "存款教程",
          "วิธีฝากเงิน",
        ),
        imageUrl: depositImg,
      },
    ],
  },
  {
    key: "withdrawal",
    title: t("Withdrawal", "ငွေထုတ်", "提款", "ถอนเงิน"),
    imageUrl: withdrawalImg,
    children: [
      {
        key: "withdrawal-step-1",
        title: t(
          "Withdraw Tutorial",
          "ငွေထုတ်နည်းလမ်း",
          "提款教程",
          "วิธีถอนเงิน",
        ),
        imageUrl: withdrawalImg,
      },
    ],
  },
  {
    key: "games",
    title: t("Games", "ဂိမ်း", "游戏", "เกม"),
    imageUrl:
      "https://images.9734232.com/mcs-images/announcement/rm98f4/1753248299582_photo_2025-07-23_13-01-47%20(2).jpeg",
    children: [
      {
        key: "games-step-1",
        title: t("Overview", "အခြေခံအကြမ်းဖျဉ်း", "概述", "ภาพรวม"),
        contentHtml: gamesOverviewContent,
      },
    ],
  },
  {
    key: "terms",
    title: t(
      "Terms and Conditions",
      "စည်းမျဉ်းနှင့်အခြေအနေများ",
      "条款与条件",
      "ข้อกำหนดและเงื่อนไข",
    ),
    imageUrl:
      "https://images.9734232.com/mcs-images/announcement/rm98f4/2694125_1756372380887.gif",
    children: [
      {
        key: "terms-step-1",
        title: t("Overview", "အခြေခံအကြမ်းဖျဉ်း", "概述", "ภาพรวม"),
        contentHtml: termsContent,
      },
    ],
  },
  {
    key: "privacy",
    title: t(
      "Privacy and Security",
      "ကိုယ်ရေးကိုယ်တာနှင့် လုံခြုံရေး",
      "隐私与安全",
      "ความเป็นส่วนตัวและความปลอดภัย",
    ),
    imageUrl:
      "https://images.9734232.com/mcs-images/announcement/rm98f4/1753248299582_photo_2025-07-23_13-01-47%20(2).jpeg",
    children: [
      {
        key: "privacy-step-1",
        title: t(
          "Privacy Policy",
          "ကိုယ်ရေးအချက်အလက်မူဝါဒ",
          "隐私政策",
          "นโยบายความเป็นส่วนตัว",
        ),
        contentHtml: privacyContent,
      },
    ],
  },
  {
    key: "faq",
    title: t(
      "Frequent Questions",
      "မကြာခဏ မေးလေ့ရှိသော မေးခွန်းများ",
      "常见问题",
      "คำถามที่พบบ่อย",
    ),
    imageUrl:
      "https://images.9734232.com/mcs-images/announcement/rm98f4/1753248355460_photo_2025-07-22_20-43-13.jpeg",
    children: [
      {
        key: "faq-step-1",
        title: t("All", "အားလုံး", "全部", "ทั้งหมด"),
        contentHtml: faqContent,
      },
    ],
  },
]);



const showPopup = ref(false);
const isHideForToday = ref(false);

onMounted(async () => {
  await fetchWelcomeImages();

  if (!popupSlides.value.length) {
    showPopup.value = false;
    return;
  }

  showPopup.value = checkPopupStatus();
});

const closePopup = () => {
  showPopup.value = false;

  const today = new Date().toISOString().split("T")[0];
  if (isHideForToday.value) {
    localStorage.setItem("popupDismissedDate", today);
  }
};

const checkPopupStatus = () => {
  const today = new Date().toISOString().split("T")[0];
  const lastDismissedDate = localStorage.getItem("popupDismissedDate");

  return lastDismissedDate !== today;
};
</script>

<template>
  <div class="min-h-screen bg-[#16062b] relative">
    <SnowFall v-if="seasonalEffectKey === 'christmas'" />
    <ConfettiEffect v-else-if="
      seasonalEffectKey === 'newyear_eve' || seasonalEffectKey === 'newyear'
    " />
    <ChineseNewYearEffect v-else-if="seasonalEffectKey === 'cny'" />
    <ValentineEffect v-else-if="seasonalEffectKey === 'valentine'" />
    <HalloweenEffect v-else-if="seasonalEffectKey === 'halloween'" />
    <StPatricksEffect v-else-if="seasonalEffectKey === 'stpatricks'" />
    <CherryBlossomEffect v-else-if="seasonalEffectKey === 'cherry'" />
    <SongkranEffect v-else-if="seasonalEffectKey === 'songkran'" />
    <EasterEffect v-else-if="seasonalEffectKey === 'easter'" />
    <!-- Desktop Navbar -->
    <Navbar
      class="hidden md:flex"
      @toggle-floating-menu="toggleFloatingMenu"
    />
    <!-- Mobile Navbar -->
    <MobileNavbar
      v-if="!isCategoryPage"
      class="md:hidden"
      @toggle-sidebar="toggleMobileSidebar"
    />
    <CategoryPageHeader v-if="isCategoryPage" />

    <div class="flex">
      <!-- Desktop Sidebar (hidden on home to match IXMM full-width layout) -->
      <Sidebar
        v-if="!isHome"
        class="hidden md:block"
        @open-guide="openGuideModal"
      />

      <!-- Mobile Sidebar Overlay -->
      <transition name="fade">
        <div
          v-if="isMobileSidebarOpen"
          class="fixed inset-0 bg-black/50 z-40 md:hidden"
          @click="closeMobileSidebar"
        ></div>
      </transition>

      <!-- Mobile Sidebar -->
      <transition name="slide-left">
        <div
          v-if="isMobileSidebarOpen"
          class="fixed left-0 top-0 bottom-0 w-[72%] max-w-[300px] z-50 md:hidden overflow-y-auto bg-[#260a4a]"
        >
          <Sidebar
            @close="closeMobileSidebar"
            @open-guide="openGuideModal"
          />
        </div>
      </transition>

      <main
        class="flex-1 overflow-y-auto"
        :class="isHome
          ? 'p-0 pb-20 md:pb-8'
          : ['p-2 md:px-8 md:py-6', 'md:h-[calc(100vh-70px)]', 'pb-20 md:pb-8']"
      >
        <RouterView />
        <div class="md:mt-16" :class="{ 'hidden md:block': isCategoryPage, 'mt-6': isHome, 'mt-10': !isHome }">
          <FooterSection
            @open-privacy="openGuideModal('privacy')"
            @open-faq="openGuideModal('faq')"
            @open-guide="openGuideModal"
          />
        </div>
        <van-overlay
          v-if="popupSlides.length"
          :show="showPopup"
          :z-index="3000"
          @click="closePopup"
        >
          <div
            class="fixed inset-0 flex items-center justify-center p-4"
            @click.stop
          >
            <div class="w-full max-w-[460px] rounded-lg bg-[#172240] p-4">
              <van-swipe
                :autoplay="3000"
                indicator-color="white"
                class="overflow-hidden rounded-md"
              >
                <van-swipe-item
                  v-for="(item, index) in popupSlides"
                  :key="`${item.imageUrl}-${index}`"
                >
                  <img
                    :src="item.imageUrl"
                    :alt="item.title"
                    class="h-auto w-full object-cover"
                  />
                </van-swipe-item>
              </van-swipe>

              <div class="mt-4 flex items-center justify-between gap-3">
                <label
                  class="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-white/90"
                >
                  <input
                    type="checkbox"
                    v-model="isHideForToday"
                    class="h-4 w-4 rounded border border-white/30 bg-transparent accent-[#1986E1]"
                  />
                  <span>
                    {{ t("Hide for today", "ယနေ့အတွက် ပိတ်ထားရန်", "今日不再显示", "ไม่ต้องแสดงวันนี้") }}
                  </span>
                </label>
                <button
                  class="inline-flex min-w-[120px] items-center justify-center rounded-md bg-[#1986E1] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition"
                  @click="closePopup()"
                >
                  {{ t("Close", "ပိတ်ရန်", "关闭", "ปิด") }}
                </button>
              </div>
            </div>
          </div>
        </van-overlay>
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />

    <!-- Welcome Modal -->
    <!-- <WelcomeModal
      :is-open="isWelcomeModalOpen"
      :announcements="announcements"
      :initial-index="0"
      @close="closeWelcomeModal"
    /> -->

    <!-- Floating contact menu -->
    <FloatingContactMenu
      :visible="isFloatingMenuOpen"
    />

    <!-- Guide Modal -->
    <GuideModal
      :is-open="isGuideModalOpen"
      :items="guideItems"
      :selected-key="guideSelectedKey"
      @close="closeGuideModal"
      @select="(key) => (guideSelectedKey.value = key)"
    />

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
      @openRegister="() => { closeLoginModal(); openRegisterModal(); }"
    />

    <RegisterModal
      :isOpen="isRegisterModalOpen"
      @close="closeRegisterModal"
      @openLogin="() => { closeRegisterModal(); openLoginModal(); }"
    />

    <!-- Fixed contact button bottom left -->
    <!-- <div class="contact-bubble-fixed fixed left-5 bottom-[100px] z-[60]">
      <button
        type="button"
        class="relative overflow-visible w-18 h-18 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-[#1986E1] text-white shadow-[0_10px_26px_rgba(25, 134, 225,0.45)] ring-2 ring-white/15 transition-transform duration-200 active:scale-95"
        aria-label="Contact"
        @click="toggleFloatingMenu"
      >
        <div class="contact-bubble-dot-pulse"></div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="45"
          height="45"
          viewBox="0 0 24 24"
        >
          <g fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M17 11.805c0-.346 0-.519.052-.673c.151-.448.55-.621.95-.803c.448-.205.672-.307.895-.325c.252-.02.505.034.721.155c.286.16.486.466.69.714c.943 1.146 1.415 1.719 1.587 2.35c.14.51.14 1.044 0 1.553c-.251.922-1.046 1.694-1.635 2.41c-.301.365-.452.548-.642.655a1.27 1.27 0 0 1-.721.155c-.223-.018-.447-.12-.896-.325c-.4-.182-.798-.355-.949-.803c-.052-.154-.052-.327-.052-.672zm-10 0c0-.436-.012-.827-.364-1.133c-.128-.111-.298-.188-.637-.343c-.449-.204-.673-.307-.896-.325c-.667-.054-1.026.402-1.41.87c-.944 1.145-1.416 1.718-1.589 2.35a2.94 2.94 0 0 0 0 1.553c.252.921 1.048 1.694 1.636 2.409c.371.45.726.861 1.363.81c.223-.018.447-.12.896-.325c.34-.154.509-.232.637-.343c.352-.306.364-.697.364-1.132z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20 10.5V9c0-3.866-3.582-7-8-7S4 5.134 4 9v1.5m16 7c0 4.5-4 4.5-8 4.5"
            />
          </g>
        </svg>
      </button>
    </div> -->

    <!-- Withdraw Modal -->
    <WithdrawModal
      :isOpen="isWithdrawModalOpen"
      @close="closeWithdrawModal"
    />

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

    <LuckySpinModal
      :is-open="isLuckySpinModalOpen"
      @close="closeLuckySpinModal"
    />

    <!-- Lucky Wheel quick entry (logged-in only; mobile: above bottom nav) -->
    <button
      v-if="isUserLoggedIn"
      type="button"
      class="fixed right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/60 bg-gradient-to-b from-amber-400 to-amber-600 text-lg shadow-lg shadow-amber-900/40 transition active:scale-95 md:bottom-8 md:right-6 bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))]"
      :aria-label="t('Lucky Wheel', 'ကံစမ်းလည်ပတ်', '幸运转盘', 'วงล้อนำโชค')"
      @click="openLuckySpinModal"
    >
      <span aria-hidden="true">🎡</span>
    </button>
  </div>
</template>

<style scoped>
/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.contact-bubble-dot,
.contact-bubble-dot-pulse {
  position: absolute;
  right: 1px;
  top: 63%;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: #ff2d2d;
  z-index: 20;
}

.contact-bubble-dot {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.12);
}

.contact-bubble-dot-pulse {
  animation: contactPulse 1.4s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes contactPulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.8);
    opacity: 0;
  }

  100% {
    transform: scale(0.9);
    opacity: 0;
  }
}

/* Slide left transition for sidebar */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(-100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}
</style>
