<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import LoginModal from "../components/LoginModal.vue";
import { useModal } from "../composables/useModal";
import { showConfirmDialog } from "vant";
import {
  showFailToast,
  showSuccessToast,
  showLoadingToast,
  closeToast,
} from "vant";
import axios from "axios";
import { useTranslation } from "../composables/useTranslation";
import { getProfileImageUrl } from "../composables/useProfileImage";

const router = useRouter();
const route = useRoute();
const store = useStore();
const { t } = useTranslation();
const isLoginModalOpen = ref(false);
const { openDepositModal, openWithdrawModal, openBettingHistoryModal, openDownloadModal, openDepositHistoryModal, openWithdrawHistoryModal } = useModal();

// Modal states
const isPasswordModalOpen = ref(false);
const isLanguageModalOpen = ref(false);
const isComingSoonModalOpen = ref(false);
const isConfirm = ref(false);

// Form data
const password = ref({
  user_id: null,
  old: "",
  new: "",
  confirm: "",
});

const errors = ref({});

// Computed properties for user data
const authUser = computed(() => store.state.authUser || {});
const userBalance = computed(() => store.state.amount || 0);
const language = computed(() => store.state.language || "mm");

// User data for display (profile image from CDN using authUser.profile_image 1–10)
const user = computed(() => ({
  username: authUser.value.user_name || authUser.value.name || "",
  nickname: authUser.value.user_name || "",
  balance: Number(userBalance.value).toLocaleString(),
  vipLevel: authUser.value.vip_level || 0,
  profileImage: getProfileImageUrl(authUser.value),
  phone: authUser.value.phone || "",
  commissioner: authUser.value.commissioner || null,
}));

const openLoginModal = () => {
  isLoginModalOpen.value = true;
};

const closeLoginModal = () => {
  isLoginModalOpen.value = false;
};

const copyUsername = () => {
  navigator.clipboard.writeText(user.value.username);
  showSuccessToast({
    message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制", "คัดลอกแล้ว!"),
    position: "top",
  });
};

const refreshBalance = async () => {
  await store.dispatch("fetchUser");
  showSuccessToast({
    message: t(
      "Balance refreshed!",
      "လက်ကျန်ငွေ ပြန်လည်ရယူပြီးပါပြီ",
      "余额已刷新",
      "รีเฟรชยอดคงเหลือแล้ว!",
    ),
    position: "top",
  });
};

const goBack = () => {
  router.back();
};

// Blur phone number
const blurLastFiveCharacters = (inputString = "0000000000") => {
  const length = inputString.length;
  if (length >= 7) {
    const firstPart = inputString.substring(length - 5, length);
    const blurredCharacters = "*".repeat(length - 5);
    return blurredCharacters + firstPart;
  }
  return inputString;
};

// Open modals
const openPasswordModal = () => {
  password.value = {
    user_id: authUser.value.id,
    old: "",
    new: "",
    confirm: "",
  };
  errors.value = {};
  isPasswordModalOpen.value = true;
};

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  password.value = {
    user_id: null,
    old: "",
    new: "",
    confirm: "",
  };
  errors.value = {};
};

// Change password
const changeNewPassword = () => {
  errors.value = {};
  if (!password.value.old) {
    errors.value.old = t(
      "Old password required",
      "လျို့ဝှက်နံပါတ်အဟောင်း ထည့်ပါ။",
      "需要旧密码",
      "ต้องใส่รหัสผ่านเดิม",
    );
    return false;
  }
  if (!password.value.new) {
    errors.value.new = t(
      "New password required",
      "လျို့ဝှက်နံပါတ်အသစ် ထည့်ပါ။",
      "需要新密码",
      "ต้องใส่รหัสผ่านใหม่",
    );
    return false;
  }
  if (!password.value.confirm) {
    errors.value.confirm = t(
      "Confirm password required",
      "အတည်ပြုလျို့ဝှက်နံပါတ် ထည့်ပါ။",
      "需要确认密码",
      "ต้องยืนยันรหัสผ่าน",
    );
    return false;
  }
  if (password.value.new !== password.value.confirm) {
    errors.value.confirmPassword = t(
      "New passwords not match",
      "လျှို့ဝှက်နံပါတ် မတူညီပါ။",
      "两次密码不一致",
      "รหัสผ่านใหม่ไม่ตรงกัน",
    );
    return false;
  }

  showConfirmDialog({
    title: t("Are you sure?", "သေချာပါသလား?", "确定吗？", "คุณแน่ใจหรือไม่?"),
    cancelButtonText: t("Cancel", "မလုပ်တော့ပါ။", "取消", "ยกเลิก"),
    confirmButtonText: t("Sure", "သေချာပြီ။", "确定", "ยืนยัน"),
    theme: "round-button",
    className: "logout-dialog-dark",
    confirmButtonColor: "#1986E1",
    cancelButtonColor: "#94a3b8",
  })
    .then(() => {
      updateUser();
    })
    .catch(() => {});
  return true;
};

