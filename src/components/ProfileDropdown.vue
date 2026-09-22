<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useModal } from "../composables/useModal";
import { showConfirmDialog, showSuccessToast } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { getProfileImageUrl } from "../composables/useProfileImage";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const store = useStore();
const router = useRouter();
const { openBettingHistoryModal, openDepositHistoryModal, openWithdrawHistoryModal } = useModal();
const { t } = useTranslation();

const language = computed(() => store?.state?.language || "mm");
const authUser = computed(() => store?.state?.authUser || {});
const userProfileImage = computed(
  () => getProfileImageUrl(authUser.value) || "/logo-profile.png",
);
const username = computed(
  () => authUser.value?.name || authUser.value?.phone || "User",
);

// Check if mobile device
const isMobile = ref(false);

const checkMobile = () => {
  if (typeof window !== "undefined") {
    isMobile.value = window.innerWidth < 768; // md breakpoint
  }
};

// Menu items
const menuItems = computed(() => [
  {
    id: "betting-history",
    label: t(
      "Betting History",
      "လောင်းကြေးမှတ်တမ်း",
      "投注记录",
      "ประวัติการเดิมพัน",
    ),
    icon: "spade",
    action: () => {
      openBettingHistoryModal();
      emit("close");
    },
  },
  {
    id: "withdraw-history",
    label: t(
      "Withdraw History",
      "ငွေထုတ်ယူ မှတ်တမ်း",
      "提现记录",
      "ประวัติการถอนเงิน",
    ),
    icon: "withdraw",
    action: () => {
      openWithdrawHistoryModal();
      emit("close");
    },
  },
  {
    id: "deposit-history",
    label: t(
      "Deposit History",
      "ငွေဖြည့် မှတ်တမ်း",
      "存款记录",
      "ประวัติการฝากเงิน",
    ),
    icon: "deposit",
    action: () => {
      openDepositHistoryModal();
      emit("close");
    },
  },
  {
    id: "account",
    label: t("Account", "အကောင့်", "账户", "บัญชี"),
    icon: "shield",
    action: () => {
      router.push({ name: "account" });
      emit("close");
    },
  },
]);

// Handle logout
const handleLogout = () => {
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
      try {
        await store.dispatch("logoutUser");
      } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        store.commit("SET_USER", {});
        store.commit("setAmount", 0.0);
      }
      emit("close");
      if (router.currentRoute.value.path !== "/") {
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

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const dropdown = event.target.closest(".profile-dropdown");
  const trigger = event.target.closest(".profile-trigger");
  if (!dropdown && !trigger) {
    emit("close");
  }
};

onMounted(() => {
  checkMobile();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", checkMobile);
  }
  if (props.isOpen) {
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", checkMobile);
  }
  document.removeEventListener("click", handleClickOutside);
});

// Watch for isOpen changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  },
);
</script>

