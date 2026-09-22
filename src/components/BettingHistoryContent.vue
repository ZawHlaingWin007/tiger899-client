<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import { useTranslation } from "../composables/useTranslation";
import {
  Tabs as VanTabs,
  Tab as VanTab,
  Calendar as VanCalendar,
  Popup as VanPopup,
  Icon as VanIcon,
  Empty as VanEmpty,
} from "vant";
import { showSuccessToast } from "vant";
import axios from "axios";

const props = defineProps({
  /** When true, summary bar is not fixed (e.g. inside modal) */
  embedded: { type: Boolean, default: false },
});

const store = useStore();
const { t, language } = useTranslation();
const isLoading = ref(false);
const activeTab = ref(0);

// Tab titles: Slots, Fish, Card, Poker, Sports, Lottery (translated)
const tabTitles = computed(() => {
  void language.value;
  return [
    t("Slots", "စလော့", "老虎机", "สล็อต"),
    t("Fish", "ငါး", "捕鱼", "ปลา"),
    t("Card", "ဖဲဂိမ်း", "棋牌", "ไพ่"),
    t("Sports", "အားကစား", "体育", "กีฬา"),
    t("Lottery", "ထီ", "彩票", "ลอตเตอรี่"),
  ];
});

// ----- Date range (Vant Calendar) -----
const showCalendar = ref(false);
const dateRange = ref([new Date(), new Date()]);

const dateRangeText = computed(() => {
  const range = dateRange.value;
  if (!range || !Array.isArray(range) || range.length < 2) return "—";
  const fmt = (d) => {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${String(m).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
  };
  return `${fmt(range[0])} - ${fmt(range[1])}`;
});

const clearDateRange = () => {
  dateRange.value = null;
  showCalendar.value = false;
};

const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
});

const maxDate = computed(() => new Date());

const onCalendarConfirm = (value) => {
  if (Array.isArray(value) && value.length >= 2) {
    dateRange.value = [new Date(value[0]), new Date(value[1])];
  }
  showCalendar.value = false;
};

const calendarDefaultDate = computed(() => {
  const range = dateRange.value;
  if (range && Array.isArray(range) && range.length >= 2)
    return [new Date(range[0]), new Date(range[1])];
  const today = new Date();
  return [today, today];
});

watch(showCalendar, (open) => {
  if (typeof document === "undefined") return;
  if (open) document.body.classList.add("calendar-dark-open");
  else document.body.classList.remove("calendar-dark-open");
});
onBeforeUnmount(() => {
  document.body.classList.remove("calendar-dark-open");
});

// ----- Select provider (bottom sheet) -----
const showSelectSheet = ref(false);
const providerOptionsFromApi = ref([]);
const selectOptions = computed(() => {
  void language.value;
  const all = { name: t("All", "အားလုံး", "全部", "ทั้งหมด") };
  const providers = providerOptionsFromApi.value.length
    ? providerOptionsFromApi.value.map((p) => ({ name: p }))
    : [
        { name: "PP" },
        { name: "Pocket Games Soft" },
        { name: "Jili" },
        { name: "Live22" },
        { name: "CQ9" },
      ];
  return [all, ...providers];
});
const selectedOptionIndex = ref(0);
const selectedOptionText = computed(
  () =>
    selectOptions.value[selectedOptionIndex.value]?.name ??
    t("All", "အားလုံး", "全部", "ทั้งหมด"),
);

const onSelectOption = (index) => {
  selectedOptionIndex.value = index;
  showSelectSheet.value = false;
};

const selectSheetTitle = computed(() =>
  t("Select a seller", "ရောင်းချသူရွေးချယ်ပါ", "选择供应商", "เลือกผู้ขาย"),
);

const typeMap = ["vs", "fish", "bj", "rl", "bc"];

