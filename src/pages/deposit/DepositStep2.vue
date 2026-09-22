<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import {
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
  showDialog,
} from "vant";
import moment from "moment-timezone";
import { useTranslation } from "../../composables/useTranslation";
import { useModal } from "../../composables/useModal";
import { getApiErrorMessage } from "../../composables/useApiError";
import {
  getPromotionClaimableAmount,
  claimableAmountMessage,
  translateClaimableAmountApiError,
} from "../../composables/usePromotionClaimable";

const router = useRouter();
const { openDepositHistoryModal } = useModal();
const route = useRoute();
const store = useStore();

const { t } = useTranslation();

// Language selection (same pattern as MobileNavbar)
const language = computed(() => store.state.language || "mm");
const showLanguagePopup = ref(false);
const languageOptions = [
  { text: "English", value: "en", flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/united-kingdom.png" },
  { text: "中文", value: "cn", flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/china.png" },
  { text: "ไทย", value: "th", flag: "https://yy24gld.sgp1.cdn.digitaloceanspaces.com/general/thailand.png" },
  { text: "မြန်မာ", value: "mm", flag: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/myanmar.png" },
];
const setLanguage = (lang) => {
  store.commit("setLanguage", lang);
  showLanguagePopup.value = false;
};
const openLanguagePopup = () => {
  showLanguagePopup.value = true;
};

// Get data from previous step
const depositData = ref({
  depositMethod: null,
  depositMethodName: "",
  depositMethodImage: "",
  paymentChannel: null,
  cardNumber: "",
  amount: "",
  min_deposit: null,
  max_deposit: null,
  promotion: null,
  selectedAccount: null, // { id, number, account_name, name } from step 1
});

// Account information
const accountInfo = ref({
  name: "",
  accountNumber: "",
});

// Form state
const transactionNumber = ref("");
const isConfirm = ref(false);
const errors = ref({});
const apiErrorMessage = ref("");
const orderValidTime = ref("30:00"); // Countdown timer
const orderExpiryAt = ref(null); // expiry timestamp (ms) from transaction created_at + 30 min

// After submit: store deposit id for polling; redirect when confirmed
const pendingDepositId = ref(null);
let pollingIntervalId = null;
let countdownIntervalId = null;
let initialCountdownTimerId = null; // fixed 30:00 before submit
const POLL_INTERVAL_MS = 4000;
const VALIDITY_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_KEY_STEP2_STATE = "depositStep2State";

function getStep2State() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_STEP2_STATE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStep2State(state) {
  sessionStorage.setItem(SESSION_KEY_STEP2_STATE, JSON.stringify(state));
}

function clearStep2State() {
  sessionStorage.removeItem(SESSION_KEY_STEP2_STATE);
}

// Fetch account information based on selected method
const fetchAccountInfo = async () => {
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    const res = await axios.get("/accounts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const accounts = res.data.data || [];
    // Find account matching the selected deposit method
    const selectedAccount = accounts.find(
      (acc) =>
        acc.id === depositData.value.depositMethod ||
        acc.name
          ?.toLowerCase()
          .includes(depositData.value.depositMethod?.toLowerCase()),
    );

    if (selectedAccount) {
      accountInfo.value = {
        name:
          selectedAccount.account_name || selectedAccount.name || "Wai Lin Ko",
        accountNumber:
          selectedAccount.number ||
          selectedAccount.account_number ||
          "9673715572",
      };
    } else if (accounts.length > 0) {
      // Fallback to first account
      accountInfo.value = {
        name: accounts[0].account_name || accounts[0].name || "Wai Lin Ko",
        accountNumber:
          accounts[0].number || accounts[0].account_number || "9673715572",
      };
    }
  } catch (error) {
    console.error("Error fetching account info:", error);
    // Use default values
    accountInfo.value = {
      name: "Wai Lin Ko",
      accountNumber: "9673715572",
    };
  } finally {
    closeToast();
  }
};

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast({
      message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制！", "คัดลอกแล้ว!"),
      position: "top",
    });
  } catch (error) {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showSuccessToast({
      message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制！", "คัดลอกแล้ว!"),
      position: "top",
    });
  }
};

// Load data from previous step (and restore waiting state on refresh)
onMounted(async () => {
  // Try to get data from sessionStorage first (survives refresh)
  const savedData = sessionStorage.getItem("depositStep1Data");

  if (savedData) {
    try {
      const step1Data = JSON.parse(savedData);
      depositData.value = {
        depositMethod: step1Data.depositMethod,
        depositMethodName: step1Data.depositMethodName || "",
        depositMethodImage: step1Data.depositMethodImage || "",
        paymentChannel: step1Data.paymentChannel,
        cardNumber: step1Data.cardNumber || "",
        amount: step1Data.amount,
        min_deposit: step1Data.min_deposit ?? null,
        max_deposit: step1Data.max_deposit ?? null,
        promotion: step1Data.promotion || null,
        selectedAccount: step1Data.selectedAccount || null,
      };
    } catch (error) {
      console.error("Error parsing saved data:", error);
    }
  } else if (route.state) {
    depositData.value = {
      depositMethod: route.state.depositMethod,
      depositMethodName: route.state.depositMethodName || "",
      depositMethodImage: route.state.depositMethodImage || "",
      paymentChannel: route.state.paymentChannel,
      cardNumber: route.state.cardNumber || "",
      amount: route.state.amount,
      min_deposit: route.state.min_deposit ?? null,
      max_deposit: route.state.max_deposit ?? null,
      promotion: route.state.promotion || null,
      selectedAccount: route.state.selectedAccount || null,
    };
  }

  // If no data at all, redirect back to step 1 (don't start timer or show empty page)
  if (!depositData.value.depositMethod) {
    router.push({ name: "deposit-step-1" });
    return;
  }

  // Use selected account from step 1 for transfer info; otherwise fetch from API
  const acc = depositData.value.selectedAccount;
  if (
    acc &&
    (acc.number || acc.account_number) &&
    (acc.account_name || acc.name)
  ) {
    accountInfo.value = {
      name: acc.account_name || acc.name || "",
      accountNumber: acc.number || acc.account_number || "",
    };
  } else {
    await fetchAccountInfo();
  }

  // Restore "waiting for confirmation" state on refresh from single object
  const step2State = getStep2State();
  if (step2State) {
    if (step2State.transactionNumber) {
      transactionNumber.value = step2State.transactionNumber;
    }
    if (step2State.orderExpiryAt != null) {
      orderExpiryAt.value = step2State.orderExpiryAt;
    }
    const id =
      step2State.pendingId != null
        ? Number(step2State.pendingId) || step2State.pendingId
        : null;
    if (id) {
      pendingDepositId.value = id;
      isConfirm.value = true;
      startPolling();
      // If we restored pending but have no expiry (e.g. refresh before we had created_at), fetch status to get created_at
      if (orderExpiryAt.value == null) {
        try {
          const statusRes = await axios.get(`/user/deposits/${id}/status`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const payload = statusRes.data;
          const createdAt = payload?.data?.created_at ?? payload?.created_at;
          if (createdAt) {
            const expiry = new Date(createdAt).getTime() + VALIDITY_DURATION_MS;
            orderExpiryAt.value = expiry;
            setStep2State({
              pendingId: pendingDepositId.value,
              transactionNumber: transactionNumber.value.trim(),
              orderExpiryAt: expiry,
            });
          }
        } catch (e) {
          console.error("Failed to fetch deposit status for timer:", e);
        }
      }
    }
  }

  // Countdown: use transaction created_at if we have expiry (after submit or restore), else placeholder 30:00
  if (orderExpiryAt.value != null) {
    startCountdownFromExpiry();
  } else {
    startInitialCountdown();
  }
});

// Countdown from transaction created_at
const startCountdownFromExpiry = () => {
  if (countdownIntervalId != null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
  const update = () => {
    const expiry = orderExpiryAt.value;
    if (expiry == null) return;
    const remainingMs = expiry - Date.now();
    if (remainingMs <= 0) {
      orderValidTime.value = "00:00";
      if (countdownIntervalId != null) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
      }
      return;
    }
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    orderValidTime.value = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };
  update();
  countdownIntervalId = setInterval(update, 1000);
};

// Placeholder countdown (30:00) before submit
const startInitialCountdown = () => {
  if (initialCountdownTimerId != null) {
    clearInterval(initialCountdownTimerId);
  }
  let minutes = 30;
  let seconds = 0;
  initialCountdownTimerId = setInterval(() => {
    if (seconds > 0) {
      seconds--;
    } else if (minutes > 0) {
      minutes--;
      seconds = 59;
    } else {
      clearInterval(initialCountdownTimerId);
      initialCountdownTimerId = null;
    }
    orderValidTime.value = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, 1000);
};

// Validate form
const validateForm = () => {
  errors.value = {};
  let isValid = true;

  if (
    !transactionNumber.value ||
    transactionNumber.value.length !== 6 ||
    !/^\d{6}$/.test(transactionNumber.value)
  ) {
    errors.value.transactionNumber = t(
      "Please enter last 6 digits of transaction number",
      "လုပ်ငန်းစဉ်နံပါတ်၏နောက်ဆုံး 6 လုံးကိုထည့်ပါ",
      "请输入交易号后6位",
      "โปรดกรอกเลขท้าย 6 หลักของรายการ",
    );
    isValid = false;
  }

  return isValid;
};

// Submit deposit and return response (with id for polling)
const submitDeposit = async (payload) => {
  const res = await axios.post("/user/deposits", payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

// Poll deposit status via GET /user/deposits/{id}/status until confirmed or failed
const checkDepositStatus = async () => {
  if (pendingDepositId.value == null) return;
  try {
    const res = await axios.get(
      `/user/deposits/${pendingDepositId.value}/status`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    // Response: { success, status, data: { id, amount, status, remark, created_at } }
    const payload = res.data;
    const status =
      payload?.data?.status ?? payload?.status ?? payload?.data?.confirmed;
    const isConfirmed =
      status === "confirm" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "success" ||
      payload?.data?.confirmed === true;
    const normalized = String(status ?? "").toLowerCase();
    const isFailed =
      normalized === "fail" ||
      normalized === "failed" ||
      normalized === "rejected" ||
      normalized === "reject";

    if (isConfirmed) {
      stopPolling();
      pendingDepositId.value = null;
      sessionStorage.removeItem("depositStep1Data");
      clearStep2State();
      await store.dispatch("fetchUser");
      showSuccessToast({
        message: t(
          "Deposit confirmed!",
          "ငွေသွင်းအောင်မြင်ပါပြီ။",
          "充值已确认！",
          "ฝากเงินสำเร็จ!",
        ),
        position: "top",
      });
      openDepositHistoryModal();
    } else if (isFailed) {
      stopPolling();
      pendingDepositId.value = null;
      sessionStorage.removeItem("depositStep1Data");
      clearStep2State();
      await store.dispatch("fetchUser");
      isConfirm.value = false;
      showFailToast({
        message: t(
          "Deposit was not approved.",
          "ငွေသွင်းမှု မအောင်မြင်ပါ။",
          "充值未通过审核。",
          "รายการฝากไม่ได้รับการอนุมัติ",
        ),
        position: "top",
      });
      openDepositHistoryModal();
    }
  } catch (e) {
    console.error("Deposit status check failed:", e);
  }
};

const startPolling = () => {
  stopPolling();
  if (pendingDepositId.value != null) {
    setStep2State({
      pendingId: pendingDepositId.value,
      transactionNumber: transactionNumber.value.trim(),
      orderExpiryAt: orderExpiryAt.value ?? null,
    });
    pollingIntervalId = setInterval(checkDepositStatus, POLL_INTERVAL_MS);
    checkDepositStatus(); // run once immediately
  }
};

const stopPolling = () => {
  if (pollingIntervalId != null) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};

onUnmounted(() => {
  stopPolling();
  if (initialCountdownTimerId != null) {
    clearInterval(initialCountdownTimerId);
    initialCountdownTimerId = null;
  }
  if (countdownIntervalId != null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
});

const DEFAULT_MIN_DEPOSIT = 1000;
const DEFAULT_MAX_DEPOSIT = 100000;

function effectiveAmountLimitsFromStep1() {
  let min = Number(depositData.value.min_deposit);
  let max = Number(depositData.value.max_deposit);
  if (!Number.isFinite(min) || min <= 0) min = DEFAULT_MIN_DEPOSIT;
  if (!Number.isFinite(max) || max <= 0) max = DEFAULT_MAX_DEPOSIT;
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return { min, max };
}

// Handle submit
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  const amt = parseFloat(String(depositData.value.amount).replace(/,/g, ""));
  const { min, max } = effectiveAmountLimitsFromStep1();
  const requiredClaimable = getPromotionClaimableAmount({
    claimable_amount: depositData.value.claimable_amount,
  });
  if (requiredClaimable && Number.isFinite(amt) && amt < requiredClaimable) {
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: claimableAmountMessage(t, requiredClaimable),
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  if (!Number.isFinite(amt) || amt < min || amt > max) {
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: t(
        `Deposit amount must be between K ${min.toLocaleString()} and K ${max.toLocaleString()} for this payment method. Please go back and adjust the amount.`,
        `ဤငွေပေးချေစနစ်အတွက် ငွေသွင်းပမာဏ K ${min.toLocaleString()} နှင့် K ${max.toLocaleString()} အကြားဖြစ်ရမည်။ ပြန်သွားပြီး ပြင်ဆင်ပါ။`,
        `该支付方式的充值金额须在 K ${min.toLocaleString()} – K ${max.toLocaleString()} 之间，请返回修改。`,
        `จำนวนเงินฝากต้องอยู่ระหว่าง K ${min.toLocaleString()} ถึง K ${max.toLocaleString()} สำหรับช่องทางนี้ กรุณาย้อนกลับเพื่อแก้ไข`,
      ),
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  apiErrorMessage.value = "";

  isConfirm.value = true;

  // Match Postman store withdraw/deposit: account_number, account_name, amount, remark, type
  const acc = depositData.value.selectedAccount;
  const depositPayload = {
    payment_type_id: depositData.value.depositMethod,
    account_id: acc?.id ?? null,
    account_number: acc?.number ?? acc?.account_number ?? "",
    account_name: acc?.account_name ?? acc?.name ?? "",
    amount: parseFloat(depositData.value.amount),
    remark: transactionNumber.value.trim(),
    type: depositData.value.depositMethodName || "",
    promotion_id: depositData.value.promotion ?? null,
  };

  try {
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
    const res = await submitDeposit(depositPayload);

    const id =
      res?.data?.id ??
      res?.data?.data?.id ??
      res?.data?.deposit?.id ??
      res?.id ??
      res?.deposit?.id;
    const createdAt =
      res?.data?.created_at ??
      res?.data?.data?.created_at ??
      res?.created_at ??
      res?.data?.deposit?.created_at;
    if (id != null) {
      pendingDepositId.value = id;
      if (initialCountdownTimerId != null) {
        clearInterval(initialCountdownTimerId);
        initialCountdownTimerId = null;
      }
      const expiryTime =
        createdAt != null
          ? new Date(createdAt).getTime() + VALIDITY_DURATION_MS
          : Date.now() + VALIDITY_DURATION_MS;
      orderExpiryAt.value = expiryTime;
      startCountdownFromExpiry();
      startPolling(); // saves { pendingId, transactionNumber, orderExpiryAt } to sessionStorage
    } else {
      console.warn("Deposit response (no id for polling):", res);
    }
    // Stay on page and show waiting UI; redirect happens when polling confirms
  } catch (error) {
    const rawError = getApiErrorMessage(error);
    const errorMessage = translateClaimableAmountApiError(t, rawError) || rawError || t(
      "Deposit failed. Please contact customer service.",
      "ငွေသွင်း၍ မရသေးပါ။ Customer service သို့ဆက်သွယ်ပေးပါ။",
      "充值失败，请联系在线客服。",
      "ฝากเงินล้มเหลว กรุณาติดต่อฝ่ายบริการลูกค้า",
    );
    apiErrorMessage.value = errorMessage;
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: errorMessage,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
    isConfirm.value = false;
  } finally {
    closeToast();
  }
};

// Clear API error when user edits transaction number
watch(transactionNumber, () => {
  if (apiErrorMessage.value) apiErrorMessage.value = "";
});

// Go back to step 1: replace history so Step 1's "Back" goes to Account (no loop)
const goBack = () => {
  stopPolling();
  pendingDepositId.value = null;
  clearStep2State();
  router.replace({ name: "deposit-step-1" });
};
</script>

<template>
  <div class="min-h-screen bg-[#E8F0F5] pt-2 pb-32">
    <!-- Top Navigation Bar -->
    <div class="bg-white px-4 py-3 mx-4 text-black flex items-center justify-between">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-700"
        :aria-label="t('Back', 'ပြန်သွားမည်', '返回', 'กลับ')"
      >
        <svg
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
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span class="text-sm font-medium font-['Pyidaungsu','Padauk',sans-serif]">{{ t("Back", "ပြန်သွားမည်", "返回", "กลับ") }}</span>
      </button>

      <!-- Payment Method Logo and Text (Dynamic from Step 1) -->
      <div class="flex items-center gap-2">
        <img
          v-if="depositData.depositMethodImage"
          :src="depositData.depositMethodImage"
          :alt="depositData.depositMethodName"
          class="w-8 h-8 rounded-full object-cover"
        />
        <div
          v-else
          class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#0066CC"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
            <path d="M8 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
          </svg>
        </div>
        <span class="text-base font-semibold text-gray-800 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ depositData.depositMethodName || "WavePay" }}
        </span>
      </div>

      <!-- Language (globe) icon -->
      <button
        type="button"
        class="text-gray-700 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
        :aria-label="t('Language', 'ဘာသာစကား', '语言', 'ภาษา')"
        @click="openLanguagePopup"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </button>
    </div>

    <!-- Language selection popup -->
    <Teleport to="body">
      <Transition name="language-fade">
        <div
          v-show="showLanguagePopup"
          class="fixed inset-0 z-[9999] flex items-start justify-end pt-24 pr-3 sm:pr-4 bg-black/50"
          @click.self="showLanguagePopup = false"
        >
          <div
            class="w-[280px] max-w-[calc(100vw-24px)] bg-[#080E1E] border border-white/20 rounded-xl overflow-hidden shadow-xl"
            @click.stop
          >
            <button
              v-for="opt in languageOptions"
              :key="opt.value"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3.5 text-left font-['Pyidaungsu','Padauk',sans-serif] text-sm text-white hover:bg-white/10 active:bg-white/15 transition-colors border-b border-white/5 last:border-b-0"
              :class="{ 'bg-white/10': language === opt.value }"
              @click="setLanguage(opt.value)"
            >
              <img
                :src="opt.flag"
                :alt="opt.text"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <span>{{ opt.text }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Content -->
    <div class="px-4 py-4 space-y-4">
      <!-- Waiting result (shown after submit until API/timeout completes) -->

      <!-- Order Valid Time -->
      <p class="text-sm font-semibold text-center text-orange-500 font-['Pyidaungsu','Padauk',sans-serif]">
        {{ t("Order valid time", "အော်ဒါတရားဝင်ကာလ", "订单有效时间", "เวลาออเดอร์ใช้ได้") }} {{ orderValidTime }}
      </p>

      <!-- Order Details Card -->
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <div class="space-y-4">
          <!-- Name Row -->
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Name", "နာမည်", "姓名", "ชื่อ") }}
            </span>
            <span class="text-lg font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ accountInfo.name }}
            </span>
          </div>

          <!-- Account Number Row -->
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Account number", "အကောင့်နံပါတ်", "账号", "หมายเลขบัญชี") }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-red-600 font-['Pyidaungsu','Padauk',sans-serif]">
                {{ accountInfo.accountNumber }}
              </span>
              <button
                @click="copyToClipboard(accountInfo.accountNumber)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium hover:bg-gray-200 active:scale-95 transition-all font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation"
                style="color: #374151"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="shrink-0"
                >
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                {{ t("Copy", "ကော်ပီ", "复制", "คัดลอก") }}
              </button>
            </div>
          </div>

          <!-- Transfer Amount Row -->
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Transfer amount", "လွှဲပြောင်းပမာဏ", "转账金额", "จำนวนโอน") }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
                {{ Number(depositData.amount || 0).toLocaleString() }}
              </span>
              <button
                @click="copyToClipboard(depositData.amount)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium hover:bg-gray-200 active:scale-95 transition-all font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation"
                style="color: #374151"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="shrink-0"
                >
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                {{ t("Copy", "ကော်ပီ", "复制", "คัดลอก") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="isConfirm"
        class="bg-white rounded-xl p-2 flex items-center gap-1"
      >
        <div
          class="shrink-0 w-12 h-12 flex items-center justify-center text-amber-500"
          aria-hidden="true"
        >
          <svg
            class="icon-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 14 14"
          >
            <g
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.5 3.5a3.5 3.5 0 0 1-7 0v-3h7Z" />
              <path d="M10.5 10.5a3.5 3.5 0 0 0-7 0v3h7Zm-9-10h11m-11 13h11" />
            </g>
          </svg>
        </div>
        <div class="flex-1 min-w-0 bg-white rounded-lg p-1">
          <p class="text-sm text-gray-800 font-['Pyidaungsu','Padauk',sans-serif] leading-relaxed">
            {{ t("Transaction number submitted successfully. Refill", "မှာယူမှုနံပါတ်ကိုအောင်မြင်စွာ တင်သွင်းပြီး ပြန်လည်ဖြည့်သွင်းမှု", "交易号提交成功，正在充值", "ส่งหมายเลขธุรกรรมสำเร็จ กำลังเติมเงิน") }}
          </p>
          <p class="text-sm text-gray-800 font-['Pyidaungsu','Padauk',sans-serif] leading-relaxed mt-1">
            {{ t("Waiting for confirmation.", "အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။", "等待确认。", "กำลังรอการยืนยัน") }}
          </p>
        </div>
      </div>

      <!-- Transaction Input Section -->
      <div>
        <div class="bg-white rounded-lg p-3 space-y-3">
          <p class="text-sm font-semibold text-red-500 mb-3 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Enter last 6 digits of transaction number", "လုပ်ငန်းစဉ်နံပါတ်၏နောက်ဆုံး 6 လုံးကိုထည့်ပါ", "请输入交易号后6位", "กรอกเลขท้าย 6 หลักของหมายเลขธุรกรรม") }}
          </p>
          <!-- Single compound input: order number (placeholder) + transaction number, Bootstrap-style -->
          <div
            class="flex bg-gray-50 border items-center border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#1986E1] focus-within:border-[#1986E1]"
          >
            <p class="shrink-0 text-black py-2.5 !border-r-gray-300 px-2 border-r text-[13px]">
              {{ t("Order number", "အော်ဒါနံပါတ်", "订单号", "หมายเลขออเดอร์") }}...
            </p>
            <div class="relative flex-1 flex items-stretch">
              <input
                v-model="transactionNumber"
                type="text"
                :placeholder="t('Transaction number', 'လုပ်ငန်းစဉ်နံပါတ်', '交易号', 'หมายเลขธุรกรรม')"
                maxlength="6"
                pattern="[0-9]{6}"
                class="w-full min-w-0 bg-transparent border-0 rounded-none rounded-r-lg px-4 py-2.5 pr-16 !text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 font-['Pyidaungsu','Padauk',sans-serif] text-sm"
              />
            </div>
          </div>
        </div>

        <span
          v-if="errors.transactionNumber"
          class="text-red-500 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ errors.transactionNumber }}
        </span>

        <!-- API error message (from deposit submit) -->
        <div
          v-if="apiErrorMessage"
          class="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          <p class="text-red-700 text-sm font-medium">
            {{ apiErrorMessage }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          :disabled="transactionNumber.length !== 6 || isConfirm"
          class="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-4"
        >
          <span v-if="!isConfirm">{{ t("Submit", "တင်ပြပါ။", "提交", "ส่ง") }}</span>
          <span v-else>
            {{
              t(
                "Waiting for confirmation",
                "အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်",
                "等待确认",
                "กำลังรอการยืนยัน",
              )
            }}
          </span>
        </button>
      </div>

      <!-- Tips/Instructions Section -->
      <div class="bg-white rounded-lg p-4 shadow-sm">
        <h3 class="text-lg font-semibold text-red-500 mb-3 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Notes", "အရိပ်အမြွက်", "须知", "หมายเหตุ") }}
        </h3>

        <div class="space-y-3">
          <!-- Tip 1 -->
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 bg-[#1986E1] rounded-full mt-2 flex-shrink-0"></div>
            <p class="text-sm text-black leading-relaxed font-['Pyidaungsu','Padauk',sans-serif]">
              {{
                t(
                  "Place the order within the valid time. If the time has passed, place the order again. Enter the amount and phone number correctly. If you transfer by wrong method, you may not receive the money.",
                  "အော်ဒါတရားဝင်ကာလအတွင်း အော်ဒါပေးရမည်။ ကာလကျော်လွန်ပါက အော်ဒါပြန်လည်ပေးရမည်။ ငွေပမာဏနှင့် ဖုန်းနံပါတ်မှန်ကန်စွာ ထည့်သွင်းရမည်။ မှားယွင်းသောနည်းလမ်းဖြင့် ငွေလွှဲပြောင်းပါက ငွေမရရှိနိုင်ပါ။",
                  "请在有效时间内下单。超时请重新下单。请正确填写金额和手机号。若通过错误方式转账，可能无法到账。",
                  "กรุณาสั่งออเดอร์ภายในเวลาที่ใช้ได้ หากเลยเวลา กรุณาสั่งออเดอร์ใหม่ กรอกจำนวนเงินและหมายเลขโทรศัพท์ให้ถูกต้อง หากโอนผิดวิธี อาจไม่ได้รับเงิน"
                )
              }}
            </p>
          </div>

          <!-- Tip 2 -->
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 bg-[#1986E1] rounded-full mt-2 flex-shrink-0"></div>
            <p class="text-sm text-black leading-relaxed font-['Pyidaungsu','Padauk',sans-serif]">
              {{
                t(
                  "Copy the phone number and transfer. If the order is correct, the money will automatically enter the game. The receiving phone number in the game changes frequently, so do not rely on a single number.",
                  "ဖုန်းနံပါတ်ကို ကော်ပီကူးယူ၍ လွှဲပြောင်းရမည်။ မှန်ကန်သော အော်ဒါပေးပါက ငွေသည် အလိုအလျောက် ဂိမ်းထဲသို့ ဝင်ရောက်မည်။ ဂိမ်းထဲရှိ လက်ခံဖုန်းနံပါတ်သည် အမြဲတမ်း ပြောင်းလဲနေသောကြောင့် တစ်ခုတည်းသော နံပါတ်ကို အားကိုးအားထားပြုလုပ်ခြင်း မပြုလုပ်ရပါ။",
                  "请复制手机号后转账。订单正确时款项将自动进入游戏。游戏中收款手机号经常变更，请勿只依赖一个号码。",
                  "กรุณาคัดลอกหมายเลขโทรศัพท์แล้วโอน หากออเดอร์ถูกต้อง เงินจะเข้าเกมอัตโนมัติ หมายเลขรับเงินในเกมเปลี่ยนบ่อย จึงอย่าพึ่งพาเลขหมายเดียว"
                )
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Language popup transition */
.language-fade-enter-active,
.language-fade-leave-active {
  transition: opacity 0.2s ease;
}
.language-fade-enter-from,
.language-fade-leave-to {
  opacity: 0;
}

.icon-spin {
  animation: icon-spin 3s linear infinite;
}

@keyframes icon-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