const updateUser = async () => {
  try {
    isConfirm.value = true;
    showLoadingToast({
      message: t(
        "Loading...",
        "ဆောင်ရွက်နေသည်...",
        "加载中...",
        "กำลังโหลด...",
      ),
      duration: 0,
      forbidClick: true,
    });
    await axios.post("/auth/userPasswordChange", password.value, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    showSuccessToast({
      message: t("Success", "အောင်မြင်သည်။", "成功", "สำเร็จ"),
      position: "top",
    });
    closePasswordModal();
  } catch (err) {
    showFailToast({
      message: t("Fail", "ကျရှုံးသည်။", "失败", "ล้มเหลว"),
      position: "top",
    });
  } finally {
    isConfirm.value = false;
    closeToast();
  }
};

// Open language modal
const openLanguageModal = () => {
  isLanguageModalOpen.value = true;
};

// Close language modal
const closeLanguageModal = () => {
  isLanguageModalOpen.value = false;
};

const showComingSoonModal = () => {
  isComingSoonModalOpen.value = true;
};

const openSupportLink = () => {
  const url =
    "https://j5wxcf.7mmon3ss.com/49eb439defbd4e02226jkfle-keli9defbf47052a694d65191bae44c1ab40a969d3ff0da6e420b241156cad034064";
  window.open(url, "_blank");
};

const closeComingSoonModal = () => {
  isComingSoonModalOpen.value = false;
};

// Set language
const setLangLocalstorage = (lang) => {
  localStorage.setItem("language", lang);
  store.commit("setLanguage", lang);
  // If using i18n, update it here
  // this.$i18n.locale = lang;
  closeLanguageModal();
  showSuccessToast({
    message:
      lang === "en"
        ? "Language changed to English"
        : lang === "mm"
          ? "ဘာသာစကား မြန်မာသို့ ပြောင်းလဲပြီးပါပြီ"
          : lang === "cn"
            ? "语言已更改为中文"
            : "เปลี่ยนภาษาเป็นไทย",
    position: "top",
  });
};

// Logout
const logout = () => {
  showConfirmDialog({
    title: t(
      "Are you sure to log out?",
      "ထွက်မှာ သေချာပါသလား?",
      "确定退出吗？",
      "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
    ),
    cancelButtonText: t("Cancel", "မထွက်တော့ပါ", "取消", "ยกเลิก"),
    confirmButtonText: t("Sure", "သေချာပြီ", "确定", "ยืนยัน"),
    theme: "round-button",
    className: "logout-dialog-dark",
    confirmButtonColor: "#1986E1",
    cancelButtonColor: "#94a3b8",
  })
    .then(async () => {
      await store.dispatch("logoutUser");
      if (router.currentRoute.value.path === "/") {
        // Stay on home
      } else {
        router.push("/");
      }
      showSuccessToast({
        message: t(
          "Logged out!",
          "ထွက်ပြီးပြီ",
          "已退出登录",
          "ออกจากระบบแล้ว!",
        ),
        position: "top",
      });
    })
    .catch(() => {});
};

// Navigation handlers
const handleWithdraw = () => {
  openWithdrawModal();
};

const handleTransactionHistory = () => {
  router.push("/history");
};

const handleWithdrawHistory = () => {
  openWithdrawHistoryModal();
};

const handleDepositHistory = () => {
  openDepositHistoryModal();
};

const openProfileEditModal = () => {
  store.commit("setProfileModalOpen", true);
};

// Open profile modal when navigated with ?edit=profile (e.g. from deep link)
watch(
  () => route.query?.edit,
  (edit) => {
    if (edit === "profile") {
      store.commit("setProfileModalOpen", true);
      router.replace({ name: "account" });
    }
  },
  { immediate: true }
);

// Initialize on mount
onMounted(async () => {
  const authUserData = await store.dispatch("fetchUser");
  if (!authUserData) {
    openLoginModal();
  }
});
</script>

<template>
  <div class="min-h-screen relative bg-white pb-20 overflow-x-hidden">
    <!-- Top Header Bar - full width with background for tablet/desktop -->
    <div
      class="bg-[#080E1E] md:bg-[#172240] px-4 md:px-6 pt-5 pb-4 flex items-center justify-center sticky top-0 z-40"
    >
      <div class="w-full max-w-4xl mx-auto relative flex items-center justify-center">
        <!-- Back Button -->
        <button
          @click="goBack"
          class="text-white absolute left-0 md:left-2 p-1 hover:opacity-80 transition-opacity"
        >
          <svg
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- Centered Title -->
        <h1
          class="text-white text-[20px] md:text-2xl lg:text-3xl text-center font-['Pyidaungsu','Padauk',sans-serif] font-bold tracking-tight"
        >
          {{ t("My Account", "မိမိ အကောင့်", "我的账户", "บัญชีของฉัน") }}
        </h1>
      </div>
    </div>

    <!-- Decorative shape - hidden on tablet/desktop for cleaner look -->
    <div
      class="bg-[#080E1E] w-[500px] h-[700px] right-[-100px] top-[-480px] rotate-[12deg] absolute hidden md:block md:right-[-200px] md:top-[-400px] md:opacity-30 lg:opacity-20"
      aria-hidden="true"
    ></div>

    <!-- Main content: centered container for tablet/desktop -->
    <div class="relative max-w-4xl mx-auto px-3 md:px-6 lg:px-8">
      <!-- Profile Information Section -->
      <div class="relative pt-4 md:pt-6 pb-3 pr-0 md:pr-0">
        <!-- Dark Profile Card - full rounded on tablet/desktop -->
        <div
          class="bg-[#E4EAF0] rounded-tl-3xl rounded-bl-3xl md:rounded-2xl relative overflow-hidden border border-white/10 shadow-lg md:shadow-xl"
        >
          <div class="relative p-5 md:p-6 lg:p-8">
            <!-- Profile Picture and VIP Badge Row -->
            <div class="flex items-start gap-4 md:gap-6 mb-4">
              <!-- Profile Picture with Edit -->
              <div class="shrink-0 relative group">
                <img
                  :src="user.profileImage"
                  :alt="user.username"
                  class="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-2 border-white bg-[#080E1E] shadow-md"
                />
                <button
                  type="button"
                  @click.stop="openProfileEditModal"
                  class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  :aria-label="t('Edit profile', 'ပရိုဖိုင်ပြင်', '编辑资料', 'แก้ไขโปรไฟล์')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>

            <div class="flex-1 pt-2 min-w-0">
              <!-- Username -->
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-lg md:text-xl lg:text-2xl font-bold text-black font-['Pyidaungsu','Padauk',sans-serif] truncate"
                  >{{ user.username }}</span
                >
                <button
                  @click="copyUsername"
                  class="text-black transition-colors hover:opacity-80 shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    class="md:w-5 md:h-5 text-black"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    ></path>
                  </svg>
                </button>
              </div>

              <!-- Phone Number -->
              <div
                v-if="user.phone"
                class="flex items-center gap-2 mb-1 text-sm md:text-base text-black font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <span class="font-['Pyidaungsu','Padauk',sans-serif]">
                  {{ blurLastFiveCharacters(user.phone) }}
                </span>
              </div>

              <!-- Commissioner -->
              <div
                v-if="user.commissioner"
                class="flex items-center gap-2 mb-3 text-sm md:text-base text-black font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <span class="font-['Pyidaungsu','Padauk',sans-serif]">
                  {{ t("Upper Line", "ကိုယ်စားလှယ်", "上级", "ผู้แนะนำ") }}:
                  {{ user.commissioner }}
                </span>
              </div>

              <!-- Balance -->
              <div class="flex items-center gap-3">
                <span class="text-xl md:text-2xl lg:text-3xl font-bold text-black">
                  {{ user.balance }} MMK
                </span>
                <button
                  @click="refreshBalance"
                  class="transition-colors hover:opacity-80 p-1 rounded-full hover:bg-black/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    class="md:w-6 md:h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path
                      d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-row gap-2 md:gap-4 mt-4 md:mt-6">
            <button
              @click="openDepositModal"
              class="flex-1 bg-[#F7FAFC] !text-gray-900 py-2 md:py-3.5 px-4 rounded-full font-bold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif] text-sm md:text-base shadow-sm hover:shadow-md active:scale-95 min-h-[44px] md:min-h-[52px] touch-manipulation max-w-[200px] md:max-w-none"
            >
              {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
            </button>
            <button
              @click="handleWithdraw"
              class="flex-1 bg-[#F7FAFC] !text-gray-900 py-2 md:py-3.5 px-4 rounded-full font-bold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif] text-sm md:text-base shadow-sm hover:shadow-md active:scale-95 min-h-[44px] md:min-h-[52px] touch-manipulation max-w-[200px] md:max-w-none"
            >
              {{ t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน") }}
            </button>
            <button
              @click="router.push({ name: 'my-cards' })"
              class="flex-1 bg-[#F7FAFC] !text-gray-900 py-2 md:py-3.5 px-4 rounded-full font-bold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif] text-sm md:text-base shadow-sm hover:shadow-md active:scale-95 min-h-[44px] md:min-h-[52px] touch-manipulation max-w-[200px] md:max-w-none"
            >
              {{ t("My Cards", "ကတ်များ", "我的卡", "บัตรของฉัน") }}
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- Member Center Section -->
      <div class="mt-4 md:mt-6 mb-4">
        <!-- Header -->
        <div class="mb-2 md:mb-3 flex items-center gap-3">
          <div
            class="bg-[#DFDFDF] shrink-0 text-black px-4 py-1.5 md:px-5 md:py-2 rounded-full font-['Pyidaungsu','Padauk',sans-serif] text-sm md:text-base font-medium"
          >
            {{ t("Member Center", "အသင်းဝင်စင်တာ", "会员中心", "ศูนย์สมาชิก") }}
          </div>
          <div class="bg-[#DFDFDF] flex-1 h-[1px] min-w-0"></div>
        </div>

        <!-- Grid Menu Items - 4 cols mobile, 5 tablet, 6 desktop -->
        <div class="rounded-lg p-3 md:p-4 lg:p-5 bg-white/50 md:bg-transparent">
        <div class="account-menu-grid grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
          <!-- Rewards Center -->
          <button
            @click="showComingSoonModal"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-trophy-icon lucide-trophy"
              >
                <path
                  d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"
                />
                <path
                  d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"
                />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path
                  d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"
                />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t("Rewards Center", "ဆုလာဘ်စင်တာ", "奖励中心", "ศูนย์รางวัล")
              }}
            </span>
          </button>
          <button
            @click="showComingSoonModal"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/win-lose.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Profit and Loss Statement",
                  "အရှုး အမြတ်စာရင်း",
                  "盈亏记录",
                  "รายการกำไรขาดทุน",
                )
              }}
            </span>
          </button>

          <button
            @click="router.push({ name: 'invite' })"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/invite-code.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Invite", "ဖိတ်ခေါ်ခြင်း", "邀请", "เชิญชวน") }}
            </span>
          </button>
          <button
            @click="openBettingHistoryModal"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/transactions.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Betting Record",
                  "လောင်းကြေးမှတ်တမ်း",
                  "投注记录",
                  "บันทึกการเดิมพัน",
                )
              }}
            </span>
          </button>

          <!-- Deposit Record -->
          <button
            @click="handleDepositHistory"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/deposit-yellow.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Deposit Record",
                  "ငွေဖြည့် မှတ်တမ်း",
                  "充值记录",
                  "บันทึกการฝาก",
                )
              }}
            </span>
          </button>

          <!-- Row 2 -->
          <!-- Withdrawal Record -->
          <button
            @click="handleWithdrawHistory"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img
                src="/withdraw-yellow.png"
                class="w-[36px] h-[36px]"
                alt=""
              />
            </div>
            <span
              class="block w-full text-center text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Withdrawal Record",
                  "ငွေထုတ်ယူမှု မှတ်တမ်း",
                  "提现记录",
                  "บันทึกการถอน",
                )
              }}
            </span>
          </button>

          <!-- Transaction Record -->
          <button
            @click="handleTransactionHistory"
            class="flex flex-col items-center gap-1.5 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img
                src="/money-statement.png"
                class="w-[36px] h-[36px]"
                alt=""
              />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Transaction History",
                  "ငွေစာရင်း မှတ်တမ်း",
                  "交易记录",
                  "ประวัติธุรกรรม",
                )
              }}
            </span>
          </button>

          <button
            @click="router.push({ name: 'account' })"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/profile.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Profile", "အကောင့်စင်တာ", "账户信息", "ข้อมูลบัญชี") }}
            </span>
          </button>

          <!-- Security Center / Update Password -->
          <button
            @click="openPasswordModal"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/account-center.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Update Password",
                  "လုံခြုံရေးစင်တာ",
                  "修改密码",
                  "เปลี่ยนรหัสผ่าน",
                )
              }}
            </span>
          </button>

          <!-- Language Selection -->
          <button
            @click="openLanguageModal"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M5 8h14M5 8a2 2 0 1 0 0-4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2a2 2 0 1 0 0-4h14M5 8v12M19 8v12M19 8a2 2 0 1 1 0-4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2a2 2 0 1 1 0-4"
                ></path>
              </svg>
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Language", "ဘာသာစကား", "语言", "ภาษา") }}
            </span>
          </button>

          <button
            @click="router.push({ name: 'promo-code-claim' })"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12V8a2 2 0 0 0-2-2h-3l-2-2-2 2H8a2 2 0 0 0-2 2v4" />
                <path d="M4 12h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <path d="M12 12v4" />
                <path d="M10 14h4" />
              </svg>
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Promo Code", "ပရိုမိုကုဒ်", "优惠码", "รหัสโปรโมชั่น") }}
            </span>
          </button>

          <button
            @click="openSupportLink"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/invite-code.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Invite", "ကိုယ်စားလှယ်ကုဒ်", "邀请码", "รหัสเชิญ") }}
            </span>
          </button>

          <button
            @click="showComingSoonModal"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="32"
                viewBox="0 0 14 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M6.58 15c1.25 0 2.52-.31 3.56-.94l-.42-.94c-.84.52-1.89.83-3.03.83c-3.23 0-5.64-2.08-5.64-5.72c0-4.37 3.23-7.18 6.58-7.18c3.45 0 5.22 2.19 5.22 5.2c0 2.39-1.34 3.86-2.5 3.86c-1.05 0-1.36-.73-1.05-2.19l.73-3.75H8.98l-.11.72c-.41-.63-.94-.83-1.56-.83c-2.19 0-3.66 2.39-3.66 4.38c0 1.67.94 2.61 2.3 2.61c.84 0 1.67-.53 2.3-1.25c.11.94.94 1.45 1.98 1.45c1.67 0 3.77-1.67 3.77-5C14 2.61 11.59 0 7.83 0C3.66 0 0 3.33 0 8.33C0 12.71 2.92 15 6.58 15zm-.31-5c-.73 0-1.36-.52-1.36-1.67c0-1.45.94-3.22 2.41-3.22c.52 0 .84.2 1.25.83l-.52 3.02c-.63.73-1.25 1.05-1.78 1.05V10z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span
              class="block w-full text-center text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Information Center",
                  "အချက်အလက်စင်တာ",
                  "信息中心",
                  "ศูนย์ข้อมูล",
                )
              }}
            </span>
          </button>

          <button
            @click="showComingSoonModal"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/reviews.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t("Review Center", "မှတ်ချက်စင်တာ", "评论中心", "ศูนย์รีวิว")
              }}
            </span>
          </button>

          <button
            @click="openDownloadModal"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/download.png" class="w-[36px] h-[45px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Download App",
                  "အက်ပ်ကို ဒေါင်းလုဒ်",
                  "下载APP",
                  "ดาวน์โหลดแอป",
                )
              }}
            </span>
          </button>
          <button
            @click="openSupportLink()"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <img src="/24-7.png" class="w-[36px] h-[36px]" alt="" />
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Support", "ဧည့်၀န်ဆောင်မှု", "客服", "บริการช่วยเหลือ") }}
            </span>
          </button>

          <!-- Row 4 -->
          <!-- Logout -->
          <button
            @click="logout"
            class="flex flex-col items-center gap-2 justify-start text-center hover:opacity-80 transition-opacity"
          >
            <div
              class="bg-[#FFF2DB] w-[60px] text-[#D1A24F] h-[60px] rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <span
              class="text-base font-medium leading-[1.1] text-black font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Logout", "ထွက်မည်", "退出登录", "ออกจากระบบ") }}
            </span>
          </button>
        </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <div
      v-if="isPasswordModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closePasswordModal"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-md relative shadow-2xl"
        @click.stop
      >
        <!-- Close Button -->
        <button
          @click="closePasswordModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Modal Title -->
        <div class="px-6 pt-6 pb-4 border-b border-white/10">
          <h2
            class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Update Password",
                "လျို့ဝှက်နံပါတ် ပြောင်းလဲမည်",
                "修改密码",
                "เปลี่ยนรหัสผ่าน",
              )
            }}
          </h2>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4">
          <div>
            <label
              class="block text-sm font-medium text-white mb-2 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Old Password",
                  "လျို့ဝှက်နံပါတ်အဟောင်း",
                  "旧密码",
                  "รหัสผ่านเดิม",
                )
              }}
            </label>
            <input
              v-model="password.old"
              type="password"
              class="w-full px-3 py-2 bg-[#080E1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif] text-sm placeholder:text-xs placeholder:text-gray-400"
              :placeholder="
                t(
                  'Enter old password',
                  'လျို့ဝှက်နံပါတ်အဟောင်း ထည့်ပါ',
                  '请输入旧密码',
                  'กรอกรหัสผ่านเดิม',
                )
              "
            />
            <span v-if="errors.old" class="text-red-500 text-sm mt-1 block">{{
              errors.old
            }}</span>
          </div>
          <div>
            <label
              class="block text-sm font-medium text-white mb-2 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "New Password",
                  "လျို့ဝှက်နံပါတ်အသစ်",
                  "新密码",
                  "รหัสผ่านใหม่",
                )
              }}
            </label>
            <input
              v-model="password.new"
              type="password"
              class="w-full px-3 py-2 bg-[#080E1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif] text-sm placeholder:text-xs placeholder:text-gray-400"
              :placeholder="
                t(
                  'Enter new password',
                  'လျို့ဝှက်နံပါတ်အသစ် ထည့်ပါ',
                  '请输入新密码',
                  'กรอกรหัสผ่านใหม่',
                )
              "
            />
            <span v-if="errors.new" class="text-red-500 text-sm mt-1 block">{{
              errors.new
            }}</span>
          </div>
          <div>
            <label
              class="block text-sm font-medium text-white mb-2 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t(
                  "Confirm Password",
                  "အတည်ပြုလျို့ဝှက်နံပါတ်",
                  "确认密码",
                  "ยืนยันรหัสผ่าน",
                )
              }}
            </label>
            <input
              v-model="password.confirm"
              type="password"
              class="w-full px-3 py-2 bg-[#080E1E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif] text-sm placeholder:text-xs placeholder:text-gray-400"
              :placeholder="
                t(
                  'Confirm new password',
                  'အတည်ပြုလျို့ဝှက်နံပါတ် ထည့်ပါ',
                  '请确认新密码',
                  'ยืนยันรหัสผ่านใหม่',
                )
              "
            />
            <span
              v-if="errors.confirm || errors.confirmPassword"
              class="text-red-500 text-sm mt-1 block"
              >{{ errors.confirm || errors.confirmPassword }}</span
            >
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-white/10 flex gap-3">
          <button
            @click="closePasswordModal"
            class="flex-1 bg-[#080E1E] hover:bg-[#172240] text-white py-2 px-4 rounded-lg font-semibold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("Cancel", "မလုပ်တော့ပါ", "取消", "ยกเลิก") }}
          </button>
          <button
            @click="changeNewPassword"
            class="flex-1 bg-[#1986E1] hover:bg-[#156FBD] text-white py-2 px-4 rounded-lg font-semibold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("Update", "ပြောင်းလဲမည်", "更新", "อัปเดต") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Language Selection Modal -->
    <div
      v-if="isLanguageModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closeLanguageModal"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-md relative shadow-2xl"
        @click.stop
      >
        <!-- Close Button -->
        <button
          @click="closeLanguageModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Modal Title -->
        <div class="px-6 pt-6 pb-4 border-b border-white/10">
          <h2
            class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Select Language",
                "ဘာသာစကား ရွေးချယ်မည်",
                "选择语言",
                "เลือกภาษา",
              )
            }}
          </h2>
        </div>

        <!-- Modal Content -->
        <div class="p-6">
          <div class="space-y-2">
            <!-- English -->
            <button
              @click="setLangLocalstorage('en')"
              class="w-full flex items-center gap-3 px-4 py-3 bg-[#080E1E] hover:bg-[#172240] rounded-lg transition-colors text-left"
              :class="language === 'en' ? 'ring-2 ring-[#1986E1]' : ''"
            >
              <img
                src="https://cdn.myanmarshankoeme.com/build/assets/img/bf688/china.png"
                alt="English"
                class="w-6 h-6 object-contain"
              />
              <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]"
                >English</span
              >
              <span
                v-if="language === 'en'"
                class="ml-auto text-[#1986E1] font-bold"
                >✓</span
              >
            </button>

            <!-- Myanmar -->
            <button
              @click="setLangLocalstorage('mm')"
              class="w-full flex items-center gap-3 px-4 py-3 bg-[#080E1E] hover:bg-[#172240] rounded-lg transition-colors text-left"
              :class="language === 'mm' ? 'ring-2 ring-[#1986E1]' : ''"
            >
              <img
                src="https://cdn.myanmarsoccer.xyz/build/assets/img/icons/common/myanmar.png"
                alt="Myanmar"
                class="w-6 h-6 object-contain"
              />
              <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]"
                >မြန်မာ</span
              >
              <span
                v-if="language === 'mm'"
                class="ml-auto text-[#1986E1] font-bold"
                >✓</span
              >
            </button>

            <!-- Chinese -->
            <button
              @click="setLangLocalstorage('cn')"
              class="w-full flex items-center gap-3 px-4 py-3 bg-[#080E1E] hover:bg-[#172240] rounded-lg transition-colors text-left"
              :class="language === 'cn' ? 'ring-2 ring-[#1986E1]' : ''"
            >
              <img
                src="https://yy24gld.sgp1.cdn.digitaloceanspaces.com/general/china.png"
                alt="Chinese"
                class="w-6 h-6 object-contain"
              />
              <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]"
                >中文</span
              >
              <span
                v-if="language === 'cn'"
                class="ml-auto text-[#1986E1] font-bold"
                >✓</span
              >
            </button>

            <!-- Thai -->
            <button
              @click="setLangLocalstorage('th')"
              class="w-full flex items-center gap-3 px-4 py-3 bg-[#080E1E] hover:bg-[#172240] rounded-lg transition-colors text-left"
              :class="language === 'th' ? 'ring-2 ring-[#1986E1]' : ''"
            >
              <img
                src="https://yy24gld.sgp1.cdn.digitaloceanspaces.com/general/thailand.png"
                alt="Thai"
                class="w-6 h-6 object-contain"
              />
              <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]"
                >ไทย</span
              >
              <span
                v-if="language === 'th'"
                class="ml-auto text-[#1986E1] font-bold"
                >✓</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Modal -->
    <div
      v-if="isComingSoonModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closeComingSoonModal"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-md relative shadow-2xl"
        @click.stop
      >
        <button
          @click="closeComingSoonModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="px-6 pt-6 pb-4 border-b border-white/10">
          <h2
            class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t("Coming Soon", "မကြာမီ ရရှိတော့မည်", "即将推出", "เร็วๆ นี้")
            }}
          </h2>
        </div>
        <div class="p-6">
          <p
            class="text-white/80 text-center font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "This feature is under development. Please check back later.",
                "ဤအချက်အလက်ကို ဖန်တီးဆဲဖြစ်ပါသည်။ နောက်မှ ပြန်ကြည့်ပါ။",
                "此功能正在开发中，请稍后再试。",
                "ฟีเจอร์นี้กำลังพัฒนา กรุณาตรวจสอบในภายหลัง",
              )
            }}
          </p>
        </div>
        <div class="px-6 py-4 border-t border-white/10">
          <button
            @click="closeComingSoonModal"
            class="w-full bg-[#1986E1] hover:bg-[#156FBD] text-white py-2 px-4 rounded-lg font-semibold text-center transition-all font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("OK", "အိုကေ", "确定", "ตกลง") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal
      :isOpen="isLoginModalOpen"
      @close="closeLoginModal"
      @openRegister="() => {}"
    />
  </div>