<template>
  <div
    v-if="isOpen"
    class="profile-dropdown absolute z-50 bg-[#080E1E] rounded-2xl min-w-[280px] sm:min-w-[300px] overflow-hidden top-full right-0 mt-2"
  >
    <!-- Profile Header: click profile icon to open edit modal -->
    <div class="p-4 border-b border-white/10 text-center">
      <button
        type="button"
        @click="store.commit('setProfileModalOpen', true); emit('close')"
        class="relative inline-block rounded-full focus:outline-none focus:ring-2 focus:ring-[#1986E1] focus:ring-offset-2 focus:ring-offset-[#080E1E] cursor-pointer"
        :aria-label="t('Edit profile', 'ပရိုဖိုင်ပြင်', '编辑资料', 'แก้ไขโปรไฟล์')"
      >
        <span class="relative inline-block">
          <img
            :src="userProfileImage"
            alt="Profile"
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-2 border border-white/20 hover:border-[#1986E1] transition-colors block bg-[#080E1E]"
          />
          <span
            class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#1986E1] flex items-center justify-center text-white border-2 border-[#080E1E]"
            title="Edit profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </span>
        </span>
      </button>
      <div
        class="text-white font-semibold text-xl sm:text-base font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ username }}
      </div>
    </div>

    <!-- Menu Items -->
    <div class="py-2 px-1">
      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="item.action"
        class="w-full px-4 py-3 mx-1 rounded-xl flex items-center gap-3 text-left hover:bg-white/8 active:bg-white/12 transition-colors text-white font-['Pyidaungsu','Padauk',sans-serif]"
      >
        <!-- Spade Icon -->
        <svg
          v-if="item.icon === 'spade'"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          class="text-[#1986E1]"
          viewBox="0 0 24 24"
        >
          <!-- Icon from Remix Icon by Remix Design - https://github.com/Remix-Design/RemixIcon/blob/master/License -->
          <path
            fill="currentColor"
            d="M10.951 15.893A5.83 5.83 0 0 1 7.5 17C4.462 17 2 14.761 2 12c0-3.548 3.525-6.089 6.644-8.338C9.92 2.742 11.129 1.872 12 1c.871.871 2.08 1.742 3.356 2.662C18.476 5.911 22 8.452 22 12c0 2.761-2.462 5-5.5 5a5.83 5.83 0 0 1-3.451-1.107c.284 1.646 1.009 2.82 1.794 4.092l.369.602c.384.636-.087 1.413-.83 1.413H9.618c-.743 0-1.214-.777-.83-1.413l.369-.602c.785-1.272 1.51-2.446 1.794-4.092"
          />
        </svg>

        <svg
          v-else-if="item.icon === 'withdraw'"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          class="text-[#1986E1]"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-width="1.5"
          >
            <path
              d="m18.935 13.945l-.67-3.648c-.29-1.576-.435-2.364-1.008-2.83S15.86 7 14.213 7H9.787c-1.647 0-2.47 0-3.044.467c-.573.466-.718 1.254-1.008 2.83l-.67 3.648c-.6 3.271-.901 4.907.024 5.98C6.014 21 7.724 21 11.142 21h1.716c3.418 0 5.128 0 6.053-1.074s.625-2.71.024-5.98Z"
            />
            <path
              stroke-linejoin="round"
              d="M10.438 16.667v-5.334m1.562 0V10m0 8v-1.333M10.438 14h3.124m0 0c.518 0 .938.448.938 1v.667c0 .552-.42 1-.937 1H9.5M13.563 14c.517 0 .937-.448.937-1v-.667c0-.552-.42-1-.937-1H9.5"
            />
            <path
              d="M21 11a1.5 1.5 0 0 0 .414-.305C22 10.089 22 9.11 22 7.152s0-2.936-.586-3.544S19.886 3 18 3H6c-1.886 0-2.828 0-3.414.608S2 5.195 2 7.152s0 2.936.586 3.543q.18.188.414.305"
            />
          </g>
        </svg>

        <svg
          v-else-if="item.icon === 'deposit'"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          class="text-[#1986E1]"
          viewBox="0 0 14 14"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M1 4.5A.5.5 0 0 1 .5 4V1A.5.5 0 0 1 1 .5h12a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5"
            />
            <rect width="7" height="8" x="3.5" y="3" rx=".5" />
            <circle cx="7" cy="7" r="1.5" />
            <path d="M3.5 13.5h7" />
          </g>
        </svg>

        <!-- People Icon -->
        <svg
          v-else-if="item.icon === 'shield'"
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          class="text-[#1986E1]"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M22 4h-8v3h-4V4H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M8 9a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m4 8H4v-1c0-1.33 2.67-2 4-2s4 .67 4 2zm8 1h-6v-2h6zm0-4h-6v-2h6zm0-4h-6V8h6zm-7-4h-2V2h2z"
          />
        </svg>

        <span class="text-base font-semibold">{{ item.label }}</span>
      </button>
    </div>

    <!-- Logout Button -->
    <div class="p-4 border-t border-white/10">
      <button
        @click="handleLogout"
        class="w-full bg-[#1986E1] hover:bg-[#156FBD] text-white py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ t("Logout", "ထွက်မည်", "退出登录", "ออกจากระบบ") }}
      </button>
    </div>
  </div>
</template>

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
.profile-dropdown {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
