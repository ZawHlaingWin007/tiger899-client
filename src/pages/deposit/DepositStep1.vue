<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import { showSuccessToast, showLoadingToast, closeToast, showDialog } from "vant";
import { getApiErrorMessage } from "../../composables/useApiError";
import {
  getPromotionClaimableAmount,
  claimableAmountMessage,
  translateClaimableAmountApiError,
} from "../../composables/usePromotionClaimable";
import { useTranslation } from "../../composables/useTranslation";
import { RadioGroup, Radio, Popup as VanPopup } from "vant";

const router = useRouter();
const store = useStore();
const { t } = useTranslation();

// Form state
const selectedDepositMethod = ref(null);
const selectedAccount = ref(null); // selected account from payment type's accounts
const depositAmount = ref("");
const selectedPromotion = ref("none"); // "none" is default
const errors = ref({});
const isLoading = ref(false);

// Promotions
const promotions = ref([]);
const isLoadingPromotions = ref(false);
const showPromotionDetailModal = ref(false);
const promotionDetail = ref(null);
const activePromoCode = ref(null);

// Deposit methods – loaded from /payment-types API
const depositMethods = ref([]);
const isLoadingPaymentTypes = ref(false);

// Map API payment type to UI shape (id, name, image, bonus, rate, min_deposit, max_deposit, accounts)
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
    console.log("Payment types API response:", res.data);
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

// Payment channels
const paymentChannels = [
  {
    id: "mmbapay",
    name: "MMBAPAY",
    bonus: "+0.9%",
  },
];

// USDT exchange rate: from selected payment type when USDT, else fallback
const usdtExchangeRateFallback = 3997.0363022185047;
const usdtDisplayRate = computed(() => {
  if (!isUSDTSelected.value) return null;
  const rate = selectedDepositMethodDetails.value?.rate;
  return rate != null ? rate : usdtExchangeRateFallback;
});

// Get selected deposit method bonus
const selectedMethodBonus = computed(() => {
  return selectedDepositMethodDetails.value?.bonus || null;
});

// Get payment channels with bonus from selected method
const channelsWithBonus = computed(() => {
  return paymentChannels.map((channel) => ({
    ...channel,
    bonus: selectedMethodBonus.value || channel.bonus,
  }));
});

// Check if USDT is selected (by method name, since API id is numeric)
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

// Select deposit method
const selectDepositMethod = (method) => {
  selectedDepositMethod.value = method.id;
  selectedAccount.value = null;
  errors.value.method = null;
  errors.value.account = null;
};

// Select account (from selected payment type's accounts)
const selectAccount = (account) => {
  selectedAccount.value = account;
  errors.value.account = null;
};

// Whether selected method has accounts (so we require account selection)
const selectedMethodHasAccounts = computed(() => {
  const list = selectedDepositMethodDetails.value?.accounts;
  return Array.isArray(list) && list.length > 0;
});

/** When payment type has no min/max set (null or <= 0), use these defaults (aligned with API). */
const DEFAULT_MIN_DEPOSIT = 1000;
const DEFAULT_MAX_DEPOSIT = 100000;

function resolveDepositLimits(method) {
  if (!method) {
    return { min: DEFAULT_MIN_DEPOSIT, max: DEFAULT_MAX_DEPOSIT };
  }
  let min = method.min_deposit;
  let max = method.max_deposit;
  min =
    min != null && Number.isFinite(min) && min > 0 ? min : DEFAULT_MIN_DEPOSIT;
  max =
    max != null && Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX_DEPOSIT;
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return { min, max };
}

