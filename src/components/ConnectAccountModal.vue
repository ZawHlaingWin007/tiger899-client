<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import { showSuccessToast, showFailToast, showLoadingToast, closeToast } from "vant";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  /** 'ewallet' | 'bank' */
  mode: { type: String, default: "ewallet" },
  /** For e-wallet: user_bank_type_id from API */
  accountTypeId: { type: [Number, String], default: null },
  /** For e-wallet display: 'kbz' | 'wave' */
  walletType: { type: String, default: "wave" },
});

const emit = defineEmits(["close", "connected"]);

const { t } = useTranslation();

// E-wallet
const ewalletName = ref("");
const ewalletNumber = ref("");

// Bank
const selectedBankId = ref("");
const bankSearch = ref("");
const bankOptions = ref([]);
const bankAccountName = ref("");
const bankAccountNumber = ref("");
const isLoadingBanks = ref(false);
const bankDropdownOpen = ref(false);
const bankDropdownRef = ref(null);

const isSubmitting = ref(false);

const walletLabel = computed(() =>
  props.walletType === "kbz" ? "KBZ Pay" : "Wave Pay"
);

const walletLogoUrl = computed(() =>
  props.walletType === "kbz"
    ? "https://play-lh.googleusercontent.com/cnKJYzzHFAE5ZRepCsGVhv7ZnoDfK8Wu5z6lMefeT-45fTNfUblK_gF3JyW5VZsjFc4"
    : "https://yt3.googleusercontent.com/ytc/AIdro_n8JoWWWC4bvYfAgoHtZtoaNwDlD7kTk_CN-g6O06CaB4o=s900-c-k-c0x00ffffff-no-rj"
);

const filteredBanks = computed(() => {
  const q = bankSearch.value.trim().toLowerCase();
  if (!q) return bankOptions.value;
  return bankOptions.value.filter(
    (b) =>
      (b.labelKey || "").toLowerCase().includes(q) ||
      String(b.value || "").toLowerCase().includes(q)
  );
});

const selectedBankLabel = computed(() => {
  if (selectedBankId.value === "" || selectedBankId.value == null) return "";
  const opt = bankOptions.value.find((b) => b.value == selectedBankId.value);
  return opt ? opt.labelKey : "";
});

/** Known bank name substrings (API may return names without "bank", e.g. CB, Yoma, UAB). */
const BANK_NAME_HINTS = ["bank", "cb bank", "yoma", "uab"];

async function fetchBankTypes() {
  isLoadingBanks.value = true;
  try {
    const res = await axios.get("/user-bank-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const isBank = (item) => {
      const name = (item?.name ?? "").toString().toLowerCase();
      const cat = (item?.category ?? "").toString().toLowerCase();
      return cat === "bank" || BANK_NAME_HINTS.some((hint) => name.includes(hint));
    };
    const active = list.filter(
      (item) => item.is_active !== false && isBank(item)
    );
    bankOptions.value = active.map((item) => ({
      value: item.id,
      labelKey: item.name || "",
      ...item,
    }));
  } catch (e) {
    console.error("Fetch bank types failed:", e);
    bankOptions.value = [];
  } finally {
    isLoadingBanks.value = false;
  }
}

