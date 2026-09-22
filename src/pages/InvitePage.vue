<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { showFailToast, showSuccessToast } from "vant";
import {
  Tabs as VanTabs,
  Tab as VanTab,
  Empty as VanEmpty,
  Popup as VanPopup,
  Calendar as VanCalendar,
  Pagination as VanPagination,
} from "vant";
import { useTranslation } from "../composables/useTranslation";
import { useFormatAmount } from "../composables/useFormatAmount";
import { useModal } from "../composables/useModal";
import {
  getReferral,
  getReferralBonusSummary,
  getReferralBonusByDate,
} from "../api/referral";

// Tab state — titles follow language (Rewards tab omitted)
const inviteActiveTab = ref(0);
const inviteTabTitles = computed(() => [
  t("Overview", "ခြုံငုံသုံးသပ်မှု", "概览", "ภาพรวม"),
  // t("Rewards", "ဆုလာဘ်", "奖励", "รางวัล"),
  t("Income", "ဝင်ငွေ", "收入", "รายได้"),
  t(
    "Invite list",
    "ဖိတ်ကြားထားသူများစာရင်း",
    "邀请列表",
    "รายชื่อผู้ได้รับเชิญ",
  ),
]);

// --- Rewards tab: referral reward-events API removed; wire new endpoint here ---
const rewardEventsList = ref([]);
const rewardEventsLoading = ref(false);
const claimingEventId = ref(null);

async function fetchRewardEvents() {
  if (!store.getters.isLoggedIn) return;
  rewardEventsLoading.value = true;
  try {
    rewardEventsList.value = [];
  } finally {
    rewardEventsLoading.value = false;
  }
}

async function claimRewardEvent(event) {
  if (!event || event.claimed || event.progressCurrent < event.progressTarget)
    return;
  claimingEventId.value = event.id;
  try {
    // Referral claim API removed; wire new endpoint here
  } finally {
    claimingEventId.value = null;
  }
}

const router = useRouter();
const store = useStore();
const { t } = useTranslation();
const { formatAmount } = useFormatAmount();
const { openLoginModal } = useModal();

/** GET /user/referral + GET /user/referral/bonus-summary */
const referralPayload = ref(null);
const bonusSummaryPayload = ref(null);
const bonusByDatePayload = ref(null);
/** Show leaderboard section when referral list exists */
const showTab0DemoWinnersSection = computed(
  () =>
    Array.isArray(referralPayload.value?.referrals) &&
    referralPayload.value.referrals.length > 0,
);

function syncRecordsTabStatsFromPayloads() {
  const sum = referralPayload.value?.summary;
  const b = bonusSummaryPayload.value;
  if (sum) {
    recordsTabInvitedCount.value = Number(sum.total_referrals) || 0;
    recordsTabActiveCount.value = Number(sum.rewarded_referrals) || 0;
    recordsTabVipLabel.value = "";
  }
  if (b) {
    recordsTabToday.value = `K ${formatAmount(Number(b.today_bonus) || 0, 2)}`;
    recordsTabYesterday.value = `K ${formatAmount(
      Number(b.yesterday_bonus) || 0,
      2,
    )}`;
    recordsTabCurrentMonth.value = `K ${formatAmount(
      Number(b.this_month_bonus) || 0,
      2,
    )}`;
  }
}

function applyInvitedReferralsFilter() {
  const raw = bonusByDatePayload.value?.transactions;
  if (!Array.isArray(raw) || raw.length === 0) {
    invitedUserList.value = [];
    recordsTotal.value = 0;
    return;
  }
  let rows = raw.slice();

  const mapStatus = (type) => {
    const normalized = String(type || "").toLowerCase();
    return normalized.includes("inviter") ? "qualified" : "not_qualified";
  };

  if (invitedStatusFilter.value === "qualified") {
    rows = rows.filter((r) => mapStatus(r.type) === "qualified");
  } else if (invitedStatusFilter.value === "not_qualified") {
    rows = rows.filter((r) => mapStatus(r.type) === "not_qualified");
  }

  const parseDate = (row) => {
    const s = row?.local_date || row?.created_at;
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  if (invitedFilterTodayActive.value) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    rows = rows.filter((r) => {
      const j = parseDate(r);
      return j && j >= start && j <= end;
    });
  } else {
    const range = invitedDateRange.value;
    if (range && range.length >= 2) {
      const start = new Date(range[0]);
      start.setHours(0, 0, 0, 0);
      const endD = new Date(range[1]);
      endD.setHours(23, 59, 59, 999);
      rows = rows.filter((r) => {
        const j = parseDate(r);
        return j && j >= start && j <= endD;
      });
    }
  }

  recordsTotal.value = rows.length;
  const startIdx = (recordsPage.value - 1) * recordsLimit;
  const pageRows = rows.slice(startIdx, startIdx + recordsLimit);

  invitedUserList.value = pageRows.map((r) => {
    const joined = parseDate(r);
    const dateStr = joined
      ? `${String(joined.getMonth() + 1).padStart(2, "0")}/${String(joined.getDate()).padStart(2, "0")}/${joined.getFullYear()}`
      : "—";
    const status = mapStatus(r.type);
    const label =
      status === "qualified"
        ? t("Inviter bonus", "ဖိတ်သူဆု", "邀请方奖励", "โบนัสผู้แนะนำ")
        : t("Invitee bonus", "ဖိတ်ခံသူဆု", "受邀方奖励", "โบนัสผู้ถูกแนะนำ");
    const amount = formatAmount(Number(r.amount) || 0, 2);
    return {
      id: r.id,
      user_name: `${label} (K ${amount})`,
      name: label,
      date: dateStr,
      status,
    };
  });
}

function formatDateForApi(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- Invite tab 1: load referral + bonus summary ---
const inviteDashboardLoading = ref(false);

async function fetchInviteDashboard() {
  const hasAuth = store.getters.isLoggedIn || !!localStorage.getItem("token");
  if (!hasAuth) return;
  inviteDashboardLoading.value = true;
  try {
    const [refData, bonusData] = await Promise.all([
      getReferral(),
      getReferralBonusSummary(),
    ]);
    referralPayload.value = refData;
    bonusSummaryPayload.value = bonusData;

    if (!refData && !bonusData) return;

    const summary = refData?.summary || {};
    invitedCount.value = Number(summary.total_referrals) || 0;

    if (refData?.settings) {
      const s = refData.settings;
      const ga = Number(s.qualifying_usage_amount);
      const gb = Number(s.qualifying_total_deposit_amount);
      if (!Number.isNaN(ga) && ga > 0) incomeGoalAmount.value = ga;
      else if (!Number.isNaN(gb) && gb > 0) incomeGoalAmount.value = gb;
    }

    if (bonusData && refData?.summary) {
      summaryStats.value = [
        {
          label: "_",
          value: formatAmount(Number(bonusData.today_bonus) || 0, 2),
          gradient: "blue",
        },
        {
          label: "_",
          value: formatAmount(Number(bonusData.yesterday_bonus) || 0, 2),
          gradient: "purple",
        },
        {
          label: "_",
          value: String(Number(refData.summary.total_referrals) || 0),
          gradient: "purple",
        },
        {
          label: "_",
          value: formatAmount(Number(refData.summary.earned_amount) || 0, 2),
          gradient: "blue",
        },
      ];
    } else if (bonusData) {
      summaryStats.value = [
        {
          label: "_",
          value: formatAmount(Number(bonusData.today_bonus) || 0, 2),
          gradient: "blue",
        },
        {
          label: "_",
          value: formatAmount(Number(bonusData.yesterday_bonus) || 0, 2),
          gradient: "purple",
        },
        { label: "_", value: "0", gradient: "purple" },
        { label: "_", value: "0.00", gradient: "blue" },
      ];
    }

    if (bonusData) {
      const sm = refData?.summary || {};
      const tBonus = Number(bonusData.today_bonus) || 0;
      const yBonus = Number(bonusData.yesterday_bonus) || 0;
      const wBonus = Number(bonusData.this_week_bonus) || 0;
      currentIncomeTab1.value = [
        {
          title: t("Today's bonus", "ယနေ့ဆု", "今日奖金", "โบนัสวันนี้"),
          amount: Number(bonusData.today?.total_bonus ?? tBonus) || 0,
          bonusesCount: Number(sm.rewarded_referrals) || 0,
          icon: "star",
        },
        {
          title: t("Yesterday's bonus", "မနေ့ဆု", "昨日奖金", "โบนัสเมื่อวาน"),
          amount: Number(bonusData.yesterday?.total_bonus ?? yBonus) || 0,
          bonusesCount: Number(sm.pending_referrals) || 0,
          icon: "medal",
        },
        {
          title: t(
            "This week bonus",
            "ဒီအပတ်ဆု",
            "本周奖金",
            "โบนัสสัปดาห์นี้",
          ),
          amount: Number(bonusData.this_week?.total_bonus ?? wBonus) || 0,
          bonusesCount: Number(sm.total_referrals) || 0,
          icon: "cashback",
        },
      ];
    }

    if (bonusData && refData?.summary) {
      const sm = refData.summary;
      const suffix = t(
        "bonuses issued",
        "ဘောနပ်စ်ထုတ်ထားသည်",
        "已发放奖励",
        "โบนัสที่ออกแล้ว",
      );
      incomeCards.value = [
        {
          title: t("Today's bonus", "ယနေ့ဆု", "今日奖金", "โบนัสวันนี้"),
          amount: formatAmount(Number(bonusData.today_bonus) || 0, 2),
          subtitle: `${Number(sm.rewarded_referrals) || 0} ${suffix}`,
          icon: "star",
        },
        {
          title: t("Yesterday's bonus", "မနေ့ဆု", "昨日奖金", "โบนัสเมื่อวาน"),
          amount: formatAmount(Number(bonusData.yesterday_bonus) || 0, 2),
          subtitle: `${Number(sm.pending_referrals) || 0} ${suffix}`,
          icon: "medal",
        },
        {
          title: t("This month bonus", "ဒီလဆု", "本月奖金", "โบนัสเดือนนี้"),
          amount: formatAmount(Number(bonusData.this_month_bonus) || 0, 2),
          subtitle: `${Number(sm.total_referrals) || 0} ${suffix}`,
          icon: "cashback",
          showJitLogo: true,
        },
      ];
    }

    syncRecordsTabStatsFromPayloads();
    applyInvitedReferralsFilter();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) openLoginModal();
    else if (status === 403) {
      showFailToast(
        t(
          "Referral is only available for normal accounts.",
          "ဖိတ်ခေါ်ခြင်းကို ပုံမှန်အကောင့်များတွင်သာ ရနိုင်ပါသည်။",
          "邀请功能仅限普通账户。",
          "การแนะนำเพื่อนใช้ได้เฉพาะบัญชีทั่วไป",
        ),
      );
    }
    referralPayload.value = null;
    bonusSummaryPayload.value = null;
  } finally {
    inviteDashboardLoading.value = false;
  }
}

// Share link: `?r=` must match RegisterModal.vue (localStorage referralCode on register).
const shareReferralCode = computed(() => {
  const api = referralPayload.value?.referral_code;
  if (api != null && String(api).trim()) return String(api).trim();
  const u = store?.state?.authUser || {};
  return String(u.user_name || "").trim();
});

const referralInviteDisabled = computed(
  () => referralPayload.value?.settings?.is_enabled === false,
);

const referrerDisplayLine = computed(() => {
  const r = referralPayload.value?.referrer;
  if (!r || typeof r !== "object") return "";
  const name = r.user_name || r.name || r.referral_code;
  if (!name) return "";
  return `${t("Referred by", "ဖိတ်ခေါ်သူ", "推荐人", "แนะนำโดย")} ${name}`;
});

const referralLink = computed(() => {
  const code = shareReferralCode.value;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return code ? `${origin}/?r=${encodeURIComponent(code)}` : "";
});

