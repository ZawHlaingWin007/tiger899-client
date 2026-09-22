<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  showFailToast,
  showSuccessToast,
  showLoadingToast,
  closeToast,
} from "vant";
import {
  Loading,
  Pagination as VanPagination,
  Icon as VanIcon,
  Tabs as VanTabs,
  Tab as VanTab,
  ActionSheet as VanActionSheet,
  Calendar as VanCalendar,
  Empty as VanEmpty,
} from "vant";
import axios from "axios";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  /** When true, hide page header (e.g. when shown inside modal) */
  embedded: { type: Boolean, default: false },
});

const store = useStore();
const router = useRouter();

// Check if user is logged in
const isLoggedIn = computed(() => {
  const authUser = store?.state?.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

// Language
const { t, language } = useTranslation();

// Loading state
const isLoading = ref(false);

// Table data
const tableData = ref([]);
const rows = ref(1);
const currentPage = ref(1);

// Tabs: 0 = All, 1 = Today, 2 = Yesterday, 3 = Week
const activeTab = ref(0);

// Tab titles: 0 = All, 1 = Today, 2 = Yesterday, 3 = Week
const tabTitles = computed(() => [
  t("All", "အားလုံး", "全部", "ทั้งหมด"),
  t("Today", "ယနေ့", "今天", "วันนี้"),
  t("Yesterday", "မနေ့", "昨天", "เมื่อวาน"),
  t("Week", "တပတ်", "本周", "สัปดาห์"),
]);

// Filter buttons: Action sheets
const showAllSheet = ref(false);
const showCategoriesSheet = ref(false);
const selectedAll = ref(t("All", "အားလုံး", "全部", "ทั้งหมด"));
const selectedCategory = ref(
  t("Categories", "အမျိုးအစားများ", "分类", "หมวดหมู่"),
);
// API filter values (for request params, language-independent)
const selectedStatusValue = ref("");
const selectedCategoryValue = ref("");

// Date range (Vant Calendar)
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

const minDate = computed(() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
});

const maxDate = computed(() => new Date());

/** Returns [start, end] for tab: 0 = All (no date filter), 1 = today, 2 = yesterday, 3 = week */
const getDateRangeForTab = (tabIndex) => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000,
  );
  const endOfYesterday = new Date(startOfToday.getTime() - 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  startOfWeek.setHours(0, 0, 0, 0);

  if (tabIndex === 0) {
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return [oneYearAgo, endOfToday];
  }
  if (tabIndex === 1) return [startOfToday, endOfToday];
  if (tabIndex === 2) return [startOfYesterday, endOfYesterday];
  if (tabIndex === 3) return [startOfWeek, endOfToday];
  return [startOfToday, endOfToday];
};

watch(activeTab, (newTab) => {
  dateRange.value = getDateRangeForTab(newTab);
});

const onCalendarConfirm = (value) => {
  if (Array.isArray(value) && value.length >= 2) {
    dateRange.value = [new Date(value[0]), new Date(value[1])];
  }
  showCalendar.value = false;
};

// Toggle body class for calendar black theme (calendar teleports to body)
watch(showCalendar, (open) => {
  if (typeof document === "undefined") return;
  if (open) document.body.classList.add("calendar-dark-open");
  else document.body.classList.remove("calendar-dark-open");
});
onBeforeUnmount(() => {
  document.body.classList.remove("calendar-dark-open");
});

const allActions = computed(() => [
  { name: t("All", "အားလုံး", "全部", "ทั้งหมด"), value: "" },
  {
    name: t("Deposited", "ငွေသွင်းပြီး", "已充值", "ฝากแล้ว"),
    value: "confirm",
  },
  {
    name: t("Pending", "စောင့်ဆိုင်းနေသည်", "处理中", "รอดำเนินการ"),
    value: "pending",
  },
  { name: t("Failed", "မအောင်မြင်ပါ", "失败", "ล้มเหลว"), value: "fail" },
]);

const categoryActions = computed(() => [
  {
    name: t("All types", "အမျိုးအစားအားလုံး", "全部类型", "ทุกประเภท"),
    value: "",
  },
  { name: "WavePay", value: "1" },
  { name: "KBZ Pay", value: "2" },
  {
    name: t("Bank transfer", "ဘဏ်လွှဲပြောင်းမှု", "银行转账", "โอนผ่านธนาคาร"),
    value: "3",
  },
]);

