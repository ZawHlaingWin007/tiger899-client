<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import {
  Tabs as VanTabs,
  Tab as VanTab,
  Empty as VanEmpty,
  Loading as VanLoading,
  showDialog,
  showSuccessToast,
  showLoadingToast,
  closeToast,
} from "vant";
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";
import axios from "axios";

const router = useRouter();
const { openWithdrawHistoryModal } = useModal();
const store = useStore();
const { t } = useTranslation();
const activePaymentTab = ref(0);

const userBalanceFormatted = computed(() =>
  Number(store.state.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
);

const turnOverAmount = computed(() => {
  const v = store.state.authUser?.turn_over_amount;
  return Number(v) || 0;
});
const turnOverAmountFormatted = computed(() =>
  Number(turnOverAmount.value || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
);
const hasUnmetTurnOver = computed(() => turnOverAmount.value > 0);
const turnOverWarningMessage = computed(() => {
  const msg = t(
    "You need to complete the required play amount (K {amount}) before withdrawing.",
    "ငွေထုတ်ရန် ကစားအားပမာဏ (K {amount}) ပြည့်မီအောင် ကစားပြီးမှ ထုတ်ယူပါ။",
    "请先完成所需流水 (K {amount}) 后再提款。",
    "กรุณาทำยอดเทิร์นโอเวอร์ (K {amount}) ให้ครบก่อนถอนเงิน"
  );
  return msg.replace("{amount}", turnOverAmountFormatted.value);
});

/** All connected user banks (flat list), used to build one-tab-per-account. */
const userBanksList = ref([]);
const loadingUserBanks = ref(true);

// Withdrawal info (can be filled from API later)
const withdrawInfo = ref({
  withdrawalTime: 24,
  dailyLimit: 10,
  remainingWithdrawals: 10,
});

// Today's total withdrawn amount (from withdraw history API)
const withdrawnTodayAmount = ref(0);
const withdrawnTodayFormatted = computed(() =>
  Number(withdrawnTodayAmount.value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }),
);

const requiredWagering = ref("1,025.37");

// Withdrawal form (amount only)
const withdrawAmount = ref("");
const isSubmittingWithdraw = ref(false);

/** Tabs: one per connected account (with logo/name) + last tab "Connect account". */
const withdrawTabs = computed(() => {
  const accounts = userBanksList.value;
  const tabs = accounts.map((acc) => {
    const contentKey = acc._category || "bank";
    const name =
      contentKey === "kbz"
        ? "KBZ Pay"
        : contentKey === "wave"
        ? "Wave Pay"
        : contentKey === "cb"
        ? "CB Pay"
        : contentKey === "aya"
        ? "Aya Pay"
        : contentKey === "ayabank"
        ? "Aya Bank"
        : contentKey === "kbzbank"
        ? "KBZ Bank"
        : contentKey === "yomabank"
        ? "Yoma Bank"
        : contentKey === "uabbank"
        ? "UAB Bank"
        : contentKey === "usdttrc20"
        ? "USDT TRC20"
        : contentKey === "usdterc20"
        ? "USDT ERC-20"
        : contentKey === "btc"
        ? "BTC"
        : contentKey === "eth"
        ? "ETH"
        : acc.bank_name || acc.bankName || "Bank";
    return {
      type: "account",
      id: acc.id,
      contentKey,
      name,
      logo_url: acc.logo_url || null,
      account: acc,
    };
  });
  tabs.push({
    type: "connect",
    id: "connect",
    contentKey: "connect",
    name: "Connect account",
  });
  return tabs;
});

/** Currently selected tab (account or connect). */
const currentWithdrawTab = computed(() => {
  const tabs = withdrawTabs.value;
  const idx = activePaymentTab.value;
  return tabs[idx] || null;
});

/** Selected account id for submit: active tab's account id when tab is an account. */
const selectedUserBankId = computed(() => {
  const tab = currentWithdrawTab.value;
  if (tab?.type === "account" && tab?.id) return tab.id;
  return null;
});

const MIN_WITHDRAW_AMOUNT_MMK = 10000;
const canSubmitWithdraw = computed(
  () =>
    !hasUnmetTurnOver.value &&
    selectedUserBankId.value != null &&
    withdrawAmount.value != null &&
    String(withdrawAmount.value).trim() !== "" &&
    Number(withdrawAmount.value) >= MIN_WITHDRAW_AMOUNT_MMK,
);

async function onSubmitWithdraw() {
  const userBankId = selectedUserBankId.value;
  const amount = parseFloat(withdrawAmount.value);
  if (userBankId == null || !Number.isFinite(amount) || amount < MIN_WITHDRAW_AMOUNT_MMK) return;

  isSubmittingWithdraw.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      "/user/withdraws",
      {
        amount,
        user_bank_id: userBankId,
        remark: null,
        lang: null,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );
    closeToast();
    showSuccessToast({
      message: t(
        "Withdrawal submitted.",
        "ငွေထုတ်တောင်းခံချက် တင်ပြီးပါပြီ။",
        "提现已提交",
        "ส่งคำขอถอนเงินแล้ว",
      ),
      position: "top",
    });
    withdrawAmount.value = "";
    await store.dispatch("fetchUser");
    await fetchConnectedAccounts();
    openWithdrawHistoryModal();
  } catch (error) {
    closeToast();
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.amount?.[0] ||
      error?.response?.data?.errors?.user_bank_id?.[0] ||
      t(
        "Withdrawal failed. Please try again.",
        "ငွေထုတ်၍ မရပါ။ ထပ်ကြိုးစားပါ။",
        "提现失败，请重试",
        "ถอนเงินไม่สำเร็จ กรุณาลองใหม่",
      );
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: msg,
      confirmButtonText: t("OK", "အိုကေ", "确定", "ตกลง"),
      theme: "round-button",
    });
  } finally {
    isSubmittingWithdraw.value = false;
  }
}

