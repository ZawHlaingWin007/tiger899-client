<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import {
  showSuccessToast,
  showLoadingToast,
  closeToast,
  showDialog,
} from "vant";
import { RadioGroup, Radio, Popup as VanPopup } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { getApiErrorMessage } from "../composables/useApiError";
import {
  getPromotionClaimableAmount,
  claimableAmountMessage,
  translateClaimableAmountApiError,
} from "../composables/usePromotionClaimable";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const store = useStore();
const { t } = useTranslation();

// Stepper: 0 = step 1, 1 = step 2
const currentStep = ref(0);

// ---- Step 1 state ----
const selectedDepositMethod = ref(null);
const selectedAccount = ref(null);
const depositAmount = ref("");
const selectedPromotion = ref("none");
const depositMethods = ref([]);
const promotions = ref([]);
const isLoadingPaymentTypes = ref(false);
const isLoadingPromotions = ref(false);
const errors = ref({});
const showPromotionDetailModal = ref(false);
const promotionDetail = ref(null);

// ---- Step 2 state ----
const step1Data = ref(null); // set when moving to step 2
const accountInfo = ref({ name: "", accountNumber: "" });
const transactionNumber = ref("");
const orderValidTime = ref("30:00");
const orderExpiryAt = ref(null); // expiry timestamp (ms) from transaction created_at + 30 min
const isConfirm = ref(false);
const pendingDepositId = ref(null);
let pollingIntervalId = null;
let countdownIntervalId = null;
let initialCountdownTimerId = null; // 30:00 countdown before submit (step 2)
const POLL_INTERVAL_MS = 4000;
const VALIDITY_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function mapPaymentType(item) {
  const cashback =
    item.cashback_percent != null ? parseFloat(item.cashback_percent) : 0;
  const accounts = (item.accounts || []).filter((a) => a.is_disable !== true);
  return {
    id: item.id,
    name: item.name || "",
    image: item.image || "",
    bonus: cashback ? `+${cashback}%` : "",
    rate: item.rate != null ? parseFloat(item.rate) : null,
    min_deposit: item.min_deposit != null ? parseFloat(item.min_deposit) : null,
    max_deposit: item.max_deposit != null ? parseFloat(item.max_deposit) : null,
    is_active: item.is_active,
    accounts,
  };
}