const formatDateForApi = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapApiRowToCard = (row) => {
  const num = (v) => {
    if (v == null || v === "") return "0.00";
    const n = Number(v);
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };
  const str = (v) => (v != null && v !== "" ? String(v) : "-");
  const winLoss = row.win_loss_amount ?? row.winLossAmount ?? 0;
  const profitVal = Number(winLoss);
  const profitLoss =
    profitVal !== 0 || winLoss !== undefined
      ? (profitVal >= 0 ? "" : "-") + Math.abs(profitVal).toFixed(2)
      : "0.00";
  return {
    category: str(row.provider),
    categoryMm: str(row.provider),
    datetime: "-",
    upline: "-",
    orderId: "-",
    betAmount: num(row.total_bet_amount ?? row.totalBetAmount),
    payoutOdds: "-",
    profitLoss,
    prize: num(row.total_won_amount ?? row.totalWonAmount),
    isProviderSummary: true,
  };
};

const apiTotals = ref({
  totalBetAmount: 0,
  totalWonAmount: 0,
  totalWinLossAmount: 0,
});

const fetchBettingRecord = async () => {
  const authUser = store?.state?.authUser;
  const userId = authUser?.id;
  if (!userId) {
    betHistoryList.value = [];
    apiTotals.value = {
      totalBetAmount: 0,
      totalWonAmount: 0,
      totalWinLossAmount: 0,
    };
    return;
  }

  const params = new URLSearchParams();
  params.set("user_id", String(userId));
  const typeVal = typeMap[activeTab.value];
  if (typeVal) params.set("type", typeVal);
  const providerName =
    selectedOptionIndex.value > 0
      ? selectOptions.value[selectedOptionIndex.value]?.name
      : null;
  if (providerName) params.set("provider", providerName);

  const range = dateRange.value;
  if (range && Array.isArray(range) && range.length >= 2) {
    params.set("from_date", formatDateForApi(range[0]));
    params.set("to_date", formatDateForApi(range[1]));
  }

  try {
    isLoading.value = true;
    const res = await axios.get(`/user/betting-record?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const body = res?.data ?? {};
    const raw = body.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    betHistoryList.value = list.map(mapApiRowToCard);

    apiTotals.value = {
      totalBetAmount: Number(body.total_bet_amount) || 0,
      totalWonAmount: Number(body.total_won_amount) || 0,
      totalWinLossAmount: Number(body.total_win_loss_amount) || 0,
    };

    if (list.length > 0) {
      const providers = [
        ...new Set(list.map((r) => r.provider).filter(Boolean)),
      ];
      if (providers.length > 0) {
        providerOptionsFromApi.value = providers.sort();
      }
    }
  } catch (err) {
    console.error("Betting record API error:", err);
    betHistoryList.value = [];
    apiTotals.value = {
      totalBetAmount: 0,
      totalWonAmount: 0,
      totalWinLossAmount: 0,
    };
  } finally {
    isLoading.value = false;
  }
};

const betHistoryList = ref([]);

const copyOrderId = (text) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
    showSuccessToast(t("Copied", "ကူးယူပြီး", "已复制", "คัดลอกแล้ว"));
  }
};

const formatAmountDisplay = (val) => {
  const n = Number(String(val).replace(/,/g, ""));
  return isNaN(n)
    ? val
    : n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

const emptyDescription = computed(() =>
  t(
    "No betting history",
    "လောင်းကြေးမှတ်တမ်းမရှိပါ",
    "暂无投注记录",
    "ไม่มีประวัติการเดิมพัน",
  ),
);

const formatMoney = (value) =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const summaryTotals = computed(() => {
  const tot = apiTotals.value;
  return {
    totalWagered: formatMoney(tot.totalBetAmount),
    totalPrize: formatMoney(tot.totalWonAmount),
    profitLoss: formatMoney(tot.totalWinLossAmount),
    profitLossNum: tot.totalWinLossAmount,
  };
});

const showSummaryBar = computed(() => betHistoryList.value.length > 0);

watch(
  [dateRange, activeTab, selectedOptionIndex],
  () => {
    fetchBettingRecord();
  },
  { deep: true },
);

const fetchProviders = async () => {
  try {
    const res = await axios.get("/games");
    const games = res?.data?.data ?? [];
    if (Array.isArray(games) && games.length > 0) {
      const providers = [
        ...new Set(games.map((g) => g.provider).filter(Boolean)),
      ].sort();
      if (providers.length > 0) providerOptionsFromApi.value = providers;
    }
  } catch (e) {
    console.error("Failed to fetch providers:", e);
  }
};

onMounted(async () => {
  await store.dispatch("fetchUser");
  await fetchProviders();
  await fetchBettingRecord();
});
</script>

<template>
  <div class="betting-history-content-root bg-white" :class="{ 'pb-24': !embedded && showSummaryBar }">
    <VanTabs
      v-model:active="activeTab"
      class="betting-history-tabs font-['Pyidaungsu','Padauk',sans-serif]"
      :title-active-color="'#1986E1'"
      :title-inactive-color="'#1f2937'"
    >
      <VanTab v-for="(title, index) in tabTitles" :key="index" :title="title">
        <div
          class="betting-history-content py-4 px-4 min-h-[40vh] text-gray-700 font-['Pyidaungsu','Padauk',sans-serif]"
          :class="{ 'pb-28': showSummaryBar && !embedded }"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="min-w-0 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1986E1] text-[#1986E1] text-sm"
                @click="showCalendar = true"
              >
                <VanIcon name="calendar-o" class="text-base shrink-0" />
                <span class="truncate">{{ dateRangeText }}</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#1986E1] text-[#1986E1] text-sm shrink-0"
                @click="showSelectSheet = true"
              >
                <VanIcon name="arrow-down" class="text-base" />
                <span>{{ selectedOptionText }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="isLoading"
            class="py-12 text-center text-gray-500 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด...") }}
          </div>
          <VanEmpty
            v-else-if="betHistoryList.length === 0"
            class="betting-history-empty py-12"
            :description="emptyDescription"
          />
          <div v-else class="betting-history-list">
            <article
              v-for="(item, idx) in betHistoryList"
              :key="idx"
              class="betting-history-card"
            >
              <div class="betting-history-card__header">
                <div class="betting-history-card__title-row">
                  <span class="betting-history-card__dot" aria-hidden="true"></span>
                  <span class="betting-history-card__game-name">{{
                    language === "mm" ? item.categoryMm : item.category
                  }}</span>
                </div>
                <span class="betting-history-card__datetime">{{
                  item.datetime !== "-" ? item.datetime : "—"
                }}</span>
              </div>
              <p class="betting-history-card__label-row">
                {{ t("Upline", "အပေါ်လိုင်း", "上線", "อัพไลน์") }}: {{ item.upline }}
              </p>
              <div class="betting-history-card__order-row">
                <span class="betting-history-card__label">{{
                  t("Order Number", "အော်တာနံပါတ်", "订单号", "หมายเลขคำสั่ง")
                }}:</span>
                <span class="betting-history-card__order-id">{{ item.orderId }}</span>
                <button
                  v-if="item.orderId !== '-'"
                  type="button"
                  class="betting-history-card__copy-btn"
                  :aria-label="t('Copy', 'ကူးရန်', '复制', 'คัดลอก')"
                  @click="copyOrderId(item.orderId)"
                >
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
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <div class="betting-history-card__grid">
                <div class="betting-history-card__col">
                  <p class="betting-history-card__label">{{ t("Betting Amount", "လောင်းကြေးငွေပမာဏ", "投注金额", "จำนวนเงินเดิมพัน") }}:</p>
                  <p class="betting-history-card__value betting-history-card__value--black">
                    {{ formatAmountDisplay(item.betAmount) }}
                  </p>
                  <p class="betting-history-card__label betting-history-card__label--spaced">{{ t("Profit/Loss", "အရှုံးအမြတ်စာရင်း", "盈亏", "กำไร/ขาดทุน") }}:</p>
                  <p
                    class="betting-history-card__value"
                    :class="item.profitLoss.startsWith('-') || item.profitLoss.startsWith('−') ? 'betting-history-card__value--red' : 'betting-history-card__value--green'"
                  >
                    {{ formatAmountDisplay(item.profitLoss) }}
                  </p>
                </div>
                <div class="betting-history-card__col betting-history-card__col--right">
                  <p class="betting-history-card__label">{{ t("Betting term", "အလောင်းကစားသက်တမ်း", "投注期限", "ระยะเวลาการเดิมพัน") }} {{ t("Time", "အချိန်", "时间", "เวลา") }}:</p>
                  <p class="betting-history-card__value betting-history-card__value--black">
                    {{ item.payoutOdds !== "-" ? item.payoutOdds : "—" }}
                  </p>
                  <p class="betting-history-card__label betting-history-card__label--spaced">{{ t("Prize", "ဆုငွေ", "奖金", "รางวัล") }}:</p>
                  <p class="betting-history-card__value betting-history-card__value--green">
                    {{ formatAmountDisplay(item.prize) }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </VanTab>
    </VanTabs>

    <VanCalendar
      v-model:show="showCalendar"
      type="range"
      color="#1986E1"
      :default-date="calendarDefaultDate"
      :min-date="minDate"
      :max-date="maxDate"
      :title="t('Select date range', 'နေ့ရက် အကွာအဝေး ရွေးချယ်ပါ', '选择日期范围', 'เลือกช่วงวันที่')"
      @confirm="onCalendarConfirm"
    >
      <template #title>
        <div class="van-calendar__header-title flex items-center justify-between w-full gap-2">
          <span>{{ t("Select date range", "နေ့ရက် အကွာအဝေး ရွေးချယ်ပါ", "选择日期范围", "เลือกช่วงวันที่") }}</span>
          <button
            type="button"
            class="text-[#1986E1] text-sm font-medium shrink-0 py-1 px-2 rounded hover:bg-[#1986E1]/10"
            @click="clearDateRange"
          >
            {{ t("No date range", "နေ့ရက် မရွေးပါ", "不限日期", "ไม่ระบุวันที่") }}
          </button>
        </div>
      </template>
    </VanCalendar>

    <VanPopup
      v-model:show="showSelectSheet"
      position="bottom"
      round
      :style="{ background: 'white' }"
      class="provider-sheet font-['Pyidaungsu','Padauk',sans-serif]"
    >
      <div class="provider-sheet__inner">
        <header class="provider-sheet__header">
          <span class="provider-sheet__title">{{ selectSheetTitle }}</span>
          <button type="button" class="provider-sheet__close" aria-label="Close" @click="showSelectSheet = false">
            <VanIcon name="cross" />
          </button>
        </header>
        <ul class="provider-sheet__list">
          <li
            v-for="(opt, index) in selectOptions"
            :key="index"
            class="provider-sheet__item"
            @click="onSelectOption(index)"
          >
            <span class="provider-sheet__icon" aria-hidden="true"></span>
            <span class="provider-sheet__label !text-xl font-medium">{{ opt.name }}</span>
          </li>
        </ul>
      </div>
    </VanPopup>

    <footer
      v-if="showSummaryBar"
      class="betting-summary-bar"
      :class="{ 'betting-summary-bar--embedded': embedded }"
    >
      <div class="betting-summary-bar__grid">
        <div class="betting-summary-bar__col">
          <p class="betting-summary-bar__label">{{ t("Betting amount", "လောင်းကြေးငွေပမာဏ", "投注金额", "จำนวนเงินเดิมพัน") }}</p>
          <p class="betting-summary-bar__value betting-summary-bar__value--black">{{ summaryTotals.totalWagered }}</p>
          <p class="betting-summary-bar__label betting-summary-bar__label--spaced">{{ t("Prize", "ဆုငွေ", "奖金", "รางวัล") }}</p>
          <p class="betting-summary-bar__value betting-summary-bar__value--green">{{ summaryTotals.totalPrize }}</p>
        </div>
        <div class="betting-summary-bar__col betting-summary-bar__col--right">
          <p class="betting-summary-bar__label">{{ t("Profit/Loss", "အရှုံးအမြတ်စာရင်း", "盈亏", "กำไร/ขาดทุน") }}</p>
          <p
            class="betting-summary-bar__value"
            :class="summaryTotals.profitLossNum >= 0 ? 'betting-summary-bar__value--green' : 'betting-summary-bar__value--red'"
          >
            {{ summaryTotals.profitLoss }}
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.betting-history-tabs :deep(.van-tabs__nav) {
  background: white;
}
.betting-history-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  min-height: 58px;
}
.betting-history-tabs :deep(.van-tabs__nav) {
  flex-wrap: nowrap;
  min-width: min-content;
  min-height: 58px;
  align-items: stretch;
}
.betting-history-tabs :deep(.van-tab) {
  font-weight: 600;
  font-size: 1.125rem !important;
  padding-left: 1rem;
  padding-right: 1rem;
  min-height: 58px;
  display: flex;
  align-items: center;
  line-height: 1.3 !important;
  flex-shrink: 0;
}
.betting-history-tabs :deep(.van-tabs__line) {
  background-color: #1986E1;
  height: 3px;
}
.provider-sheet__inner {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.provider-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.provider-sheet__title {
  font-size: 0.9375rem;
  color: #6b7280;
}
.provider-sheet__close {
  padding: 4px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.provider-sheet__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}
.provider-sheet__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.15s;
}
.provider-sheet__item:active {
  background: #f3f4f6;
}
.provider-sheet__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
}
.provider-sheet__label {
  font-size: 1rem;
  color: #1f2937;
}
.betting-history-empty :deep(.van-empty__description) {
  color: #6b7280;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.betting-history-content {
  background-color: #f8f8f8;
}
.betting-history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.betting-history-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 18px;
}
.betting-history-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.betting-history-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.betting-history-card__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #2196f3;
}
.betting-history-card__game-name {
  font-size: 17px;
  font-weight: 700;
  color: #333333;
}
.betting-history-card__datetime {
  font-size: 13px;
  color: #888888;
}
.betting-history-card__label-row {
  font-size: 14px;
  font-weight: 400;
  color: #333333;
  margin-bottom: 8px;
  line-height: 1.5;
}
.betting-history-card__order-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.betting-history-card__label {
  font-size: 14px;
  font-weight: 400;
  color: #333333;
}
.betting-history-card__label--spaced {
  margin-top: 12px;
}
.betting-history-card__order-id {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}
.betting-history-card__copy-btn {
  padding: 4px;
  color: #000000;
  background: none;
  border: none;
  cursor: pointer;
}
.betting-history-card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #eeeeee;
}
.betting-history-card__col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.betting-history-card__col--right {
  text-align: right;
}
.betting-history-card__value {
  font-size: 15px;
  font-weight: 500;
}
.betting-history-card__value--black {
  color: #000000;
}
.betting-history-card__value--green {
  color: #4caf50;
}
.betting-history-card__value--red {
  color: #d32f2f;
  font-weight: 600;
}
.betting-summary-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  padding: 18px 16px;
  padding-bottom: calc(18px + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 12px 12px 0 0;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.betting-summary-bar--embedded {
  position: relative;
  border-radius: 12px;
  margin-top: 16px;
  padding-bottom: 18px;
}
.betting-summary-bar__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.betting-summary-bar__col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.betting-summary-bar__col--right {
  text-align: right;
}
.betting-summary-bar__label {
  font-size: 14px;
  font-weight: 400;
  color: #333333;
}
.betting-summary-bar__label--spaced {
  margin-top: 12px;
}
.betting-summary-bar__value {
  font-size: 15px;
  font-weight: 600;
}
.betting-summary-bar__value--black {
  color: #000000;
}
.betting-summary-bar__value--green {
  color: #4caf50;
}
.betting-summary-bar__value--red {
  color: #d32f2f;
}
</style>
