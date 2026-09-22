<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useModal } from "../composables/useModal";
import { useTranslation } from "../composables/useTranslation";
import { useFormatAmount } from "../composables/useFormatAmount";
import { getProfileImageUrl } from "../composables/useProfileImage";
import RegisterModal from "./RegisterModal.vue";
import { showConfirmDialog, showSuccessToast } from "vant";

const props = defineProps({
  onClose: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(["close", "open-guide"]);

const route = useRoute();
const router = useRouter();
const store = useStore();
const {
  openBettingHistoryModal,
  openDepositModal,
  openWithdrawModal,
  openLoginModal,
  openDownloadModal,
} = useModal();
const { t } = useTranslation();

const isLoggedIn = computed(() => {
  const authUser = store.state.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const authUserAvatar = computed(() => {
  return getProfileImageUrl(store.state.authUser);
});

const { formatAmount } = useFormatAmount();
const formattedBalance = computed(() =>
  formatAmount(Number(store.state.amount) || 0, 2)
);

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

const language = computed(() => store.state.language || "mm");

const isRegisterModalOpen = ref(false);

const openRegisterModal = () => {
  isRegisterModalOpen.value = true;
};

const closeRegisterModal = () => {
  isRegisterModalOpen.value = false;
};

// Check if mobile device
const isMobile = ref(
  typeof window !== "undefined" ? window.innerWidth < 768 : false
);

const checkMobile = () => {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 768; // md breakpoint
  }
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
  document.removeEventListener("click", handleClickOutside);
});

const handleClose = () => {
  if (props.onClose) {
    props.onClose();
  }
  emit("close");
};

const handleNavigation = (routeName) => {
  if (routeName) {
    router.push({ name: routeName });
    handleClose();
  }
};

const handleBettingHistoryClick = () => {
  openBettingHistoryModal();
  handleClose();
};

const handleDownloadClick = () => {
  openDownloadModal();
  handleClose();
};

const handleGuideClick = () => {
  emit("open-guide", "registration");
  handleClose();
};

const topMenuItems = computed(() => [
  {
    name: t("Favorites", "အကြိုက်ဆုံး", "收藏", "รายการโปรด"),
    icon: "heart",
    route: "favorites",
  },
  {
    name: t("Last Game", "နောက်ဆုံးဂိမ်း", "最近游戏", "เกมล่าสุด"),
    icon: "clock",
    route: "last-game",
  },
  {
    name: t("Betting History", "လောင်းကစားမှတ်တမ်း", "投注记录", "ประวัติการเดิมพัน"),
    icon: "file-text",
    route: "betting-history",
  },
]);

const gamesMenuItems = computed(() => [
  {
    name: t("Slots", "စလော့", "老虎机", "สล็อต"),
    image: "/7.png",
    route: "slots",
  },
  {
    name: t("Buffalo", "ကျွဲ", "野牛", "ควาย"),
    image: "https://storage.googleapis.com/spacetech2/yu95/kYAWEL-Green.png",
    route: "buffalo",
  },
  {
    name: t("Fish Shooting", "ငါးပစ်", "捕鱼", "ยิงปลา"),
    image: "/fish.png",
    route: "fish-shooting",
  },
  {
    name: t("Card Games", "ဖဲဂိမ်း", "棋牌游戏", "เกมไพ่"),
    image: "https://storage.googleapis.com/spacetech2/yu95/card.png",
    route: "card-games",
  },
  {
    name: t("Live Casino", "ကာစီနို", "真人娱乐场", "คาสิโนสด"),
    image: "https://storage.googleapis.com/spacetech2/yu95/livecasino.png",
    route: "live",
  },
  {
    name: t("Lottery", "ထီ", "彩票游戏", "ลอตเตอรี่"),
    image: "/lottery.png",
    route: "lottery",
  },
  // {
  //    name: t("Cock Fighting", "ကြက်တိုက်", "斗鸡", "ไก่ชน"),
  //   image: "https://storage.googleapis.com/spacetech2/yu95/cockfighting.png",
  //   route: "cockfighting",
  // },
  {
    name: t("Sports", "အားကစား", "体育游戏", "กีฬา"),
    image: "/sport.png",
    route: "sports",
  },
]);

const isActive = (routeName) => {
  return route.name === routeName;
};

const actionMenuItems = computed(() => [
  {
    name: t("Download App", "အက်ပ်ကို ဒေါင်းလုဒ်", "下载APP", "ดาวน์โหลดแอป"),
    icon: "download",
    route: "download",
  },
  {
    name: t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น"),
    icon: "promotion",
    route: "promotion",
  },
  {
    name: t("Guide", "လမ်းညွှန်ချက်", "指南", "คู่มือ"),
    icon: "guide",
  },
  { name: t("Support", "ဝန်ဆောင်မှု", "客服", "บริการช่วยเหลือ"), icon: "service" },
  // { name: t("Invite", "ဖိတ်ခေါ်ခြင်း", "邀请", "เชิญชวน"), icon: "invitation" },
]);

const socialMenuItems = [
  {
    name: "facebook",
    icon: "facebook",
    href: "https://www.facebook.com/profile.php?id=61593202325346",
  },
  {
    name: "TELEGRAM",
    icon: "telegram",
    href: "https://t.me/Eazywin8",
  },
  {
    name: "VIBER",
    icon: "viber",
    href: "https://viber.me/959663263464",
  },
];

const supportUrl =
  "https://j5wxcf.7mmon3ss.com/49eb439defbd4e02226jkfle-keli9defbf47052a694d65191bae44c1ab40a969d3ff0da6e420b241156cad034064";

const mobileGridItems = computed(() => [
  { key: "hot", name: t("Hot Games", "ဟော့ဂိမ်းများ", "热门游戏", "เกมยอดนิยม"), image: "/hot.png", route: "home" },
  { key: "invite", name: t("Invite Friends", "မိတ်ဆွေ သူငယ်ချင်း ဖိတ်ခေါ်ပါ", "邀请好友", "ชวนเพื่อน"), icon: "invite", route: "invite" },
  { key: "favorites", name: t("Favorites", "အကြိုက်ဆုံး", "收藏", "รายการโปรด"), icon: "heart", route: "favorites" },
  { key: "promotion", name: t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น"), icon: "gift", route: "promotion" },
  { key: "slots", name: t("Slots", "စလော့ဂိမ်း", "老虎机", "สล็อต"), image: "/7.png", route: "slots" },
  { key: "rewards", name: t("Rewards", "ဆုလာဘ်စတော", "奖励", "รางวัล"), icon: "medal", route: "rewards" },
  { key: "fish", name: t("Fish Shooting", "ငါးပစ်", "捕鱼", "ยิงปลา"), image: "/fish.png", route: "fish-shooting" },
  { key: "vip", name: "VIP", icon: "diamond", route: "rewards" },
  { key: "live", name: t("Live Casino", "ကာစီနို", "真人娱乐场", "คาสิโนสด"), image: "https://storage.googleapis.com/spacetech2/yu95/livecasino.png", route: "live" },
  { key: "language", name: t("Languages", "ဘာသာစကား", "语言", "ภาษา"), icon: "language", action: "language" },
  { key: "last", name: t("Last Game", "နောက်ဆုံးဂိမ်း", "最近游戏", "เกมล่าสุด"), icon: "dice", route: "last-game" },
  { key: "download", name: t("Download App", "APP ကိုဒေါင်းလုဒ်လုပ်ပါ", "下载APP", "ดาวน์โหลดแอป"), icon: "download", action: "download" },
  { key: "sports", name: t("Sports", "အားကစား", "体育游戏", "กีฬา"), image: "/sport.png", route: "sports" },
  { key: "support", name: t("Support", "ဆက်သွယ်ရန်", "客服", "ติดต่อ"), icon: "headset", action: "support" },
  { key: "lottery", name: t("Lottery", "ထီဂိမ်း", "彩票", "ลอตเตอรี่"), image: "/lottery.png", route: "lottery" },
]);

const handleGridClick = (item) => {
  if (item.action === "language") {
    showLanguageDropdown.value = !showLanguageDropdown.value;
    return;
  }
  if (item.action === "download") {
    handleDownloadClick();
    return;
  }
  if (item.action === "support") {
    window.open(supportUrl, "_blank");
    handleClose();
    return;
  }
  if (item.route) {
    handleNavigation(item.route);
  }
};

// Language options with flags (Myanmar, English, Chinese, Thai)
const languageOptions = [
  {
    text: "မြန်မာ",
    value: "mm",
    flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/myanmar.png",
  },
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
];

const currentLanguageOption = computed(() =>
  languageOptions.find((opt) => opt.value === language.value) || languageOptions[0]
);

const showLanguageDropdown = ref(false);

const setLanguage = (lang) => {
  store.commit("setLanguage", lang);
  showLanguageDropdown.value = false;
};

const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value;
};

// Close language dropdown when clicking outside
const languageDropdownRef = ref(null);
const handleClickOutside = (e) => {
  if (languageDropdownRef.value && !languageDropdownRef.value.contains(e.target)) {
    showLanguageDropdown.value = false;
  }
};

// Logout
const logout = () => {
  const isEn = language.value === "en";
  const isCn = language.value === "cn";
  const isTh = language.value === "th";
  showConfirmDialog({
    title: isEn
      ? "Are you sure to log out?"
      : isCn
      ? "确定要退出登录吗？"
      : isTh
        ? "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
        : "ထွက်မှာ သေချာပါသလား?",
    cancelButtonText: isEn
      ? "Cancel"
      : isCn
        ? "取消"
        : isTh
          ? "ยกเลิก"
          : "မထွက်တော့ပါ",
    confirmButtonText: isEn
      ? "Sure"
      : isCn
        ? "确定"
        : isTh
          ? "ยืนยัน"
          : "သေချာပြီ",
    theme: "round-button",
    className: "logout-dialog-dark",
    confirmButtonColor: "#1986E1",
    cancelButtonColor: "#94a3b8",
  })
    .then(async () => {
      await store.dispatch("logoutUser");
      handleClose();
      if (route.path !== "/") {
        router.push("/");
      }
      showSuccessToast({
        message: isEn
          ? "Logged out!"
          : isCn
            ? "已退出登录"
            : isTh
              ? "ออกจากระบบแล้ว!"
              : "ထွက်ပြီးပြီ",
        position: "top",
      });
    })
    .catch(() => {});
};
</script>

<template>
  <aside
    class="w-full md:w-[280px] text-white h-full md:h-[calc(100vh-70px)] overflow-y-auto flex-shrink-0 transition-[padding] duration-200"
    :class="isMobile ? 'bg-transparent border-0' : 'bg-[#080E1E] border-r border-white/5'"
  >
    <!-- Mobile Q79-style grid menu -->
    <div v-if="isMobile" class="p-2.5 pb-6">
      <div class="grid grid-cols-2 gap-2.5">
        <button
          v-for="item in mobileGridItems"
          :key="item.key"
          type="button"
          class="sidebar-grid-box flex flex-col items-center justify-center gap-1.5 min-h-[76px] rounded-[12px] bg-[#172240] text-white px-2 py-2.5 active:scale-[0.98] transition"
          @click="handleGridClick(item)"
        >
          <span class="w-8 h-8 flex items-center justify-center text-white">
            <img v-if="item.image" :src="item.image" alt="" class="w-8 h-8 object-contain" />
            <svg v-else-if="item.icon === 'invite'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M8 21v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/><path d="M15 5a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M17 10h2a2 2 0 0 1 2 2v1"/><path d="M5 5a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M3 13v-1a2 2 0 0 1 2-2h2"/></svg>
            <svg v-else-if="item.icon === 'heart'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12a2 2 0 0 1 2 2v11l-8-3-8 3V8a2 2 0 0 1 2-2z"/><path d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/><path d="M12.2 11.1a1.5 1.5 0 0 0-2.1 0 1.45 1.45 0 0 0 0 2.1L12 15l1.9-1.8a1.45 1.45 0 0 0 0-2.1 1.5 1.5 0 0 0-1.7 0z"/></svg>
            <svg v-else-if="item.icon === 'gift'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M12 8c-1.8-3.2-5.5-3.2-6.2-1.2C5 8.8 7.2 9.5 12 8z"/><path d="M12 8c1.8-3.2 5.5-3.2 6.2-1.2C19 8.8 16.8 9.5 12 8z"/></svg>
            <svg v-else-if="item.icon === 'medal'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5"/><path d="m9 13.5-1.8 7 4.8-2.4 4.8 2.4L15 13.5"/><path d="m10.2 8.2 1.8 1.2 1.8-1.2-.5 2.1 1.6 1.3-2.2.1L12 13l-.7-1.9-2.2-.1 1.6-1.3z"/></svg>
            <svg v-else-if="item.icon === 'diamond'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 7.5 3h9L21 9 12 21z"/><path d="M3 9h18"/><path d="m7.5 3 4.5 6 4.5-6"/></svg>
            <img v-else-if="item.icon === 'language'" :src="currentLanguageOption.flag" alt="" class="w-8 h-8 rounded-full object-cover" />
            <svg v-else-if="item.icon === 'dice'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><rect x="10.5" y="10.5" width="11" height="11" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="10" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/><circle cx="18" cy="18" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/></svg>
            <svg v-else-if="item.icon === 'download'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 17H6.2A4.2 4.2 0 0 1 4 13.3 4.1 4.1 0 0 1 7.7 9.2 6 6 0 0 1 18.8 10 3.8 3.8 0 0 1 20 16.8H16"/><path d="M12 11v8"/><path d="m9 16 3 3 3-3"/></svg>
            <svg v-else-if="item.icon === 'headset'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z"/><path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z"/><path d="M12 18v2a2 2 0 0 0 2 2h2"/></svg>
          </span>
          <span class="text-[11px] leading-tight text-center font-semibold font-['Pyidaungsu','Padauk',sans-serif]">
            {{ item.name }}
          </span>
        </button>
      </div>
      <div
        v-if="showLanguageDropdown"
        class="mt-3 rounded-2xl bg-[#172240] overflow-hidden"
      >
        <button
          v-for="opt in languageOptions"
          :key="opt.value"
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 text-left text-white"
          :class="language === opt.value ? 'bg-[#1986E1]/25' : ''"
          @click="setLanguage(opt.value)"
        >
          <img :src="opt.flag" :alt="opt.text" class="w-7 h-7 rounded-full object-cover" />
          <span class="font-['Pyidaungsu','Padauk',sans-serif]">{{ opt.text }}</span>
        </button>
      </div>
    </div>

    <div
      v-else
      class="desktop-sidebar p-3 flex flex-col gap-3"
      :class="showLanguageDropdown ? 'pb-72' : 'pb-16'"
    >
      <!-- Logged-in section: avatar, Deposit, Withdraw, balance -->
      <div v-if="isLoggedIn" class="side-card space-y-3">
        <div class="flex items-center gap-3">
          <img
            :src="authUserAvatar"
            alt=""
            class="shrink-0 w-11 h-11 rounded-full object-cover ring-2 ring-[#1986E1]/40"
          />
          <div class="min-w-0 flex-1">
            <p class="text-[11px] uppercase tracking-wide text-white/40 font-semibold">
              {{ t("Balance", "လက်ကျန်ငွေ", "余额", "ยอดเงิน") }}
            </p>
            <div class="flex items-center gap-1 min-w-0">
              <template v-if="isBalanceLoading">
                <span class="font-bold font-['Pyidaungsu','Padauk',sans-serif] text-white text-lg">*****</span>
              </template>
              <template v-else>
                <span class="font-bold font-['Pyidaungsu','Padauk',sans-serif] text-white text-lg whitespace-nowrap truncate">{{ formattedBalance }}</span>
              </template>
              <span class="text-[#22c55e] text-lg font-bold shrink-0">K</span>
              <button
                type="button"
                :disabled="isBalanceLoading"
                class="shrink-0 p-1 text-white/50 hover:text-white transition-colors disabled:opacity-70 disabled:pointer-events-none"
                aria-label="Refresh balance"
                @click="refreshBalance"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  class="transition-transform duration-300"
                  :class="{ 'animate-spin': isBalanceLoading }"
                >
                  <path
                    fill="currentColor"
                    d="M12 20.75a7.25 7.25 0 0 1 0-14.5h2.5a.75.75 0 0 1 0 1.5H12a5.75 5.75 0 1 0 5.75 5.75a.75.75 0 0 1 1.5 0A7.26 7.26 0 0 1 12 20.75"
                  />
                  <path
                    fill="currentColor"
                    d="M12 10.75a.74.74 0 0 1-.53-.22a.75.75 0 0 1 0-1.06L13.94 7l-2.47-2.47a.75.75 0 1 1 1.06-1.06l3 3a.75.75 0 0 1 0 1.06l-3 3a.74.74 0 0 1-.53.22"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn-app btn-app-blue py-1.5 text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openDepositModal"
          >
            {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
          </button>
          <button
            type="button"
            class="btn-app btn-app-navy py-1.5 text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openWithdrawModal"
          >
            {{ t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน") }}
          </button>
        </div>
      </div>
      <div v-else class="side-card flex items-center gap-2">
        <div class="shrink-0 w-10 h-10 rounded-full bg-[#080E1E] flex items-center justify-center text-white/45">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 11.385q-1.237 0-2.119-.882T9 8.385t.881-2.12T12 5.386t2.119.88t.881 2.12t-.881 2.118t-2.119.882m-7 6.192v-.608q0-.619.36-1.158q.361-.54.97-.838q1.416-.679 2.834-1.018q1.417-.34 2.836-.34t2.837.34t2.832 1.018q.61.298.97.838q.361.539.361 1.158v.608q0 .44-.299.74q-.299.298-.74.298H6.04q-.441 0-.74-.299t-.3-.74m1 .039h12v-.647q0-.332-.215-.625q-.214-.292-.593-.494q-1.234-.598-2.546-.916T12 14.616t-2.646.318t-2.546.916q-.38.202-.593.494Q6 16.637 6 16.97zm6-7.231q.825 0 1.413-.588T14 8.384t-.587-1.412T12 6.384t-1.412.588T10 8.384t.588 1.413t1.412.587m0 7.232"/>
          </svg>
        </div>
        <button
          type="button"
          @click="openLoginModal"
          class="btn-app btn-app-blue flex-1 py-1.5 text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Login", "လော့ဂ်အင်", "登录", "เข้าสู่ระบบ") }}
        </button>
        <button
          type="button"
          @click="openRegisterModal"
          class="btn-app btn-app-green flex-1 py-1.5 text-sm font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Register", "မှတ်ပုံတင်ပါ", "注册", "ลงทะเบียน") }}
        </button>
      </div>

      <div class="side-card flex items-center gap-2 px-3 py-2">
        <svg class="text-white/40 shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" fill-rule="evenodd" d="m16.31 15.561l4.114 4.115l-.848.848l-4.123-4.123a7 7 0 1 1 .857-.84M16.8 11a5.8 5.8 0 1 0-11.6 0a5.8 5.8 0 0 0 11.6 0"/>
        </svg>
        <input
          type="text"
          :placeholder="t('Search games', 'ဂိမ်းရှာရန်', '搜索游戏', 'ค้นหาเกม')"
          class="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/35 font-['Pyidaungsu','Padauk',sans-serif]"
        />
      </div>

      <!-- Top Section -->
      <ul
        v-if="isLoggedIn"
        class="side-card space-y-0.5 py-2 px-2"
      >
        <li v-for="(item, index) in topMenuItems" :key="index">
          <button
            v-if="item.route === 'betting-history'"
            type="button"
            @click="handleBettingHistoryClick()"
            :class="[
              'side-nav-item group cursor-pointer w-full text-left bg-transparent border-none',
              isActive(item.route) ? 'side-nav-item-active' : '',
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center">
                <svg
                  v-if="item.icon === 'heart'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item.icon === 'clock'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <svg
                v-else-if="item.icon === 'file-text'"
                class="w-6 h-6 text-gray-500"
                xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19.898 16h-12c-.93 0-1.395 0-1.777.102A3 3 0 0 0 4 18.224"/><path stroke-linecap="round" d="M8 7h8m-8 3.5h5m6.5 8.5H8m2 3c-2.828 0-4.243 0-5.121-.879C4 20.243 4 18.828 4 16V8c0-2.828 0-4.243.879-5.121C5.757 2 7.172 2 10 2h4c2.828 0 4.243 0 5.121.879C20 3.757 20 5.172 20 8m-6 14c2.828 0 4.243 0 5.121-.879C20 20.243 20 18.828 20 16v-4"/></g></svg>
                
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
            <svg
              v-if="item.hasSnowflake"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="animate-[spin_10s_linear_infinite]"
            >
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
            </svg>
          </button>
          <router-link
            v-else
            :to="{ name: item.route }"
            @click="handleClose()"
            :class="[
              'side-nav-item group',
              isActive(item.route) ? 'side-nav-item-active' : '',
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center">
                <svg
                  v-if="item.icon === 'heart'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  class="text-white/60"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item.icon === 'clock'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  class="text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <svg
                  v-else-if="item.icon === 'file-text'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  class="text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  ></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
            <svg
              v-if="item.hasSnowflake"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="animate-[spin_10s_linear_infinite]"
            >
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line>
            </svg>
          </router-link>
        </li>
      </ul>

      <!-- Games Section Header -->

      <!-- Games Section -->
      <ul class="side-card space-y-0.5 py-2 px-2">
        <li class="px-2.5 pt-1.5 pb-1">
          <h3
            class="font-['Pyidaungsu','Padauk',sans-serif] text-[11px] uppercase tracking-wider text-white/40 font-semibold"
          >
            {{ t("Games", "ဂိမ်း", "游戏", "เกม") }}
          </h3>
        </li>
        <li v-for="(item, index) in gamesMenuItems" :key="index">
          <router-link
            :to="{ name: item.route }"
            @click="handleClose()"
            :class="[
              'side-nav-item group',
              isActive(item.route) ? 'side-nav-item-active' : '',
            ]"
          >
            <div class="flex items-center gap-3">
              <img :src="item.image" alt="" class="w-8 h-8" />
              
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
          </router-link>
        </li>
      </ul>

      <!-- Actions Section -->
      <ul class="side-card space-y-0.5 py-2 px-2">
        <li v-for="(item, index) in actionMenuItems" :key="index">
          <!-- Download: mobile = modal, desktop = navigate -->
          <router-link
            v-if="item.route && !(item.icon === 'download' && isMobile)"
            :to="{ name: item.route }"
            @click="handleClose()"
            :class="[
              'side-nav-item group',
              isActive(item.route) ? 'side-nav-item-active' : '',
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center relative">
               
                <svg
                v-if="item.icon === 'download'"
                class="text-gray-500"
                xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m8 12l4 4m0 0l4-4m-4 4V4m7 13v.6c0 1.33-1.07 2.4-2.4 2.4H7.4C6.07 20 5 18.93 5 17.6V17"/>
              </svg>
                
                <svg
                v-else-if="item.icon === 'promotion'"
                class="text-gray-500"
                xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><!-- Icon from OpenSearch UI by OpenSearch Contributors - https://github.com/opensearch-project/oui/blob/main/LICENSE.txt --><path fill="currentColor" d="m14.447 3.724l-6-3a1 1 0 0 0-.894 0l-6 3A1 1 0 0 0 1 4.618v6.764a1 1 0 0 0 .553.894l6 3a1 1 0 0 0 .894 0l6-3a1 1 0 0 0 .553-.894V4.618a1 1 0 0 0-.553-.894M5.871 5.897l5.343-2.672l2.158 1.079L8 6.943ZM8 1.618l2.096 1.048l-5.353 2.677l-2.115-1.039ZM2 5.11l2.25 1.105V9a.5.5 0 0 0 1 0V6.706L7.5 7.811v6.321L2 11.382Zm6.5 9.022v-6.32L14 5.11v6.272Z"/></svg>
                <svg
                  v-else-if="item.icon === 'service'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  class="text-gray-500"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path
                    d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item.icon === 'invitation'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  class="text-gray-500"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <svg
                  v-else-if="item.icon === 'guide'"
                  class="text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <path d="M8 7h8"></path>
                  <path d="M8 11h8"></path>
                </svg>
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
          </router-link>
          <button
            v-else-if="item.icon === 'guide'"
            type="button"
            class="side-nav-item group w-full text-left"
            @click="handleGuideClick"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center relative">
                <svg
                  class="text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <path d="M8 7h8"></path>
                  <path d="M8 11h8"></path>
                </svg>
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
          </button>
          <p
            v-else-if="item.icon === 'download' && isMobile"
            class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[#1986E1] transition-colors group"
            @click.prevent="handleDownloadClick($event)"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center relative">
                <svg
                class="text-gray-500"
                xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="m8 12l4 4m0 0l4-4m-4 4V4m7 13v.6c0 1.33-1.07 2.4-2.4 2.4H7.4C6.07 20 5 18.93 5 17.6V17"/>
              </svg>
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
          </p>
          <button
            v-else
            type="button"
            class="side-nav-item group w-full text-left bg-transparent border-none text-inherit cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center relative">
                <svg
                  v-if="item.icon === 'download'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  ></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <svg
                  v-else-if="item.icon === 'promotion'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                <svg
                  v-else-if="item.icon === 'service'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  class="text-gray-500"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path
                    d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
                  ></path>
                </svg>
                <svg
                  v-else-if="item.icon === 'invitation'"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  class="text-gray-500"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                <svg
                  v-else-if="item.icon === 'guide'"
                  class="text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <path d="M8 7h8"></path>
                  <path d="M8 11h8"></path>
                </svg>
              </span>
              <span class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold">{{
                item.name
              }}</span>
            </div>
          </button>
        </li>
      </ul>

      <!-- Social Media Section -->
      <div class="side-card p-2.5">
        <p class="px-1.5 pb-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold">
          {{ t("Contact", "ဆက်သွယ်ရန်", "联系", "ติดต่อ") }}
        </p>
        <div class="grid grid-cols-3 gap-1.5">
          <a
            v-for="(item, index) in socialMenuItems"
            :key="index"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center gap-1.5 py-2.5 rounded-lg hover:bg-white/8 transition-colors"
          >
            <span class="w-7 h-7 flex items-center justify-center">
              <svg
              v-if="item.icon === 'facebook'"
              xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><!-- Icon from SVG Logos by Gil Barbara - https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt --><path fill="#1877F2" d="M256 128C256 57.308 198.692 0 128 0S0 57.308 0 128c0 63.888 46.808 116.843 108 126.445V165H75.5v-37H108V99.8c0-32.08 19.11-49.8 48.348-49.8C170.352 50 185 52.5 185 52.5V84h-16.14C152.959 84 148 93.867 148 103.99V128h35.5l-5.675 37H148v89.445c61.192-9.602 108-62.556 108-126.445"/><path fill="#FFF" d="m177.825 165l5.675-37H148v-24.01C148 93.866 152.959 84 168.86 84H185V52.5S170.352 50 156.347 50C127.11 50 108 67.72 108 99.8V128H75.5v37H108v89.445A129 129 0 0 0 128 256a129 129 0 0 0 20-1.555V165z"/></svg>
              <!-- Telegram Logo -->
              <svg
              v-else-if="item.icon === 'telegram'"
              xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><!-- Icon from SVG Logos by Gil Barbara - https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt --><defs><linearGradient id="SVGuySfwdaH" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#2AABEE"/><stop offset="100%" stop-color="#229ED9"/></linearGradient></defs><path fill="url(#SVGuySfwdaH)" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0"/><path fill="#FFF" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072"/></svg>
              <!-- Viber Logo -->
              <svg
              v-else-if="item.icon === 'viber'"
              
              xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Basil by Craftwork - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" fill-rule="evenodd" d="M16.676 2.628a21.9 21.9 0 0 0-9.555 0l-.339.075a4.9 4.9 0 0 0-3.684 3.58a19.5 19.5 0 0 0 0 9.577a4.9 4.9 0 0 0 3.444 3.52l.465 2.776a.5.5 0 0 0 .826.29l2.731-2.443a22 22 0 0 0 6.112-.487l.34-.075a4.9 4.9 0 0 0 3.684-3.58a19.5 19.5 0 0 0 0-9.577a4.9 4.9 0 0 0-3.685-3.58zM7.965 6.202a.82.82 0 0 0-.537.106h-.014c-.375.22-.713.497-1.001.823c-.24.277-.37.557-.404.827c-.02.16-.006.322.041.475l.018.01c.27.793.622 1.556 1.052 2.274a13.4 13.4 0 0 0 2.03 2.775l.024.034l.038.028l.023.027l.028.024a13.6 13.6 0 0 0 2.782 2.04c1.155.629 1.856.926 2.277 1.05v.006c.123.038.235.055.348.055a1.6 1.6 0 0 0 .964-.414c.325-.288.6-.627.814-1.004v-.007c.201-.38.133-.738-.157-.981A12 12 0 0 0 14.41 13c-.448-.243-.903-.096-1.087.15l-.393.496c-.202.246-.568.212-.568.212l-.01.006c-2.731-.697-3.46-3.462-3.46-3.462s-.034-.376.219-.568l.492-.396c.236-.192.4-.646.147-1.094a12 12 0 0 0-1.347-1.88a.75.75 0 0 0-.44-.263M12.579 5a.5.5 0 0 0 0 1c1.265 0 2.315.413 3.146 1.205c.427.433.76.946.978 1.508c.219.563.319 1.164.293 1.766a.5.5 0 0 0 1 .042a5.4 5.4 0 0 0-.361-2.17a5.4 5.4 0 0 0-1.204-1.854l-.01-.01C15.39 5.502 14.085 5 12.579 5m-.034 1.644a.5.5 0 0 0 0 1h.017c.912.065 1.576.369 2.041.868c.477.514.724 1.153.705 1.943a.5.5 0 0 0 1 .023c.024-1.037-.31-1.932-.972-2.646V7.83c-.677-.726-1.606-1.11-2.724-1.185l-.017-.002zm-.019 1.675a.5.5 0 1 0-.052.998c.418.022.685.148.853.317c.169.17.295.443.318.87a.5.5 0 1 0 .998-.053c-.032-.6-.22-1.13-.605-1.52c-.387-.39-.914-.58-1.512-.612" clip-rule="evenodd"/></svg>
            </span>
            <span
              class="font-['Pyidaungsu','Padauk',sans-serif] text-[10px] uppercase tracking-wide text-white/70"
              >{{ item.name }}</span
            >
          </a>
        </div>
      </div>

      <!-- Language Selector Section (custom dropdown) -->
      <div
        ref="languageDropdownRef"
        class="side-card language-dropdown-wrap relative p-1"
      >
        <!-- Trigger: flag + current language + chevron -->
        <button
          type="button"
          class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white/8 transition-colors text-left"
          @click.stop="toggleLanguageDropdown"
        >
          <div class="flex items-center gap-3">
            <img
              :src="currentLanguageOption.flag"
              :alt="currentLanguageOption.text"
              class="w-6 h-6 rounded-full object-cover shrink-0 ring-2 ring-white/10"
            />
            <span
              class="font-['Pyidaungsu','Padauk',sans-serif] text-base font-semibold text-white"
            >
              {{ currentLanguageOption.text }}
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0 text-white/80 transition-transform"
            :class="{ 'rotate-180': showLanguageDropdown }"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <!-- Options panel (no border, no shadow) -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-show="showLanguageDropdown"
            class="absolute left-1 right-1 top-full mt-1.5 z-[100] rounded-xl bg-[#172240] border border-white/8 overflow-hidden py-1"
          >
            <button
              v-for="opt in languageOptions"
              :key="opt.value"
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-left font-['Pyidaungsu','Padauk',sans-serif] text-sm text-white transition-colors"
              :class="language === opt.value ? 'bg-[#1986E1]/25' : 'hover:bg-white/10 active:bg-white/15'"
              @click.stop="setLanguage(opt.value)"
            >
              <img
                :src="opt.flag"
                :alt="opt.text"
                class="w-6 h-6 rounded-full object-cover shrink-0 ring-2 ring-white/10"
              />
              <span>{{ opt.text }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Logout button (when logged in) -->
      <button
        v-if="isLoggedIn"
        type="button"
        class="btn-app w-full mt-1 py-2.5 font-semibold font-['Pyidaungsu','Padauk',sans-serif] text-white bg-[#ef4444] hover:bg-[#dc2626]"
        @click="logout"
      >
        {{ t("Logout", "ထွက်မည်", "退出登录", "ออกจากระบบ") }}
      </button>
    </div>

    <RegisterModal
      :isOpen="isRegisterModalOpen"
      @close="closeRegisterModal"
      @openLogin="openLoginModal"
    />
  </aside>
</template>

<style scoped>
.language-dropdown-wrap {
  position: relative;
}

.sidebar-grid-box {
  border: 1px solid rgba(25, 134, 225, 0.8);
  box-shadow: 0 0 6px 1px rgba(25, 134, 225, 0.28);
}

.side-card {
  background: #172240;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.side-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.875rem;
  transition: background 0.15s ease, color 0.15s ease;
}
.side-nav-item svg {
  width: 20px;
  height: 20px;
}
.side-nav-item img {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
}
.side-nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}
.side-nav-item-active {
  background: rgba(25, 134, 225, 0.2);
  color: #fff;
  box-shadow: inset 2px 0 0 #1986e1;
}
.desktop-sidebar :deep(.text-gray-500) {
  color: rgba(255, 255, 255, 0.65);
}
</style>

