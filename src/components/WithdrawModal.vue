<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import { Empty as VanEmpty, Loading as VanLoading } from "vant";
import { showSuccessToast, showFailToast, showLoadingToast, closeToast } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";
import ConnectAccountModal from "./ConnectAccountModal.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const store = useStore();
const router = useRouter();
const { t } = useTranslation();
const { openWithdrawHistoryModal } = useModal();

const activeTab = ref(0);
const withdrawBankTypes = ref([
  { id: "kbz", name: "KBZ Pay", contentKey: "kbz" },
  { id: "wave", name: "Wave Pay", contentKey: "wave" },
  { id: "bank", name: "Bank Account", contentKey: "bank" },
]);
const connectedKbz = ref([]);
const connectedWave = ref([]);
const connectedBank = ref([]);
const loading = ref(false);
const withdrawAmount = ref("");
const isSubmitting = ref(false);

const showConnectModal = ref(false);
const connectMode = ref("ewallet");
const connectAccountTypeId = ref(null);
const connectWalletType = ref("wave");

const WITHDRAW_TAB_NAMES = ["Wave Pay", "KBZ Pay", "KBZ Bank"];

function contentKeyFromName(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("wave")) return "wave";
  if (n.includes("kbz") && n.includes("bank")) return "bank";
  if (n.includes("kbz")) return "kbz";
  return "bank";
}

function getBankCategory(item) {
  const name = (item?.bankType?.name ?? item?.bankType ?? "").toString().toLowerCase().trim();
  if (name.includes("wave pay")) return "wave";
  if (name.includes("kbz pay")) return "kbz";
  if (name.includes("kbz bank") && name.includes("bank")) return "bank";
  return "bank";
}

function mapUserBank(item) {
  return {
    id: item.id,
    account_number: item.account_number,
    accountNumber: item.account_number,
    number: item.account_number,
    masked_number: item.masked_number,
    bank_name: item.bankType?.name || item.name,
    connected_at: item.updated_at ?? item.created_at,
    created_at: item.created_at,
  };
}

function maskAccount(value) {
  if (!value) return "****";
  const s = String(value);
  const last4 = s.length >= 4 ? s.slice(-4) : s;
  return "********" + last4;
}

function formatAccountDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

const activeTabName = computed(() => {
  const tab = withdrawBankTypes.value[activeTab.value];
  return tab?.name ?? "";
});

const currentTab = computed(() => withdrawBankTypes.value[activeTab.value] ?? null);

function openConnectModal() {
  const tab = currentTab.value;
  if (!tab) return;
  connectAccountTypeId.value = tab.id;
  if (tab.contentKey === "bank") {
    connectMode.value = "bank";
  } else {
    connectMode.value = "ewallet";
    connectWalletType.value = tab.contentKey === "kbz" ? "kbz" : "wave";
  }
  showConnectModal.value = true;
}

function onConnectModalConnected() {
  fetchConnectedAccounts();
  showConnectModal.value = false;
}

const accountsByTab = computed(() => {
  const i = activeTab.value;
  if (i === 0) return connectedKbz.value;
  if (i === 1) return connectedWave.value;
  return connectedBank.value;
});

const selectedUserBankId = computed(() => {
  const list = accountsByTab.value;
  const first = list[0];
  return first?.id ?? null;
});