const effectiveDepositLimits = computed(() =>
  resolveDepositLimits(selectedDepositMethodDetails.value),
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

const depositAmountInRange = computed(() => {
  const n = Number(depositAmount.value);
  if (
    depositAmount.value == null ||
    String(depositAmount.value).trim() === "" ||
    !Number.isFinite(n)
  ) {
    return false;
  }
  if (requiredClaimableAmount.value && n < requiredClaimableAmount.value) {
    return false;
  }
  const { min, max } = effectiveDepositLimits.value;
  return n >= min && n <= max;
});

/** Rate used for “you will receive” preview (same idea as API credit: amount × rate). */
const creditPreviewRate = computed(() => {
  const m = selectedDepositMethodDetails.value;
  if (!m) return null;
  const r = m.rate;
  if (r != null && Number.isFinite(r) && r > 0) return r;
  if (isUSDTSelected.value) return usdtExchangeRateFallback;
  return null;
});

const showRateAndCreditPreview = computed(() => {
  const r = creditPreviewRate.value;
  return r != null && r > 1;
});

const creditedBalancePreview = computed(() => {
  if (!showRateAndCreditPreview.value) return null;
  const amt = Number(depositAmount.value);
  const rate = creditPreviewRate.value;
  if (!Number.isFinite(amt) || amt <= 0 || rate == null) return null;
  return amt * rate;
});
const userBalance = computed(() => {
  const fromStore = Number(store.state.amount ?? store.state.authUser?.amount ?? 0);
  return Number.isFinite(fromStore) ? fromStore : 0;
});
const hasActivePromoCodeBalanceRestriction = computed(() => {
  return !!activePromoCode.value && userBalance.value > 50;
});

const fetchActivePromoCode = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("/user/promo-codes/active", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    activePromoCode.value = res?.data?.data ?? res?.data ?? null;
  } catch (error) {
    activePromoCode.value = null;
  }
};

// Validate form
const validateForm = () => {
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

  if (selectedDepositMethod.value) {
    const { min, max } = effectiveDepositLimits.value;
    const amount = Number(depositAmount.value);
    if (!depositAmount.value || !Number.isFinite(amount)) {
      errors.value.amount = t(
        "Please enter a valid deposit amount",
        "ငွေသွင်းပမာဏကို မှန်ကန်စွာထည့်ပါ",
        "请输入有效的充值金额",
        "กรุณากรอกจำนวนเงินฝากที่ถูกต้อง",
      );
      isValid = false;
    } else if (amount < min) {
      errors.value.amount = t(
        `Minimum deposit is K ${min.toLocaleString()}`,
        `အနည်းဆုံးငွေသွင်းပမာဏ K ${min.toLocaleString()}`,
        `最低充值 K ${min.toLocaleString()}`,
        `ฝากขั้นต่ำ K ${min.toLocaleString()}`,
      );
      isValid = false;
    } else if (amount > max) {
      errors.value.amount = t(
        `Maximum deposit is K ${max.toLocaleString()}`,
        `အများဆုံးငွေသွင်းပမာဏ K ${max.toLocaleString()}`,
        `最高充值 K ${max.toLocaleString()}`,
        `ฝากสูงสุด K ${max.toLocaleString()}`,
      );
      isValid = false;
    } else if (requiredClaimableAmount.value && amount < requiredClaimableAmount.value) {
      errors.value.amount = claimableAmountMessage(t, requiredClaimableAmount.value);
      isValid = false;
    }
  }

  if (hasActivePromoCodeBalanceRestriction.value) {
    errors.value.amount = t(
      `You claimed promo code ${activePromoCode.value?.promo_code || ""}. Deposit is allowed only when your balance is under 50.`,
      `သင် claim လုပ်ထားသော promo code ${activePromoCode.value?.promo_code || ""} ရှိနေသဖြင့် လက်ကျန်ငွေ 50 အောက်မှသာ ငွေသွင်းနိုင်ပါသည်။`,
      `您已领取优惠码 ${activePromoCode.value?.promo_code || ""}，余额低于 50 时才可充值。`,
      `คุณได้รับโค้ดโปรโมชั่น ${activePromoCode.value?.promo_code || ""} แล้ว จึงต้องฝากได้เมื่อยอดคงเหลือต่ำกว่า 50 เท่านั้น`
    );
    isValid = false;
  }

  return isValid;
};