const copyLink = async () => {
  if (referralInviteDisabled.value) {
    showFailToast(
      t(
        "Referrals are disabled.",
        "ဖိတ်ခေါ်ခြင်းပိတ်ထားသည်။",
        "邀请功能已关闭。",
        "ปิดการแนะนำแล้ว",
      ),
    );
    return;
  }
  try {
    await navigator.clipboard.writeText(referralLink.value);
    showSuccessToast({
      message: t("Copied!", "ကူးယူပြီးပါပြီ", "已复制", "คัดลอกแล้ว!"),
      position: "top",
    });
  } catch (e) {
    showFailToast({
      message: t("Copy failed", "ကူးယူ၍မရပါ", "复制失败", "คัดลอกไม่สำเร็จ"),
      position: "top",
    });
  }
};

const shareUrl = (platform) => {
  if (referralInviteDisabled.value) {
    showFailToast(
      t(
        "Referrals are disabled.",
        "ဖိတ်ခေါ်ခြင်းပိတ်ထားသည်။",
        "邀请功能已关闭。",
        "ปิดการแนะนำแล้ว",
      ),
    );
    return;
  }
  const url = encodeURIComponent(referralLink.value);
  const text = encodeURIComponent("Join me on JIT99");

  const map = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `${decodeURIComponent(text)} ${decodeURIComponent(url)}`,
    )}`,
    line: `https://social-plugins.line.me/lineit/share?url=${url}`,
    messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=1234567890&redirect_uri=${url}`,
  };

  const target = map[platform];
  if (!target) return;
  window.open(target, "_blank", "noopener,noreferrer");
};

// --- Summary (4 cards): referral summary API removed; wire new endpoint here ---
const summaryLoading = ref(false);
const summaryStats = ref([
  { label: "ယနေ့ဝင်ငွေ", value: "--", gradient: "blue" },
  { label: "မနေ့က ဝင်ငွေ", value: "--", gradient: "purple" },
  { label: "ဖိတ်ခေါ် ဦးရေ", value: "--", gradient: "purple" },
  { label: "တရားဝင်ဆော့သူများ", value: "--", gradient: "blue" },
]);

const summaryStatsDisplay = computed(() => {
  const labels = [
    t("Today's bonus", "ယနေ့ဆု", "今日奖金", "โบนัสวันนี้"),
    t("Yesterday's bonus", "မနေ့ဆု", "昨日奖金", "โบนัสเมื่อวาน"),
    t(
      "Total referrals",
      "ဖိတ်ခေါ်စုစုပေါင်း",
      "邀请总人数",
      "จำนวนแนะนำทั้งหมด",
    ),
    t(
      "Earned from referrals",
      "ဖိတ်ခေါ်ဆုငွေ",
      "邀请获得金额",
      "รายได้จากการแนะนำ",
    ),
  ];
  return summaryStats.value.map((s, i) => ({
    ...s,
    label: labels[i] ?? s.label,
  }));
});

// --- Tab 4 (မှတ်တမ်းများ - Records): referral records APIs removed; wire new endpoints here ---
const recordsTabVipLabel = ref("");
const recordsTabInvitedCount = ref(0);
const recordsTabActiveCount = ref(0);
const recordsTabToday = ref("+0");
const recordsTabYesterday = ref("+0");
const recordsTabCurrentMonth = ref("+0");
const recordsTabStatsLoading = ref(false);
const invitedRecordsLoading = ref(false);
const recordsTotal = ref(0);
const recordsPage = ref(1);
const recordsLimit = 20;

// Invited user filter (under Records tab): Status popup, Today button, date range calendar
const invitedStatusOptions = computed(() => [
  { text: t("All", "အားလုံး", "全部", "ทั้งหมด"), value: "all" },
  {
    text: t("Qualified", "အရည်အချင်းပြည့်မီသည်", "符合条件", "ผ่านเกณฑ์"),
    value: "qualified",
  },
  {
    text: t(
      "Not qualified",
      "အရည်အချင်းမပြည့်မီ",
      "未符合条件",
      "ไม่ผ่านเกณฑ์",
    ),
    value: "not_qualified",
  },
]);
const invitedStatusFilter = ref("all");
const showInvitedStatusPopup = ref(false);
const invitedFilterTodayActive = ref(true);
const invitedDateRange = ref([new Date(), new Date()]);
const showInvitedCalendar = ref(false);
const invitedUserList = ref([]);

const invitedStatusLabel = computed(() => {
  const o = invitedStatusOptions.value.find(
    (opt) => opt.value === invitedStatusFilter.value,
  );
  return o ? o.text : t("All", "အားလုံး", "全部", "ทั้งหมด");
});

const invitedDateRangeText = computed(() => {
  const range = invitedDateRange.value;
  if (!range || !Array.isArray(range) || range.length < 2) return "—";
  const fmt = (d) => {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${String(m).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
  };
  return `${fmt(range[0])}- ${fmt(range[1])}`;
});

function onInvitedStatusSelect(value) {
  invitedStatusFilter.value = value;
  showInvitedStatusPopup.value = false;
  recordsPage.value = 1;
  fetchInviteRecords();
}

function onInvitedCalendarConfirm(dates) {
  if (Array.isArray(dates)) invitedDateRange.value = dates;
  invitedFilterTodayActive.value = false;
  showInvitedCalendar.value = false;
  recordsPage.value = 1;
  fetchInviteRecords();
}

function onInvitedFilterTodayClick() {
  invitedFilterTodayActive.value = true;
  const today = new Date();
  invitedDateRange.value = [today, today];
  recordsPage.value = 1;
  fetchInviteRecords();
}

function onRecordsPageChange(page) {
  recordsPage.value = page;
  fetchInviteRecords();
}

function buildInviteRecordsParams() {
  const params = {
    status: invitedStatusFilter.value || "all",
    page: recordsPage.value,
    limit: recordsLimit,
  };
  if (invitedFilterTodayActive.value) {
    params.preset = "today";
  } else {
    const range = invitedDateRange.value;
    if (range && Array.isArray(range) && range.length >= 2) {
      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      params.dateFrom = fmt(range[0]);
      params.dateTo = fmt(range[1]);
    }
  }
  return params;
}

async function fetchRecordsStatistics() {
  const hasAuth = store.getters.isLoggedIn || !!localStorage.getItem("token");
  if (!hasAuth) return;
  recordsTabStatsLoading.value = true;
  try {
    if (referralPayload.value || bonusSummaryPayload.value) {
      syncRecordsTabStatsFromPayloads();
    } else {
      recordsTabToday.value = "+0";
      recordsTabYesterday.value = "+0";
      recordsTabCurrentMonth.value = "+0";
    }
  } finally {
    recordsTabStatsLoading.value = false;
  }
}

async function fetchInviteRecords() {
  const hasAuth = store.getters.isLoggedIn || !!localStorage.getItem("token");
  if (!hasAuth) return;
  invitedRecordsLoading.value = true;
  try {
    let fromDate;
    let toDate;
    if (invitedFilterTodayActive.value) {
      const today = new Date();
      fromDate = formatDateForApi(today);
      toDate = formatDateForApi(today);
    } else {
      const range = invitedDateRange.value;
      if (!range || !Array.isArray(range) || range.length < 2) {
        invitedUserList.value = [];
        recordsTotal.value = 0;
        return;
      }
      fromDate = formatDateForApi(new Date(range[0]));
      toDate = formatDateForApi(new Date(range[1]));
    }
    const data = await getReferralBonusByDate({
      from_date: fromDate,
      to_date: toDate,
    });
    bonusByDatePayload.value = data;

    if (data) {
      recordsTabInvitedCount.value = Number(data.count) || 0;
      recordsTabActiveCount.value =
        (Array.isArray(data.transactions) ? data.transactions.length : 0) || 0;
    }
    applyInvitedReferralsFilter();
  } catch (err) {
    if (err?.response?.status === 401) openLoginModal();
    else if (err?.response?.status === 403) {
      showFailToast(
        t(
          "Referral is only available for normal accounts.",
          "ဖိတ်ခေါ်ခြင်းကို ပုံမှန်အကောင့်များတွင်သာ ရနိုင်ပါသည်။",
          "邀请功能仅限普通账户。",
          "การแนะนำเพื่อนใช้ได้เฉพาะบัญชีทั่วไป",
        ),
      );
    }
    invitedUserList.value = [];
    recordsTotal.value = 0;
  } finally {
    invitedRecordsLoading.value = false;
  }
}

// --- Income goal (first tab) – can be from API later ---
const incomeGoalAmount = ref(150000);
const incomeGoalTargetUsers = ref(10);
const incomeGoalFormatted = computed(() =>
  formatAmount(Number(incomeGoalAmount.value || 0), 2),
);

/** Invite page UI strings (en, mm, cn, th) – reactive to language */
const inviteTexts = computed(() => ({
  pageTitle: t(
    "Invite friends",
    "သူငယ်ချင်းများကိုဖိတ်ခေါ်ကြ",
    "邀请好友",
    "เชิญเพื่อน",
  ),
  incomeGoalTitle: t(
    "Income goal",
    "ဝင်ငွေပန်းတိုင်",
    "收入目标",
    "เป้ารายได้",
  ),
  incomeGoalHintPrefix: t(
    "To reach the goal, invite ",
    "ပစ်မှတ်ပြည့်မီရန် အသုံးပြုသူ ",
    "为达成目标，请邀请 ",
    "เพื่อถึงเป้า เชิญผู้ใช้ ",
  ),
  incomeGoalHintSuffix: t(" users.", " ဦးကို ဖိတ်ကြားပါ။", " 位用户。", " คน"),
  incomeCalcTitle: t(
    "Income calculator",
    "ဝင်ငွေ ဂဏန်းတွက်စက်",
    "收入计算器",
    "เครื่องคำนวณรายได้",
  ),
  incomeCalcLine1: t("Income", "ဝင်ငွေ", "收入", "รายได้"),
  incomeCalcLine2: t("Calculator", "ဂဏန်းတွက်စက်", "计算器", "คำนวณ"),
  incomeCalcHintPrefix: t(
    "Expected income — invite ",
    "မျှော်မှန်းထားသော ဝင်ငွေ၊ အသုံးပြုသူ ",
    "预计收入，邀请 ",
    "รายได้ที่คาดหวัง — เชิญ ",
  ),
  incomeCalcHintSuffix: t(" users.", " ဦးကို ဖိတ်ကြားပါ။", " 位用户。", " คน"),
  currentIncomeTitle: t(
    "Current income",
    "လက်ရှိဝင်ငွေ",
    "当前收入",
    "รายได้ปัจจุบัน",
  ),
  rewardSectionTitle: t(
    "Who received rewards?",
    "ဆုလာဘ်ကို ဘယ်သူတွေ ရရှိခဲ့ လဲ။",
    "谁获得了奖励？",
    "ใครได้รับรางวัลบ้าง?",
  ),
  rewardReceived: t("Received", "ရရှိခဲ့သည်။", "已获得", "ได้รับแล้ว"),
  shareWithFriends: t(
    "Share with friends",
    "မိတ်ဆွေများကို မျှဝေပါ",
    "分享给好友",
    "แชร์ให้เพื่อน",
  ),
  copy: t("Copy", "ကူးယူ", "复制", "คัดลอก"),
  rewardEventsNoExpiry: t(
    "No expiration",
    "သက်တမ်းကုန်ဆုံးခြင်းမရှိပါ။",
    "无期限",
    "ไม่มีวันหมดอายุ",
  ),
  rewardEventsLoading: t(
    "Loading rewards…",
    "ဆုလက်များဖွင့်နေသည်...",
    "加载奖励中…",
    "กำลังโหลดรางวัล…",
  ),
  rewardEventsEmpty: t(
    "No rewards yet",
    "ဆုလက်များ မရှိသေးပါ",
    "暂无奖励",
    "ยังไม่มีรางวัล",
  ),
  claiming: t("Processing…", "လုပ်ဆောင်နေသည်...", "处理中…", "กำลังดำเนินการ…"),
  claimSuccess: t(
    "Reward claimed",
    "ဆုလာဘ်ရရှိပါပြီ",
    "已领取奖励",
    "รับรางวัลแล้ว",
  ),
  claimFail: t("Could not claim", "ရယူ၍မရပါ", "领取失败", "รับไม่สำเร็จ"),
  claimError: t(
    "Claim failed",
    "ဆုလာဘ်ရယူရာမအောင်မြင်ပါ",
    "领取出错",
    "การรับล้มเหลว",
  ),
  incomeTabLoading: t(
    "Loading income…",
    "ဝင်ငွေများဖွင့်နေသည်...",
    "加载收入中…",
    "กำลังโหลดรายได้…",
  ),
  recordsInvited: t(
    "Invited",
    "ဖိတ်ခေါ် ဦးရေ",
    "邀请人数",
    "จำนวนผู้ได้รับเชิญ",
  ),
  recordsActive: t(
    "Rewarded referrals",
    "ဆုရဖိတ်ခေါ်များ",
    "已获奖邀请",
    "การแนะนำที่ได้รับรางวัล",
  ),
  recordsToday: t("Today", "ယနေ့", "今天", "วันนี้"),
  recordsYesterday: t("Yesterday", "မနေ့", "昨天", "เมื่อวาน"),
  recordsThisMonth: t("This month", "လက်ရှိလ", "本月", "เดือนนี้"),
  filterToday: t("Today", "ယနေ့", "今天", "วันนี้"),
  recordsLoading: t("Please wait…", "ခဏစောင့်ပါ...", "请稍候…", "โปรดรอ…"),
  recordsEmpty: t("No data", "အချက်အလက်မရှိပါ", "暂无数据", "ไม่มีข้อมูล"),
  tableUser: t("Username", "အသုံးပြုသူအမည်", "用户名", "ชื่อผู้ใช้"),
  tableDate: t("Date", "ရက်စွဲ", "日期", "วันที่"),
  tableStatus: t("Status", "အခြေအနေ", "状态", "สถานะ"),
  statusOfficial: t("Official", "တရားဝင်", "正式", "เป็นทางการ"),
  statusNotMet: t("Not met", "မပြည့်မီ", "未达标", "ยังไม่ถึง"),
  calendarTitle: t(
    "Select dates",
    "နေ့ရက် ရွေးချယ်ပါ",
    "选择日期",
    "เลือกวันที่",
  ),
  calendarConfirm: t("Confirm", "အတည်ပြု", "确认", "ยืนยัน"),
  statusPopupTitle: t("Status", "အခြေအနေ", "状态", "สถานะ"),
  withdrawTitle: t("Withdraw", "ပိတ်ခြင်း ထုတ်ယူခြင်း", "提款", "ถอนเงิน"),
  withdrawCta: t("Withdraw", "ငွေထုတ်ယူမည်", "提款", "ถอนเงิน"),
  qualifiedLabel: t(
    "Qualified",
    "အရည်အချင်းပြည့်မီသည်",
    "符合条件",
    "ผ่านเกณฑ์",
  ),
  claimedLabel: t("Claimed", "ရရှိပြီး", "已领取", "รับแล้ว"),
  canClaimLabel: t("Claim", "ရရှိနိုင်", "可领取", "รับได้"),
}));

// Third tab (ဝင်ငွေ): income-tab referral API removed; wire new endpoint here
const incomeTabData = ref(null);
const incomeTabLoading = ref(false);
const incomeTabDepositCount = ref(0);
const incomeTabTotalIncome = ref(0);

/** Income tab: which bonus-summary slice to show (both cards follow this) */
const incomePeriodFilter = ref("today");

const incomePeriodOptions = computed(() => [
  { value: "today", label: t("Today", "ယနေ့", "今天", "วันนี้") },
  { value: "yesterday", label: t("Yesterday", "မနေ့", "昨天", "เมื่อวาน") },
  {
    value: "this_week",
    label: t("This week", "ဒီအပတ်", "本周", "สัปดาห์นี้"),
  },
  {
    value: "this_month",
    label: t("This month", "ဒီလ", "本月", "เดือนนี้"),
  },
]);

/** Bonus fields for one period from GET /user/referral/bonus-summary */
function getIncomeBonusSlice(bonus, period) {
  if (!bonus) return null;
  if (period === "today") {
    const n = bonus.today || {};
    return {
      total: Number(n.total_bonus ?? bonus.today_bonus) || 0,
      inviter: Number(n.inviter_bonus) || 0,
      invitee: Number(n.invitee_bonus) || 0,
      date: n.date,
      dateFrom: null,
      dateTo: null,
    };
  }
  if (period === "yesterday") {
    const n = bonus.yesterday || {};
    return {
      total: Number(n.total_bonus ?? bonus.yesterday_bonus) || 0,
      inviter: Number(n.inviter_bonus) || 0,
      invitee: Number(n.invitee_bonus) || 0,
      date: n.date,
      dateFrom: null,
      dateTo: null,
    };
  }
  if (period === "this_week") {
    const n = bonus.this_week || {};
    return {
      total: Number(n.total_bonus ?? bonus.this_week_bonus) || 0,
      inviter: Number(n.inviter_bonus) || 0,
      invitee: Number(n.invitee_bonus) || 0,
      date: null,
      dateFrom: n.date_from ?? null,
      dateTo: n.date_to ?? null,
    };
  }
  if (period === "this_month") {
    const n = bonus.this_month || {};
    return {
      total: Number(n.total_bonus ?? bonus.this_month_bonus) || 0,
      inviter: Number(n.inviter_bonus) || 0,
      invitee: Number(n.invitee_bonus) || 0,
      date: null,
      dateFrom: n.date_from ?? null,
      dateTo: n.date_to ?? null,
    };
  }
  return null;
}

function incomePeriodBonusTitle(period) {
  if (period === "today")
    return t("Today's bonus", "ယနေ့ဆု", "今日奖金", "โบนัสวันนี้");
  if (period === "yesterday")
    return t("Yesterday's bonus", "မနေ့ဆု", "昨日奖金", "โบนัสเมื่อวาน");
  if (period === "this_week")
    return t("This week bonus", "ဒီအပတ်ဆု", "本周奖金", "โบนัสสัปดาห์นี้");
  return t("This month bonus", "ဒီလဆု", "本月奖金", "โบนัสเดือนนี้");
}

function setIncomePeriod(value) {
  incomePeriodFilter.value = value;
}

async function fetchIncomeTab() {
  if (!store.getters.isLoggedIn) return;
  incomeTabLoading.value = true;
  incomeTabData.value = null;
  try {
    if (!bonusSummaryPayload.value) {
      await fetchInviteDashboard();
    }
    const b = bonusSummaryPayload.value;
    const sum = referralPayload.value?.summary || {};
    incomeTabDepositCount.value = Number(sum.rewarded_referrals) || 0;
    const slice = getIncomeBonusSlice(b, incomePeriodFilter.value);
    incomeTabTotalIncome.value = Number(slice?.total) || 0;
  } finally {
    incomeTabLoading.value = false;
  }
}

// Invited count for progress (set from referral summary)
const invitedCount = ref(0);
const incomeCalculatorProgress = computed(() => {
  const target = Number(incomeGoalTargetUsers.value) || 10;
  const current = Number(invitedCount.value) || 0;
  return Math.min(100, Math.round((current / target) * 100));
});

// Third tab: two summary cards – row amounts from incomeCards (match 3rd card by title language)
function incomeTabAmountFor(type) {
  const cards = incomeCards.value;
  if (type === "referral") return cards[0]?.amount ?? "0.00";
  if (type === "achievement") return cards[1]?.amount ?? "0.00";
  const c2 = cards[2];
  const ttl = String(c2?.title || "");
  const isDeposit =
    ttl.includes("အပ်ငွေ") ||
    /deposit|deposit refund/i.test(ttl) ||
    ttl.includes("存款");
  const isBetting =
    ttl.includes("လောင်း") ||
    /betting|rebate|wager|cashback/i.test(ttl) ||
    ttl.includes("投注");
  if (type === "deposit_refund") {
    if (isDeposit) return c2?.amount ?? "0.00";
    return "0.00";
  }
  if (type === "betting_rebate") {
    if (isBetting) return c2?.amount ?? "0.00";
    return "0.00";
  }
  return "0.00";
}

const incomeTabRowLabels = computed(() => ({
  referral: t("Referral rewards", "ဖိတ်စာဆုများ", "邀请奖励", "รางวัลแนะนำ"),
  achievement: t(
    "Achievement rewards",
    "အောင်မြင်မှုဆုလာဘ်များ",
    "成就奖励",
    "รางวัลความสำเร็จ",
  ),
  depositRefund: t(
    "Deposit refund",
    "အပ်ငွေ ပြန်အမ်းငွေ",
    "存款返现",
    "คืนเงินฝาก",
  ),
  bettingRebate: t(
    "Betting rebate",
    "လောင်းကြေးပြန်အမ်းငွေ",
    "投注返利",
    "คืนยอดเดิมพัน",
  ),
  invitedCount: t(
    "Invited count",
    "ဖိတ်ခေါ် ဦးရေ",
    "邀请人数",
    "จำนวนผู้ได้รับเชิญ",
  ),
  activePlayers: t(
    "Active players",
    "တရားဝင်ဆော့သူများ",
    "活跃玩家",
    "ผู้เล่นที่ใช้งาน",
  ),
  depositCount: t("Deposit count", "ငွေသွင်းဦးရေ", "存款次数", "จำนวนครั้งฝาก"),
}));

function incomeTabFormatAmount(n) {
  return formatAmount(Number(n) || 0, 2);
}

const incomeTabCard1 = computed(() => {
  const L = incomeTabRowLabels.value;
  const bonus = bonusSummaryPayload.value;
  if (bonus) {
    const period = incomePeriodFilter.value;
    const slice = getIncomeBonusSlice(bonus, period);
    if (!slice) {
      return {
        title: incomePeriodBonusTitle(period),
        rows: [],
      };
    }
    const titleBase = incomePeriodBonusTitle(period);
    return {
      title: `${titleBase} K ${incomeTabFormatAmount(slice.total)}`,
      rows: [
        {
          label: t("Inviter bonus", "ဖိတ်သူဆု", "邀请方奖励", "โบนัสผู้แนะนำ"),
          value: incomeTabFormatAmount(slice.inviter),
          isAmount: true,
        },
        {
          label: t(
            "Invitee bonus",
            "ဖိတ်ခံသူဆု",
            "受邀方奖励",
            "โบนัสผู้ถูกแนะนำ",
          ),
          value: incomeTabFormatAmount(slice.invitee),
          isAmount: true,
        },
        {
          label: t("Total bonus", "စုစုပေါင်းဆု", "奖金合计", "โบนัสรวม"),
          value: incomeTabFormatAmount(slice.total),
          isAmount: true,
        },
      ],
    };
  }
  const d = incomeTabData.value;
  if (d) {
    const b = d.income_breakdown || {};
    const ref = b.referral_rewards;
    const ach = b.achievement_rewards;
    const dep = b.deposit_refund;
    const bet = b.betting_rebate;
    const todayLabel = t(
      "Today's income",
      "ယနေ့ဝင်ငွေ",
      "今日收入",
      "รายได้วันนี้",
    );
    return {
      title: `${todayLabel} K ${incomeTabFormatAmount(d.today_income)}`,
      rows: [
        {
          label: L.referral,
          value: incomeTabFormatAmount(ref?.amount),
          isAmount: true,
        },
        {
          label: L.achievement,
          value: incomeTabFormatAmount(ach?.amount),
          isAmount: true,
        },
        {
          label: L.depositRefund,
          value: incomeTabFormatAmount(dep?.amount),
          isAmount: true,
        },
        {
          label: L.bettingRebate,
          value: incomeTabFormatAmount(bet?.amount),
          isAmount: true,
        },
        {
          label: L.invitedCount,
          value: String(d.referral_count ?? 0),
          isAmount: false,
        },
        {
          label: L.activePlayers,
          value: String(d.official_players_count ?? 0),
          isAmount: false,
        },
        {
          label: L.depositCount,
          value: String(d.deposit_count ?? 0),
          isAmount: false,
        },
      ],
    };
  }
  const todayVal = summaryStats.value[0]?.value ?? "0.00";
  const refCount = summaryStats.value[2]?.value ?? "0";
  const offCount = summaryStats.value[3]?.value ?? "0";
  const todayLabel = t(
    "Today's income",
    "ယနေ့ဝင်ငွေ",
    "今日收入",
    "รายได้วันนี้",
  );
  return {
    title: `${todayLabel} K ${todayVal}`,
    rows: [
      {
        label: L.referral,
        value: incomeCards.value[0]?.amount ?? "0.00",
        isAmount: true,
      },
      {
        label: L.achievement,
        value: incomeCards.value[1]?.amount ?? "0.00",
        isAmount: true,
      },
      {
        label: L.depositRefund,
        value: incomeTabAmountFor("deposit_refund"),
        isAmount: true,
      },
      {
        label: L.bettingRebate,
        value: incomeTabAmountFor("betting_rebate"),
        isAmount: true,
      },
      { label: L.invitedCount, value: refCount, isAmount: false },
      { label: L.activePlayers, value: offCount, isAmount: false },
      {
        label: L.depositCount,
        value: String(incomeTabDepositCount.value ?? 0),
        isAmount: false,
      },
    ],
  };
});

const incomeTabTotalFormatted = computed(() => {
  const bonus = bonusSummaryPayload.value;
  if (bonus) {
    const slice = getIncomeBonusSlice(bonus, incomePeriodFilter.value);
    return incomeTabFormatAmount(Number(slice?.total) || 0);
  }
  const d = incomeTabData.value;
  if (d != null && d.total_income != null)
    return incomeTabFormatAmount(d.total_income);
  return formatAmount(Number(incomeTabTotalIncome.value) || 0, 2);
});

const incomeTabCard2 = computed(() => {
  const L = incomeTabRowLabels.value;
  const bonus = bonusSummaryPayload.value;
  const totalVal = incomeTabTotalFormatted.value;
  const totalTitle = t(
    "Total income",
    "စုစုပေါင်းဝင်ငွေ",
    "总收入",
    "รายได้รวม",
  );
  if (bonus) {
    const period = incomePeriodFilter.value;
    const slice = getIncomeBonusSlice(bonus, period);
    const sum = referralPayload.value?.summary || {};
    const detailTitle = t(
      "Period details",
      "ကာလအသေးစိတ်",
      "周期说明",
      "รายละเอียดช่วงเวลา",
    );
    const rows = [];

    if (slice?.date) {
      rows.push({
        label: t("Date", "ရက်စွဲ", "日期", "วันที่"),
        value: String(slice.date),
        isAmount: false,
      });
    }
    if (slice?.dateFrom && slice?.dateTo) {
      rows.push({
        label: t("Date range", "နေ့စွဲအကွာအဝေး", "日期范围", "ช่วงวันที่"),
        value: `${slice.dateFrom} – ${slice.dateTo}`,
        isAmount: false,
      });
    }

    if (period === "this_month") {
      rows.push({
        label: L.invitedCount,
        value: String(sum.total_referrals ?? 0),
        isAmount: false,
      });
      rows.push({
        label: t(
          "Rewarded referrals",
          "ဆုရဖိတ်ခေါ်များ",
          "已获奖邀请",
          "การแนะนำที่ได้รับรางวัล",
        ),
        value: String(sum.rewarded_referrals ?? 0),
        isAmount: false,
      });
      rows.push({
        label: t(
          "Pending referrals",
          "စောင့်ဆိုင့် ဖိတ်ခေါ်များ",
          "待完成邀请",
          "การแนะนำที่รอดำเนินการ",
        ),
        value: String(sum.pending_referrals ?? 0),
        isAmount: false,
      });
      rows.push({
        label: t(
          "Earned (all time)",
          "စုစုပေါင်း ရရှိငွေ",
          "累计获得",
          "รายได้สะสม",
        ),
        value: incomeTabFormatAmount(sum.earned_amount),
        isAmount: true,
      });
    }

    if (rows.length === 0) {
      rows.push({
        label: t("Period", "ကာလ", "周期", "ช่วงเวลา"),
        value: incomePeriodBonusTitle(period),
        isAmount: false,
      });
    }

    return {
      title: `${detailTitle} · K ${totalVal}`,
      rows,
    };
  }
  const d = incomeTabData.value;
  if (d) {
    const b = d.income_breakdown || {};
    const ref = b.referral_rewards;
    const ach = b.achievement_rewards;
    const dep = b.deposit_refund;
    const bet = b.betting_rebate;
    return {
      title: `${totalTitle} K ${totalVal}`,
      rows: [
        {
          label: L.referral,
          value: incomeTabFormatAmount(ref?.amount),
          isAmount: true,
        },
        {
          label: L.achievement,
          value: incomeTabFormatAmount(ach?.amount),
          isAmount: true,
        },
        {
          label: L.depositRefund,
          value: incomeTabFormatAmount(dep?.amount),
          isAmount: true,
        },
        {
          label: L.bettingRebate,
          value: incomeTabFormatAmount(bet?.amount),
          isAmount: true,
        },
        {
          label: L.invitedCount,
          value: String(d.referral_count ?? 0),
          isAmount: false,
        },
        {
          label: L.activePlayers,
          value: String(d.official_players_count ?? 0),
          isAmount: false,
        },
        {
          label: L.depositCount,
          value: String(d.deposit_count ?? 0),
          isAmount: false,
        },
      ],
    };
  }
  const refAmount = incomeCards.value[0]?.amount ?? "0.00";
  return {
    title: `${totalTitle} K ${totalVal}`,
    rows: [
      { label: L.referral, value: refAmount, isAmount: true },
      {
        label: L.achievement,
        value: incomeCards.value[1]?.amount ?? "0.00",
        isAmount: true,
      },
      {
        label: L.depositRefund,
        value: incomeTabAmountFor("deposit_refund"),
        isAmount: true,
      },
      {
        label: L.bettingRebate,
        value: incomeTabAmountFor("betting_rebate"),
        isAmount: true,
      },
      {
        label: L.invitedCount,
        value: summaryStats.value[2]?.value ?? "0",
        isAmount: false,
      },
      {
        label: L.activePlayers,
        value: summaryStats.value[3]?.value ?? "0",
        isAmount: false,
      },
      {
        label: L.depositCount,
        value: String(incomeTabDepositCount.value ?? 0),
        isAmount: false,
      },
    ],
  };
});

// --- Current income (လက်ရှိဝင်ငွေ) in tab 1: persistent random data so it looks like real data ---
const STORAGE_KEY_CURRENT_INCOME = "invite_tab1_current_income";

function getOrCreateCurrentIncomeTab1() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_INCOME);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    }
  } catch (_) {}
  // Generate once: amounts in millions (realistic range), bonus counts
  const amount = (min, max) =>
    Number((min + Math.random() * (max - min)).toFixed(2));
  const bonus = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
  const data = [
    {
      title: "ဖိတ်စာဆုများ",
      amount: amount(10, 55) * 1_000_000,
      bonusesCount: bonus(800, 1800),
      icon: "star",
    },
    {
      title: "အောင်မြင်မှုဆုလာဘ်များ",
      amount: amount(5, 18) * 1_000_000,
      bonusesCount: bonus(200, 450),
      icon: "medal",
    },
    {
      title: "လောင်းကြေးပြန်အမ်းငွေ",
      amount: amount(30, 70) * 1_000_000,
      bonusesCount: bonus(3000, 5500),
      icon: "cashback",
    },
  ];
  const toStore = data.map((d) => ({
    title: d.title,
    amount: d.amount,
    bonusesCount: d.bonusesCount,
    icon: d.icon,
  }));
  localStorage.setItem(STORAGE_KEY_CURRENT_INCOME, JSON.stringify(toStore));
  return toStore;
}

const currentIncomeTab1 = ref(getOrCreateCurrentIncomeTab1());

// Seeded random so same card always gets same value (no flicker when data is 0)
function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function getRandomIncomeForCard(index, icon) {
  const s = (i) => seededRandom(index * 3 + i);
  const amountRange =
    icon === "star" ? [10, 55] : icon === "medal" ? [5, 18] : [30, 70];
  const bonusRange =
    icon === "star"
      ? [800, 1800]
      : icon === "medal"
        ? [200, 450]
        : [3000, 5500];
  const amount =
    (s(1) * (amountRange[1] - amountRange[0]) + amountRange[0]) * 1_000_000;
  const bonusesCount = Math.floor(
    s(2) * (bonusRange[1] - bonusRange[0] + 1) + bonusRange[0],
  );
  return { amount: Math.round(amount * 100) / 100, bonusesCount };
}

function getDefaultCurrentIncomeCards() {
  return [
    { title: "ဖိတ်စာဆုများ", amount: 0, bonusesCount: 0, icon: "star" },
    {
      title: "အောင်မြင်မှုဆုလာဘ်များ",
      amount: 0,
      bonusesCount: 0,
      icon: "medal",
    },
    {
      title: "လောင်းကြေးပြန်အမ်းငွေ",
      amount: 0,
      bonusesCount: 0,
      icon: "cashback",
    },
  ];
}

const currentIncomeTab1Display = computed(() => {
  const list = currentIncomeTab1.value;
  let cards = list;
  if (!Array.isArray(list) || list.length < 3) {
    const fallback = getOrCreateCurrentIncomeTab1();
    cards =
      Array.isArray(fallback) && fallback.length >= 3
        ? fallback
        : getDefaultCurrentIncomeCards();
  }
  return cards.map((card, i) => {
    const amount = Number(card.amount) || 0;
    const bonusesCount = Number(card.bonusesCount) ?? 0;
    const useApi = Boolean(bonusSummaryPayload.value);
    if (!useApi && amount === 0 && bonusesCount === 0) {
      const rand = getRandomIncomeForCard(i, card.icon || "star");
      return { ...card, amount: rand.amount, bonusesCount: rand.bonusesCount };
    }
    return { ...card, amount, bonusesCount };
  });
});

function formatCurrentIncomeAmount(val) {
  return formatAmount(Number(val || 0), 2);
}

function formatCurrentIncomeSubtitle(count) {
  const n = Number(count);
  const suffix = t(
    "bonuses issued",
    "ဘောနပ်စ်ထုတ်ထားသည်",
    "已发放奖励",
    "โบนัสที่ออกแล้ว",
  );
  return `${isNaN(n) ? 0 : n} ${suffix}`;
}

// --- Reward winners section (tab 1): persistent random data ---
const STORAGE_KEY_REWARD_WINNERS = "invite_tab1_reward_winners";

function randomMaskedName() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const a = chars[Math.floor(Math.random() * chars.length)];
  const b = chars[Math.floor(Math.random() * chars.length)];
  const c = chars[Math.floor(Math.random() * 10)];
  return `${a}${b}*****${c}`;
}

function getOrCreateRewardWinnersTab1() {
  if (typeof localStorage === "undefined") {
    return { top3: [], list: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REWARD_WINNERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.top3?.length === 3 && parsed?.list?.length >= 8)
        return parsed;
    }
  } catch (_) {}
  const amount = (min, max) =>
    Number((min + Math.random() * (max - min)).toFixed(2));
  const top3 = [
    {
      rank: 2,
      name: randomMaskedName(),
      amount: amount(8, 12) * 1_000_000,
      ringColor: "emerald",
      avatar: "/second.png",
    },
    {
      rank: 1,
      name: randomMaskedName(),
      amount: amount(10, 15) * 1_000_000,
      ringColor: "amber",
      avatar: "/first.png",
    },
    {
      rank: 3,
      name: randomMaskedName(),
      amount: amount(8, 11) * 1_000_000,
      ringColor: "amber",
      avatar: "/third.png",
    },
  ];
  const list = Array.from({ length: 16 }, () => ({
    name: randomMaskedName(),
    amount: amount(10, 20) * 1_000,
  }));
  const toStore = {
    top3: top3.map((t) => ({
      rank: t.rank,
      name: t.name,
      amount: t.amount,
      ringColor: t.ringColor,
    })),
    list: list.map((l) => ({ name: l.name, amount: l.amount })),
  };
  localStorage.setItem(STORAGE_KEY_REWARD_WINNERS, JSON.stringify(toStore));
  return toStore;
}

const rewardWinnersTab1 = ref(getOrCreateRewardWinnersTab1());

function formatShortDateLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

const referralRewardRows = computed(() => {
  const list = referralPayload.value?.referrals;
  if (!Array.isArray(list)) return [];
  return list.map((r, idx) => {
    const rewarded = Boolean(r.referral_rewarded_at);
    return {
      id: r.id ?? idx,
      rank: idx + 1,
      name: r.user_name || r.name || "—",
      statusLabel: rewarded
        ? t("Rewarded", "ဆုရရှိ", "已奖励", "ได้รับรางวัล")
        : t("Pending", "စောင့်ဆိုင်း", "待处理", "รอดำเนินการ"),
      joinedLabel: `${t("Joined", "ဝင်ရောက်", "加入", "เข้าร่วม")} ${formatShortDateLabel(r.joined_at)}`,
      ringColor: idx === 0 ? "amber" : idx === 1 ? "emerald" : "amber",
      avatar:
        idx === 0
          ? "https://www.rm98ff.com/mobile/mc/top-2.5d7ed6f5.png"
          : idx === 1
            ? "https://www.rm98ff.com/mobile/mc/top-1.0d57925e.png"
            : "https://www.rm98ff.com/mobile/mc/top-3.b990170f.png",
    };
  });
});

const rewardTop3Display = computed(() => {
  const live = referralRewardRows.value.slice(0, 3);
  if (live.length >= 3) return [live[1], live[0], live[2]];
  return rewardWinnersTab1.value?.top3 ?? [];
});

const rewardListSource = computed(() => {
  const live = referralRewardRows.value;
  if (live.length > 0) return live;
  return rewardWinnersTab1.value?.list ?? [];
});

// Sliding window: show 4 winners, inner list translates up by one row every tick
const REWARD_ROW_HEIGHT_PX = 52;
const REWARD_ROW_GAP_PX = 12;
const REWARD_STEP_PX = REWARD_ROW_HEIGHT_PX + REWARD_ROW_GAP_PX; // one row + gap
const currentRewardIndex = ref(0);
const rewardSlideOffset = ref(0); // 0 or -REWARD_STEP_PX for animation
const rewardTrackNoTransition = ref(false); // true when resetting so no "swipe down"
const rewardTrackHidden = ref(false); // hide during end->top hard reset
const rewardIsAnimating = ref(false); // prevent interval re-entry while slide is active

function buildRewardWindow(list, start, size = 5) {
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.slice(start, start + size);
}

const displayedRewardList = computed(() => {
  const list = rewardListSource.value ?? [];
  const start = currentRewardIndex.value;
  // Show 5 rows so we can slide by one (4 visible + 1 below)
  return buildRewardWindow(list, start, 5);
});

let rewardTickerInterval = null;
let rewardTransitionEndHandler = null;

async function onRewardSlideTransitionEnd() {
  rewardTransitionEndHandler = null;
  const list = rewardListSource.value ?? [];
  if (list.length <= 4) {
    rewardIsAnimating.value = false;
    return;
  }
  const lastScrollableStart = Math.max(0, list.length - 5);
  const reachedEnd = currentRewardIndex.value >= lastScrollableStart;
  // Reset position without animating. At end->top, hide track for one frame
  // so users don't perceive a downward jump during index reset.
  rewardTrackNoTransition.value = true;
  if (reachedEnd) {
    rewardTrackHidden.value = true;
    currentRewardIndex.value = 0;
  } else {
    currentRewardIndex.value += 1;
  }
  rewardSlideOffset.value = 0;
  await nextTick();
  rewardTrackHidden.value = false;
  rewardTrackNoTransition.value = false;
  rewardIsAnimating.value = false;
}

function stepRewardTicker() {
  const list = rewardListSource.value ?? [];
  // Need at least 5 rows to animate one-up sliding.
  if (list.length <= 4) {
    return;
  }
  if (displayedRewardList.value.length <= 4) {
    rewardTrackNoTransition.value = true;
    currentRewardIndex.value = 0;
    rewardSlideOffset.value = 0;
    rewardIsAnimating.value = false;
    nextTick(() => {
      rewardTrackNoTransition.value = false;
    });
    return;
  }
  if (rewardIsAnimating.value) {
    return;
  }
  rewardIsAnimating.value = true;
  rewardTransitionEndHandler = onRewardSlideTransitionEnd;
  rewardSlideOffset.value = -REWARD_STEP_PX;
}

function startRewardTicker() {
  if (rewardTickerInterval) return;
  rewardTickerInterval = setInterval(stepRewardTicker, 2200);
}

watch(
  () => showTab0DemoWinnersSection.value,
  (visible) => {
    if (!visible) return;
    currentRewardIndex.value = 0;
    rewardSlideOffset.value = 0;
    startRewardTicker();
  },
);

onUnmounted(() => {
  if (rewardTickerInterval) {
    clearInterval(rewardTickerInterval);
    rewardTickerInterval = null;
  }
});

async function fetchSummary() {
  summaryLoading.value = true;
  try {
    // Referral summary API removed; wire new endpoint here
  } finally {
    summaryLoading.value = false;
  }
}

// --- Income (3 cards): referral income API removed; wire new endpoint here ---
const incomeLoading = ref(false);
const incomeCards = ref([
  {
    title: "ဖိတ်စာဆုများ",
    amount: "0.00",
    subtitle: "0 ဘောနပ်စ်ထုတ်ထားသည်",
    icon: "star",
  },
  {
    title: "အောင်မြင်မှုဆုလာဘ်များ",
    amount: "0.00",
    subtitle: "0 ဘောနပ်စ်ထုတ်ထားသည်",
    icon: "medal",
  },
  {
    title: "အပ်ငွေ ပြန်အမ်းငွေ",
    amount: "0.00",
    subtitle: "0 ဘောနပ်စ်ထုတ်ထားသည်",
    icon: "cashback",
    showJitLogo: true,
  },
]);

async function fetchIncome() {
  incomeLoading.value = true;
  try {
    // Referral income API removed; wire new endpoint here
  } finally {
    incomeLoading.value = false;
  }
}

async function tryFetchInviteData() {
  const hasToken = !!localStorage.getItem("token");
  const loggedIn = store.getters.isLoggedIn;
  if (!loggedIn && !hasToken) return;
  await fetchInviteDashboard();
  if (inviteActiveTab.value === 1) await fetchIncomeTab();
  if (inviteActiveTab.value === 2) {
    await fetchRecordsStatistics();
    await fetchInviteRecords();
  }
}

// When Income / Invite list tab is selected, fetch that tab's data
watch(inviteActiveTab, (tab) => {
  if (!store.getters.isLoggedIn && !localStorage.getItem("token")) return;
  void (async () => {
    if (tab === 1) await fetchIncomeTab();
    if (tab === 2) {
      if (!referralPayload.value) await fetchInviteDashboard();
      await fetchRecordsStatistics();
      await fetchInviteRecords();
    }
  })();
});

// When user becomes logged in (e.g. after login or store rehydration), load first-tab data
watch(
  () => store.getters.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) void tryFetchInviteData();
  },
  { immediate: false },
);

onMounted(() => {
  void tryFetchInviteData();
  if (showTab0DemoWinnersSection.value) startRewardTicker();
});
</script>

<template>
  <div class="invite-wrap -mx-2 md:-mx-6 -mt-2 md:-mt-6 pb-28 bg-white">
    <!-- Top gradient header (like screenshot) -->
    <header class="invite-header sticky top-0 z-30">
      <div class="invite-header-inner">
        <button
          type="button"
          class="invite-back"
          aria-label="Back"
          @click="router.back()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          class="invite-header-title font-['Pyidaungsu','Padauk',sans-serif]"
        >
          <div class="leading-[1.05]">{{ inviteTexts.pageTitle }}</div>
        </div>
      </div>
    </header>

    <!-- Tabs (Vant): sticky like header so tab bar stays visible when scrolling -->
    <VanTabs
      v-model:active="inviteActiveTab"
      class="invite-page-tabs mt-4 font-['Pyidaungsu','Padauk',sans-serif]"
      :title-active-color="'#1986E1'"
      :title-inactive-color="'#000'"
      :offset-top="64"
      sticky
      shrink
    >
      <VanTab v-for="(title, index) in inviteTabTitles" :key="index">
        <template #title>
          <div class="flex flex-col items-center text-center gap-0.5 py-1">
            <span class="text-lg font-semibold min-w-[100px] text-black">{{
              title
            }}</span>
          </div>
        </template>
        <div class="px-4 pb-6">
          <!-- Tab 0: ခြံရုံသုံးပစ္စည်း - Summary + Income Goal + Share card -->
          <template v-if="index === 0">
            <!-- 4 summary cards (2x2) -->
            <div class="summary-grid summary-grid-tab1 mt-4">
              <div
                v-for="(stat, i) in summaryStatsDisplay"
                :key="i"
                class="summary-card-tab1 font-['Pyidaungsu','Padauk',sans-serif]"
                :class="'summary-tab1-' + (i + 1)"
              >
                <div
                  class="summary-label-tab1 text-center !text-lg !font-semibold"
                >
                  {{ stat.label }}
                </div>
                <div
                  class="summary-value-tab1 text-center !text-lg !font-semibold"
                >
                  <span v-if="i < 2 || i === 3" class="text-2xl!">K </span
                  ><span class="tabular-nums text-2xl font-bold">{{
                    stat.value
                  }}</span>
                </div>
              </div>
            </div>

            <p
              v-if="referrerDisplayLine"
              class="mt-3 text-center text-sm font-medium text-[#374151] font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ referrerDisplayLine }}
            </p>

            <!-- Income goal card -->
            <!-- <template v-if="false"> -->
            <!-- <section
                class="income-goal-card flex flex-col items-center mt-4 font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <div class="income-goal-inner">
                  <div class="income-goal-trophy" aria-hidden="true">
                    <img
                      src="https://www.rm98ff.com/mobile/mc/goals.c8ea3922.png"
                      alt=""
                      class="w-[90px]"
                    />
                    <h3 class="income-goal-title">
                      {{ inviteTexts.incomeGoalTitle }}
                    </h3>
                  </div>
                  <div class="income-goal-text">
                    <div class="income-goal-amount-wrap">
                      <span class="income-goal-amount"
                        >K {{ incomeGoalFormatted }}</span
                      >
                    </div>
                    <p
                      class="income-goal-hint text-center text-white !text-[17px] font-semibold"
                    >
                      {{ inviteTexts.incomeGoalHintPrefix
                      }}<strong>{{ incomeGoalTargetUsers }}</strong
                      >{{ inviteTexts.incomeGoalHintSuffix }}
                    </p>
                  </div>
                </div>
              </section> -->

            <!-- ဝင်ငွေ ဂဏန်းတွက်စက် (Income Calculator) card -->
            <!-- <section
                class="income-calculator-card mt-4 rounded-2xl overflow-hidden shadow-lg font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <div class="income-calculator-inner flex gap-4 p-4">
                  <div
                    class="income-calculator-icon shrink-0 w-14 h-14 flex items-center justify-center"
                  >
                    <img
                      src="https://placehold.co/56x56/fbbf24/1f2937?text=💰"
                      alt=""
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <div class="income-calculator-text flex-1 min-w-0">
                    <h3 class="text-white font-bold text-lg leading-tight">
                      {{ inviteTexts.incomeCalcLine1 }}<br />{{
                        inviteTexts.incomeCalcLine2
                      }}
                    </h3>
                    <p class="text-amber-400 font-bold text-xl mt-2 tabular-nums">
                      K {{ incomeGoalFormatted }}
                    </p>
                    <p class="text-white/90 text-sm mt-1 leading-snug">
                      {{ inviteTexts.incomeCalcHintPrefix
                      }}<strong class="font-bold">{{
                        incomeGoalTargetUsers
                      }}</strong
                      >{{ inviteTexts.incomeCalcHintSuffix }}
                    </p>
                  </div>
                </div>
                <div class="income-calculator-progress-wrap px-4 pb-4">
                  <div
                    class="income-calculator-progress-track h-2 rounded-full overflow-hidden"
                    role="progressbar"
                    :aria-valuenow="incomeCalculatorProgress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div
                      class="income-calculator-progress-thumb h-2 rounded-full transition-all duration-300 ease-out"
                      :style="{ width: `${incomeCalculatorProgress}%` }"
                    />
                  </div>
                </div>
              </section>
            </template> -->

            <section
              v-if="showTab0DemoWinnersSection"
              class="mt-6 rounded-2xl overflow-hidden bg-gradient-to-b from-[#1986E1]/90 to-purple-700/90 px-4 py-6 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <!-- Top 3 leaderboard -->
              <div class="flex items-end justify-center gap-2 sm:gap-4">
                <div
                  v-for="p in rewardTop3Display"
                  :key="p.rank"
                  class="flex flex-col items-center"
                  :class="
                    p.rank === 1
                      ? 'order-2 -mt-4'
                      : p.rank === 2
                        ? 'order-1'
                        : 'order-3'
                  "
                >
                  <span class="mb-1 text-sm font-bold text-amber-400">{{
                    p.rank === 1 ? "1st" : p.rank === 2 ? "2nd" : "3rd"
                  }}</span>
                  <div
                    class="relative rounded-full p-1.5"
                    :class="
                      p.ringColor === 'amber'
                        ? 'ring-2 ring-amber-400 bg-amber-400/20'
                        : 'ring-2 ring-emerald-400 bg-emerald-400/20'
                    "
                  >
                    <img
                      :src="p.avatar"
                      :alt="'Rank ' + p.rank"
                      :class="
                        p.rank === 1
                          ? 'h-20 w-20 rounded-full object-cover ring-2 ring-white sm:h-24 sm:w-24'
                          : 'h-16 w-16 rounded-full object-cover ring-2 ring-white sm:h-20 sm:w-20'
                      "
                    />
                  </div>
                  <p
                    class="mt-2 truncate max-w-[90px] text-center text-sm font-medium text-white"
                  >
                    {{ p.name }}
                  </p>
                  <p class="text-sm font-bold text-white tabular-nums">
                    {{ p.statusLabel || inviteTexts.rewardReceived }}
                  </p>
                  <p class="text-xs text-white/90">
                    {{ p.joinedLabel || "" }}
                  </p>
                </div>
              </div>

              <!-- Header -->
              <h3
                class="mt-8 text-center text-3xl font-bold text-white sm:text-2xl"
              >
                {{ inviteTexts.rewardSectionTitle }}
              </h3>

              <div class="w-full h-[1px] bg-white my-3"></div>

              <!-- List of received: 4 visible, swipe up one row every 2.2s until end -->
              <div
                class="reward-list-viewport mt-6 overflow-hidden"
                :style="{
                  height: `${4 * REWARD_ROW_HEIGHT_PX + 3 * REWARD_ROW_GAP_PX}px`,
                }"
              >
                <div
                  class="reward-list-track"
                  :class="{
                    'reward-list-track--no-transition': rewardTrackNoTransition,
                    'reward-list-track--hidden': rewardTrackHidden,
                  }"
                  :style="{
                    transform: `translateY(${rewardSlideOffset}px)`,
                  }"
                  @transitionend="
                    (e) =>
                      e.propertyName === 'transform' &&
                      rewardTransitionEndHandler &&
                      rewardTransitionEndHandler()
                  "
                >
                  <div
                    v-for="(item, i) in displayedRewardList"
                    :key="currentRewardIndex + i"
                    class="reward-list-row flex items-center justify-between rounded-full bg-white/95 px-4 shadow-sm"
                    :style="{
                      height: `${REWARD_ROW_HEIGHT_PX}px`,
                      minHeight: `${REWARD_ROW_HEIGHT_PX}px`,
                    }"
                  >
                    <span
                      class="text-sm font-semibold text-gray-800 truncate max-w-[120px]"
                    >
                      {{ item.name }}
                    </span>
                    <span
                      class="shrink-0 font-bold text-sm text-gray-600 mx-2"
                      >{{
                        item.statusLabel || inviteTexts.rewardReceived
                      }}</span
                    >
                    <span
                      class="text-sm font-bold text-gray-900 tabular-nums shrink-0"
                    >
                      {{ item.joinedLabel || "" }}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <!-- လက်ရှိဝင်ငွေ (Current Income) - persistent random data -->
            <section
              class="current-income-section-tab1 mt-6 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <h3 class="current-income-title-tab1">
                {{ inviteTexts.currentIncomeTitle }}
              </h3>
              <div class="current-income-cards-tab1">
                <div
                  v-for="(card, i) in currentIncomeTab1Display"
                  :key="i"
                  class="current-income-card-tab1"
                >
                  <div class="current-income-card-icon">
                    <img
                      src="https://www.rm98ff.com/mobile/mc/bonus-1.c87d7418.png"
                      v-if="card.icon === 'star'"
                      alt=""
                    />
                    <img
                      src="https://www.rm98ff.com/mobile/mc/bonus-2.d1627bd5.png"
                      v-else-if="card.icon === 'medal'"
                      alt=""
                    />
                    <img
                      src="https://www.rm98ff.com/mobile/mc/bonus-4.68a7d715.png"
                      v-else-if="card.icon === 'cashback'"
                      alt=""
                    />
                  </div>
                  <div class="current-income-card-body">
                    <div class="current-income-card-title">
                      {{ card.title }}
                    </div>
                    <div class="current-income-card-amount">
                      K
                      <span class="tabular-nums">{{
                        formatCurrentIncomeAmount(card.amount)
                      }}</span>
                    </div>
                    <div class="current-income-card-subtitle">
                      {{ formatCurrentIncomeSubtitle(card.bonusesCount) }}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Demo winners / leaderboard: hidden until API exists -->

            <!-- Share card -->
            <section
              class="invite-card mt-4"
              :class="{
                'opacity-50 pointer-events-none': referralInviteDisabled,
              }"
            >
              <div
                class="text-[#6b7280] text-[13px] font-['Pyidaungsu','Padauk',sans-serif]"
              >
                {{ inviteTexts.shareWithFriends }}
              </div>

              <div class="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  class="share-btn share-fb"
                  aria-label="Facebook"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('facebook')"
                >
                  <span class="share-ic">f</span>
                </button>
                <button
                  type="button"
                  class="share-btn share-x"
                  aria-label="X"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('x')"
                >
                  <span class="share-ic">X</span>
                </button>
                <button
                  type="button"
                  class="share-btn share-tg"
                  aria-label="Telegram"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('telegram')"
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
                    <path d="M22 2 11 13" />
                    <path d="m22 2-7 20-4-9-9-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="share-btn share-wa"
                  aria-label="WhatsApp"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('whatsapp')"
                >
                  <span class="share-ic">☎</span>
                </button>
                <button
                  type="button"
                  class="share-btn share-msg"
                  aria-label="Message"
                  :disabled="referralInviteDisabled"
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
                    <path
                      d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="share-btn share-line"
                  aria-label="LINE"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('line')"
                >
                  <span class="share-ic">LINE</span>
                </button>
                <button
                  type="button"
                  class="share-btn share-msgr"
                  aria-label="Messenger"
                  :disabled="referralInviteDisabled"
                  @click="shareUrl('messenger')"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2C6.477 2 2 6.154 2 11.273c0 2.918 1.45 5.521 3.72 7.238V22l3.347-1.84c.918.255 1.892.388 2.933.388 5.523 0 10-4.154 10-9.273C22 6.154 17.523 2 12 2zm1.024 11.996-2.55-2.72-4.976 2.72 5.452-5.785 2.55 2.72 4.976-2.72-5.452 5.785z"
                    />
                  </svg>
                </button>
              </div>

              <div class="invite-copy mt-4">
                <div class="invite-link">
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
                    class="text-[#6b7280] shrink-0"
                  >
                    <path
                      d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 4.93"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 19.07"
                    />
                  </svg>
                  <div class="invite-link-text">{{ referralLink }}</div>
                </div>
                <button
                  type="button"
                  class="invite-copy-btn"
                  :disabled="referralInviteDisabled"
                  @click="copyLink"
                >
                  {{ inviteTexts.copy }}
                </button>
              </div>
            </section>
          </template>

          <!-- Tab 1: ဝင်ငွေ – Income (Rewards tab removed) -->
          <template v-else-if="index === 1">
            <div
              v-if="incomeTabLoading"
              class="under-section mt-4 py-8 text-center text-[#6b7280] text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ inviteTexts.incomeTabLoading }}
            </div>
            <div
              v-else
              class="under-section mt-4 space-y-4 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <div
                class="income-period-chips flex flex-wrap gap-2 font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <button
                  v-for="opt in incomePeriodOptions"
                  :key="opt.value"
                  type="button"
                  class="income-period-chip rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors shrink-0"
                  :class="
                    incomePeriodFilter === opt.value
                      ? 'income-period-chip--active'
                      : 'income-period-chip--inactive'
                  "
                  @click="setIncomePeriod(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
              <!-- Card 1: period bonus breakdown -->
              <div
                class="income-tab-card rounded-xl bg-gray-500/10 p-4 shadow-xs"
              >
                <h3
                  class="income-tab-card__title text-[#3A2987] text-center text-lg font-bold mb-3"
                >
                  {{ incomeTabCard1.title }}
                </h3>
                <div class="w-full h-[1px] bg-gray-500/10 my-5"></div>
                <ul
                  class="income-tab-card__rows bg-[#d6e5f1]/50 !px-3 !py-4 rounded-lg space-y-1"
                >
                  <li
                    v-for="(row, i) in incomeTabCard1.rows"
                    :key="i"
                    class="flex justify-between items-center text-sm font-extrabold"
                  >
                    <span class="text-[#374151] text-base">{{
                      row.label
                    }}</span>
                    <span
                      class="tabular-nums font-extrabold text-base text-[#3A2987]"
                    >
                      {{ row.isAmount ? "K " + row.value : row.value }}
                    </span>
                  </li>
                </ul>
              </div>
              <!-- Card 2: စုစုပေါင်းဝင်ငွေ -->
              <div
                class="income-tab-card rounded-xl bg-gray-500/10 p-4 shadow-xs mt-6"
              >
                <h3
                  class="income-tab-card__title text-[#3A2987] text-center text-lg font-bold mb-3"
                >
                  {{ incomeTabCard2.title }}
                </h3>
                <div class="w-full h-[1px] bg-gray-500/10 my-5"></div>

                <ul
                  class="income-tab-card__rows bg-[#d6e5f1]/50 !px-3 !py-4 rounded-lg space-y-1 mt-5"
                >
                  <li
                    v-for="(row, i) in incomeTabCard2.rows"
                    :key="i"
                    class="flex justify-between items-center text-sm font-extrabold"
                  >
                    <span class="text-[#374151] text-base">{{
                      row.label
                    }}</span>
                    <span
                      class="tabular-nums font-extrabold text-base text-[#3A2987]"
                    >
                      {{ row.isAmount ? "K " + row.value : row.value }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <!-- Tab 2: မှတ်တမ်းများ - Records -->
          <template v-else-if="index === 2">
            <div
              class="records-tab-wrap mt-4 rounded-2xl overflow-hidden font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <div class="records-tab-inner flex gap-2">
                <!-- Left panel: VIP + invite count + official players -->
                <div
                  class="records-tab-left flex-1 rounded-xl p-4 flex items-center gap-4 bg-[#E1F4FF]"
                >
                  <div class="records-tab-stats flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                      <div
                        class="records-tab-stat relative z-10 flex shadow-sm items-center justify-center rounded-full bg-white w-12 h-12"
                      >
                        <svg
                          class="w-8 h-8 text-[#3A2987]/80 mb-1"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                          />
                        </svg>
                      </div>
                      <div
                        class="flex flex-col translate-y-[-5px] relative z-5 translate-x-[-20px]"
                      >
                        <span
                          class="text-[#3A2987] text-base font-extrabold text-center leading-tight"
                          >{{ inviteTexts.recordsInvited }}</span
                        >
                        <span
                          class="text-[#3A2987] black w-[150px] text-center bg-white rounded-full font-bold text-lg mt-0.5"
                          >{{
                            recordsTabStatsLoading
                              ? "—"
                              : (recordsTabInvitedCount ?? "0")
                          }}</span
                        >
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <div
                        class="records-tab-stat relative z-10 flex shadow-sm items-center justify-center rounded-full bg-white w-12 h-12"
                      >
                        <svg
                          class="w-8 h-8 text-[#3A2987]/80"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766a12.41 12.41 0 0 1-1.75-2.757h-.001M15 19.128a9.373 9.373 0 0 1-3.746.475m-.001-1.08a9.38 9.38 0 0 1-2.625.372 9.337 9.337 0 0 1-4.121-.952 4.125 4.125 0 0 1 7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106a12.318 12.318 0 0 1-3.746.475m-4.378-6.767a9.39 9.39 0 0 1-1.75-2.757h-.001M15 19.128a9.373 9.373 0 0 1-3.746.475"
                          />
                        </svg>
                      </div>
                      <div
                        class="flex flex-col translate-y-[-5px] relative z-5 translate-x-[-20px]"
                      >
                        <span
                          class="text-[#3A2987] text-base font-extrabold text-center leading-tight"
                          >{{ inviteTexts.recordsActive }}</span
                        >
                        <span
                          class="text-[#3A2987] black w-[150px] text-center bg-white rounded-full font-bold text-lg mt-0.5"
                          >{{
                            recordsTabStatsLoading
                              ? "—"
                              : (recordsTabActiveCount ?? "0")
                          }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Right panel: Today / Yesterday / Current month -->
                <div
                  class="records-tab-right flex-1 rounded-lg flex flex-col gap-2"
                >
                  <div
                    class="records-tab-row border-[1px] border-[#CD861C]/20 bg-[#FFF8E8] flex justify-between items-center rounded-lg py-2 px-2"
                  >
                    <span class="text-[#CD861C] font-semibold text-sm">{{
                      inviteTexts.recordsToday
                    }}</span>
                    <span class="tabular-nums text-black font-extrabold">{{
                      recordsTabToday
                    }}</span>
                  </div>
                  <div
                    class="records-tab-row flex border-[1px] border-[#CD861C]/20 bg-[#FFF8E8] justify-between items-center rounded-lg p-2"
                  >
                    <span class="text-[#CD861C] font-semibold text-sm">{{
                      inviteTexts.recordsYesterday
                    }}</span>
                    <span class="tabular-nums text-black font-extrabold">{{
                      recordsTabYesterday
                    }}</span>
                  </div>
                  <div
                    class="records-tab-row flex border-[1px] border-[#CD861C]/20 bg-[#FFF8E8] justify-between items-center rounded-lg p-2"
                  >
                    <span class="text-[#CD861C] font-semibold text-sm">{{
                      inviteTexts.recordsThisMonth
                    }}</span>
                    <span class="tabular-nums text-black font-extrabold">{{
                      recordsTabCurrentMonth
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invited user filter bar + list/empty state (Vant) -->
            <div
              class="invited-user-filter-section mt-4 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <div class="invited-filter-bar flex items-center gap-2">
                <button
                  type="button"
                  class="invited-filter-status flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#1986E1] bg-[#1986E1] text-white text-sm font-semibold"
                  @click="showInvitedStatusPopup = true"
                >
                  <span>{{ invitedStatusLabel }}</span>
                  <svg
                    class="w-4 h-4 shrink-0 opacity-90"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="invited-filter-today shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  :class="{
                    'invited-filter-today--active': invitedFilterTodayActive,
                  }"
                  @click="onInvitedFilterTodayClick"
                >
                  <svg
                    v-if="invitedFilterTodayActive"
                    class="w-4 h-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ inviteTexts.filterToday }}
                </button>
                <button
                  type="button"
                  class="invited-filter-daterange shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1986E1] bg-white text-[#1986E1] text-sm font-semibold"
                  @click="showInvitedCalendar = true"
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {{ invitedDateRangeText }}
                </button>
              </div>

              <div class="invited-user-content mt-4 min-h-[200px] relative">
                <div
                  v-if="invitedRecordsLoading"
                  class="py-12 flex justify-center items-center"
                >
                  <span class="text-[#6b7280] text-sm">{{
                    inviteTexts.recordsLoading
                  }}</span>
                </div>
                <template v-else>
                  <VanEmpty
                    v-if="!invitedUserList || invitedUserList.length === 0"
                    :description="inviteTexts.recordsEmpty"
                    image="default"
                    class="invited-user-empty py-12"
                  />
                  <div v-else class="invited-records-block">
                    <div class="invited-records-table-wrap overflow-x-auto">
                      <table
                        class="invited-records-table w-full border-collapse font-['Pyidaungsu','Padauk',sans-serif]"
                      >
                        <thead>
                          <tr class="invited-records-thead">
                            <th class="invited-records-th">
                              {{ inviteTexts.tableUser }}
                            </th>
                            <th class="invited-records-th">
                              {{ inviteTexts.tableDate }}
                            </th>
                            <th class="invited-records-th">
                              {{ inviteTexts.tableStatus }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(user, i) in invitedUserList"
                            :key="user.id != null ? user.id : i"
                            class="invited-records-tr"
                          >
                            <td
                              class="invited-records-td invited-records-td--name"
                            >
                              {{ user.user_name || user.name || "—" }}
                            </td>
                            <td
                              class="invited-records-td invited-records-td--date tabular-nums"
                            >
                              {{ user.date || "—" }}
                            </td>
                            <td class="invited-records-td">
                              <span
                                class="invited-records-status"
                                :class="
                                  user.status === 'qualified'
                                    ? 'invited-records-status--qualified'
                                    : 'invited-records-status--not-qualified'
                                "
                              >
                                {{
                                  user.status === "qualified"
                                    ? inviteTexts.statusOfficial
                                    : inviteTexts.statusNotMet
                                }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div
                      v-if="recordsTotal > recordsLimit"
                      class="invited-records-pagination mt-4 flex justify-center"
                    >
                      <VanPagination
                        v-model="recordsPage"
                        :total-items="recordsTotal"
                        :items-per-page="recordsLimit"
                        :show-page-size="3"
                        force-ellipses
                        @update:model-value="onRecordsPageChange"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <VanCalendar
              v-model:show="showInvitedCalendar"
              type="range"
              teleport="#invited-calendar-teleport"
              :default-date="invitedDateRange"
              :min-date="
                new Date(new Date().setFullYear(new Date().getFullYear() - 1))
              "
              :max-date="new Date()"
              :title="inviteTexts.calendarTitle"
              :confirm-text="inviteTexts.calendarConfirm"
              color="#1986E1"
              poppable
              @confirm="onInvitedCalendarConfirm"
            />

            <!-- Status filter popup: အခြေအနေ (All / Qualified / Not Qualified) -->
            <VanPopup
              v-model:show="showInvitedStatusPopup"
              position="bottom"
              round
              class="invited-status-popup"
              :style="{ height: 'auto' }"
              :overlay-style="{ background: 'rgba(0, 0, 0, 0.35)' }"
            >
              <div
                class="invited-status-popup__inner font-['Pyidaungsu','Padauk',sans-serif]"
              >
                <div
                  class="invited-status-popup__header flex items-center justify-between px-4 py-3 border-b border-gray-200"
                >
                  <h3 class="invited-status-popup__title text-lg">
                    {{ inviteTexts.statusPopupTitle }}
                  </h3>
                  <button
                    type="button"
                    class="invited-status-popup__close w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                    aria-label="Close"
                    @click="showInvitedStatusPopup = false"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div class="invited-status-popup__options py-2">
                  <button
                    v-for="opt in invitedStatusOptions"
                    :key="opt.value"
                    type="button"
                    class="invited-status-option w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    :class="{
                      'invited-status-option--active':
                        invitedStatusFilter === opt.value,
                    }"
                    @click="onInvitedStatusSelect(opt.value)"
                  >
                    <span class="invited-status-option__label text-base">{{
                      opt.text
                    }}</span>
                    <span
                      v-if="invitedStatusFilter === opt.value"
                      class="invited-status-check shrink-0 text-[#ef4444]"
                      aria-hidden="true"
                    >
                      <svg
                        class="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </VanPopup>
          </template>

          <!-- Tab 4: ပိတ်ခြင်း ထုတ်ယူခြင်း - Withdraw -->
          <template v-else>
            <div
              class="invite-card mt-4 py-12 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <p class="text-center text-[#374151] mb-6">
                {{ inviteTexts.withdrawTitle }}
              </p>
              <div class="flex justify-center">
                <button
                  type="button"
                  class="py-3 px-6 rounded-xl bg-[#1986E1] text-white font-medium"
                  @click="router.push({ name: 'withdraw' })"
                >
                  {{ inviteTexts.withdrawCta }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </VanTab>
    </VanTabs>

    <!-- Records tab: calendar teleports here so we can apply dark theme (Vant popup is not under scoped root) -->
    <div
      id="invited-calendar-teleport"
      class="invited-calendar-dark-host"
      aria-hidden="true"
    />
  </div>
</template>

<!-- Dark theme for Records tab date-range calendar (teleported; must be unscoped) -->
<style>
.invited-calendar-dark-host {
  position: fixed;
  inset: 0;
  width: 0;
  height: 0;
  overflow: visible;
  pointer-events: none;
  z-index: 3000;
}

.invited-calendar-dark-host > * {
  pointer-events: auto;
}

.invited-calendar-dark-host {
  --van-popup-background: #141416;
  --van-background-2: #141416;
  --van-calendar-background: #141416;
  --van-text-color: #f4f4f5;
  --van-text-color-2: #e4e4e7;
  --van-text-color-3: #a1a1aa;
  --van-border-color: #3f3f46;
  --van-gray-5: #a1a1aa;
  --van-gray-7: #52525b;
  --van-calendar-month-mark-color: rgba(255, 255, 255, 0.05);
  --van-calendar-header-shadow: 0 2px 14px rgba(0, 0, 0, 0.5);
  --van-primary-color: #1986E1;
  --van-calendar-range-middle-background-opacity: 0.2;
  --van-white: #ffffff;
  --van-button-primary-background: #1986E1;
  --van-button-primary-border-color: #1986E1;
}

.invited-calendar-dark-host .van-calendar__header {
  background: #172240;
  border-bottom: 1px solid #27272a;
  box-shadow: none;
}

.invited-calendar-dark-host .van-calendar__month-title,
.invited-calendar-dark-host .van-calendar__header-title,
.invited-calendar-dark-host .van-calendar__header-subtitle {
  color: #fafafa;
}

.invited-calendar-dark-host .van-calendar__weekday {
  color: #a1a1aa;
}

.invited-calendar-dark-host .van-calendar__day {
  color: #e4e4e7;
}

.invited-calendar-dark-host .van-calendar__day--disabled {
  color: #52525b;
}

.invited-calendar-dark-host .van-calendar__footer {
  background: #141416;
  border-top: 1px solid #27272a;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0));
}

.invited-calendar-dark-host .van-popup__close-icon {
  color: #d4d4d8;
}

.invited-calendar-dark-host .van-button--primary {
  background: linear-gradient(180deg, #1986E1, #1986E1);
  border: none;
}
</style>

<style scoped>
/* Reward list: viewport shows 4 rows, track translates up by one row */
.reward-list-viewport {
  position: relative;
}

.reward-list-track {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.5s ease-out;
}

.reward-list-track--no-transition {
  transition: none;
}

.reward-list-track--hidden {
  opacity: 0;
}
war

/* Reward event cards (ဆုလက် tab) – reference: icon | text+price | count+button, #E9EFF5 */
.reward-event-card {
  transition: opacity 0.2s ease;
  align-items: center;
}

.reward-event-card--disabled {
  opacity: 0.78;
}

.reward-event-card--disabled .reward-event-card__text p:first-child {
  color: #6b7280;
}

.reward-event-card--disabled .reward-event-card__price {
  color: #374151;
}

.reward-event-card--disabled .reward-event-card__count-current {
  color: #9ca3af;
}

.reward-event-card__btn {
  background: linear-gradient(to right, #1986E1, #156FBD);
  color: #fff;
  cursor: default;
  pointer-events: none;
  border: none;
}

.reward-event-card__btn--action {
  pointer-events: auto;
  cursor: pointer;
}

.reward-event-card__btn--action:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.reward-event-card--disabled .reward-event-card__btn {
  background: #d1d5db;
  color: #9ca3af;
}

/* Reward events empty state (Vant Empty) */
.reward-events-empty :deep(.van-empty__description) {
  color: #6b7280;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}

/* Third tab: two summary cards (ယနေ့ဝင်ငွေ, စုစုပေါင်းဝင်ငွေ) */
.income-tab-card {
  /* border: 1px solid #e5e7eb; */
}
.income-tab-card__title {
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.income-tab-card__rows li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* Income Calculator card (ဝင်ငွေ ဂဏန်းတွက်စက်) */
.income-calculator-card {
  background: linear-gradient(
    90deg,
    #d946ef 0%,
    #a855f7 40%,
    #7c3aed 70%,
    #5b21b6 100%
  );
}

.income-calculator-progress-track {
  background: rgba(0, 0, 0, 0.25);
}

.income-calculator-progress-thumb {
  background: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
}

/* Vant tabs: no background, black text, bigger font, thicker active bar */
.invite-page-tabs :deep(.van-tabs__nav) {
  background: #f2f3f7;
}
.invite-page-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid #e5e7eb;
}
/* Sticky tab bar: match wrap background so content doesn’t show through */
.invite-page-tabs :deep(.van-tabs__wrap--scrollable),
.invite-page-tabs :deep(.van-sticky) {
  background: #f2f3f7;
}

.invite-page-tabs :deep(.van-tab) {
  padding: 0 8px 10px;
}

/* Line width matches active tab (Vant default); do not set 100% or it spans whole nav */
.invite-page-tabs :deep(.van-tabs__line) {
  background-color: #1986E1;
  height: 3px;
}

.invite-page-tabs :deep(.van-tabs__content) {
  background: transparent;
}

/* Income tab: period pills (inactive = outline + dark text; active = solid blue) */
.income-period-chips {
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}
.income-period-chip {
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  line-height: 1.35;
}
.income-period-chip--inactive {
  color: #156FBD !important;
  background-color: #fff !important;
  border-color: #1986E1 !important;
}
.income-period-chip--inactive:hover {
  background-color: #eff6ff !important;
  border-color: #156FBD !important;
}
.income-period-chip--active {
  color: #fff !important;
  background-color: #1986E1 !important;
  border-color: #1986E1 !important;
}

.records-tab-inner {
  min-height: 0;
}

.records-tab-vip-icon {
  position: relative;
}
.records-tab-vip-diamond {
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, #3a2987 0%, #5b4aa8 100%);
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(58, 41, 135, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.records-tab-vip-letter {
  transform: rotate(-45deg);
  color: #fff;
  font-weight: 900;
  font-size: 1.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Invited user filter bar (tab 4) – blue buttons, no gray */
.invited-user-filter-section {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.invited-filter-bar {
  flex-wrap: wrap;
}
.invited-filter-bar button {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  outline: none;
  box-shadow: none;
}
.invited-filter-status {
  background: #1986E1 !important;
  border: 1px solid #1986E1 !important;
  color: #fff !important;
}
.invited-filter-status:hover,
.invited-filter-status:focus {
  background: #156FBD !important;
  border-color: #156FBD !important;
}
.invited-filter-status svg {
  fill: #fff !important;
}
.invited-filter-today {
  background: #fff !important;
  border: 1px solid #1986E1 !important;
  color: #1986E1 !important;
}
.invited-filter-today.invited-filter-today--active {
  background: #1986E1 !important;
  border-color: #1986E1 !important;
  color: #fff !important;
}
.invited-filter-today.invited-filter-today--active svg {
  fill: #fff !important;
}
.invited-filter-today:not(.invited-filter-today--active) svg {
  fill: #1986E1 !important;
}
.invited-filter-daterange {
  background: #fff !important;
  border: 1px solid #1986E1 !important;
  color: #1986E1 !important;
}
.invited-filter-daterange svg {
  stroke: #1986E1 !important;
}
.invited-filter-daterange:hover,
.invited-filter-daterange:focus {
  border-color: #156FBD !important;
  color: #156FBD !important;
}
.invited-filter-daterange:hover svg,
.invited-filter-daterange:focus svg {
  stroke: #156FBD !important;
}
/* Lighter overlay so background doesn’t look fully gray when Status popup is open */
.invited-status-popup :deep(.van-overlay) {
  background-color: rgba(0, 0, 0, 0.35);
}
.invited-status-popup__inner {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.invited-status-popup__title {
  color: #6b7280;
  font-weight: 600;
}
.invited-status-option__label {
  color: #172240;
  font-weight: 500;
}
.invited-status-option--active {
  background: #f9fafb;
}
.invited-user-empty :deep(.van-empty__description) {
  color: #1986E1;
  font-size: 16px;
  font-weight: 600;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
.invited-user-empty :deep(.van-empty__image) {
  opacity: 0.9;
}

.invited-records-block {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  background: #fff;
}
.invited-records-table-wrap {
  min-width: 280px;
}
.invited-records-thead {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e2e8f0;
}
.invited-records-th {
  text-align: left;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #080E1E;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.invited-records-tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease;
}
.invited-records-tr:last-child {
  border-bottom: none;
}
.invited-records-tr:hover {
  background-color: #f8fafc;
}
.invited-records-td {
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #080E1E;
}
.invited-records-td--name {
  color: #172240;
  font-weight: 700;
}
.invited-records-td--date {
  color: #64748b;
  font-weight: 500;
}
.invited-records-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.invited-records-status--qualified {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.invited-records-status--not-qualified {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.invited-records-pagination :deep(.van-pagination) {
  padding: 8px 0;
}
.invited-records-pagination :deep(.van-pagination__item) {
  font-weight: 600;
}
.invited-records-pagination :deep(.van-pagination__item--active) {
  background: #1986E1;
  color: #fff;
}

.invite-wrap {
  background: #f2f3f7;
  min-height: 100vh;
}

.invite-header {
  background: #080E1E;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.invite-header-inner {
  height: 64px;
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 14px;
}
.invite-back {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: transparent;
}
.invite-header-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #fff;
  font-weight: 800;
  font-size: 20px;
  letter-spacing: 0.2px;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}

.invite-card {
  background: white;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.share-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 14px rgba(0, 0, 0, 0.08);
}
.share-ic {
  font-weight: 800;
  font-size: 16px;
}
.share-fb {
  background: #1877f2;
}
.share-x {
  background: #111;
}
.share-tg {
  background: #229ed9;
}
.share-wa {
  background: #25d366;
}
.share-msg {
  background: #22c55e;
}
.share-line {
  background: #06c755;
  font-size: 10px;
}
.share-msgr {
  background: linear-gradient(135deg, #156FBD 0%, #6366f1 100%);
}

.invite-copy {
  display: flex;
  gap: 10px;
  align-items: center;
}
.invite-link {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  background: #eef2f7;
  border-radius: 12px;
  padding: 12px 12px;
}
.invite-link-text {
  color: #172240;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.invite-copy-btn {
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #1986E1 0%, #5b21b6 100%);
  box-shadow: 0 10px 18px rgba(25, 134, 225, 0.28);
}

.winners-card {
  border-radius: 18px;
  padding: 18px 14px 22px;
  background: linear-gradient(135deg, #36c4ff 0%, #7c3aed 70%, #6d28d9 100%);
  box-shadow: 0 18px 30px rgba(124, 58, 237, 0.18);
}
.rank-badge {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  font-weight: 900;
  letter-spacing: 0.2px;
  color: #172240;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
}
.rank-1 {
  font-size: 34px;
  color: #ffb020;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}
.rank-2,
.rank-3 {
  font-size: 28px;
  color: #ffb020;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
}
.rank-sup {
  font-size: 14px;
  font-weight: 900;
  margin-left: 1px;
  transform: translateY(-6px);
}

.avatar-ring {
  width: 92px;
  height: 92px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px auto 0;
}
.avatar-ring.ring-3 {
  width: 104px;
  height: 104px;
}
.avatar {
  width: 78px;
  height: 78px;
  border-radius: 9999px;
  background: #f8fafc;
  border: 6px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
}
.avatar-1 {
  background: radial-gradient(circle at 40% 30%, #ffeaa7, #f59e0b);
}
.avatar-2 {
  background: radial-gradient(circle at 40% 30%, #a7f3d0, #10b981);
}
.avatar-3 {
  background: radial-gradient(circle at 40% 30%, #fde68a, #f97316);
}

.winner-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 13px;
}
.winner-amount {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 800;
  font-size: 13px;
}

/* Under section: summary + current income */
.under-section {
  padding-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-card {
  border-radius: 14px;
  padding: 14px 12px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.summary-blue {
  background: linear-gradient(180deg, #1986E1 0%, #156FBD 65%, #1986E1 100%);
  color: #374164;
}

.summary-purple {
  background: linear-gradient(180deg, #c4b5fd 0%, #a78bfa 65%, #8b5cf6 100%);
  color: #2e1065;
}

/* First tab: 4 summary cards with white text and distinct gradients */
.summary-grid-tab1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-card-tab1 {
  border-radius: 14px;
  padding: 14px 12px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: white;
}

.summary-tab1-1 {
  background: linear-gradient(90deg, #156FBD 0%, #a78bfa 100%);
}

.summary-tab1-2 {
  background: linear-gradient(90deg, #a78bfa 0%, #f472b6 100%);
}

.summary-tab1-3 {
  background: linear-gradient(90deg, #c4b5fd 0%, #7dd3fc 100%);
}

.summary-tab1-4 {
  background: linear-gradient(90deg, #1986E1 0%, #67e8f9 100%);
}

.summary-label-tab1 {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.95);
}

.summary-value-tab1 {
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
  letter-spacing: 0.02em;
  color: white;
}

/* Income goal card (first tab) */
.income-goal-card {
  background: linear-gradient(90deg, #1e3a8a 0%, #4c1d95 60%, #5b21b6 100%);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(30, 58, 138, 0.25);
}

.income-goal-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.income-goal-trophy {
  flex-shrink: 0;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}

.trophy-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.income-goal-text {
  flex: 1;
  min-width: 0;
}

.income-goal-title {
  font-size: 36px;
  font-weight: 900;
  color: white;
  margin: 0 0 6px 0;
  line-height: 1.3;
}

.income-goal-amount-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.income-goal-amount {
  font-size: 36px;
  font-weight: 900;
  text-align: center;
  color: #ffc676;
  letter-spacing: 0.02em;
}

.income-goal-help {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.income-goal-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.4;
}

.income-goal-hint strong {
  font-weight: 700;
}

/* လက်ရှိဝင်ငွေ (Current Income) section in tab 1 */
.current-income-section-tab1 {
  padding-bottom: 0;
}

.current-income-title-tab1 {
  font-size: 30px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 12px 0;
  text-align: center;
  line-height: 1.3;
}

.current-income-cards-tab1 {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 12px;
}

.current-income-card-tab1 {
  background: #e7edf5;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.current-income-card-icon {
  width: 80px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-income-icon {
  width: 48px;
  height: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
}

.current-income-card-body {
  flex: 1;
  min-width: 0;
}

.current-income-card-title {
  font-size: 18px;
  font-weight: 800;
  color: #374151;
  line-height: 1.3;
}

.current-income-card-amount {
  font-size: 30px;
  font-weight: 800;
  color: #3730a3;
  margin-top: 4px;
  line-height: 1;
  letter-spacing: 0.02em;
}

.current-income-card-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-top: 2px;
}

.summary-label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
}

.summary-value {
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
  letter-spacing: 0.02em;
}

.under-heading {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.income-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.income-card {
  background: #f1f5f9;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  position: relative;
}

.income-card-icon-wrap {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.income-icon {
  width: 48px;
  height: 48px;
}

.income-icon-star,
.income-icon-medal {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.12));
}

.income-icon-cashback {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.income-card-body {
  flex: 1;
  min-width: 0;
}

.income-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.income-card-amount {
  font-size: 20px;
  font-weight: 800;
  color: #172240;
  margin-top: 4px;
}

.income-card-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.income-card-jit {
  position: absolute;
  right: 12px;
  bottom: 10px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #172240;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.income-card-jit-text {
  color: #fbbf24;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.3px;
}
</style>