<!-- Dark theme for logout confirm dialog (teleported to body) -->
<style>
.logout-dialog-dark.van-dialog {
  --van-dialog-background: #080E1E;
  --van-dialog-radius: 12px;
  --van-dialog-header-padding-top: 20px;
  --van-dialog-message-padding: 20px 20px 16px;
  --van-dialog-button-height: 48px;
  --van-dialog-round-button-height: 44px;
}
.logout-dialog-dark .van-dialog__header {
  color: #f1f5f9;
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
}
.logout-dialog-dark .van-dialog__message {
  color: #e2e8f0;
  padding: 12px 20px 20px;
}

.van-dialog__footer{
  gap:10px;
}
/* Footer: more padding and clear button separation */
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer {
  position: relative;
  height: auto;
  padding: 16px 20px 20px;
  background: transparent;
}
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer .van-action-bar {
  position: relative;
  height: auto;
  background: transparent;
  gap: 12px;
  padding: 0;
}
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer .van-action-bar-button {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  margin: 0;
}
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer .van-action-bar-button--first {
  margin-left: 0;
  background: #080E1E !important;
  color: #e2e8f0 !important;
}
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer .van-action-bar-button--last {
  margin-right: 0;
  background: #1986E1 !important;
  color: #fff !important;
}
</style>