async function submitEwallet() {
  const name = (ewalletName.value || "").trim();
  const num = (ewalletNumber.value || "").trim();
  if (!name) {
    showFailToast({
      message: t("Please enter wallet name", "ပိုက်ဆံအိတ်အမည် ထည့်ပါ", "请输入钱包名称", "กรุณากรอกชื่อกระเป๋าเงิน"),
      position: "top",
    });
    return;
  }
  if (!num) {
    showFailToast({
      message: t("Please enter wallet number", "ပိုက်ဆံအိတ်နံပါတ် ထည့်ပါ", "请输入钱包号码", "กรุณากรอกหมายเลขกระเป๋าเงิน"),
      position: "top",
    });
    return;
  }
  if (props.accountTypeId == null) {
    showFailToast({
      message: t("Invalid account type.", "အကောင့်အမျိုးအစား မမှန်ပါ။", "账户类型无效。", "ประเภทบัญชีไม่ถูกต้อง"),
      position: "top",
    });
    return;
  }

  isSubmitting.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      "/user/user-banks",
      {
        name,
        account_number: num,
        user_bank_type_id: props.accountTypeId,
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    closeToast();
    showSuccessToast({
      message: t("Pay connected.", "Pay ချိတ်ဆက်ပြီးပါပြီ။", "电子钱包已连接", "เชื่อมต่อ Pay สำเร็จ"),
      position: "top",
    });
    ewalletName.value = "";
    ewalletNumber.value = "";
    emit("connected");
    emit("close");
  } catch (error) {
    closeToast();
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.account_number?.[0] ||
      error?.response?.data?.errors?.name?.[0] ||
      t("Failed to connect. Please try again.", "ချိတ်ဆက်၍ မရပါ။ ထပ်ကြိုးစားပါ။", "连接失败，请重试", "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmitting.value = false;
  }
}

async function submitBank() {
  const name = (bankAccountName.value || "").trim();
  const num = (bankAccountNumber.value || "").trim();
  if (!name) {
    showFailToast({
      message: t("Please enter account name", "အကောင့်အမည် ထည့်ပါ", "请输入账户名称", "กรุณากรอกชื่อบัญชี"),
      position: "top",
    });
    return;
  }
  if (!num) {
    showFailToast({
      message: t("Please enter account number", "အကောင့်နံပါတ် ထည့်ပါ", "请输入账号", "กรุณากรอกหมายเลขบัญชี"),
      position: "top",
    });
    return;
  }
  if (!selectedBankId.value) {
    showFailToast({
      message: t("Please select a bank", "ဘဏ်ရွေးချယ်ပါ", "请选择银行", "กรุณาเลือกธนาคาร"),
      position: "top",
    });
    return;
  }

  isSubmitting.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      "/user/user-banks",
      {
        name,
        account_number: num,
        user_bank_type_id: selectedBankId.value,
      },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    closeToast();
    showSuccessToast({
      message: t("Bank account connected.", "ဘဏ်အကောင့် ချိတ်ဆက်ပြီးပါပြီ။", "银行账户已连接", "เชื่อมต่อบัญชีธนาคารสำเร็จ"),
      position: "top",
    });
    bankAccountName.value = "";
    bankAccountNumber.value = "";
    selectedBankId.value = "";
    emit("connected");
    emit("close");
  } catch (error) {
    closeToast();
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.account_number?.[0] ||
      error?.response?.data?.errors?.name?.[0] ||
      t("Failed to connect. Please try again.", "ချိတ်ဆက်၍ မရပါ။ ထပ်ကြိုးစားပါ။", "连接失败，请重试", "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit("close");
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.mode === "bank") {
      fetchBankTypes();
    }
    if (!open) {
      ewalletName.value = "";
      ewalletNumber.value = "";
      bankAccountName.value = "";
      bankAccountNumber.value = "";
      selectedBankId.value = "";
      bankSearch.value = "";
      bankDropdownOpen.value = false;
    }
  }
);

function closeBankDropdown() {
  bankDropdownOpen.value = false;
}

function selectBank(opt) {
  selectedBankId.value = opt.value;
  bankDropdownOpen.value = false;
}