// Fetch all active promotions (same as promotion list page); validation happens on submit
const fetchPromotions = async () => {
  const msg = t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...");
  showLoadingToast({ message: msg, duration: 0, forbidClick: true });
  try {
    isLoadingPromotions.value = true;
    const token = localStorage.getItem("token");
    const res = await axios.get("/promotions?active=1", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    // API returns { data: [...] } from Resource::collection
    const raw = res.data?.data ?? res.data;
    promotions.value = Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error("Error fetching promotions:", error);
    promotions.value = [];
  } finally {
    isLoadingPromotions.value = false;
    closeToast();
  }
};

// Handle promotion selection and open detail modal when selecting a promotion (not "none")
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

// No-deposit (free money) promotion: user can claim without entering deposit amount
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
  const explicitNoDeposit = promotion.no_deposit === true || promotion.no_deposit === 1 ||
    promotion.is_no_deposit === true || promotion.is_no_deposit === 1;
  return noDepositFlag || hasFixedBonus || explicitNoDeposit;
}
const isNoDepositPromotion = computed(() => {
  const prom = selectedPromotionObj.value;
  const ok = prom && isNoDepositPromo(prom);
  if (prom && import.meta.env?.DEV) {
    console.log("[Deposit] selected promotion", {
      id: prom.id,
      name: prom.name || prom.title,
      requires_deposit: prom.requires_deposit,
      fixed_bonus_amount: prom.fixed_bonus_amount,
      isNoDeposit: ok,
    });
  }
  return !!ok;
});
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

// Handle next step
const handleNext = async () => {
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

  if (!validateForm()) {
    if (hasActivePromoCodeBalanceRestriction.value) {
      await showDialog({
        title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
        message: errors.value.amount,
        confirmButtonText: t("OK", "အိုကေ", "确定", "ตกลง"),
        theme: "round-button",
      });
    }
    return;
  }

  const selectedMethod = selectedDepositMethodDetails.value;
  const limits = resolveDepositLimits(selectedMethod);

  // Save data to sessionStorage for step 2 (include selected account for transfer info and API)
  const step1Data = {
    depositMethod: selectedDepositMethod.value,
    depositMethodName: selectedMethod?.name || "",
    depositMethodImage: selectedMethod?.image || "",
    selectedAccount: selectedAccount.value
      ? {
        id: selectedAccount.value.id,
        number: selectedAccount.value.number,
        account_name: selectedAccount.value.account_name,
        name: selectedAccount.value.name,
      }
      : null,
    amount: depositAmount.value,
    min_deposit: limits.min,
    max_deposit: limits.max,
    promotion:
      selectedPromotion.value === "none" ? null : selectedPromotion.value,
    claimable_amount: requiredClaimableAmount.value || null,
    exchangeRate: isUSDTSelected.value ? usdtDisplayRate.value : null,
  };
  console.log("Step 1 data to save for step 2:", step1Data);

  sessionStorage.setItem("depositStep1Data", JSON.stringify(step1Data));

  // Navigate to next step
  router.push({ name: "deposit-step-2" });
};

// Load payment types and promotions on mount
onMounted(() => {
  fetchPaymentTypes();
  fetchPromotions();
  fetchActivePromoCode();
});