const userBalanceFormatted = computed(() =>
  Number(store.state.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
);

const turnOverAmount = computed(() => {
  const v = store.state.authUser?.turn_over_amount;
  return Number(v) || 0;
});
const turnOverAmountFormatted = computed(() =>
  Number(turnOverAmount.value || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
);
const hasUnmetTurnOver = computed(() => turnOverAmount.value > 0);
const withdrawBlockedByPromotion = computed(() => {
  if (!hasUnmetTurnOver.value) return "";
  const msg = t(
    "You need to complete the required play amount (K {amount}) before withdrawing.",
    "ငွေထုတ်ရန် ကစားအားပမာဏ (K {amount}) ပြည့်မီအောင် ကစားပြီးမှ ထုတ်ယူပါ။",
    "请先完成所需流水 (K {amount}) 后再提款。",
    "กรุณาทำยอดเทิร์นโอเวอร์ (K {amount}) ให้ครบก่อนถอนเงิน"
  );
  return msg.replace("{amount}", turnOverAmountFormatted.value);
});

const MIN_WITHDRAW_AMOUNT_MMK = 10000;
const canSubmit = computed(
  () =>
    !hasUnmetTurnOver.value &&
    selectedUserBankId.value != null &&
    withdrawAmount.value != null &&
    String(withdrawAmount.value).trim() !== "" &&
    Number(withdrawAmount.value) >= MIN_WITHDRAW_AMOUNT_MMK
);

async function fetchUserBankTypes() {
  try {
    const res = await axios.get("/user-bank-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const allowed = (name) =>
      WITHDRAW_TAB_NAMES.some((n) => String(name || "").toLowerCase() === n.toLowerCase());
    const withKey = list
      .filter((item) => item.is_active !== false && allowed(item.name))
      .map((item) => {
        const contentKey = contentKeyFromName(item.name);
        const displayName = contentKey === "bank" ? "Bank Account" : (item.name || "");
        return { id: item.id, name: displayName, contentKey };
      });
    const order = { kbz: 0, wave: 1, bank: 2 };
    withKey.sort((a, b) => (order[a.contentKey] ?? 3) - (order[b.contentKey] ?? 3));
    if (withKey.length > 0) withdrawBankTypes.value = withKey;
  } catch (e) {
    console.error("User bank types failed:", e);
  }
}

async function fetchConnectedAccounts() {
  loading.value = true;
  try {
    const res = await axios.get("/user/user-banks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const list = res?.data?.data ?? res?.data ?? [];
    const items = Array.isArray(list) ? list : [];
    const active = items.filter((a) => a.is_active !== false);
    const withCategory = active.map((item) => ({
      ...mapUserBank(item),
      _category: getBankCategory(item),
    }));
    connectedKbz.value = withCategory.filter((a) => a._category === "kbz").map(({ _category, ...r }) => r);
    connectedWave.value = withCategory.filter((a) => a._category === "wave").map(({ _category, ...r }) => r);
    connectedBank.value = withCategory.filter((a) => a._category === "bank").map(({ _category, ...r }) => r);
  } catch (e) {
    console.error("Fetch user banks failed:", e);
    connectedKbz.value = [];
    connectedWave.value = [];
    connectedBank.value = [];
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  if (!canSubmit.value) return;
  const userBankId = selectedUserBankId.value;
  const amount = parseFloat(withdrawAmount.value);
  if (userBankId == null || !Number.isFinite(amount) || amount < MIN_WITHDRAW_AMOUNT_MMK) return;

  isSubmitting.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      "/user/withdraws",
      { amount, user_bank_id: userBankId, remark: null, lang: null },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    closeToast();
    showSuccessToast({
      message: t("Withdrawal submitted.", "ငွေထုတ်တောင်းခံချက် တင်ပြီးပါပြီ။", "提现已提交", "ส่งคำขอถอนเงินแล้ว"),
      position: "top",
    });
    withdrawAmount.value = "";
    await store.dispatch("fetchUser");
    await fetchConnectedAccounts();
    handleClose();
    openWithdrawHistoryModal();
  } catch (error) {
    closeToast();
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.amount?.[0] ||
      error?.response?.data?.errors?.user_bank_id?.[0] ||
      t("Withdrawal failed. Please try again.", "ငွေထုတ်၍ မရပါ။ ထပ်ကြိုးစားပါ။", "提现失败，请重试", "ถอนเงินไม่สำเร็จ กรุณาลองใหม่");
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit("close");
  showConnectModal.value = false;
  activeTab.value = 0;
  withdrawAmount.value = "";
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      store.dispatch("fetchUser");
      fetchUserBankTypes();
      fetchConnectedAccounts();
      activeTab.value = 0;
      withdrawAmount.value = "";
    }
  }
);
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="handleClose"
  >
    <div
      class="withdraw-modal-card bg-[#080E1E] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl my-auto border border-white/5"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-[#080E1E]/95 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <h2 class="text-white text-xl sm:text-2xl font-bold font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Withdraw", "ငွေထုတ်ယူရန်", "提款", "ถอนเงิน") }}
        </h2>
        <button
          @click="handleClose"
          class="text-white/80 hover:text-white p-2 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Balance -->
      <div class="px-4 sm:px-6 py-3 border-b border-white/10 space-y-1">
        <p class="text-white/70 text-sm font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Main wallet", "အဓိကပိုက်ဆံအိတ်", "主钱包", "กระเป๋าเงินหลัก") }}: K {{ userBalanceFormatted }}
        </p>
        <p
          v-if="hasUnmetTurnOver"
          class="text-amber-400 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ withdrawBlockedByPromotion }}
        </p>
      </div>

      <!-- Custom tab bar: connected bank account types (no Vant Tabs) -->
      <div class="px-4 sm:px-6 pt-4 pb-3">
        <div class="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            v-for="(tab, index) in withdrawBankTypes"
            :key="tab.id"
            type="button"
            @click="activeTab = index"
            class="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all font-['Pyidaungsu','Padauk',sans-serif]"
            :class="
              activeTab === index
                ? 'bg-red-600 text-white shadow'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            "
          >
            {{ tab.name }}
          </button>
        </div>
      </div>

      <!-- Tab content -->
      <div class="px-4 sm:px-6 pb-6">
        <VanLoading v-if="loading" class="py-8" vertical>
          {{ t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...") }}
        </VanLoading>

        <template v-else>
          <p class="text-white/80 text-sm mt-1 mb-3 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Connected accounts", "ချိတ်ဆက်ထားသော အကောင့်များ", "已连接账户", "บัญชีที่เชื่อมต่อ") }}
            ({{ accountsByTab.length }})
          </p>

          <div
            v-if="accountsByTab.length === 0"
            class="rounded-2xl border-2 border-dashed border-white/30 bg-white/5 flex flex-col items-center justify-center py-10 px-6 cursor-pointer hover:bg-white/10 transition-colors font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openConnectModal"
          >
            <div class="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <p class="text-white font-semibold text-center">
              {{ currentTab?.contentKey === 'bank'
                ? t("Connect Bank Account", "ဘဏ်အကောင့် ချိတ်ဆက်မည်", "连接银行账户", "เชื่อมต่อบัญชีธนาคาร")
                : t("Connect Pay", "Pay ချိတ်ဆက်မည်", "连接电子钱包", "เชื่อมต่อ Pay")
              }}
            </p>
            <p class="text-white/60 text-sm mt-1 text-center">
              {{ t("Tap to add", "ချိတ်ဆက်ရန် နှိပ်ပါ", "点击添加", "แตะเพื่อเพิ่ม") }}
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(account, idx) in accountsByTab"
              :key="account.id || idx"
              class="withdraw-modal-card-item relative overflow-hidden rounded-2xl px-5 py-5 text-white font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <div class="withdraw-modal-card-pattern absolute inset-0" aria-hidden="true" />
              <div class="relative z-10 flex flex-col gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="withdraw-modal-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                    </svg>
                  </div>
                  <span class="text-xl font-semibold">{{ account.bank_name || activeTabName }}</span>
                </div>
                <p class="text-xl font-bold tracking-widest">
                  {{ account.masked_number || maskAccount(account.account_number ?? account.accountNumber ?? account.number) }}
                </p>
                <p class="withdraw-modal-card-time text-sm font-medium text-white/90 tabular-nums tracking-wide">
                  {{ formatAccountDateTime(account.connected_at ?? account.created_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Amount & Submit (only when has accounts) -->
          <template v-if="accountsByTab.length > 0">
            <div class="mt-5">
              <label class="block text-white/90 text-sm font-semibold mb-2 font-['Pyidaungsu','Padauk',sans-serif]">
                {{ t("Withdrawal amount", "ထုတ်ယူငွေပမာဏ", "提现金额", "จำนวนที่ถอน") }}
              </label>
              <input
                v-model="withdrawAmount"
                type="number"
                :min="MIN_WITHDRAW_AMOUNT_MMK"
                step="1000"
                :placeholder="t('Min 10,000 MMK', 'အနည်းဆုံး ၁၀,၀၀၀ ကျပ်', '最低 10,000 缅币', 'ขั้นต่ำ 10,000 MMK')"
                class="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 font-['Pyidaungsu','Padauk',sans-serif]"
                style="color: #fff"
              />
            </div>
            <button
              type="button"
              :disabled="!canSubmit || isSubmitting"
              class="w-full mt-4 py-3.5 rounded-lg font-semibold text-white transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 disabled:cursor-not-allowed"
              :class="canSubmit && !isSubmitting ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20'"
              @click="onSubmit"
            >
              <span v-if="!isSubmitting">{{ t("Submit", "တင်သွင်းပါ", "提交", "ส่ง") }}</span>
              <span v-else>{{ t("Submitting...", "တင်သွင်းနေသည်...", "提交中...", "กำลังส่ง...") }}</span>
            </button>
          </template>
        </template>
      </div>
    </div>

    <!-- Connect Account Modal (e-wallet or bank) -->
    <ConnectAccountModal
      :is-open="showConnectModal"
      :mode="connectMode"
      :account-type-id="connectAccountTypeId"
      :wallet-type="connectWalletType"
      @close="showConnectModal = false"
      @connected="onConnectModalConnected"
    />
  </div>
</template>

<style scoped>
.withdraw-modal-card {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Bank card style (same as mobile WithdrawPage) */
.withdraw-modal-card-item {
  background: linear-gradient(
    90deg,
    #a78bfa 0%,
    #c4b5fd 35%,
    #93c5fd 70%,
    #7dd3fc 100%
  );
  box-shadow: 0 4px 14px rgba(167, 139, 250, 0.25);
}

.withdraw-modal-card-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 5 30 0 40 Q 5 50 0 60 Q 5 70 0 80' stroke='rgba(255,255,255,0.12)' fill='none' stroke-width='1'/%3E%3Cpath d='M10 10 Q 15 25 10 40 Q 15 55 10 70 Q 15 85 10 100' stroke='rgba(255,255,255,0.1)' fill='none' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 24px 100px;
  opacity: 0.9;
}

.withdraw-modal-card-icon {
  backdrop-filter: blur(6px);
}

.withdraw-modal-card-time {
  font-family: ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.02em;
}
</style>
