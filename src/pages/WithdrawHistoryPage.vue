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

const isLoggedIn = computed(() => {
  const authUser = store?.state?.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const { t, language } = useTranslation();

const isLoading = ref(false);
const tableData = ref([]);
const rows = ref(1);
const currentPage = ref(1);
const activeTab = ref(0);

const tabTitles = computed(() => [
  t("All", "အားလုံး", "全部", "ทั้งหมด"),
  t("Today", "ယနေ့", "今天", "วันนี้"),
  t("Yesterday", "မနေ့", "昨天", "เมื่อวาน"),
  t("Week", "တပတ်", "本周", "สัปดาห์"),
]);

const showAllSheet = ref(false);
const showCategoriesSheet = ref(false);
const selectedAll = ref(t("All", "အားလုံး", "全部", "ทั้งหมด"));
const selectedCategory = ref(
  t("Categories", "အမျိုးအစားများ", "分类", "หมวดหมู่"),
);
// API filter values (for request params, language-independent)
const selectedStatusValue = ref("");
const selectedCategoryValue = ref("");

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
    name: t("Withdrawn", "ငွေထုတ်ပြီး", "已提现", "ถอนแล้ว"),
    value: "withdrawn",
  },
  {
    name: t("Pending", "စောင့်ဆိုင်းနေသည်", "处理中", "รอดำเนินการ"),
    value: "pending",
  },
  { name: t("Failed", "မအောင်မြင်ပါ", "失败", "ล้มเหลว"), value: "failed" },
]);

const categoryActions = computed(() => [
  {
    name: t("All types", "အမျိုးအစားအားလုံး", "全部类型", "ทุกประเภท"),
    value: "",
  },
  { name: "WavePay", value: "WavePay" },
  { name: "KBZ Pay", value: "KBZ Pay" },
  {
    name: t("Bank transfer", "ဘဏ်လွှဲပြောင်းမှု", "银行转账", "โอนผ่านธนาคาร"),
    value: "bank_transfer",
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

/** Returns Tailwind classes for card border/background based on status */
const getCardStatusClass = (row) => {
  const s = String(row?.status ?? "").toLowerCase();
  if (["confirm", "withdrawn", "completed", "success"].includes(s))
    return "border-l-4 border-green-500 bg-green-500/10";
  if (["pending", "processing"].includes(s))
    return "border-l-4 border-amber-500 bg-amber-500/10";
  if (["failed", "fail", "error", "rejected"].includes(s))
    return "border-l-4 border-red-500 bg-red-500/10";
  return "border-l-4 border-gray-500 bg-gray-500/5";
};

const getCardRow = (row) => {
  // API: amount may be number or already formatted string after fetch
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

const fetchWithdrawHistory = async () => {
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
      params.set("bank_type", selectedCategoryValue.value);

    const res = await axios.get(`/user/withdraws?${params.toString()}`, {
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
    console.error("Error fetching withdrawal history:", error);
    tableData.value = [];
    rows.value = 0;
    try {
      showFailToast({
        message: t(
          "Failed to load withdrawal history",
          "ငွေထုတ်ယူမှု မှတ်တမ်း ရယူရန် မအောင်မြင်ပါ",
          "加载提现记录失败",
          "โหลดประวัติการถอนเงินไม่สำเร็จ",
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

const tableColumns = computed(() => [
  t("Date", "နေ့စွဲ", "日期", "วันที่"),
  t("Amount", "ငွေအမောင့်", "金额", "จำนวนเงิน"),
  t("Status", "အခြေအနေ", "状态", "สถานะ"),
  t("Account", "အကောင့်", "账号", "บัญชี"),
  t("Remark", "မှတ်ချက်", "备注", "หมายเหตุ"),
]);

watch(currentPage, () => {
  fetchWithdrawHistory();
});

// When filters change, reset to first page and refetch
watch(
  [activeTab, dateRange, selectedStatusValue, selectedCategoryValue],
  () => {
    const wasPage1 = currentPage.value === 1;
    currentPage.value = 1;
    if (wasPage1) fetchWithdrawHistory();
  },
  { deep: true },
);

onMounted(async () => {
  const authUser = await store.dispatch("fetchUser");
  if (!authUser) {
    router.push("/");
    return;
  }
  dateRange.value = getDateRangeForTab(activeTab.value);
  await fetchWithdrawHistory();
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
              "Withdrawal History",
              "ငွေထုတ်ယူမှု မှတ်တမ်း",
              "提现记录",
              "ประวัติการถอนเงิน",
            )
          }}
        </h1>
        <router-link
          :to="{ name: 'deposit-history' }"
          class="inline-flex items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-colors"
          :aria-label="
            t(
              'Deposit History',
              'ငွေဖြည့်မှတ်တမ်း',
              '充值记录',
              'ประวัติการฝากเงิน',
            )
          "
        >
          <img
            src="/deposit.png"
            :alt="
              t(
                'Deposit History',
                'ငွေဖြည့်မှတ်တမ်း',
                '充值记录',
                'ประวัติการฝากเงิน',
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

    <!-- Tabs + Content -->
    <div v-else class="">
      <VanTabs
        v-model:active="activeTab"
        class="withdraw-history-tabs"
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

            <!-- Transaction detail cards -->
            <div class="space-y-4">
              <div
                v-for="(row, rowIndex) in displayList"
                :key="rowIndex"
                :class="[
                  'rounded-lg py-4 px-4 shadow-sm font-[\'Pyidaungsu\',\'Padauk\',sans-serif] text-white',
                  getCardStatusClass(row),
                ]"
              >
                <p class="text-lg font-light text-white">
                  {{ getCardRow(row).method }}
                </p>
                <p class="text-base font-semibold text-white mt-0.5">
                  {{ getCardRow(row).date || "—" }}
                </p>

                <div class="bg-[#080E1E] rounded-lg mt-3 px-3 py-2">
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

                  <p class="mt-3 text-lg text-white">
                    {{
                      t("Postscript", "မှတ်စု", "附言", "หมายเหตุเพิ่มเติม")
                    }}:
                    {{ getCardRow(row).postscript || "—" }}
                  </p>

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

            <VanEmpty
              v-if="displayList.length === 0"
              class="py-20 withdraw-history-empty"
              :description="
                t(
                  'No withdrawal history found',
                  'ငွေထုတ်ယူမှု မှတ်တမ်း မရှိပါ',
                  '暂无提现记录',
                  'ไม่พบประวัติการถอนเงิน',
                )
              "
            />
          </div>
        </VanTab>
      </VanTabs>

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

    <VanCalendar
      v-model:show="showCalendar"
      type="range"
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
.withdraw-history-tabs :deep(.van-tabs__nav) {
  background: transparent;
}
.withdraw-history-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.withdraw-history-tabs :deep(.van-tab) {
  color: rgba(255, 255, 255, 0.7);
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.withdraw-history-tabs {
  --van-tabs-bottom-bar-width: 25%;
}
.withdraw-history-tabs :deep(.van-tabs__line) {
  background: #1986E1;
  width: 25% !important;
}
.withdraw-history-empty :deep(.van-empty__description) {
  color: rgba(255, 255, 255, 0.85);
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.withdraw-history-empty :deep(.van-empty__image) {
  opacity: 0.9;
}
</style>