// Go back
const goBack = () => {
  router.push({ name: "home" });
};
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F2] pb-24 md:pb-28 pt-16 md:pt-20">
    <!-- Top Navigation Bar - Fixed -->
    <div
      class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between max-w-[100vw]"
    >
      <div class="w-full max-w-5xl mx-auto flex items-center justify-between">
        <!-- Back Button -->
        <button
          @click="goBack"
          class="text-white p-1 -ml-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
          :aria-label="t('Back', 'ပြန်သွားမည်', '返回', 'กลับ')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6 sm:w-7 sm:h-7"
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

        <!-- Title -->
        <h1
          class="text-xl sm:text-2xl md:text-3xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif] truncate max-w-[50vw]"
        >
          {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
        </h1>

        <!-- Right Icons -->
        <div class="flex items-center gap-2 sm:gap-3">
          <img
            src="/deposit.png"
            alt=""
            class="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white shrink-0"
          />
          <img
            src="/service.png"
            alt=""
            class="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white shrink-0"
          />
        </div>
      </div>
    </div>

    <!-- Content - constrained on large screens; extra bottom padding when Claim free bonus bar is shown -->
    <div
      class="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
      :class="{ 'pb-32': isNoDepositPromotion }"
    >
      <div class="space-y-3 sm:space-y-4 md:space-y-5">
        <template v-if="!isNoDepositPromotion">
        <!-- Deposit System Selection (ငွေသွင်းစနစ်) -->
        <div class="bg-white rounded-lg sm:rounded-xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div>
            <div class="flex items-center gap-2 mb-3 sm:mb-4">
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FB9E00] rounded-full shrink-0"></div>
              <h2
                class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]"
              >
                {{ t("Deposit system", "ငွေသွင်းစနစ်", "充值方式", "ระบบฝากเงิน") }}
              </h2>
            </div>

            <!-- Deposit Method Cards Grid - responsive columns -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <button
                v-for="method in depositMethods"
                :key="method.id"
                @click="selectDepositMethod(method)"
                class="relative bg-white flex overflow-hidden items-center justify-center flex-col border-2 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 transition-all min-h-[100px] sm:min-h-[120px] md:min-h-[130px] touch-manipulation"
                :class="selectedDepositMethod === method.id
                    ? 'border-red-500'
                    : 'border-gray-200 hover:border-gray-300'
                  "
              >
                <!-- Method Image (placeholder when API has no image) -->
                <img
                  v-if="method.image"
                  :src="method.image"
                  :alt="method.name"
                  class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain shrink-0 rounded-lg"
                />
                <div
                  v-else
                  class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-lg sm:text-xl font-semibold shrink-0"
                >
                  {{ (method.name || "?").charAt(0) }}
                </div>

                <!-- Method Name -->
                <p
                  class="text-sm sm:text-base md:text-lg mt-1.5 sm:mt-2 font-semibold text-gray-900 text-center font-['Pyidaungsu','Padauk',sans-serif] line-clamp-2 wrap-break-word">
                  {{ method.name }}
                </p>
                <p class="text-xs sm:text-sm text-red-500 font-semibold text-center mt-0.5">
                  {{ method.bonus }}
                </p>

                <!-- Selected Checkmark -->
                <div
                  v-if="selectedDepositMethod === method.id"
                  class="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    class="text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              </button>
            </div>

            <span
              v-if="errors.method"
              class="text-red-500 text-xs sm:text-sm mt-2 block font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ errors.method }}
            </span>
          </div>

          <!-- Important Instructions -->
          <p
            class="text-sm sm:text-base md:text-lg mt-4 sm:mt-5 text-red-500 leading-relaxed font-medium font-['Pyidaungsu','Padauk',sans-serif]">
            {{
              t(
                "Please enter the deposit amount and submit. After transfer, enter the last 5 digits of the transaction number correctly. We kindly ask you to use KPay and WavePay correctly.",
                "ငွေသွင်းမည့်ပမာနတိုင်းငွေသွင်းစာရင်တင်ပေးပါ။ငွေလွဲပြီးနောက် လုပ်ငန်းစဉ်နံပတ် နောက် ၅ လုံးကို မှန်ကန်စွာဖြည့်ပြီးတင်ပြပါရန် ၊ Kpay နှင့် Wavepay မှားမလွဲ ရန် မေတ္တာရပ်ခံပါသည်။",
                "请填写充值金额并提交。转账后请正确填写交易号后5位。请正确使用KPay和WavePay。",
                "กรุณากรอกจำนวนเงินฝากและส่ง หลังโอนเงิน กรุณากรอกตัวเลข 5 หลักสุดท้ายของหมายเลขธุรกรรมให้ถูกต้อง ขอความร่วมมือใช้ KPay และ WavePay ให้ถูกต้อง"
              )
            }}
          </p>
        </div>

        <!-- Select Account (အကောင့်ရွေးချယ်ပါ) - shown when payment type has accounts -->
        <div
          v-if="
            selectedDepositMethod &&
            selectedDepositMethodDetails?.accounts?.length
          "
          class="bg-white rounded-lg sm:rounded-xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 space-y-4"
        >
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#B56F85] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{
                t("Select account", "အကောင့်ရွေးချယ်ပါ", "选择账户", "เลือกบัญชี")
              }}
            </h2>
          </div>

          <div class="space-y-2 sm:space-y-3">
            <button
              v-for="acc in selectedDepositMethodDetails.accounts"
              :key="acc.id"
              type="button"
              @click="selectAccount(acc)"
              class="w-full text-left bg-gray-50 border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-colors font-['Pyidaungsu','Padauk',sans-serif] touch-manipulation hover:bg-gray-100"
              :class="selectedAccount?.id === acc.id
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
                "
            >
              <p class="text-sm sm:text-base font-semibold text-gray-900">
                {{ acc.name || acc.account_name || `Account ${acc.id}` }}
              </p>
              <p class="text-xs sm:text-sm text-gray-600 mt-0.5">
                {{ acc.number || acc.account_number || "" }}
              </p>
              <p
                v-if="acc.account_name && acc.name !== acc.account_name"
                class="text-xs sm:text-sm text-gray-500 mt-0.5"
              >
                {{ acc.account_name }}
              </p>
            </button>
          </div>

          <span
            v-if="errors.account"
            class="text-red-500 text-xs sm:text-sm mt-1 block font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ errors.account }}
          </span>
        </div>

        <!-- Deposit Amount (သွင်းငွေပမာဏ) -->
        <div class="bg-white rounded-lg sm:rounded-xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 space-y-4">
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FD5680] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Deposit amount", "သွင်းငွေပမာဏ", "充值金额", "จำนวนเงินฝาก") }}
            </h2>
          </div>

          <div class="relative">
            <div
              v-if="isUSDTSelected"
              class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-sm sm:text-base"
            >
              -
            </div>
            <input
              v-model="depositAmount"
              type="number"
              :placeholder="`${effectiveDepositLimits.min.toLocaleString()} – ${effectiveDepositLimits.max.toLocaleString()}`"
              :min="effectiveDepositLimits.min"
              :max="effectiveDepositLimits.max"
              class="w-full bg-gray-50 border border-gray-300 rounded-lg sm:rounded-xl px-4 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
              :class="isUSDTSelected ? 'pl-10 sm:pl-12' : ''"
              style="color: #172240"
            />
            <div
              v-if="!isUSDTSelected"
              class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div
              v-else
              class="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-sm sm:text-base"
            >
              USDT
            </div>
          </div>

          <!-- Exchange rate / bonus rate and credited balance preview (rate > 1, same as API: amount × rate) -->
          <div
            v-if="showRateAndCreditPreview && creditPreviewRate != null"
            class="mt-3 sm:mt-4 space-y-2 p-3 sm:p-4 bg-gray-50 rounded-lg"
          >
            <template v-if="isUSDTSelected">
              <p class="text-sm sm:text-base text-red-600 font-['Pyidaungsu','Padauk',sans-serif]">
                - USDT
              </p>
              <p class="text-sm sm:text-base text-red-600 font-['Pyidaungsu','Padauk',sans-serif]">
                {{ t("Exchange rate", "ငွေလဲလှယ်နှုန်း", "汇率", "อัตราแลกเปลี่ยน") }}:
              </p>
              <p class="text-base sm:text-lg md:text-xl font-bold text-red-600 font-['Pyidaungsu','Padauk',sans-serif]">
                1 USDT = K
                {{
                  creditPreviewRate.toLocaleString("en-US", {
                    maximumFractionDigits: 21,
                  })
                }}
              </p>
            </template>
            <template v-else>
              <p class="text-sm sm:text-base text-gray-800 font-['Pyidaungsu','Padauk',sans-serif]">
                {{ t("Rate", "နှုန်း", "汇率/倍率", "อัตรา") }}:
                <span class="font-bold text-red-600">{{ creditPreviewRate.toLocaleString() }}</span>
              </p>
            </template>
            <p
              v-if="creditedBalancePreview != null"
              class="text-sm sm:text-base text-gray-900 font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("You will receive about", "လက်ခံမည့်ပမာဏ ", "预计到账约", "จะได้รับประมาณ") }}:
              <span class="text-red-600">
                K {{ creditedBalancePreview.toLocaleString("en-US", { maximumFractionDigits: 2 }) }}
              </span>
            </p>
          </div>

          <span
            v-if="errors.amount || claimableAmountError"
            class="text-red-500 text-xs sm:text-sm mt-1 block font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ errors.amount || claimableAmountError }}
          </span>
        </div>

        </template>

        <!-- Promotion Selection (လှုပ်ရှားမှု) -->
        <div class="bg-white rounded-lg sm:rounded-xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 space-y-4">
          <div class="flex items-center gap-2 mb-3 sm:mb-4">
            <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FF97EE] rounded-full shrink-0"></div>
            <h2
              class="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Promotion", "လှုပ်ရှားမှု", "优惠活动", "โปรโมชั่น") }}
            </h2>
          </div>

          <RadioGroup
            v-model="selectedPromotion"
            @update:model-value="handlePromotionChange"
          >
            <!-- Promotion Options -->
            <div
              v-for="promotion in promotions"
              :key="promotion.id"
              role="button"
              tabindex="0"
              class="mb-3 rounded-lg sm:rounded-xl p-3 sm:p-4 py-4 sm:py-5 cursor-pointer transition-all touch-manipulation border-2"
              :class="selectedPromotion == promotion.id
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'"
              @click="handlePromotionChange(promotion.id, promotion)"
              @keydown.enter.space.prevent="handlePromotionChange(promotion.id, promotion)"
            >
              <Radio
                :name="promotion.id"
                :label="false"
                class="flex items-center pointer-events-none"
              >
                <template #icon="{ checked }">
                  <div
                    class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    :class="checked
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300 bg-white'
                      "
                  >
                    <div
                      v-if="checked"
                      class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                    ></div>
                  </div>
                </template>
                <div class="flex-1 ml-3 min-w-0">
                  <p class="text-sm sm:text-base font-medium text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
                    {{ (promotion.title || promotion.name) }}
                  </p>
                  <p
                    v-if="getPromotionClaimableAmount(promotion)"
                    class="text-xs text-gray-500 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Min. deposit", "အနည်းဆုံးငွေသွင်း", "最低存款", "ฝากขั้นต่ำ") }}:
                    {{ getPromotionClaimableAmount(promotion).toLocaleString() }}
                  </p>
                  <p
                    v-if="promotion.claim_once_per_user && promotion.claimed"
                    class="text-xs text-amber-600 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("You have already claimed this promotion.", "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။", "您已经领取过此优惠。", "คุณได้รับโปรโมชั่นนี้แล้ว") }}
                  </p>
                </div>
              </Radio>
            </div>

            <!-- No Promotion Option (Default Selected) -->
            <div
              role="button"
              tabindex="0"
              class="rounded-lg sm:rounded-xl p-3 sm:p-4 py-4 sm:py-5 cursor-pointer transition-all touch-manipulation border-2"
              :class="selectedPromotion === 'none'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'"
              @click="handlePromotionChange('none', null)"
              @keydown.enter.space.prevent="handlePromotionChange('none', null)"
            >
              <Radio
                name="none"
                :label="false"
                class="flex items-center pointer-events-none"
              >
                <template #icon="{ checked }">
                  <div
                    class="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                    :class="checked
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300 bg-white'
                      "
                  >
                    <div
                      v-if="checked"
                      class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"
                    ></div>
                  </div>
                </template>
                <div class="flex-1 ml-3 min-w-0">
                  <p class="text-base sm:text-lg font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
                    {{
                      t(
                        "Do not participate in any promotion",
                        "မည်သည့်ပရိုမိုးရှင်းတွင်မှမပါဝင်ပါ",
                        "不参与任何优惠",
                        "ไม่เข้าร่วมโปรโมชั่นใดๆ"
                      )
                    }}
                  </p>
                </div>
              </Radio>
            </div>
          </RadioGroup>

          <!-- Loading State -->
          <div
            v-if="isLoadingPromotions"
            class="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Loading promotions...",
                "လုပ်ဆောင်နေသည်...",
                "正在加载优惠...",
                "กำลังโหลดโปรโมชั่น...",
              )
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Promotion detail modal (bottom sheet) -->
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
        <!-- Title -->
        <h3 class="text-xl font-bold text-gray-900 mb-3">
          {{ promotionDetail.title || promotionDetail.name }}
        </h3>
        <!-- Description -->
        <div
          v-if="promotionDetail.description"
          class="text-gray-700 text-sm leading-relaxed mb-4 prose prose-sm max-w-none"
          v-html="promotionDetail.description"
        />
        <!-- Limits & details -->
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
          <div v-if="getPromotionClaimableAmount(promotionDetail)" class="flex justify-between">
            <span class="text-gray-600">{{ t("Claimable amount", "ရယူရန် လိုအပ်သော ပမာဏ", "最低存款", "ยอดฝากขั้นต่ำ") }}</span>
            <span class="font-medium">{{ getPromotionClaimableAmount(promotionDetail).toLocaleString() }}</span>
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

    <!-- Bottom: Claim free bonus (no-deposit) and/or Next (deposit) -->
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] p-4 sm:p-5 md:p-6">
      <div class="w-full max-w-5xl mx-auto space-y-3">
        <!-- Claim free bonus - when a no-deposit promotion is selected -->
        <button
          v-if="isNoDepositPromotion"
          @click="claimFreePromotion"
          :disabled="isClaimingFree || (selectedPromotionObj && selectedPromotionObj.claimed)"
          class="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 touch-manipulation border-2 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 active:scale-[0.98]"
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
        <!-- Next - deposit flow (hidden when free-money promotion selected) -->
        <button
          v-if="!isNoDepositPromotion"
          @click="handleNext"
          :disabled="isLoading ||
            !selectedDepositMethod ||
            (selectedMethodHasAccounts && !selectedAccount) ||
            !depositAmountInRange
            "
          class="w-full bg-gray-400 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 touch-manipulation"
          :class="selectedDepositMethod &&
              (!selectedMethodHasAccounts || selectedAccount) &&
              depositAmountInRange &&
              !isLoading
              ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
              : ''
            "
        >
          <span v-if="!isLoading">{{ t("Next", "နောက်တစ်ခု", "下一步", "ถัดไป") }}</span>
          <span v-else>{{ t("Loading...", "လုပ်ဆောင်နေသည်...", "加载中...", "กำลังโหลด...") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Extra bottom padding for notched devices (e.g. iPhone) */
.fixed.bottom-0 {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .fixed.bottom-0 {
    padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  }
}

@media (min-width: 768px) {
  .fixed.bottom-0 {
    padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