let clickOutsideCleanup = null;
watch(bankDropdownOpen, (open) => {
  if (clickOutsideCleanup) {
    clickOutsideCleanup();
    clickOutsideCleanup = null;
  }
  if (open) {
    const onDocClick = (e) => {
      if (bankDropdownRef.value && !bankDropdownRef.value.contains(e.target)) {
        bankDropdownOpen.value = false;
      }
    };
    setTimeout(() => document.addEventListener("click", onDocClick), 0);
    clickOutsideCleanup = () => document.removeEventListener("click", onDocClick);
  }
});
onBeforeUnmount(() => {
  if (clickOutsideCleanup) clickOutsideCleanup();
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="bg-[#080E1E] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/5"
    >
      <div class="sticky top-0 bg-[#080E1E] border-b border-white/10 px-4 py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <h2 class="text-white text-xl font-bold font-['Pyidaungsu','Padauk',sans-serif]">
          {{ mode === "bank"
            ? t("Connect Bank Account", "ဘဏ်အကောင့် ချိတ်ဆက်မည်", "连接银行账户", "เชื่อมต่อบัญชีธนาคาร")
            : t("Connect Pay", "Pay ချိတ်ဆက်မည်", "连接电子钱包", "เชื่อมต่อ Pay")
          }}
        </h2>
        <button
          type="button"
          @click="handleClose"
          class="text-white/80 hover:text-white p-2 rounded-lg"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Pay wallet form -->
        <template v-if="mode === 'ewallet'">
          <div class="flex items-center gap-3 mb-4">
            <img
              :src="walletLogoUrl"
              :alt="walletLabel"
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain bg-white/10 shrink-0"
            />
            <p class="text-white text-xl sm:text-2xl font-bold font-['Pyidaungsu','Padauk',sans-serif]">
              {{ walletLabel }}
            </p>
          </div>
          <div>
            <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Wallet name", "ပိုက်ဆံအိတ်အမည်", "钱包名称", "ชื่อกระเป๋าเงิน") }}
            </label>
            <input
              v-model="ewalletName"
              type="text"
              maxlength="100"
              :placeholder="t('Enter wallet name', 'အမည် ထည့်ပါ', '请输入钱包名称', 'กรอกชื่อกระเป๋าเงิน')"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
            />
          </div>
          <div>
            <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Wallet number", "ပိုက်ဆံအိတ်နံပါတ်", "钱包号码", "หมายเลขกระเป๋าเงิน") }}
            </label>
            <input
              v-model="ewalletNumber"
              type="text"
              maxlength="50"
              :placeholder="t('Enter wallet number', 'နံပါတ် ထည့်ပါ', '请输入钱包号码', 'กรอกหมายเลข')"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
            />
          </div>
          <button
            type="button"
            :disabled="isSubmitting || !ewalletName.trim() || !ewalletNumber.trim()"
            class="w-full py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-['Pyidaungsu','Padauk',sans-serif]"
            @click="submitEwallet"
          >
            {{ isSubmitting ? t("Connecting...", "ချိတ်ဆက်နေသည်...", "连接中...", "กำลังเชื่อมต่อ...") : t("Connect", "ချိတ်ဆက်မည်", "连接", "เชื่อมต่อ") }}
          </button>
        </template>

        <!-- Bank form -->
        <template v-else>
          <div ref="bankDropdownRef" class="relative">
            <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Select Bank", "ဘဏ်ရွေးချယ်ပါ", "选择银行", "เลือกธนาคาร") }}
            </label>
            <button
              type="button"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-left text-white placeholder-white/40 text-sm font-['Pyidaungsu','Padauk',sans-serif] flex items-center justify-between gap-2"
              :class="{ 'ring-2 ring-red-500': bankDropdownOpen }"
              @click.stop="bankDropdownOpen = !bankDropdownOpen"
            >
              <span :class="selectedBankLabel ? 'text-white' : 'text-white/50'">
                {{ selectedBankLabel || t("Select bank", "ဘဏ်ရွေးချယ်ပါ", "选择银行", "เลือกธนาคาร") }}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="shrink-0 transition-transform"
                :class="{ 'rotate-180': bankDropdownOpen }"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div
              v-show="bankDropdownOpen"
              class="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-white/20 bg-[#080E1E] shadow-xl"
            >
              <input
                v-model="bankSearch"
                type="text"
                :placeholder="t('Search bank', 'ဘဏ်ရှာမည်', '搜索银行', 'ค้นหาธนาคาร')"
                class="w-full bg-white/10 border-b border-white/20 rounded-t-lg px-4 py-2.5 text-white placeholder-white/40 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
                @click.stop
              />
              <div class="max-h-40 overflow-y-auto rounded-b-lg">
                <button
                  v-for="opt in filteredBanks"
                  :key="opt.value"
                  type="button"
                  class="w-full text-left px-4 py-2.5 text-white/90 hover:bg-white/10 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
                  :class="{ 'bg-red-600/30': selectedBankId == opt.value }"
                  @click.stop="selectBank(opt)"
                >
                  {{ opt.labelKey }}
                </button>
                <p v-if="filteredBanks.length === 0" class="px-4 py-3 text-white/50 text-sm">
                  {{ t("No bank found", "ဘဏ်မရှိပါ", "未找到银行", "ไม่พบธนาคาร") }}
                </p>
              </div>
            </div>
            <p v-if="selectedBankLabel && !bankDropdownOpen" class="text-red-400 text-sm mt-1">{{ selectedBankLabel }}</p>
          </div>
          <div>
            <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Account name", "အကောင့်အမည်", "账户名称", "ชื่อบัญชี") }}
            </label>
            <input
              v-model="bankAccountName"
              type="text"
              maxlength="100"
              :placeholder="t('Enter account name', 'အမည် ထည့်ပါ', '请输入账户名称', 'กรอกชื่อบัญชี')"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
            />
          </div>
          <div>
            <label class="block text-white/80 text-sm font-medium mb-1 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Account number", "အကောင့်နံပါတ်", "账号", "หมายเลขบัญชี") }}
            </label>
            <input
              v-model="bankAccountNumber"
              type="text"
              maxlength="50"
              :placeholder="t('Enter account number', 'နံပါတ် ထည့်ပါ', '请输入账号', 'กรอกหมายเลข')"
              class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
            />
          </div>
          <button
            type="button"
            :disabled="isSubmitting || !selectedBankId || !bankAccountName.trim() || !bankAccountNumber.trim()"
            class="w-full py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-['Pyidaungsu','Padauk',sans-serif]"
            @click="submitBank"
          >
            {{ isSubmitting ? t("Connecting...", "ချိတ်ဆက်နေသည်...", "连接中...", "กำลังเชื่อมต่อ...") : t("Connect", "ချိတ်ဆက်မည်", "连接", "เชื่อมต่อ") }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