const onSelectAll = (action) => {
  selectedAll.value = action.name;
  selectedStatusValue.value = action.value ?? "";
};

const onSelectCategory = (action) => {
  selectedCategory.value = action.name;
  selectedCategoryValue.value = action.value ?? "";
};

watch(language, () => {
  selectedAll.value = allActions.value[0]?.name || selectedAll.value;
  selectedCategory.value =
    categoryActions.value[0]?.name || selectedCategory.value;
  selectedStatusValue.value = allActions.value[0]?.value ?? "";
  selectedCategoryValue.value = categoryActions.value[0]?.value ?? "";
});

// API returns filtered data; show it directly
const displayList = computed(() => tableData.value);

/** Returns Tailwind classes for left border only based on status */
const getCardStatusClass = (row) => {
  const s = String(row?.status ?? "").toLowerCase();
  if (["confirm", "deposited", "completed", "success"].includes(s))
    return "border-l-4 border-green-500";
  if (["pending", "processing"].includes(s))
    return "border-l-4 border-amber-500";
  if (["failed", "fail", "error", "rejected"].includes(s))
    return "border-l-4 border-red-500";
  return "border-l-4 border-gray-500";
};

// Normalize API row for card display (matches deposit API: id, amount, no_format_amount, date, updated_at, remark, status, account, user_name, promotion, etc.)
const getCardRow = (row) => {
  const amt =
    row.amount != null
      ? String(row.amount)
      : row.no_format_amount != null
        ? Number(row.no_format_amount).toLocaleString()
        : "";
  return {
    method: row.account ?? "—",
    date: row.date ?? "",
    ref: row.ref ?? row.id ?? "—",
    postscript: row.postscript ?? row.remark ?? "",
    receivedTime: row.updated_at ?? "",
    serviceFee: row.service_fee ?? "—",
    activity: row.promotion != null ? String(row.promotion) : "—",
    remark: row.remark ?? "",
    requestAmount: amt,
    receivedAmount: row.received_amount ?? amt,
    status: row.status ?? "—",
    amount: amt,
    user_name: row.user_name ?? "—",
    payment_type: row.payment_type ?? "—",
  };
};

const copyRef = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessToast({
      message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制！", "คัดลอกแล้ว!"),
      position: "top",
    });
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showSuccessToast({
      message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制！", "คัดลอกแล้ว!"),
      position: "top",
    });
  }
};