function onConfirmRequirements() {
  // Handle confirm – e.g. proceed with withdrawal
}

const DEFAULT_LOGO = {
  kbz: "https://play-lh.googleusercontent.com/_mHHv8vs7kKh3eusAOV-hFFsGGPLWNsmSiKLCVwvN8oisVUbA92cfgadtift2Sfdb4o",
  wave: "https://yt3.googleusercontent.com/ytc/AIdro_n8JoWWWC4bvYfAgoHtZtoaNwDlD7kTk_CN-g6O06CaB4o=s900-c-k-c0x00ffffff-no-rj",
  cb: "https://play-lh.googleusercontent.com/ErPz7wvjl-tmKkfsTDtxz4XepVocji0Mo0k9Somq7ydxA7y49JHU9EnGMUGDUY9Nveq-",
  aya: "https://play-lh.googleusercontent.com/Lgulng3ncFuuFVYTmT-JQxuZ_IQ9-iPCojY5lM6c3wK9uvSx_ZRqLGcq8dTQcez1HDvQiSvfmJHZN1EHg1oWfLk",
  ayabank: "https://play-lh.googleusercontent.com/1jHtoS0x173CQwK9Pg2VnNTttB01AQkAf58C6bcv0JSqj-go-p0JMfnPJBdoZ_ElCg",
  kbzbank: "https://play-lh.googleusercontent.com/_mHHv8vs7kKh3eusAOV-hFFsGGPLWNsmSiKLCVwvN8oisVUbA92cfgadtift2Sfdb4o",
  yomabank: "https://play-lh.googleusercontent.com/260LJ7YiUpIjxwcWLzR7gcR59sLZr4-psXFrczW_ujcMdXjnLgqJwv-jVdaVXtUVp0xs=w240-h480-rw",
  uabbank: "https://www.uab.com.mm/wp-content/uploads/2020/01/UAB-New-Logo-.-e1736415840696.jpg",
  bank: "https://images.9734232.com/mcs-images/bank_type/MT2/MY_1_20251021141958323.jpeg",
  usdttrc20: "https://zengo.com/wp-content/uploads/USDT-TRC20.png",
  usdterc20: "https://zengo.com/wp-content/uploads/USDT-ERC20.png",
  btc: "https://s2.coinmarketcap.com/static/img/coins/200x200/1.png",
  eth: "https://s2.coinmarketcap.com/static/img/coins/200x200/1027.png",
  crypto: "https://cdn-icons-png.flaticon.com/512/825/825454.png",
};
function getTabLogo(tab) {
  return tab?.logo_url || DEFAULT_LOGO[tab?.contentKey] || null;
}