const fetchPaymentTypes = async () => {
  isLoadingPaymentTypes.value = true;
  try {
    const res = await axios.get("/payment-types/active", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = res.data?.data ?? res.data;
    const list = Array.isArray(data) ? data : [];
    depositMethods.value = list
      .filter((item) => item.is_active !== false)
      .map(mapPaymentType);
  } catch (error) {
    console.error("Error fetching payment types:", error);
    depositMethods.value = [];
  } finally {
    isLoadingPaymentTypes.value = false;
  }
};

const fetchPromotions = async () => {
  try {
    isLoadingPromotions.value = true;
    const token = localStorage.getItem("token");
    const res = await axios.get("/promotions?active=1", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const raw = res.data?.data ?? res.data;
    promotions.value = Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error("Error fetching promotions:", error);
    promotions.value = [];
  } finally {
    isLoadingPromotions.value = false;
  }
};

const selectedDepositMethodDetails = computed(() => {
  if (selectedDepositMethod.value == null) return null;
  return (
    depositMethods.value.find((m) => m.id === selectedDepositMethod.value) ||
    null
  );
});

const isUSDTSelected = computed(() => {
  const name = selectedDepositMethodDetails.value?.name || "";
  return String(name).toLowerCase().includes("usdt");
});

const usdtExchangeRateFallback = 3997.0363022185047;
const usdtDisplayRate = computed(() => {
  if (!isUSDTSelected.value) return null;
  const rate = selectedDepositMethodDetails.value?.rate;
  return rate != null ? rate : usdtExchangeRateFallback;
});

const selectedMethodHasAccounts = computed(() => {
  const list = selectedDepositMethodDetails.value?.accounts;
  return Array.isArray(list) && list.length > 0;
});

const selectDepositMethod = (method) => {
  selectedDepositMethod.value = method.id;
  selectedAccount.value = null;
  errors.value.method = null;
  errors.value.account = null;
};

const selectAccount = (account) => {
  selectedAccount.value = account;
  errors.value.account = null;
};

const handlePromotionChange = (value, promotionObj = null) => {
  selectedPromotion.value = value;
  if (value !== "none" && promotionObj) {
    promotionDetail.value = promotionObj;
    showPromotionDetailModal.value = true;
  }
};

const closePromotionDetailModal = () => {
  showPromotionDetailModal.value = false;
};

// No-deposit (free money) promotion: claim without deposit amount
const selectedPromotionObj = computed(() => {
  if (!selectedPromotion.value || selectedPromotion.value === "none") return null;
  return promotions.value.find((p) => p.id == selectedPromotion.value) || null;
});
function isNoDepositPromo(promotion) {
  if (!promotion) return false;
  const rd = promotion.requires_deposit;
  const noDepositFlag = rd === false || rd === 0 || rd == null ||
    String(rd).toLowerCase() === "false" || String(rd) === "0";
  const hasFixedBonus = promotion.fixed_bonus_amount != null && promotion.fixed_bonus_amount !== "";
  return noDepositFlag || hasFixedBonus;
}
const isNoDepositPromotion = computed(
  () => selectedPromotionObj.value && isNoDepositPromo(selectedPromotionObj.value)
);
const isClaimingFree = ref(false);

async function claimFreePromotion() {
  const prom = selectedPromotionObj.value;
  if (!prom || !isNoDepositPromo(prom)) return;
  isClaimingFree.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      `/user/promotions/${prom.id}/claim`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    closeToast();
    showSuccessToast({
      message: t("Promotion claimed successfully", "ပရိုမိုးရှင်း ရယူပြီးပါပြီ", "优惠领取成功", "รับโปรโมชั่นสำเร็จ"),
      position: "top",
    });
    await store.dispatch("fetchUser");
    await fetchPromotions();
    selectedPromotion.value = "none";
    promotionDetail.value = null;
    showPromotionDetailModal.value = false;
  } catch (error) {
    closeToast();
    const raw = getApiErrorMessage(error) || error?.message || "";
    const claimableMsg = translateClaimableAmountApiError(t, raw);
    const msg =
      raw === "You have already claimed this promotion." || raw === "Already claimed"
        ? t(
            "You have already claimed this promotion.",
            "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။",
            "您已经领取过此优惠。",
            "คุณได้รับโปรโมชั่นนี้แล้ว"
          )
        : claimableMsg || t("Claim failed", "ရယူ၍မရပါ", "领取失败", "รับไม่สำเร็จ");
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: msg,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
  } finally {
    isClaimingFree.value = false;
  }
}

function formatPromotionDateRange(promotion) {
  if (!promotion) return "";
  const dt = promotion.date_type;
  const dv = promotion.date_values;
  if (dt === "daily") return t("Daily", "နေ့စဉ်", "每日", "รายวัน");
  if (dt === "weekend") return t("Weekend", "အပတ်စဉ်နားချိန်", "周末", "วันหยุดสุดสัปดาห์");
  if (dt === "weekdays") return t("Weekdays", "ရက်စဉ်အလုပ်ရက်", "工作日", "วันธรรมดา");
  if (dt === "custom" && dv && (dv.from || dv.to)) {
    const from = dv.from ? new Date(dv.from).toLocaleDateString() : "—";
    const to = dv.to ? new Date(dv.to).toLocaleDateString() : "—";
    return `${from} – ${to}`;
  }
  return "";
}

const MIN_DEPOSIT_AMOUNT_MMK = 3000;
const effectiveMinDeposit = computed(
  () => (isUSDTSelected.value ? 40000 : MIN_DEPOSIT_AMOUNT_MMK)
);
const requiredClaimableAmount = computed(() =>
  getPromotionClaimableAmount(selectedPromotionObj.value)
);
const claimableAmountError = computed(() => {
  const required = requiredClaimableAmount.value;
  if (!required) return "";
  const amount = Number(depositAmount.value);
  if (
    depositAmount.value == null ||
    String(depositAmount.value).trim() === "" ||
    !Number.isFinite(amount)
  ) {
    return "";
  }
  if (amount < required) {
    return claimableAmountMessage(t, required);
  }
  return "";
});
const depositAmountMeetsMin = computed(() => {
  const n = Number(depositAmount.value);
  if (
    depositAmount.value == null ||
    String(depositAmount.value).trim() === "" ||
    !Number.isFinite(n) ||
    n < effectiveMinDeposit.value
  ) {
    return false;
  }
  if (requiredClaimableAmount.value && n < requiredClaimableAmount.value) {
    return false;
  }
  return true;
});
const validateStep1 = () => {
  errors.value = {};
  let isValid = true;
  if (!selectedDepositMethod.value) {
    errors.value.method = t(
      "Please select a deposit method",
      "ငွေသွင်းစနစ် ရွေးချယ်ပေးပါ",
      "请选择充值方式",
      "โปรดเลือกวิธีฝากเงิน",
    );
    isValid = false;
  }
  if (selectedMethodHasAccounts.value && !selectedAccount.value) {
    errors.value.account = t(
      "Please select an account",
      "အကောင့် ရွေးချယ်ပေးပါ",
      "请选择账户",
      "โปรดเลือกบัญชี",
    );
    isValid = false;
  }
  const effectiveMin = isUSDTSelected.value ? 40000 : MIN_DEPOSIT_AMOUNT_MMK;
  const amount = Number(depositAmount.value);
  if (!depositAmount.value || !Number.isFinite(amount) || amount < effectiveMin) {
    errors.value.amount = t(
      "Minimum deposit is K 3,000",
      "အနည်းဆုံးငွေသွင်းပမာဏ ၃,၀၀၀ ကျပ်",
      "最低充值 3,000 缅币",
      "ฝากขั้นต่ำ 3,000 MMK",
    );
    isValid = false;
  } else if (requiredClaimableAmount.value && amount < requiredClaimableAmount.value) {
    errors.value.amount = claimableAmountMessage(t, requiredClaimableAmount.value);
    isValid = false;
  }
  return isValid;
};

const fetchAccountInfo = async (depositMethodId, methodName) => {
  try {
    const res = await axios.get("/accounts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const accounts = res.data?.data || [];
    const found = accounts.find(
      (acc) =>
        acc.id === depositMethodId ||
        acc.name
          ?.toLowerCase()
          .includes(String(methodName || "").toLowerCase()),
    );
    if (found) {
      accountInfo.value = {
        name: found.account_name || found.name || "",
        accountNumber: found.number || found.account_number || "",
      };
    } else if (accounts.length > 0) {
      const first = accounts[0];
      accountInfo.value = {
        name: first.account_name || first.name || "",
        accountNumber: first.number || first.account_number || "",
      };
    }
  } catch (error) {
    console.error("Error fetching account info:", error);
  }
};

const goToStep2 = async () => {
  if (selectedPromotionObj.value?.claim_once_per_user && selectedPromotionObj.value?.claimed) {
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: t(
        "You have already claimed this promotion.",
        "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။",
        "您已经领取过此优惠。",
        "คุณได้รับโปรโมชั่นนี้แล้ว"
      ),
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
    return;
  }
  if (!validateStep1()) return;
  const method = selectedDepositMethodDetails.value;
  step1Data.value = {
    depositMethod: selectedDepositMethod.value,
    depositMethodName: method?.name || "",
    depositMethodImage: method?.image || "",
    selectedAccount: selectedAccount.value
      ? {
          id: selectedAccount.value.id,
          number: selectedAccount.value.number,
          account_name: selectedAccount.value.account_name,
          name: selectedAccount.value.name,
        }
      : null,
    amount: depositAmount.value,
    promotion:
      selectedPromotion.value === "none" ? null : selectedPromotion.value,
    claimable_amount: requiredClaimableAmount.value || null,
    exchangeRate: isUSDTSelected.value ? usdtDisplayRate.value : null,
  };
  const acc = step1Data.value.selectedAccount;
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
    accountInfo.value = { name: "", accountNumber: "" };
    await fetchAccountInfo(
      step1Data.value.depositMethod,
      step1Data.value.depositMethodName,
    );
  }
  transactionNumber.value = "";
  errors.value = {};
  currentStep.value = 1;
  orderExpiryAt.value = null;
  startInitialCountdown();
};

const startInitialCountdown = () => {
  if (initialCountdownTimerId != null) clearInterval(initialCountdownTimerId);
  let minutes = 30;
  let seconds = 0;
  const update = () => {
    if (seconds > 0) seconds--;
    else if (minutes > 0) {
      minutes--;
      seconds = 59;
    } else {
      clearInterval(initialCountdownTimerId);
      initialCountdownTimerId = null;
      return;
    }
    orderValidTime.value = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };
  orderValidTime.value = "30:00";
  initialCountdownTimerId = setInterval(update, 1000);
};

const stopInitialCountdown = () => {
  if (initialCountdownTimerId != null) {
    clearInterval(initialCountdownTimerId);
    initialCountdownTimerId = null;
  }
};

const goBackToStep1 = () => {
  stopPolling();
  pendingDepositId.value = null;
  isConfirm.value = false;
  currentStep.value = 0;
};

const startCountdownFromExpiry = () => {
  stopInitialCountdown();
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

const stopCountdown = () => {
  if (countdownIntervalId != null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
};

const validateStep2 = () => {
  errors.value = {};
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
    return false;
  }
  return true;
};

const submitDeposit = async (payload) => {
  const res = await axios.post("/user/deposits", payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

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
    const payload = res.data;
    const status =
      payload?.data?.status ?? payload?.status ?? payload?.data?.confirmed;
    const isConfirmed =
      status === "confirm" ||
      status === "confirmed" ||
      status === "completed" ||
      status === "success" ||
      payload?.data?.confirmed === true;
    if (isConfirmed) {
      stopPolling();
      pendingDepositId.value = null;
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
      handleClose();
    }
  } catch (e) {
    console.error("Deposit status check failed:", e);
  }
};

const startPolling = () => {
  stopPolling();
  if (pendingDepositId.value != null) {
    pollingIntervalId = setInterval(checkDepositStatus, POLL_INTERVAL_MS);
    checkDepositStatus();
  }
};

const stopPolling = () => {
  if (pollingIntervalId != null) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};

const handleSubmit = async () => {
  if (!validateStep2()) return;
  isConfirm.value = true;
  const acc = step1Data.value?.selectedAccount;
  const depositPayload = {
    payment_type_id: step1Data.value.depositMethod,
    account_id: acc?.id ?? null,
    account_number: acc?.number ?? acc?.account_number ?? "",
    account_name: acc?.account_name ?? acc?.name ?? "",
    amount: parseFloat(step1Data.value.amount),
    remark: transactionNumber.value.trim(),
    type: step1Data.value.depositMethodName || "",
    promotion_id: step1Data.value.promotion ?? null,
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
      const expiryTime =
        createdAt != null
          ? new Date(createdAt).getTime() + VALIDITY_DURATION_MS
          : Date.now() + VALIDITY_DURATION_MS;
      orderExpiryAt.value = expiryTime;
      startCountdownFromExpiry();
      startPolling();
    }
  } catch (error) {
    const rawError = getApiErrorMessage(error);
    const errorMessage =
      translateClaimableAmountApiError(t, rawError) ||
      rawError ||
      t(
        "Deposit failed. Please contact customer service.",
        "ငွေသွင်း၍ မရသေးပါ။ Customer service သို့ဆက်သွယ်ပေးပါ။",
        "充值失败，请联系在线客服。",
        "ฝากเงินล้มเหลว กรุณาติดต่อฝ่ายบริการลูกค้า"
      );
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

const copyToClipboard = async (text, type) => {
  try {
    await navigator.clipboard.writeText(String(text));
    showSuccessToast({
      message: t(
        `${type} copied!`,
        `${type} ကူးယူပြီးပါပြီ`,
        `${type} 已复制！`,
        `${type} คัดลอกแล้ว!`,
      ),
      position: "top",
    });
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showSuccessToast({
      message: t(
        `${type} copied!`,
        `${type} ကူးယူပြီးပါပြီ`,
        `${type} 已复制！`,
        `${type} คัดลอกแล้ว!`,
      ),
      position: "top",
    });
  }
};

const handleClose = () => {
  stopPolling();
  stopCountdown();
  stopInitialCountdown();
  currentStep.value = 0;
  selectedDepositMethod.value = null;
  selectedAccount.value = null;
  depositAmount.value = "";
  selectedPromotion.value = "none";
  step1Data.value = null;
  accountInfo.value = { name: "", accountNumber: "" };
  transactionNumber.value = "";
  isConfirm.value = false;
  pendingDepositId.value = null;
  errors.value = {};
  emit("close");
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      fetchPaymentTypes();
      fetchPromotions();
      currentStep.value = 0;
    }
  },
);
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="deposit-modal-card bg-[#080E1E] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-auto border border-white/5"
    >
      <!-- Header -->
      <div
        class="sticky top-0 bg-[#080E1E] border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl"
      >
        <h2
          class="text-white text-xl sm:text-2xl font-bold font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
        </h2>
        <button
          @click="handleClose"
          class="text-white/80 hover:text-white p-2 rounded-lg transition-colors"
          aria-label="Close"
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
      </div>

      <!-- Custom modern stepper -->
      <div class="deposit-stepper px-4 sm:px-6 py-5">
        <div class="stepper-track">
          <!-- Step 1 -->
          <div
            class="stepper-step"
            :class="{ active: currentStep === 0, done: currentStep > 0 }"
          >
            <div class="stepper-dot">
              <span v-if="currentStep > 0" class="stepper-check">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span v-else class="stepper-num">1</span>
            </div>
            <span class="stepper-label">{{
              t(
                "Method & amount",
                "နည်းလမ်း နှင့် ပမာဏ",
                "方式与金额",
                "วิธีและจำนวน",
              )
            }}</span>
          </div>
          <div class="stepper-line" :class="{ filled: currentStep > 0 }"></div>
          <!-- Step 2 -->
          <div class="stepper-step" :class="{ active: currentStep === 1 }">
            <div class="stepper-dot">
              <span class="stepper-num">2</span>
            </div>
            <span class="stepper-label">{{
              t(
                "Transfer & submit",
                "လွှဲပြောင်းပြီး တင်ပြပါ",
                "转账并提交",
                "โอนและส่ง",
              )
            }}</span>
          </div>
        </div>
      </div>

      <!-- Step 1: Method & amount -->
      <div v-show="currentStep === 0" class="px-4 sm:px-6 pb-6 space-y-3 sm:space-y-4">
        <!-- Deposit method -->
        <div class="bg-white/5 rounded-lg sm:rounded-xl border border-white/10 px-4 py-4 sm:px-5 sm:py-5">
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FB9E00] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]"
            >
              ငွေသွင်းစနစ်
            </h2>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <button
              v-for="method in depositMethods"
              :key="method.id"
              type="button"
              @click="selectDepositMethod(method)"
              class="relative flex overflow-hidden items-center justify-center flex-col border rounded-lg sm:rounded-xl p-2.5 sm:p-3 min-h-[100px] sm:min-h-[110px] transition-all touch-manipulation"
              :class="
                selectedDepositMethod === method.id
                  ? 'border-2 border-red-500 bg-red-500/20 shadow-md ring-2 ring-red-500/20'
                  : 'border border-white/20 bg-white/5 hover:bg-white/10'
              "
            >
              <img
                v-if="method.image"
                :src="method.image"
                :alt="method.name"
                class="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0"
              />
              <div
                v-else
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/20 flex items-center justify-center text-white/80 text-base font-semibold shrink-0"
              >
                {{ (method.name || "?").charAt(0) }}
              </div>
              <p
                class="text-xs sm:text-sm mt-2 font-semibold text-white text-center font-['Pyidaungsu','Padauk',sans-serif] line-clamp-2"
              >
                {{ method.name }}
              </p>
              <p class="text-[10px] sm:text-xs text-red-400 font-semibold text-center mt-0.5">{{ method.bonus }}</p>
              <div
                v-if="selectedDepositMethod === method.id"
                class="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" class="text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            </button>
          </div>
          <span v-if="errors.method" class="text-red-500 text-xs sm:text-sm mt-2 block">{{
            errors.method
          }}</span>
          <p class="text-sm sm:text-base mt-4 text-red-400 leading-relaxed font-medium font-['Pyidaungsu','Padauk',sans-serif]">
            ငွေသွင်းမည့်ပမာနတိုင်းငွေသွင်းစာရင်တင်ပေးပါ။ငွေလွဲပြီးနောက် လုပ်ငန်းစဉ်နံပတ် နောက် ၅ လုံးကို မှန်ကန်စွာဖြည့်ပြီးတင်ပြပါရန် ၊ Kpay နှင့် Wavepay မှားမလွဲ ရန် မေတ္တာရပ်ခံပါသည်။
          </p>
        </div>

        <!-- Account selection (when method has accounts) -->
        <div
          v-if="
            selectedDepositMethod &&
            selectedDepositMethodDetails?.accounts?.length
          "
          class="bg-white/5 rounded-lg sm:rounded-xl border border-white/10 px-4 py-4 sm:px-5 sm:py-5"
        >
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#B56F85] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t("Select account", "အကောင့်ရွေးချယ်ပါ", "选择账户", "เลือกบัญชี")
              }}
            </h2>
          </div>
          <div class="space-y-2">
            <button
              v-for="acc in selectedDepositMethodDetails.accounts"
              :key="acc.id"
              type="button"
              @click="selectAccount(acc)"
              class="w-full text-left border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation"
              :class="
                selectedAccount?.id === acc.id
                  ? 'border-2 border-red-500 bg-red-500/20 text-white'
                  : 'border border-white/20 bg-white/5 text-white/90 hover:bg-white/10'
              "
            >
              <p class="text-sm sm:text-base font-semibold">
                {{ acc.name || acc.account_name || `Account ${acc.id}` }}
              </p>
              <p class="text-xs sm:text-sm text-white/70 mt-0.5">
                {{ acc.number || acc.account_number || "" }}
              </p>
            </button>
          </div>
          <span v-if="errors.account" class="text-red-500 text-xs sm:text-sm mt-1 block">{{
            errors.account
          }}</span>
        </div>

        <!-- Amount -->
        <div class="bg-white/5 rounded-lg sm:rounded-xl border border-white/10 px-4 py-4 sm:px-5 sm:py-5">
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FD5680] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]"
            >
              သွင်းငွေပမာဏ
            </h2>
          </div>
          <div class="relative">
            <div
              v-if="isUSDTSelected"
              class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold text-sm"
            >
              -
            </div>
            <input
              v-model="depositAmount"
              type="number"
              :placeholder="
                isUSDTSelected ? '40,000 - 100,000,000' : 'သွင်းငွေပမာဏ'
              "
              :min="isUSDTSelected ? 40000 : MIN_DEPOSIT_AMOUNT_MMK"
              :max="isUSDTSelected ? 100000000 : undefined"
              class="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-4 py-3 pr-12 text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-['Pyidaungsu','Padauk',sans-serif] text-white"
              :class="isUSDTSelected ? 'pl-10 sm:pl-12' : ''"
            />
            <div
              v-if="!isUSDTSelected"
              class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div
              v-else
              class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold text-sm"
            >
              USDT
            </div>
          </div>
          <div
            v-if="isUSDTSelected && usdtDisplayRate != null"
            class="mt-3 space-y-1 p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <p class="text-sm text-red-400 font-['Pyidaungsu','Padauk',sans-serif]">- USDT</p>
            <p class="text-sm text-red-400 font-['Pyidaungsu','Padauk',sans-serif]">ငွေလဲလှယ်နှုန်း:</p>
            <p class="text-base font-bold text-red-400 font-['Pyidaungsu','Padauk',sans-serif]">
              1 USDT = K
              {{
                usdtDisplayRate.toLocaleString("en-US", {
                  maximumFractionDigits: 21,
                })
              }}
            </p>
          </div>
          <span
            v-if="errors.amount || claimableAmountError"
            class="text-red-400 text-xs sm:text-sm mt-2 block font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ errors.amount || claimableAmountError }}
          </span>
        </div>

        <!-- Promotion -->
        <div class="bg-white/5 rounded-lg sm:rounded-xl border border-white/10 px-4 py-4 sm:px-5 sm:py-5">
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FF97EE] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]"
            >
              လှုပ်ရှားမှု
            </h2>
          </div>
          <RadioGroup
            v-model="selectedPromotion"
            @update:model-value="handlePromotionChange"
          >
            <div
              v-for="promotion in promotions"
              :key="promotion.id"
              class="mb-3 bg-white/5 border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4"
            >
              <Radio
                :name="promotion.id"
                :label="false"
                class="flex items-center"
              >
                <template #icon="{ checked }">
                  <div
                    class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    :class="
                      checked ? 'border-red-500 bg-red-500' : 'border-white/40 bg-white/5'
                    "
                  >
                    <div
                      v-if="checked"
                      class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                    ></div>
                  </div>
                </template>
                <span class="ml-3 min-w-0">
                  <span class="block text-sm sm:text-base font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]">{{
                    promotion.title || promotion.name
                  }}</span>
                  <span
                    v-if="getPromotionClaimableAmount(promotion)"
                    class="block text-xs text-white/60 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Min. deposit", "အနည်းဆုံးငွေသွင်း", "最低存款", "ฝากขั้นต่ำ") }}:
                    {{ getPromotionClaimableAmount(promotion).toLocaleString() }}
                  </span>
                  <span
                    v-if="promotion.claim_once_per_user && promotion.claimed"
                    class="block text-xs text-amber-300 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("You have already claimed this promotion.", "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။", "您已经领取过此优惠。", "คุณได้รับโปรโมชั่นนี้แล้ว") }}
                  </span>
                </span>
              </Radio>
            </div>
            <div class="bg-red-500/10 border-2 border-red-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <Radio name="none" :label="false" class="flex items-center">
                <template #icon="{ checked }">
                  <div
                    class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    :class="
                      checked
                        ? 'border-red-500 bg-red-500'
                        : 'border-red-500/50 bg-transparent'
                    "
                  >
                    <div
                      v-if="checked"
                      class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                    ></div>
                  </div>
                </template>
                <span class="ml-3 text-base font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]">
                  {{
                    t(
                      "Do not participate in any promotion",
                      "မည်သည့်ပရိုမိုးရှင်းတွင်မှမပါဝင်ပါ",
                      "不参与任何优惠",
                      "ไม่ร่วมโปรโมชั่น",
                    )
                  }}
                </span>
              </Radio>
            </div>
          </RadioGroup>
        </div>

        <!-- Claim free bonus when a no-deposit promotion is selected -->
        <button
          v-if="isNoDepositPromotion"
          @click="claimFreePromotion"
          :disabled="isClaimingFree || (selectedPromotionObj && selectedPromotionObj.claimed)"
          class="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 border-2 border-amber-400 bg-amber-500/30 text-white hover:bg-amber-500/40"
        >
          <span v-if="!isClaimingFree">
            {{ selectedPromotionObj && selectedPromotionObj.claimed
              ? (selectedPromotionObj.claim_once_per_user
                ? t("You have already claimed this promotion.", "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။", "您已经领取过此优惠。", "คุณได้รับโปรโมชั่นนี้แล้ว")
                : t("Already claimed", "ရယူပြီးသား", "已领取", "รับแล้ว"))
              : t("Claim free bonus", "အခမဲ့ဘောနပ်စ်ရယူမည်", "领取免费奖金", "รับโบนัสฟรี")
            }}
            <template v-if="selectedPromotionObj?.fixed_bonus_amount && !selectedPromotionObj?.claimed">
              ({{ selectedPromotionObj.fixed_bonus_amount }})
            </template>
          </span>
          <span v-else>{{ t("Loading...", "လုပ်ဆောင်နေသည်...", "加载中...", "กำลังโหลด...") }}</span>
        </button>
        <button
          v-if="!isNoDepositPromotion"
          @click="goToStep2"
          :disabled="
            !selectedDepositMethod ||
            (selectedMethodHasAccounts && !selectedAccount) ||
            !depositAmountMeetsMin ||
            isLoadingPaymentTypes
          "
          class="w-full py-3.5 rounded-lg sm:rounded-xl font-semibold text-base text-white transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          :class="
            selectedDepositMethod &&
            (!selectedMethodHasAccounts || selectedAccount) &&
            depositAmountMeetsMin &&
            !isLoadingPaymentTypes
              ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
              : 'bg-white/20 cursor-not-allowed'
          "
        >
          <span v-if="!isLoadingPaymentTypes">{{ t("Next", "နောက်တစ်ခု", "下一步", "ถัดไป") }}</span>
          <span v-else>{{ t("Loading...", "လုပ်ဆောင်နေသည်...", "加载中...", "กำลังโหลด...") }}</span>
        </button>
      </div>

      <!-- Step 2: Transfer & submit (match DepositStep2) -->
      <div v-show="currentStep === 1" class="rounded-b-2xl bg-[#080E1E]">
        <!-- Step 2 header bar -->
        <div class="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/10">
          <button
            @click="goBackToStep1"
            class="flex items-center gap-2 text-white/90 hover:text-white touch-manipulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="text-sm font-medium font-['Pyidaungsu','Padauk',sans-serif]">Back</span>
          </button>
          <div class="flex items-center gap-2">
            <img
              v-if="step1Data?.depositMethodImage"
              :src="step1Data.depositMethodImage"
              :alt="step1Data.depositMethodName"
              class="w-8 h-8 rounded-full object-cover"
            />
            <div
              v-else
              class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-white/80">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                <path d="M8 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
              </svg>
            </div>
            <span class="text-base font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]">
              {{ step1Data?.depositMethodName || "Deposit" }}
            </span>
          </div>
          <div class="w-10"></div>
        </div>

        <div class="px-4 py-4 space-y-4">
          <p class="text-sm font-semibold text-center text-orange-400 font-['Pyidaungsu','Padauk',sans-serif]">
            အော်ဒါတရားဝင်ကာလ {{ orderValidTime }}
          </p>

          <!-- Order Details Card -->
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]">နာမည်</span>
                <span class="text-lg font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]">{{ accountInfo.name }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]">အကောင့်နံပါတ်</span>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-semibold text-red-400 font-['Pyidaungsu','Padauk',sans-serif]">{{ accountInfo.accountNumber }}</span>
                  <button
                    v-if="accountInfo.accountNumber"
                    @click="copyToClipboard(accountInfo.accountNumber, 'Account Number')"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium hover:bg-white/15 active:scale-95 transition-all font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    ကော်ပီ
                  </button>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]">လွှဲပြောင်းပမာဏ</span>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]">{{ Number(step1Data?.amount || 0).toLocaleString() }}</span>
                  <button
                    @click="copyToClipboard(step1Data?.amount, 'Amount')"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium hover:bg-white/15 active:scale-95 transition-all font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    ကော်ပီ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Waiting confirmation -->
          <div
            v-if="isConfirm"
            class="bg-amber-500/10 rounded-xl p-2 flex items-center gap-1 border border-amber-500/30"
          >
            <div class="shrink-0 w-12 h-12 flex items-center justify-center text-amber-400" aria-hidden="true">
              <svg class="icon-spin" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 14 14">
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.5 3.5a3.5 3.5 0 0 1-7 0v-3h7Z" />
                  <path d="M10.5 10.5a3.5 3.5 0 0 0-7 0v3h7Zm-9-10h11m-11 13h11" />
                </g>
              </svg>
            </div>
            <div class="flex-1 min-w-0 rounded-lg p-1">
              <p class="text-sm text-white/90 font-['Pyidaungsu','Padauk',sans-serif] leading-relaxed">
                မှာယူမှုနံပါတ်ကိုအောင်မြင်စွာ တင်သွင်းပြီး ပြန်လည်ဖြည့်သွင်းမှု
              </p>
              <p class="text-sm text-white/90 font-['Pyidaungsu','Padauk',sans-serif] leading-relaxed mt-1">
                အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်။
              </p>
            </div>
          </div>

          <!-- Transaction Input -->
          <div>
            <div class="bg-white/5 rounded-lg p-3 space-y-3 border border-white/10">
              <p class="text-sm font-semibold text-red-400 mb-3 font-['Pyidaungsu','Padauk',sans-serif]">
                လုပ်ငန်းစဉ်နံပါတ်၏နောက်ဆုံး 6 လုံးကိုထည့်ပါ
              </p>
              <div class="flex bg-white/10 border items-center border-white/20 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500">
                <p class="shrink-0 text-white/70 py-2.5 border-r-white/20 px-2 border-r text-[13px] font-['Pyidaungsu','Padauk',sans-serif]">အော်ဒါနံပါတ်...</p>
                <div class="relative flex-1 flex items-stretch">
                  <input
                    v-model="transactionNumber"
                    type="text"
                    placeholder="လုပ်ငန်းစဉ်နံပါတ်"
                    maxlength="6"
                    pattern="[0-9]{6}"
                    class="w-full min-w-0 bg-transparent border-0 rounded-none rounded-r-lg px-4 py-2.5 pr-16 text-white placeholder-white/40 focus:outline-none focus:ring-0 font-['Pyidaungsu','Padauk',sans-serif] text-sm"
                  />
                </div>
              </div>
            </div>
            <span v-if="errors.transactionNumber" class="text-red-500 text-xs mt-1 block font-['Pyidaungsu','Padauk',sans-serif]">
              {{ errors.transactionNumber }}
            </span>

            <button
              @click="handleSubmit"
              :disabled="transactionNumber.length !== 6 || isConfirm"
              class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 mt-4 touch-manipulation"
            >
              <span v-if="!isConfirm">တင်ပြပါ။</span>
              <span v-else>{{
                t("Waiting for confirmation", "အတည်ပြုချက်ကို စောင့်ဆိုင်းနေပါသည်", "等待确认", "กำลังรอการยืนยัน")
              }}</span>
            </button>
          </div>

          <!-- Tips section -->
          <div class="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 class="text-lg font-semibold text-red-400 mb-3 font-['Pyidaungsu','Padauk',sans-serif]">အရိပ်အမြွက်</h3>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                <p class="text-sm text-white/80 leading-relaxed font-['Pyidaungsu','Padauk',sans-serif]">
                  အော်ဒါတရားဝင်ကာလအတွင်း အော်ဒါပေးရမည်။ ကာလကျော်လွန်ပါက အော်ဒါပြန်လည်ပေးရမည်။ ငွေပမာဏနှင့် ဖုန်းနံပါတ်မှန်ကန်စွာ ထည့်သွင်းရမည်။ မှားယွင်းသောနည်းလမ်းဖြင့် ငွေလွှဲပြောင်းပါက ငွေမရရှိနိုင်ပါ။
                </p>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                <p class="text-sm text-white/80 leading-relaxed font-['Pyidaungsu','Padauk',sans-serif]">
                  ဖုန်းနံပါတ်ကို ကော်ပီကူးယူ၍ လွှဲပြောင်းရမည်။ မှန်ကန်သော အော်ဒါပေးပါက ငွေသည် အလိုအလျောက် ဂိမ်းထဲသို့ ဝင်ရောက်မည်။ ဂိမ်းထဲရှိ လက်ခံဖုန်းနံပါတ်သည် အမြဲတမ်း ပြောင်းလဲနေသောကြောင့် တစ်ခုတည်းသော နံပါတ်ကို အားကိုးအားထားပြုလုပ်ခြင်း မပြုလုပ်ရပါ။
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Promotion detail bottom sheet -->
    <VanPopup
      v-model:show="showPromotionDetailModal"
      position="bottom"
      round
      closeable
      close-on-click-overlay
      :style="{ maxHeight: '85vh' }"
      class="promotion-detail-popup font-['Pyidaungsu','Padauk',sans-serif]"
    >
      <div v-if="promotionDetail" class="p-4 pb-8 bg-white text-gray-900 overflow-y-auto" style="max-height: 85vh;">
        <h3 class="text-xl font-bold text-gray-900 mb-3">
          {{ promotionDetail.title || promotionDetail.name }}
        </h3>
        <div
          v-if="promotionDetail.description"
          class="text-gray-700 text-sm leading-relaxed mb-4 prose prose-sm max-w-none"
          v-html="promotionDetail.description"
        />
        <div class="border-t border-gray-200 pt-4 space-y-2 text-sm">
          <p class="font-semibold text-gray-800 mb-2">
            {{ t("Terms & limits", "စည်းမျဉ်းနှင့်အကန့်အသတ်", "条款与限制", "ข้อกำหนดและข้อจำกัด") }}
          </p>
          <div v-if="promotionDetail.minimum_turn_over_amount != null" class="flex justify-between">
            <span class="text-gray-600">{{ t("Min. turnover", "အနည်းဆုံးကစားအား", "最低流水", "ยอดเทิร์นโอเวอร์ขั้นต่ำ") }}</span>
            <span class="font-medium">{{ Number(promotionDetail.minimum_turn_over_amount).toLocaleString() }}</span>
          </div>
          <div v-if="promotionDetail.minimum_withdraw_times != null" class="flex justify-between">
            <span class="text-gray-600">{{ t("Min. withdraw times", "အနည်းဆုံးထုတ်ယူခြင်းအကြိမ်", "最低提款次数", "จำนวนครั้งถอนขั้นต่ำ") }}</span>
            <span class="font-medium">{{ promotionDetail.minimum_withdraw_times }}</span>
          </div>
          <div v-if="promotionDetail.promotion_percent != null" class="flex justify-between">
            <span class="text-gray-600">{{ t("Bonus %", "ဘောနပ်စ် %", "奖金%", "โบนัส %") }}</span>
            <span class="font-medium">{{ promotionDetail.promotion_percent }}%</span>
          </div>
          <div v-if="formatPromotionDateRange(promotionDetail)" class="flex justify-between">
            <span class="text-gray-600">{{ t("Valid period", "တရားဝင်ကာလ", "有效期限", "ระยะเวลาที่ใช้ได้") }}</span>
            <span class="font-medium">{{ formatPromotionDateRange(promotionDetail) }}</span>
          </div>
          <div v-if="promotionDetail.available_quantity != null" class="flex justify-between">
            <span class="text-gray-600">{{ t("Remaining", "ကျန်ရှိ", "剩余", "คงเหลือ") }}</span>
            <span class="font-medium">{{ promotionDetail.available_quantity }}</span>
          </div>
          <div v-if="promotionDetail.daily_usage_limit != null" class="flex justify-between">
            <span class="text-gray-600">{{ t("Daily limit", "နေ့စဉ်အကန့်အသတ်", "每日限用", "จำกัดต่อวัน") }}</span>
            <span class="font-medium">{{ promotionDetail.daily_usage_limit }}</span>
          </div>
          <div v-if="promotionDetail.allowed_providers?.length" class="flex flex-col gap-1">
            <span class="text-gray-600">{{ t("Allowed providers", "ခွင့်ပြုထားသော ပရိုဗိုက်ဒါများ", "适用游戏商", "ผู้ให้บริการที่อนุญาต") }}</span>
            <span class="font-medium text-gray-800">{{ (promotionDetail.allowed_providers || []).join(", ") }}</span>
          </div>
          <div v-if="promotionDetail.allowed_game_types?.length" class="flex flex-col gap-1">
            <span class="text-gray-600">{{ t("Allowed game types", "ခွင့်ပြုထားသော ဂိမ်းအမျိုးအစားများ", "适用游戏类型", "ประเภทเกมที่อนุญาต") }}</span>
            <span class="font-medium text-gray-800">{{ (promotionDetail.allowed_game_types || []).join(", ") }}</span>
          </div>
        </div>
        <button
          type="button"
          class="w-full mt-6 py-3 rounded-xl bg-red-600 text-white font-semibold"
          @click="closePromotionDetailModal"
        >
          {{ t("Close", "ပိတ်မည်", "关闭", "ปิด") }}
        </button>
      </div>
    </VanPopup>
  </div>
</template>

<style scoped>
.deposit-modal-card {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.deposit-stepper {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04) 0%,
    transparent 100%
  );
  border-radius: 12px;
  margin: 0 -0.5rem;
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

.stepper-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0;
  position: relative;
}

.stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  z-index: 1;
  transition: all 0.25s ease;
}

.stepper-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9375rem;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.stepper-step.active .stepper-dot {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25);
}

.stepper-step.done .stepper-dot {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-color: rgba(34, 197, 94, 0.4);
  color: #fff;
}

.stepper-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-num {
  line-height: 1;
}

.stepper-line {
  flex: 1;
  min-width: 24px;
  max-width: 80px;
  height: 3px;
  margin: 18px 8px 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;
}

.stepper-line.filled {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.stepper-label {
  margin-top: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  max-width: 90px;
  line-height: 1.3;
  transition: color 0.25s ease;
}

.stepper-step.active .stepper-label {
  color: rgba(255, 255, 255, 0.95);
}

.stepper-step.done .stepper-label {
  color: rgba(255, 255, 255, 0.7);
}
</style>