</template>

<style>
/* Match Sidebar logout modal: dark round-button confirm dialog */
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
  color: #e2e8f0 !important;
  padding: 12px 20px 20px;
}
.logout-dialog-dark .van-dialog__message-text {
  color: #e2e8f0 !important;
}
.van-dialog__footer {
  gap: 10px;
}
.logout-dialog-dark.van-dialog--round-button .van-dialog__footer {
  position: relative;
  height: auto;
  padding: 16px 20px 20px;
  background: transparent;
}
.logout-dialog-dark.van-dialog--round-button
  .van-dialog__footer
  .van-action-bar {
  position: relative;
  height: auto;
  background: transparent;
  gap: 12px;
  padding: 0;
}
.logout-dialog-dark.van-dialog--round-button
  .van-dialog__footer
  .van-action-bar-button {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  margin: 0;
}
.logout-dialog-dark.van-dialog--round-button
  .van-dialog__footer
  .van-action-bar-button--first {
  margin-left: 0;
  background: #080E1E !important;
  color: #e2e8f0 !important;
}
.logout-dialog-dark.van-dialog--round-button
  .van-dialog__footer
  .van-action-bar-button--last {
  margin-right: 0;
  background: #1986E1 !important;
  color: #fff !important;
}
</style>

<style scoped>
/* Responsive menu grid: larger icons and text on tablet/desktop (plain CSS to avoid @apply variant issues) */
.account-menu-grid > button {
  padding: 0.5rem;
  border-radius: 0.75rem;
  transition-property: color, background-color, border-color, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
@media (min-width: 768px) {
  .account-menu-grid > button {
    padding: 0.75rem;
  }
}
.account-menu-grid > button:hover {
  background-color: rgb(255 242 219 / 0.3);
}
.account-menu-grid > button > div:first-child {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
@media (min-width: 768px) {
  .account-menu-grid > button > div:first-child {
    width: 72px;
    height: 72px;
  }
}
@media (min-width: 1024px) {
  .account-menu-grid > button > div:first-child {
    width: 80px;
    height: 80px;
  }
}
.account-menu-grid > button > div img,
.account-menu-grid > button > div svg {
  width: 2.25rem;
  height: 2.25rem;
}
@media (min-width: 768px) {
  .account-menu-grid > button > div img,
  .account-menu-grid > button > div svg {
    width: 2.5rem;
    height: 2.5rem;
  }
}
@media (min-width: 1024px) {
  .account-menu-grid > button > div img,
  .account-menu-grid > button > div svg {
    width: 2.75rem;
    height: 2.75rem;
  }
}
.account-menu-grid > button > span {
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 500;
}
@media (min-width: 768px) {
  .account-menu-grid > button > span {
    font-size: 15px;
  }
}
</style>