function maskAccount(value) {
  if (!value) return "****";
  const s = String(value);
  const last4 = s.length >= 4 ? s.slice(-4) : s;
  return "********" + last4;
}

function formatAccountDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toISOString().slice(0, 10);
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

/** Categorize user bank by bankType.name for logo/tab (kbz, wave, cb, aya, ayabank, kbzbank, yomabank, uabbank, bank, usdttrc20, usdterc20, btc, eth, crypto). */
function getBankCategory(item) {
  const name = (item?.bankType?.name ?? item?.bankType ?? "")
    .toString()
    .toLowerCase()
    .trim();
  if (name.includes("wave pay") || name.includes("wave")) return "wave";
  if (name.includes("kbz pay")) return "kbz";
  if (name.includes("cb pay") || name.includes("cb")) return "cb";
  if (name.includes("aya pay")) return "aya";
  if ((name.includes("usdt") && (name.includes("trc20") || name.includes("trc"))) || (name.includes("trc20") && name.includes("usdt"))) return "usdttrc20";
  if ((name.includes("usdt") && (name.includes("erc20") || name.includes("erc"))) || (name.includes("erc20") && name.includes("usdt"))) return "usdterc20";
  if (name.includes("btc") || name.includes("bitcoin")) return "btc";
  if (name.includes("eth") || name.includes("ethereum")) return "eth";
  if (name.includes("usdt") || name.includes("crypto") || name.includes("erc") || name.includes("trc")) return "crypto";
  if (name.includes("aya bank")) return "ayabank";
  if (name.includes("kbz bank")) return "kbzbank";
  if (name.includes("yoma bank") || name.includes("yoma")) return "yomabank";
  if (name.includes("uab bank") || name.includes("uab")) return "uabbank";
  if (name.includes("bank")) return "bank";
  return "bank";
}

/** Normalize /user/user-banks item for template (id, account_number, masked_number, date, bank_name, logo_url) */
function mapUserBank(item) {
  return {
    id: item.id,
    user_bank_type_id: item.user_bank_type_id,
    name: item.name,
    account_number: item.account_number,
    accountNumber: item.account_number,
    number: item.account_number,
    masked_number: item.masked_number,
    bank_name: item.bankType?.name || item.name,
    bankName: item.bankType?.name,
    logo_url: item.bankType?.logo_url || null,
    connected_at: item.updated_at ?? item.created_at,
    connectedAt: item.updated_at ?? item.created_at,
    date: item.updated_at ?? item.created_at,
    created_at: item.created_at,
    updated_at: item.updated_at,
    is_active: item.is_active,
    can_update: item.can_update,
    wait_time: item.wait_time,
  };
}

async function fetchConnectedAccounts() {
  loadingUserBanks.value = true;
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
    // Order: kbz, wave, cb, aya, ayabank, kbzbank, yomabank, uabbank, bank, usdttrc20, usdterc20, btc, eth, crypto (one tab per account)
    const order = { kbz: 0, wave: 1, cb: 2, aya: 3, ayabank: 4, kbzbank: 5, yomabank: 6, uabbank: 7, bank: 8, usdttrc20: 9, usdterc20: 10, btc: 11, eth: 12, crypto: 13 };
    withCategory.sort(
      (a, b) => (order[a._category] ?? 13) - (order[b._category] ?? 13),
    );
    userBanksList.value = withCategory;
  } catch (e) {
    console.error("Fetch user banks failed:", e);
    userBanksList.value = [];
  } finally {
    loadingUserBanks.value = false;
  }
}

