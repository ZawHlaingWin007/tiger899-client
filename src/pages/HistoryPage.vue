<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  showFailToast,
  showLoadingToast,
  closeToast,
} from "vant";
import {
  Loading,
  Icon as VanIcon,
  Calendar as VanCalendar,
  Empty as VanEmpty,
  ActionSheet as VanActionSheet,
} from "vant";
import axios from "axios";
import { useTranslation } from "../composables/useTranslation";
import FBVoucher from "../components/FBVoucher.vue";

const store = useStore();
const router = useRouter();
const { t, language } = useTranslation();

const isLoggedIn = computed(() => {
  const authUser = store?.state?.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const isLoading = ref(false);
const tableData = ref([]);
const totalItems = ref(0);
const currentPage = ref(1);
const perPage = 10;

// Type filter: All | Deposit | Withdraw (API type param)
const typeOptions = computed(() => [
  { label: t("All", "အားလုံး", "全部", "ทั้งหมด"), value: "" },
  { label: t("Deposit", "ငွေသွင်း", "充值", "ฝากเงิน"), value: "deposit" },
  { label: t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน"), value: "withdraw" },
]);

const showTypeSheet = ref(false);
const selectedTypeIndex = ref(0);
const selectedTypeLabel = computed(
  () => typeOptions.value[selectedTypeIndex.value]?.label ?? t("All", "အားလုံး", "全部", "ทั้งหมด"),
);
const selectedTypeValue = computed(
  () => typeOptions.value[selectedTypeIndex.value]?.value ?? "",
);

// Date range
const showCalendar = ref(false);
const calendarRef = ref(null);
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

const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
});

const maxDate = computed(() => new Date());

const calendarDefaultDate = computed(() => {
  const range = dateRange.value;
  if (range && Array.isArray(range) && range.length >= 2)
    return [new Date(range[0]), new Date(range[1])];
  const today = new Date();
  return [today, today];
});

const setToday = () => {
  const today = new Date();
  dateRange.value = [new Date(today), new Date(today)];
  fetchHistory();
};

const onCalendarConfirm = (value) => {
  if (Array.isArray(value) && value.length >= 2) {
    dateRange.value = [new Date(value[0]), new Date(value[1])];
  }
  showCalendar.value = false;
  fetchHistory();
};

const clearDateRange = () => {
  dateRange.value = [];
  showCalendar.value = false;
  fetchHistory();
};

const onCalendarConfirmFromFooter = () => {
  const val = calendarRef.value?.getSelectedDate?.();
  if (Array.isArray(val) && val.length >= 2) {
    dateRange.value = [new Date(val[0]), new Date(val[1])];
  }
  showCalendar.value = false;
  fetchHistory();
};

watch(showCalendar, (open) => {
  if (typeof document === "undefined") return;
  if (open) document.body.classList.add("calendar-dark-open");
  else document.body.classList.remove("calendar-dark-open");
});
onBeforeUnmount(() => {
  document.body.classList.remove("calendar-dark-open");
});

const formatDateForApi = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDateTime = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}:${s}`;
};

const formatAmount = (val) => {
  if (val == null || val === "") return "0.00";
  const n = Number(val);
  return isNaN(n) ? String(val) : n.toFixed(2);
};

// Voucher modal
const isVoucherModalOpen = ref(false);
const voucherData = ref({
  type: "maung",
  datas: [],
  slipId: null,
  bet_date: null,
  bingo_amount: null,
  is_result: false,
});

const onSelectType = (item) => {
  const idx = typeOptions.value.findIndex((opt) => opt.label === item.name);
  if (idx >= 0) selectedTypeIndex.value = idx;
  showTypeSheet.value = false;
  fetchHistory();
};

const openVoucher = (row) => {
  if (!row?.voucher) return;
  const v = row.voucher;
  voucherData.value = {
    type: v.type || "maung",
    datas: v.team_vouchers || v.datas || [],
    slipId: v.id || row.id,
    bet_date: formatDateTime(row.created_at),
    bingo_amount: v.bingo_amount ?? row.bingo_amount ?? null,
    is_result: v.is_result ?? row.isBet ?? false,
  };
  isVoucherModalOpen.value = true;
};

const closeVoucherModal = () => {
  isVoucherModalOpen.value = false;
};

// Get display type suffix for "PP→" / "→PP" style (optional)
const getTypeSuffix = (row) => {
  const typeStr = String(row?.type ?? "");
  if (typeStr.includes("PP")) return "PP→";
  if (typeStr.includes("Jili") || typeStr.includes("PG") || typeStr.includes("Spade")) return "→PP";
  return "—";
};

const fetchHistory = async () => {
  if (!isLoggedIn.value) {
    router.push("/");
    return;
  }
  const userId = store.state.authUser?.id;
  if (!userId) return;

  showLoadingToast({ message: t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด..."), duration: 0, forbidClick: true });
  try {
    isLoading.value = true;
    const params = new URLSearchParams();
    params.set("user_id", String(userId));
    params.set("page", String(currentPage.value));
    params.set("perPage", String(perPage));

    const range = dateRange.value;
    if (range && Array.isArray(range) && range.length >= 2) {
      params.set("from_date", formatDateForApi(range[0]));
      params.set("to_date", formatDateForApi(range[1]));
    }
    if (selectedTypeValue.value) {
      params.set("type", selectedTypeValue.value);
    }

    const res = await axios.get(`/user/transactions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const body = res?.data ?? {};
    const data = body.data ?? body ?? [];
    tableData.value = Array.isArray(data) ? data : [];
    totalItems.value = body.total ?? body.meta?.total ?? tableData.value.length;
  } catch (err) {
    console.error("Transaction history API error:", err);
    showFailToast({
      message: t(
        "Failed to load transaction history",
        "ငွေစာရင်း မှတ်တမ်း ရယူရန် မအောင်မြင်ပါ",
        "加载交易记录失败",
        "โหลดประวัติธุรกรรมไม่สำเร็จ",
      ),
      position: "top",
    });
    tableData.value = [];
  } finally {
    isLoading.value = false;
    closeToast();
  }
};