const formatDateForApi = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Fetch deposit history from GET /user/deposits
const fetchDepositHistory = async () => {
  if (!isLoggedIn.value) {
    router.push("/");
    return;
  }

  const authUser = store?.state?.authUser;
  const userId = authUser?.id;
  if (!userId) {
    router.push("/");
    return;
  }

  const msg = t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด...");
  const loadingToast = showLoadingToast({
    message: msg,
    duration: 0,
    forbidClick: true,
  });
  try {
    isLoading.value = true;

    const isAllTab = activeTab.value === 0;
    const range = dateRange.value;
    const fromDate =
      !isAllTab &&
      Array.isArray(range) &&
      range.length >= 1
        ? formatDateForApi(range[0])
        : null;
    const toDate =
      !isAllTab &&
      Array.isArray(range) &&
      range.length >= 2
        ? formatDateForApi(range[1])
        : null;

    const filterMap = [null, "today", "yesterday", "week"];
    const filter = isAllTab ? null : (filterMap[activeTab.value] ?? null);

    const params = new URLSearchParams();
    params.set("user_id", String(userId));
    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);
    params.set("page", String(currentPage.value));
    params.set("perPage", "50");
    if (filter) params.set("filter", filter);
    if (selectedStatusValue.value)
      params.set("status", selectedStatusValue.value);
    if (selectedCategoryValue.value)
      params.set("payment_type_id", selectedCategoryValue.value);

    const res = await axios.get(`/user/deposits?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    tableData.value = list;

    for (let index = 0; index < list.length; index += 1) {
      const row = list[index];
      if (row && typeof row === "object") {
        const num = Number(row.no_format_amount ?? row.amount ?? 0);
        row.amount = num.toLocaleString();
      }
    }

    rows.value =
      typeof res?.data?.total === "number" ? res.data.total : list.length;
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    tableData.value = [];
    rows.value = 0;
    try {
      showFailToast({
        message: t(
          "Failed to load deposit history",
          "ငွေဖြည့် မှတ်တမ်း ရယူရန် မအောင်မြင်ပါ",
          "加载充值记录失败",
          "โหลดประวัติการฝากเงินไม่สำเร็จ",
        ),
        position: "top",
      });
    } catch (_) {}
  } finally {
    closeToast();
    if (loadingToast?.close) loadingToast.close();
    isLoading.value = false;
  }
};

// Table columns
const tableColumns = computed(() => [
  t("Date", "နေ့စွဲ", "日期", "วันที่"),
  t("Amount", "ငွေအမောင့်", "金额", "จำนวนเงิน"),
  t("Status", "အခြေအနေ", "状态", "สถานะ"),
  t("Account", "အကောင့်", "账号", "บัญชี"),
  t("Remark", "မှတ်ချက်", "备注", "หมายเหตุ"),
]);

// Watch pagination
watch(currentPage, () => {
  fetchDepositHistory();
});

// When filters change, reset to first page and refetch
watch(
  [activeTab, dateRange, selectedStatusValue, selectedCategoryValue],
  () => {
    const wasPage1 = currentPage.value === 1;
    currentPage.value = 1;
    if (wasPage1) fetchDepositHistory();
  },
  { deep: true },
);

// Initialize
onMounted(async () => {
  const authUser = await store.dispatch("fetchUser");
  if (!authUser) {
    router.push("/");
    return;
  }

  dateRange.value = getDateRangeForTab(activeTab.value);
  await fetchDepositHistory();
});
</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-20">
    <!-- Header (hidden when embedded in modal) -->
    <div
      v-if="!embedded"
      class="sticky top-0 z-10 bg-[#172240] border-b border-white/10 px-6 py-4"
    >
      <div class="flex items-center justify-between gap-4">
        <button
          @click="router.back()"
          class="text-white hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"
            />
          </svg>
        </button>
        <h1
          class="text-xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{
            t(
              "Deposit History",
              "ငွေဖြည့်မှတ်တမ်း",
              "充值记录",
              "ประวัติการฝากเงิน",
            )
          }}
        </h1>
        <router-link
          :to="{ name: 'withdraw-history' }"
          class="inline-flex items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-colors"
          :aria-label="
            t(
              'Withdraw History',
              'ထုတ်ယူမှတ်တမ်း',
              '提现记录',
              'ประวัติการถอนเงิน',
            )
          "
        >
          <img
            src="/withdraw.png"
            :alt="
              t(
                'Withdraw History',
                'ထုတ်ယူမှတ်တမ်း',
                '提现记录',
                'ประวัติการถอนเงิน',
              )
            "
            class="w-8 h-8"
          />
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <Loading color="#1986E1" size="24" />
        <p class="text-white mt-4 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด...") }}
        </p>
      </div>
    </div>

    <!-- Tabs + Table -->
    <div v-else class="">
      <VanTabs
        v-model:active="activeTab"
        class="deposit-history-tabs"
        :title-active-color="'#1986E1'"
        :title-inactive-color="'rgba(255,255,255,0.7)'"
      >
        <VanTab v-for="(title, index) in tabTitles" :key="index" :title="title">
          <div class="py-3 px-4">
            <!-- Filter buttons row -->
            <div class="flex gap-2 mb-3">
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-[#1986E1] text-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-gray-200 transition-colors"
                @click="showAllSheet = true"
              >
                {{ selectedAll }}
              </button>
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-[#1986E1] text-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-gray-200 transition-colors"
                @click="showCategoriesSheet = true"
              >
                {{ selectedCategory }}
              </button>
              <button
                type="button"
                class="px-3 py-2 rounded-lg border border-[#1986E1] text-[#1986E1] text-sm font-['Pyidaungsu','Padauk',sans-serif] hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-1.5"
                @click="showCalendar = true"
              >
                <VanIcon name="calendar-o" class="text-base" />
                <span>{{ dateRangeText }}</span>
              </button>
            </div>

            <!-- Transaction detail cards (same design for all screens; default sample when empty) -->
            <div class="space-y-4">
              <div
                v-for="(row, rowIndex) in displayList"
                :key="rowIndex"
                class="rounded-lg py-4 shadow-sm font-['Pyidaungsu','Padauk',sans-serif] text-white"
              >
                <!-- Header: method + date/time -->
                <p class="text-lg font-light text-white">
                  {{ getCardRow(row).method }}
                </p>
                <p class="text-base font-semibold text-white mt-0.5">
                  {{ getCardRow(row).date || "—" }}
                </p>

                <!-- Ref box with copy -->
                <div
                  :class="[
                    'bg-[#080E1E] rounded-lg mt-3 px-3 py-2',
                    getCardStatusClass(row),
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg text-white">
                      {{ t("Ref:", "Ref:", "参考:", "อ้างอิง:") }}
                    </span>
                    <div class="flex items-center gap-3">
                      {{ getCardRow(row).ref }}
                      <button
                        type="button"
                        class="p-1 text-gray-500 hover:text-gray-700"
                        :aria-label="t('Copy', 'ကူးရန်', '复制', 'คัดลอก')"
                        @click="copyRef(String(getCardRow(row).ref))"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
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
                          />
                          <path
                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Postscript -->
                  <p class="mt-3 text-lg text-white">
                    {{
                      t("Postscript", "မှတ်စု", "附言", "หมายเหตุเพิ่มเติม")
                    }}:
                    {{ getCardRow(row).postscript || "—" }}
                  </p>

                  <!-- Detail rows -->
                  <div class="mt-2 space-y-2 text-lg text-white">
                    <p>
                      {{
                        t(
                          "Received time",
                          "လက်ခံရရှိချိန်",
                          "到账时间",
                          "เวลาได้รับ",
                        )
                      }}:
                      {{ getCardRow(row).receivedTime || "—" }}
                    </p>
                    <p>
                      {{
                        t("Service fee", "ဝန်ဆောင်ခ", "手续费", "ค่าธรรมเนียม")
                      }}:
                      {{ getCardRow(row).serviceFee || "—" }}
                    </p>
                    <p>
                      {{ t("Activity", "လှုပ်ရှားမှု", "活动", "กิจกรรม") }}:
                      {{ getCardRow(row).activity || "—" }}
                    </p>
                    <p>
                      {{ t("Remark", "မှတ်ချက်", "备注", "หมายเหตุ") }}:
                      {{ getCardRow(row).remark || "—" }}
                    </p>
                  </div>
                </div>

                <!-- Bottom: request amount (red), received amount, status -->
                <div class="mt-4 pt-3 space-y-1">
                  <p class="text-lg text-white">
                    {{
                      t(
                        "Request Amount",
                        "တောင်းဆိုချက်",
                        "申请金额",
                        "จำนวนเงินที่ขอ",
                      )
                    }}
                  </p>
                  <p
                    v-if="getCardRow(row).requestAmount"
                    class="text-lg font-semibold text-red-600"
                  >
                    {{ getCardRow(row).requestAmount }}
                  </p>
                  <p class="text-lg text-white mt-1">
                    {{
                      t(
                        "Received Amount",
                        "လက်ခံရရှိသောငွေ",
                        "到账金额",
                        "จำนวนเงินที่ได้รับ",
                      )
                    }}:
                    {{ getCardRow(row).receivedAmount || "—" }}
                  </p>
                  <p class="text-lg text-white">
                    {{ t("Status", "အခြေအနေ", "状态", "สถานะ") }}:
                    {{ getCardRow(row).status || "—" }}
                  </p>
                  <p class="text-lg text-white">
                    {{ t("Amount", "ပမာဏ", "金额", "จำนวนเงิน") }}:
                    {{ getCardRow(row).amount || "—" }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Empty state: only when no data and not using default sample -->
            <VanEmpty
              v-if="displayList.length === 0"
              class="py-20 deposit-history-empty"
              :description="
                t(
                  'No deposit history found',
                  'ငွေဖြည့် မှတ်တမ်း မရှိပါ',
                  '暂无充值记录',
                  'ไม่พบประวัติการฝากเงิน',
                )
              "
            />
          </div>
        </VanTab>
      </VanTabs>

      <!-- Pagination (full list) -->
      <div v-if="tableData.length > 0" class="mt-6 flex justify-center px-4">
        <div class="pagination-container">
          <VanPagination
            v-model="currentPage"
            :total-items="rows"
            :items-per-page="50"
            :show-page-size="3"
            force-ellipses
          >
            <template #prev-text>
              <VanIcon name="arrow-left" />
            </template>
            <template #next-text>
              <VanIcon name="arrow" />
            </template>
          </VanPagination>
        </div>
      </div>
    </div>

    <!-- Action sheets (All / Categories) -->
    <VanActionSheet
      v-model:show="showAllSheet"
      :actions="allActions"
      :cancel-text="t('Cancel', 'ပယ်ဖျက်မည်', '取消', 'ยกเลิก')"
      close-on-click-action
      @select="onSelectAll"
    />
    <VanActionSheet
      v-model:show="showCategoriesSheet"
      :actions="categoryActions"
      :cancel-text="t('Cancel', 'ပယ်ဖျက်မည်', '取消', 'ยกเลิก')"
      close-on-click-action
      @select="onSelectCategory"
    />

    <!-- Date range calendar (Vant Calendar – English only) -->
    <VanCalendar
      v-model:show="showCalendar"
      type="range"
      color="#ee0a24"
      :default-date="dateRange"
      :min-date="minDate"
      :max-date="maxDate"
      :title="
        t(
          'Select date range',
          'နေ့ရက် အကွာအဝေး ရွေးချယ်ပါ',
          '选择日期范围',
          'เลือกช่วงวันที่',
        )
      "
      :confirm-text="t('Confirm', 'အတည်ပြု', '确认', 'ยืนยัน')"
      poppable
      @confirm="onCalendarConfirm"
    />
  </div>
</template>

<style scoped>
.deposit-history-tabs :deep(.van-tabs__nav) {
  background: transparent;
}
.deposit-history-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.deposit-history-tabs :deep(.van-tab) {
  color: rgba(255, 255, 255, 0.7);
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.deposit-history-tabs {
  --van-tabs-bottom-bar-width: 25%;
}
.deposit-history-tabs :deep(.van-tabs__line) {
  background: #1986E1;
  width: 25% !important;
}
.deposit-history-empty :deep(.van-empty__description) {
  color: rgba(255, 255, 255, 0.85);
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.deposit-history-empty :deep(.van-empty__image) {
  opacity: 0.9;
}
/* Pagination styles are in global style.css */
</style>

<style>
/* Calendar black theme when open (calendar is in body) */
body.calendar-dark-open .van-calendar,
body.calendar-dark-open .van-calendar__popup {
  --van-calendar-background: #172240;
  --van-calendar-header-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  --van-calendar-month-mark-color: rgba(255, 255, 255, 0.04);
  --van-calendar-day-disabled-color: rgba(255, 255, 255, 0.25);
  --van-calendar-range-edge-color: #fff;
  --van-calendar-range-edge-background: #1986E1;
  --van-calendar-range-middle-color: #1986E1;
  --van-calendar-range-middle-background-opacity: 0.15;
  --van-calendar-selected-day-color: #fff;
  --van-calendar-selected-day-background: #1986E1;
}
body.calendar-dark-open .van-calendar__header,
body.calendar-dark-open .van-calendar__month-title,
body.calendar-dark-open .van-calendar__header-title,
body.calendar-dark-open .van-calendar__header-subtitle,
body.calendar-dark-open .van-calendar__weekday,
body.calendar-dark-open .van-calendar__day {
  color: #f5f5f5;
}
body.calendar-dark-open .van-calendar__header-action {
  color: #f5f5f5;
}
body.calendar-dark-open .van-calendar__popup .van-popup {
  background: #172240;
}
body.calendar-dark-open .van-calendar .van-button--primary {
  background: #1986E1;
  border-color: #1986E1;
}
</style>