const goBack = () => {
  router.back();
};

/** Fetch today's total withdrawal amount from withdraw history API */
async function fetchWithdrawnToday() {
  const userId = store?.state?.authUser?.id;
  if (!userId) return;
  try {
    const params = new URLSearchParams();
    params.set("user_id", String(userId));
    params.set("filter", "today");
    params.set("page", "1");
    params.set("perPage", "100");
    const res = await axios.get(`/user/withdraws?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    let sum = 0;
    for (const row of list) {
      const num = Number(row.no_format_amount ?? row.amount ?? 0);
      if (Number.isFinite(num)) sum += num;
    }
    withdrawnTodayAmount.value = sum;
    // Remaining withdrawals today = daily limit − count of today's withdrawals
    const dailyLimit = withdrawInfo.value.dailyLimit ?? 10;
    withdrawInfo.value.remainingWithdrawals = Math.max(
      0,
      dailyLimit - list.length,
    );
  } catch (e) {
    console.error("Fetch withdrawn today failed:", e);
    withdrawnTodayAmount.value = 0;
    withdrawInfo.value.remainingWithdrawals =
      withdrawInfo.value.dailyLimit ?? 10;
  }
}

onMounted(async () => {
  await store.dispatch("fetchUser");
  fetchConnectedAccounts();
  fetchWithdrawnToday();
});
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Fixed Header -->
    <div
      class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-4 flex items-center justify-between"
    >
      <button @click="goBack" class="text-white">
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
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1
        class="text-2xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]"
      >
        ငွေထုတ်
      </h1>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openWithdrawHistoryModal"
          class="p-1 text-white"
          aria-label="Withdraw History"
        >
          <img src="/withdraw.png" alt="" class="w-8 h-8" />
        </button>
        <img src="/service.png" alt="" class="w-8 h-8 text-white" />
      </div>
    </div>

    <!-- Spacer for fixed header -->
    <div class="h-[60px]" aria-hidden="true"></div>

    <!-- Payment method tabs (Vant Tabs with custom titles) -->
    <VanTabs
      v-model:active="activePaymentTab"
      class="withdraw-page-tabs mt-6 font-['Pyidaungsu','Padauk',sans-serif]"
      :title-active-color="'#1986E1'"
      :title-inactive-color="'#9ca3af'"
      shrink
    >
      <VanTab v-for="tab in withdrawTabs" :key="tab.id">
        <template #title>
          <div class="flex flex-col items-center gap-0.5 py-1">
            <div class="flex items-center gap-1.5">
              <img
                v-if="getTabLogo(tab)"
                :src="getTabLogo(tab)"
                :alt="tab.name"
                class="w-8 h-8 object-contain"
              />
              <span
                class="text-base font-semibold truncate max-w-[80px]"
                :class="
                  tab.contentKey === 'kbz' ? 'text-[#0251AD]' : 'text-black/80'
                "
                >{{
                  tab.contentKey === "connect"
                    ? t("Connect account", "အကောင့်ချိတ်ဆက်မည်", "连接账户", "เชื่อมต่อบัญชี")
                    : tab.name
                }}</span
              >
            </div>
          </div>
        </template>
        <div class="py-6">
          <!-- Connect account tab: go to My Cards -->
          <template v-if="tab.contentKey === 'connect'">
            <div class="px-4 flex flex-col items-center justify-center py-12 font-['Pyidaungsu','Padauk',sans-serif]">
              <p class="text-center text-lg text-gray-700 mb-6">
                {{
                  t(
                    "Add pay, bank account, or crypto wallet to withdraw.",
                    "ငွေထုတ်ရန် Pay၊ ဘဏ်အကောင့် သို့မဟုတ် Crypto ပိုက်ဆံအိတ် ထည့်ပါ။",
                    "添加电子钱包、银行账户或加密货币钱包以提现。",
                    "เพิ่ม Pay บัญชีธนาคาร หรือกระเป๋า Crypto เพื่อถอนเงิน",
                  )
                }}
              </p>
              <button
                type="button"
                class="py-3.5 px-8 rounded-xl bg-[#080E1E] text-white text-lg font-medium"
                @click="router.push({ name: 'my-cards' })"
              >
                {{ t("Go to My Cards", "ကျွန်ုပ်၏ကတ်များသို့", "前往我的卡", "ไปที่บัตรของฉัน") }}
              </button>
            </div>
          </template>
          <!-- Account tab: one card + withdraw form -->
          <template v-else>
            <VanLoading v-if="loadingUserBanks" class="py-8" vertical
              >Loading...</VanLoading
            >
            <template v-else>
              <!-- Single card for this account -->
              <div class="px-4">
                <div
                  class="bank-card relative overflow-hidden rounded-2xl px-5 mt-5 py-5 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                >
                  <div
                    class="bank-card-pattern absolute inset-0"
                    aria-hidden="true"
                  ></div>
                  <div class="relative z-10 flex flex-col gap-4">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="bank-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/25"
                      >
                        <img
                          v-if="getTabLogo(tab)"
                          :src="getTabLogo(tab)"
                          :alt="tab.name"
                          class="h-6 w-6 object-contain"
                        />
                        <svg
                          v-else
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
                      <span class="text-2xl font-normal">{{ tab.name }}</span>
                    </div>
                    <p class="text-2xl font-bold tracking-widest">
                      {{
                        tab.account.masked_number ||
                        maskAccount(
                          tab.account.account_number ??
                            tab.account.accountNumber ??
                            tab.account.number,
                        )
                      }}
                    </p>
                    <p
                      class="bank-card-time text-base font-medium text-white tabular-nums tracking-wide"
                    >
                      {{
                        formatAccountDateTime(
                          tab.account.connected_at ??
                            tab.account.connectedAt ??
                            tab.account.date ??
                            tab.account.created_at,
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>

            <div class="relative px-4 pr-10 mb-6 mt-4">
              <div
                class="absolute top-0 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shrink-0"
                aria-hidden="true"
              >
                1
              </div>
              <div
                class="space-y-1.5 mt-7 text-left text-gray-600 font-['Pyidaungsu','Padauk',sans-serif] text-sm"
              >
                <!-- <p class="text-lg font-medium text-black/40">
                  {{
                    t("Withdrawal time", "ထုတ်ယူချိန်", "提现时间", "เวลาถอน")
                  }}: {{ withdrawInfo.withdrawalTime }}
                  {{ t("hours", "နာရီ", "小时", "ชั่วโมง") }}
                </p>
                <p class="text-lg font-medium text-black/40 pt-6">
                  {{
                    t(
                      "Daily withdrawal",
                      "နေ့စဉ်ထုတ်ယူခြင်း",
                      "每日提现",
                      "ถอนรายวัน",
                    )
                  }}
                  {{ withdrawInfo.dailyLimit }} (Times),
                  {{
                    t(
                      "Remaining withdrawal",
                      "ကျန်ရှိနေသောထုတ်ယူခြင်း",
                      "剩余提现",
                      "ถอนคงเหลือ",
                    )
                  }}
                  {{ withdrawInfo.remainingWithdrawals }} (Times)
                </p> -->
                <p class="text-lg font-medium text-black/40">
                  {{
                    t(
                      "Withdrawn today",
                      "ယနေ့ထုတ်ယူပြီးပမာဏ",
                      "今日已提现",
                      "ถอนวันนี้",
                    )
                  }}: K {{ withdrawnTodayFormatted }}
                </p>
                <p class="text-xl font-medium">
                  {{
                    t(
                      "Main wallet",
                      "အဓိကပိုက်ဆံအိတ်",
                      "主钱包",
                      "กระเป๋าเงินหลัก",
                    )
                  }}: K {{ userBalanceFormatted }}
                </p>
                <div
                  v-if="hasUnmetTurnOver"
                  class="mt-3 p-3 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
                >
                  {{ turnOverWarningMessage }}
                </div>
                <p class="text-xl font-medium">
                  {{
                    t(
                      "Withdrawable amount",
                      "ထုတ်ယူနိုင်သောပမာဏ",
                      "可提现金额",
                      "จำนวนที่ถอนได้",
                    )
                  }}: K {{ userBalanceFormatted }}
                </p>
              </div>
            </div>

            <!-- Withdrawal amount -->
            <div class="px-4 mt-10 font-['Pyidaungsu','Padauk',sans-serif]">
              <h2 class="text-lg font-semibold text-black/80 mb-4">
                {{
                  t(
                    "Withdrawal amount",
                    "ထုတ်ယူငွေပမာဏ",
                    "提现金额",
                    "จำนวนที่ถอน",
                  )
                }}
              </h2>
              <div class="space-y-4">
                <div
                  class="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden"
                >
                  <span
                    class="shrink-0 pl-4 pr-2 text-base font-medium text-gray-700"
                  >
                    {{ t("Amount", "ပမာဏ", "金额", "จำนวน") }}
                  </span>
                  <input
                    v-model="withdrawAmount"
                    type="number"
                    :min="MIN_WITHDRAW_AMOUNT_MMK"
                    max="1000000"
                    step="1000"
                    :placeholder="
                      t(
                        '10,000 ~ 1,000,000',
                        '10,000 ~ 1,000,000',
                        '10,000 ~ 1,000,000',
                        '10,000 ~ 1,000,000',
                      )
                    "
                    class="flex-1 py-3 pr-4 text-base !text-gray-900 placeholder-gray-400 focus:outline-none font-['Pyidaungsu','Padauk',sans-serif]"
                  />
                </div>
              </div>
              <button
                type="button"
                :disabled="!canSubmitWithdraw || isSubmittingWithdraw"
                class="w-full mt-7 py-3.5 rounded-lg text-xl font-medium text-center transition-opacity font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-60 disabled:cursor-not-allowed"
                :class="
                  canSubmitWithdraw
                    ? 'bg-red-600 text-white active:opacity-90'
                    : 'bg-gray-300 text-white'
                "
                @click="onSubmitWithdraw"
              >
                {{
                  isSubmittingWithdraw
                    ? t(
                        "Submitting...",
                        "တင်သွင်းနေသည်...",
                        "提交中...",
                        "กำลังส่ง...",
                      )
                    : t("Submit", "တင်သွင်းပါ", "提交", "ส่ง")
                }}
              </button>
            </div>
            </template>
          </template>

        </div>
      </VanTab>
    </VanTabs>
  </div>
</template>

<style scoped>
.withdraw-page-tabs :deep(.van-tabs__nav) {
  background: white;
}

.withdraw-page-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid #e5e7eb;
}

.withdraw-page-tabs :deep(.van-tab) {
  padding: 0 8px;
}

.withdraw-page-tabs :deep(.van-tabs__line) {
  background-color: #dc2626;
  height: 3px;
}

.withdraw-page-tabs :deep(.van-tabs__content) {
  background: white;
}

/* E-wallet / bank card: purple-to-cyan gradient, rounded, with subtle pattern */
.bank-card {
  background: linear-gradient(
    90deg,
    #a78bfa 0%,
    #c4b5fd 35%,
    #93c5fd 70%,
    #7dd3fc 100%
  );
  box-shadow: 0 4px 14px rgba(167, 139, 250, 0.25);
}

.bank-card-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 5 30 0 40 Q 5 50 0 60 Q 5 70 0 80' stroke='rgba(255,255,255,0.12)' fill='none' stroke-width='1'/%3E%3Cpath d='M10 10 Q 15 25 10 40 Q 15 55 10 70 Q 15 85 10 100' stroke='rgba(255,255,255,0.1)' fill='none' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 24px 100px;
  opacity: 0.9;
}

.bank-card-icon {
  backdrop-filter: blur(6px);
}

.bank-card-time {
  font-family: ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.02em;
}

.withdraw-kbz-empty :deep(.van-empty__description) {
  color: #6b7280;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
  font-size: 20px;
}
</style>