watch([currentPage, selectedTypeIndex], () => {
  fetchHistory();
});

onMounted(async () => {
  const authUser = await store.dispatch("fetchUser");
  if (!authUser) {
    router.push("/");
    return;
  }
  await fetchHistory();
});
</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-24">
    <!-- Header (same as deposit/withdraw history) -->
    <header
      class="sticky top-0 z-10 bg-[#172240] border-b border-white/10 px-4 md:px-6 py-4"
    >
      <div class="flex items-center justify-between gap-4">
        <button
          @click="router.back()"
          class="text-white hover:text-gray-300 transition-colors p-1"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <h1
          class="text-xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Transaction History", "ငွေစာရင်းများ", "交易记录", "ประวัติธุรกรรม") }}
        </h1>
        <div class="w-8" aria-hidden="true"></div>
      </div>
    </header>

    <!-- Filters: same style as deposit/withdraw (dark bg, blue border + visible text) -->
    <div class="py-3 px-4 md:px-6">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-white/10 transition-colors"
          style="color: #1986E1"
          @click="showTypeSheet = true"
        >
          <span class="inline-flex items-center gap-1.5">
            {{ selectedTypeLabel }}
            <VanIcon name="arrow-down" class="text-base" style="color: #1986E1" />
          </span>
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-white/10 transition-colors"
          style="color: #1986E1"
          @click="setToday"
        >
          {{ t("Today", "ယနေ့", "今天", "วันนี้") }}
        </button>
        <button
          type="button"
          class="px-3 py-2 rounded-lg border border-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-white/10 transition-colors inline-flex items-center justify-center gap-1.5 ml-auto"
          style="color: #1986E1"
          @click="showCalendar = true"
        >
          <VanIcon name="calendar-o" class="text-base" style="color: #1986E1" />
          <span>{{ dateRangeText }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <Loading color="#1986E1" size="24" />
        <p class="text-white mt-4 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด...") }}
        </p>
      </div>
    </div>

    <!-- List (dark theme like deposit/withdraw) -->
    <div v-else class="px-4 md:px-6 py-3">
      <VanEmpty
        v-if="tableData.length === 0"
        class="py-12 transaction-history-empty"
        :description="t('No transaction history', 'ငွေစာရင်း မှတ်တမ်း မရှိပါ', '暂无交易记录', 'ไม่พบประวัติธุรกรรม')"
      />
      <div v-else class="space-y-4">
        <div
          v-for="(row, index) in tableData"
          :key="row.id ?? index"
          class="rounded-lg py-4 px-4 shadow-sm font-['Pyidaungsu','Padauk',sans-serif] text-white bg-[#080E1E] border border-white/5"
          :class="{ 'cursor-pointer hover:bg-white/5': row.voucher }"
          @click="row.voucher ? openVoucher(row) : null"
        >
          <div class="flex gap-3">
            <div class="shrink-0 w-10 h-10 rounded-full bg-[#1986E1]/20 flex items-center justify-center text-[#1986E1]">
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="text-white font-medium text-base leading-tight">
                  {{ row.type || "—" }}
                </p>
                <span class="text-white/70 text-sm shrink-0 tabular-nums">
                  {{ formatDateTime(row.created_at) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2 mt-1">
                <p class="text-white/80 text-sm">
                  {{ t("Order Number", "အော်တာနံပါတ်", "订单号", "หมายเลขคำสั่ง") }}: {{ row.id ?? "—" }}
                </p>
                <span class="text-white/60 text-sm">{{ getTypeSuffix(row) }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 mt-2">
                <p class="text-white/80 text-sm">
                  {{ t("Current Balance", "လက်ကျန်ငွေ", "当前余额", "ยอดคงเหลือ") }}:
                  <span class="font-semibold text-white">{{ formatAmount(row.current_amount) }}</span>
                </p>
                <p class="text-sm">
                  {{ t("Transaction Amount", "အရောင်းအဝယ်၏ ပမာဏ", "交易金额", "จำนวนธุรกรรม") }}:
                  <span
                    class="font-semibold"
                    :class="Number(row.amount) >= 0 ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ Number(row.amount) >= 0 ? "+" : "" }}{{ formatAmount(row.amount) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="tableData.length > 0 && totalItems > perPage"
        class="mt-6 flex justify-center items-center gap-4"
      >
        <button
          type="button"
          class="px-4 py-2 rounded-lg border border-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50"
          style="color: #1986E1"
          :disabled="currentPage <= 1"
          @click="currentPage--; fetchHistory()"
        >
          {{ t("Previous", "ရှေ့", "上一页", "ก่อนหน้า") }}
        </button>
        <span class="text-white/80 text-sm">
          {{ currentPage }} / {{ Math.ceil(totalItems / perPage) }}
        </span>
        <button
          type="button"
          class="px-4 py-2 rounded-lg border border-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50"
          style="color: #1986E1"
          :disabled="currentPage >= Math.ceil(totalItems / perPage)"
          @click="currentPage++; fetchHistory()"
        >
          {{ t("Next", "နောက်", "下一页", "ถัดไป") }}
        </button>
      </div>
    </div>

    <!-- Type filter sheet -->
    <VanActionSheet
      v-model:show="showTypeSheet"
      :actions="typeOptions.map((opt) => ({ name: opt.label }))"
      :cancel-text="t('Cancel', 'ပယ်မည်', '取消', 'ยกเลิก')"
      @select="onSelectType"
    />

    <!-- Date range calendar -->
    <VanCalendar
      ref="calendarRef"
      v-model:show="showCalendar"
      type="range"
      color="#1986E1"
      :default-date="calendarDefaultDate"
      :min-date="minDate"
      :max-date="maxDate"
      :title="t('Select date range', 'နေ့ရက် ရွေးချယ်ပါ', '选择日期范围', 'เลือกช่วงวันที่')"
      @confirm="onCalendarConfirm"
    >
      <template #footer>
        <div class="van-calendar__footer-buttons flex gap-3 p-4 pt-0">
          <button
            type="button"
            class="flex-1 py-2.5 rounded-full text-sm font-medium border border-[#1986E1]"
            style="color: #1986E1; background: transparent"
            @click="clearDateRange"
          >
            {{ t("Remove date", "ရက်စွဲ ဖယ်ရှားမည်", "清除日期", "ลบวันที่") }}
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 rounded-full text-sm font-medium text-white"
            style="background: #1986E1"
            @click="onCalendarConfirmFromFooter"
          >
            {{ t("Confirm", "အတည်ပြုမည်", "确认", "ยืนยัน") }}
          </button>
        </div>
      </template>
    </VanCalendar>

    <!-- Voucher modal -->
    <div
      v-if="isVoucherModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closeVoucherModal"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl"
        @click.stop
      >
        <button
          @click="closeVoucherModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <FBVoucher
          :type="voucherData.type"
          :datas="voucherData.datas"
          :slipId="voucherData.slipId"
          :currentTime="voucherData.bet_date"
          :isHistory="true"
          :is_result="voucherData.is_result"
          :bingo_amount="voucherData.bingo_amount"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.transaction-history-empty :deep(.van-empty__description) {
  color: rgba(255, 255, 255, 0.8);
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
</style>
