<script setup>
import { watch, onUnmounted, computed, ref } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import axios from "axios";
import { showDialog, showSuccessToast, showFailToast } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";
import { usePerformanceMode } from "../composables/usePerformanceMode";
import {
  useLuckySpin,
  segmentIndexForSpinRecord,
} from "../composables/useLuckySpin";
import {
  getSpinWheel,
  postSpinWheel,
  getSpinWheelHistory,
  normalizeSpinwheelError,
} from "../api/spinwheel";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "request"]);

const store = useStore();
const route = useRoute();
const { t } = useTranslation();
const { openLoginModal, openDepositModal, isDepositModalOpen } = useModal();
const { reduceEffects: reduceEffectsMode } = usePerformanceMode();

const {
  segments,
  rotationDeg,
  isSpinning,
  lastPrize,
  requestUnlocked, // mock / spinMock: unlock GO after Request
  missionProgressPercent,
  depositTaskProgressPercent,
  ticketDepositThresholdKyat,
  ticketDepositTotalTargetKyat,
  depositAccumulatedKyat,
  spinWheelMeta,
  wheelApiLoaded,
  wheelLoading,
  canSpinToday,
  remainingSpinsToday,
  applyWheelFromApi,
  loadUniformMockSegments,
  clearWheelApiState,
  countdown,
  spinToSegmentIndex,
  markRequestDone,
  spinDurationMs,
  tickCountdown,
  syncCountdownToEndOfToday,
} = useLuckySpin();

const progressDisplay = computed(() =>
  Math.min(100, Math.max(0, missionProgressPercent.value)).toFixed(2),
);

const isLoggedIn = computed(() => {
  const u = store.state.authUser;
  return u && Object.keys(u).length > 0 && u.id;
});

/** QA layout tools — use with `&spinMock=1` for client-only mock wheel + spin (no API). */
const debugSpinEnabled = computed(() => {
  const q = route.query.debugSpin;
  return q === "1" || q === "true";
});

/** Client-only mock wheel: logged-in + `?spinMock=1` (with optional `debugSpin` / `debugWin`). */
const mockWheelOnly = computed(() => {
  if (!isLoggedIn.value) return false;
  const q = route.query.spinMock;
  return q === "1" || q === "true";
});

const debugWinIndex = computed(() => {
  if (!debugSpinEnabled.value || !mockWheelOnly.value) return null;
  const w = route.query.debugWin;
  if (w === undefined || w === null || w === "") return null;
  const n = parseInt(String(w), 10);
  if (Number.isNaN(n)) return null;
  const max = Math.max(0, segments.value.length - 1);
  return Math.min(Math.max(0, n), max);
});

const wheelForbidden = ref(false);
const wheelLoadMessage = ref("");

const showTicketMissionPanel = ref(false);
/** Keys `segId-index` when prize image fails to load — fall back to emoji. */
const prizeImageFailed = ref({});
const historyItems = ref([]);
const historyMeta = ref(null);
const historyLoading = ref(false);

let countdownTimer = null;

async function loadSpinWheelFromApi() {
  wheelForbidden.value = false;
  wheelLoadMessage.value = "";
  wheelLoading.value = true;
  try {
    const { data, meta } = await getSpinWheel();
    applyWheelFromApi(data, meta);
  } catch (err) {
    const norm = normalizeSpinwheelError(err);
    if (norm.status === 401) {
      wheelLoadMessage.value = norm.message;
      openLoginModal();
    } else if (norm.status === 403) {
      wheelForbidden.value = true;
      wheelLoadMessage.value = norm.message;
      clearWheelApiState();
    } else {
      wheelLoadMessage.value = norm.message;
      clearWheelApiState();
    }
  } finally {
    wheelLoading.value = false;
  }
}

async function loadHistoryPage(page = 1) {
  if (!isLoggedIn.value || mockWheelOnly.value) return;
  historyLoading.value = true;
  try {
    const { data, meta } = await getSpinWheelHistory({
      per_page: 10,
      page,
    });
    historyItems.value = page === 1 ? data : [...historyItems.value, ...data];
    historyMeta.value = meta;
  } catch {
    if (page === 1) historyItems.value = [];
  } finally {
    historyLoading.value = false;
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      if (!isLoggedIn.value) {
        emit("close");
        return;
      }
      prizeImageFailed.value = {};
      syncCountdownToEndOfToday();
      countdownTimer = setInterval(tickCountdown, 1000);
      if (mockWheelOnly.value) {
        loadUniformMockSegments();
        if (debugSpinEnabled.value) markRequestDone();
      } else {
        await loadSpinWheelFromApi();
        loadHistoryPage(1);
      }
    } else {
      showTicketMissionPanel.value = false;
      prizeImageFailed.value = {};
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  },
  { immediate: true },
);

watch(isDepositModalOpen, (open, prev) => {
  if (
    prev &&
    !open &&
    props.isOpen &&
    isLoggedIn.value &&
    !mockWheelOnly.value
  ) {
    loadSpinWheelFromApi();
  }
});

watch(isLoggedIn, (logged) => {
  if (!logged && props.isOpen) {
    emit("close");
    return;
  }
  if (props.isOpen && logged && !mockWheelOnly.value) {
    loadSpinWheelFromApi();
    loadHistoryPage(1);
  }
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});

const handleClose = () => {
  emit("close");
};

const pad2 = (n) => String(n).padStart(2, "0");

const handleRequest = () => {
  emit("request");
  if (mockWheelOnly.value) markRequestDone();
  showTicketMissionPanel.value = true;
};

const closeTicketMissionPanel = () => {
  showTicketMissionPanel.value = false;
  if (isLoggedIn.value && !mockWheelOnly.value) {
    loadSpinWheelFromApi();
  }
};

const handleMissionDeposit = () => {
  openDepositModal();
};

const depositTaskDisplay = computed(() =>
  Math.round(
    Math.min(
      ticketDepositTotalTargetKyat.value,
      Math.max(0, depositAccumulatedKyat.value),
    ),
  ),
);

const depositInnerBarWidth = computed(() =>
  Math.min(100, Math.max(0, depositTaskProgressPercent.value)),
);

const dailySpinChanceCount = computed(() => {
  const n = Number(
    spinWheelMeta.value?.daily_spin_chance_count ?? spinWheelMeta.value?.daily_limit,
  );
  return Number.isNaN(n) ? 0 : Math.max(0, n);
});

const missionDepositHint = computed(() =>
  t(
    "Each spin needs ≥ K {per}. Daily target ({count} spins): K {total}.",
    "တစ်ကြိမ်လည်ပတ်ရန် ≥ K {per} လိုအပ်သည်။ နေ့စဉ်ပစ်မှတ် ({count} ကြိမ်): K {total}။",
    "每次抽奖需 ≥ K {per}。每日目标（{count} 次）：K {total}。",
    "หมุนแต่ละครั้งต้อง ≥ K {per} เป้าหมายรายวัน ({count} ครั้ง): K {total}",
  )
    .replace("{per}", Number(ticketDepositThresholdKyat.value).toLocaleString())
    .replace("{count}", String(dailySpinChanceCount.value))
    .replace("{total}", Number(ticketDepositTotalTargetKyat.value).toLocaleString()),
);

const mockGoUnlocked = computed(
  () => requestUnlocked.value || debugSpinEnabled.value,
);

const goEnabled = computed(() => {
  if (isSpinning.value) return false;
  if (!isLoggedIn.value) return false;
  if (!segments.value.length) return false;
  if (mockWheelOnly.value) return mockGoUnlocked.value;
  return canSpinToday.value;
});

const pickRandomWinIndexExcludingPhone = () => {
  const list = segments.value;
  const excludeIdx = list.findIndex(
    (s) => s.kind === "phone" || s.id === "iphone",
  );
  const pool =
    excludeIdx >= 0
      ? list.map((_, i) => i).filter((i) => i !== excludeIdx)
      : list.map((_, i) => i);
  if (pool.length === 0) return 0;
  return pool[Math.floor(Math.random() * pool.length)];
};

const handleGo = async () => {
  if (!isLoggedIn.value) {
    emit("close");
    openLoginModal();
    return;
  }
  if (isSpinning.value) return;

  if (mockWheelOnly.value) {
    if (!mockGoUnlocked.value) {
      showDialog({
        title: t("Notice", "အသိပေးချက်", "提示", "แจ้งเตือน"),
        message: t(
          "Tap Request first to join the event.",
          "ပွဲတွင် ပါဝင်ရန် အရင် တောင်းဆိုမှု ကိုနှိပ်ပါ။",
          "请先点击申请参加活动。",
          "กรุณากดขอเข้าร่วมก่อน",
        ),
        confirmButtonText: t("OK", "သဘောတူပါသည်", "好的", "ตกลง"),
      });
      return;
    }
    const winIndex =
      debugWinIndex.value !== null
        ? debugWinIndex.value
        : pickRandomWinIndexExcludingPhone();
    await spinToSegmentIndex(winIndex);
    const prize = lastPrize.value;
    if (prize?.label) {
      const amtLine = kyatNumericAmountLine(prize.raw ?? {});
      const core = amtLine ? `${prize.label} (${amtLine})` : prize.label;
      showSuccessToast({
        message: t(
          `You won: ${core}`,
          `အနိုင်ရ: ${core}`,
          `获得：${core}`,
          `คุณได้รับ: ${core}`,
        ),
        duration: 2500,
      });
    }
    return;
  }

  if (!canSpinToday.value) {
    const meta = spinWheelMeta.value;
    if (meta && !meta.deposit_eligible_today) {
      showDialog({
        title: t("Notice", "အသိပေးချက်", "提示", "แจ้งเตือน"),
        message: t(
          "Deposit today’s required amount to spin.",
          "ယနေ့ လိုအပ်သော အပ်ငွေပမာဏ ပြည့်မီမှ လည်ပတ်နိုင်သည်။",
          "今日需达到指定充值额度才可抽奖。",
          "ฝากให้ครบยอดที่กำหนดวันนี้จึงจะหมุนได้",
        ),
        confirmButtonText: t("OK", "သဘောတူပါသည်", "好的", "ตกลง"),
      });
    } else {
      showDialog({
        title: t("Notice", "အသိပေးချက်", "提示", "แจ้งเตือน"),
        message: t(
          "Daily spin limit reached.",
          "ယနေ့ လည်ပတ်ခွင့် ပြည့်သွားပါပြီ။",
          "今日抽奖次数已用完。",
          "ใช้สิทธิ์หมุนครบแล้ววันนี้",
        ),
        confirmButtonText: t("OK", "သဘောတူပါသည်", "好的", "ตกลง"),
      });
    }
    return;
  }

  try {
    const { data: spinRecord } = await postSpinWheel();
    try {
      await store.dispatch("refreshUser");
    } catch {
      showFailToast({
        message: t(
          "Could not refresh balance. Check your connection.",
          "လက်ကျန်ငွေ မပြန်လည်စစ်ဆေးနိုင်ပါ။ ချိတ်ဆက်မှုကို စစ်ပါ။",
          "余额刷新失败，请检查网络。",
          "รีเฟรชยอดเงินไม่สำเร็จ ลองตรวจสอบการเชื่อมต่อ",
        ),
        position: "top",
      });
    }
    const idx = segmentIndexForSpinRecord(spinRecord, segments.value);
    if (idx < 0) {
      showFailToast({
        message: t(
          "Could not show result on wheel.",
          "ရလဒ်ကို ဘီးပေါ်တွင် မပြသနိုင်ပါ။",
          "无法在转盘上显示结果。",
          "แสดงผลบนวงล้อไม่ได้",
        ),
        position: "top",
      });
      await loadSpinWheelFromApi();
      return;
    }
    await spinToSegmentIndex(idx);
    const name =
      spinRecord.prize_name ||
      lastPrize.value?.label ||
      t("Prize", "ဆုလက်ဆောင်", "奖品", "รางวัล");
    const amtLine =
      kyatNumericAmountLine(spinRecord) ||
      kyatNumericAmountLine(lastPrize.value?.raw ?? {});
    const resultCore = amtLine ? `${name} (${amtLine})` : name;
    showSuccessToast({
      message: t(
        `Result: ${resultCore}`,
        `ရလဒ်: ${resultCore}`,
        `结果：${resultCore}`,
        `ผลลัพธ์: ${resultCore}`,
      ),
      duration: 2500,
    });
    await loadSpinWheelFromApi();
    await loadHistoryPage(1);
  } catch (err) {
    const norm = normalizeSpinwheelError(err);
    if (norm.status === 429) {
      showFailToast({
        message: t(
          "Too many spins. Try again in a minute.",
          "အကြိမ်အများကြီး လည်ပတ်ထားပါသည်။ မိနစ်အနည်းငယ်ကြာမှ ထပ်ကြိုးစားပါ။",
          "操作过于频繁，请稍后再试。",
          "หมุนถี่เกินไป ลองใหม่ในอีกสักครู่",
        ),
        position: "top",
      });
    } else {
      showFailToast({ message: norm.message, position: "top" });
    }
  }
};

const WEDGE_R = 92;

const SEGMENT_FILLS = ["#ffffff", "#fff9e5"];

function segmentPath(angleDeg) {
  const R = WEDGE_R;
  const clamped = Math.min(Math.max(Number(angleDeg) || 0, 0.05), 360);
  const rad = (clamped * Math.PI) / 180;
  const x = R * Math.cos(rad);
  const y = R * Math.sin(rad);
  const largeArc = clamped > 180 ? 1 : 0;
  return `M 0 0 L ${R} 0 A ${R} ${R} 0 ${largeArc} 1 ${x} ${y} Z`;
}

const LABEL_RADIUS = 69;

const labelLayouts = computed(() =>
  segments.value.map((seg) => {
    const angleDeg = -90 + seg.cumStartDeg + seg.angleDeg / 2;
    const rad = (angleDeg * Math.PI) / 180;
    const x = LABEL_RADIUS * Math.cos(rad);
    const y = LABEL_RADIUS * Math.sin(rad);
    let svgRot = -(angleDeg + 90);
    if (y > 0) svgRot += 180;
    while (svgRot > 180) svgRot -= 360;
    while (svgRot < -180) svgRot += 360;
    const rSpin = (svgRot * Math.PI) / 180;
    const colX = Math.sin(rSpin);
    const colY = Math.cos(rSpin);
    const norm = Math.hypot(x, y) || 1;
    const outX = x / norm;
    const outY = y / norm;
    const dotOut = colX * outX + colY * outY;
    const radialStackReverse = dotOut < 0;
    return { x, y, svgRot, radialStackReverse };
  }),
);

const segmentEmoji = (kind) => {
  if (kind === "phone") return "📱";
  if (kind === "trophy") return "🏆";
  if (kind === "none") return "🎟️";
  return "💰";
};

const prizeLines = (seg) => {
  const raw = seg.label?.trim() || "";
  let lines;
  if (seg.kind === "phone" && raw.toLowerCase().includes("iphone")) {
    const m = raw.match(/iPhone\s*(\d+)?\s*(Pro\s*Max|ProMax)?/i);
    const num = m?.[1] || "16";
    lines = [`iPhone ${num}`, "Pro Max"];
  } else if (raw.length > 13) {
    const sp = raw.indexOf(" ");
    if (sp > 0 && sp < raw.length - 1) {
      lines = [raw.slice(0, sp), raw.slice(sp + 1)];
    } else {
      lines = [raw || "—"];
    }
  } else {
    lines = [raw || "—"];
  }
  return lines;
};

function resolvePrizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  let u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//") && typeof window !== "undefined") {
    return `${window.location.protocol}${u}`;
  }
  const base = axios.defaults.baseURL || "";
  const originBase = base.replace(/\/api\/?$/i, "").trim();
  const origin =
    originBase || (typeof window !== "undefined" ? window.location.origin : "");
  if (!origin) return u;
  try {
    const path = u.startsWith("/") ? u : `/${u}`;
    return new URL(path, origin).href;
  } catch {
    return u;
  }
}

function prizeImageKey(seg, i) {
  return `${seg.id}-${i}`;
}

function onPrizeImageError(seg, i) {
  const k = prizeImageKey(seg, i);
  prizeImageFailed.value = { ...prizeImageFailed.value, [k]: true };
}

const marqueeBulbCount = 24;

/** Bulb positions on an ellipse (stretched via SVG preserveAspectRatio) for history marquee frame. */
const HISTORY_MARQUEE_BULB_COUNT = 32;
/** Reference UI: show only three recent-winner rows. */
const RECENT_WINNERS_MAX = 3;
const historyMarqueeBulbPoints = Array.from(
  { length: HISTORY_MARQUEE_BULB_COUNT },
  (_, i) => {
    const t = (i / HISTORY_MARQUEE_BULB_COUNT) * Math.PI * 2 - Math.PI / 2;
    return { x: 47 * Math.cos(t), y: 21 * Math.sin(t) };
  },
);

/** First non-empty identifier for display masking (skip all-asterisk placeholders). */
function pickHistoryUsernameRaw(row) {
  const keys = [
    "user_name",
    "username",
    "login",
    "nickname",
    "display_name",
    "name",
    "member_name",
    "account_name",
    "player_name",
    "phone",
    "mobile",
    "email",
    "member_code",
    "member_id",
    "user_id",
    "masked_username",
    "username_masked",
    "user_mask",
    "masked_name",
  ];
  const isUsable = (t) => {
    if (!t) return false;
    if (/^\*+$/.test(t)) return false;
    return true;
  };
  for (const k of keys) {
    const v = row[k];
    if (v == null || v === "") continue;
    const t = String(v).trim();
    if (isUsable(t)) return t;
  }
  const u = row.user;
  if (u && typeof u === "object") {
    for (const k of [
      "username",
      "name",
      "login",
      "nickname",
      "phone",
      "email",
    ]) {
      const t = String(u[k] ?? "").trim();
      if (isUsable(t)) return t;
    }
  }
  return "";
}

/** Show first 2 + middle stars + last 1 (e.g. `dl*******d`). */
function maskUsernameFirst2Last1(s) {
  const n = s.length;
  if (n <= 0) return "****";
  if (s.includes("*")) return s;
  if (n === 1) return `${s[0]}***`;
  if (n === 2) return `${s[0]}*${s[1]}`;
  if (n === 3) return `${s[0]}${s[1]}*${s[2]}`;
  const midLen = Math.max(3, n - 3);
  return `${s.slice(0, 2)}${"*".repeat(midLen)}${s.slice(-1)}`;
}

function historyRowMaskedName(row) {
  const raw = pickHistoryUsernameRaw(row);
  if (!raw) return "****";
  return maskUsernameFirst2Last1(raw);
}

/** Formatted `K x,xxx.xx` from API-style fields, or "" if not a numeric cash amount. */
function kyatNumericAmountLine(row) {
  if (!row || typeof row !== "object") return "";
  const candidates = [
    row.reward_amount,
    row.amount,
    row.prize_amount,
    row.win_amount,
    row.cash_amount,
  ];
  for (const c of candidates) {
    if (c == null || c === "") continue;
    const n = Number(c);
    if (!Number.isNaN(n)) {
      return `K ${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  }
  return "";
}

function historyRowPrizeKyat(row) {
  const line = kyatNumericAmountLine(row);
  if (line) return line;
  const name = String(row.prize_name || "").trim();
  return name || "—";
}

const labelOverlayStyle = (layout) => ({
  left: `${50 + layout.x * 0.5}%`,
  top: `${50 + layout.y * 0.5}%`,
  transform: `translate(-50%, -50%) rotate(${layout.svgRot}deg)`,
});

const recentWinnersDisplayed = computed(() =>
  historyItems.value.slice(0, RECENT_WINNERS_MAX),
);
</script>

<template>
  <Teleport to="body">
    <div
      v-show="isOpen && !showTicketMissionPanel"
      class="fixed inset-0 z-100 flex sm:items-center justify-center px-3 pb-6 sm:pb-0"
      :class="reduceEffectsMode ? 'bg-black/85' : 'bg-black/80'"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lucky-spin-title"
      @click.self="handleClose"
    >
      <div
        class="relative w-full max-h-[min(92vh,720px)] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.65)]"
        @click.stop
      >
        <button
          type="button"
          class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white ring-1 ring-white/25 transition hover:bg-zinc-700"
          aria-label="Close"
          @click="handleClose"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div class="px-4 pb-4 pt-8 text-center">
          <!-- Header decoration -->
          <div class="mb-1 flex justify-center gap-1 text-amber-400/90">
            <span class="text-6xl" aria-hidden="true">🎺</span>
            <span class="text-6xl leading-none" aria-hidden="true">👑</span>
            <span class="text-6xl" aria-hidden="true">🎺</span>
          </div>
          <div
            class="mx-auto mb-2 inline-block rounded-sm bg-gradient-to-r from-red-800 via-red-600 to-red-800 px-10 py-1 text-lg font-bold text-amber-100 shadow-md ring-1 ring-amber-500/50 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ t("Prizes", "ဆုတောင်းများ", "奖品", "ของรางวัล") }}
          </div>
          <!-- Featured prize preview (reference: iPhone tile) -->

          <img
            src="https://images.9734232.com/mcs-images/ticket/rm98f4/2694125_1751447649233.jpeg"
            alt=""
            class="w-[80px] h-auto max-h-[60px] object-contain rounded-xl mx-auto mb-2 mt-3"
          />

          <h2 id="lucky-spin-title" class="sr-only">
            {{ t("Lucky Wheel", "ကံစမ်းလည်ပတ်", "幸运转盘", "วงล้อนำโชค") }}
          </h2>

          <!-- Countdown (directly under featured image, per reference) -->
          <div class="mt-0 flex items-start justify-center mt-5 gap-4">
            <div
              class="flex items-center mt-3 gap-1.5 text-amber-400/95 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            >
              <span aria-hidden="true">🕐</span>
              <span class="text-lg font-semibold text-white">{{
                t("Remaining time", "လက်ကျန်အချိန်", "剩余时间", "เวลาที่เหลือ")
              }}</span>
            </div>
            <div class="flex items-center justify-center gap-2">
              <div class="flex flex-col items-center gap-0.5">
                <div
                  class="min-w-[2.5rem] rounded-md bg-[#2d2d32] px-3 py-1 text-lg font-mono font-bold text-white tabular-nums ring-1 ring-white/10"
                >
                  {{ pad2(countdown.h) }}
                </div>
                <span
                  class="text-[10px] font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >{{ t("Hours", "နာရီ", "时", "ชม.") }}</span
                >
              </div>
              <span class="mb-5 text-xl font-bold text-white">:</span>
              <div class="flex flex-col items-center gap-0.5">
                <div
                  class="min-w-[2.5rem] rounded-md bg-[#2d2d32] px-3 py-1 text-lg font-mono font-bold text-white tabular-nums ring-1 ring-white/10"
                >
                  {{ pad2(countdown.m) }}
                </div>
                <span
                  class="text-[10px] text-white font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
                  >{{ t("Minutes", "မိနစ်", "分", "นาที") }}</span
                >
              </div>
              <span class="mb-5 text-xl font-bold text-white">:</span>
              <div class="flex flex-col items-center gap-0.5">
                <div
                  class="min-w-[2.5rem] rounded-md bg-[#2d2d32] px-3 py-1 text-lg font-mono font-bold text-white tabular-nums ring-1 ring-white/10"
                >
                  {{ pad2(countdown.s) }}
                </div>
                <span
                  class="text-[10px] text-white font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
                  >{{ t("Seconds", "စက္ကန့်", "秒", "วินาที") }}</span
                >
              </div>
            </div>
          </div>

          <p
            v-if="wheelForbidden"
            class="mt-2 px-2 text-center text-sm text-amber-200 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Spin wheel is not available for this account.",
                "ဤအကောင့်အတွက် ကံစမ်းလည်ပတ် မရနိုင်ပါ။",
                "当前账户无法使用幸运转盘。",
                "วงล้อไม่พร้อมใช้งานสำหรับบัญชีนี้",
              )
            }}
          </p>
          <p
            v-else-if="wheelLoadMessage && isLoggedIn && !mockWheelOnly"
            class="mt-2 px-2 text-center text-sm text-red-300/90 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ wheelLoadMessage }}
          </p>

          <!-- Wheel + fiery glow (reference) -->
          <div
            class="relative mx-auto mt-4 flex w-[min(100%,300px)] justify-center py-3"
          >
            <div
              class="lucky-spin-glow pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[108%] max-w-[calc(100%+1.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-full"
              :class="reduceEffectsMode ? 'opacity-40' : 'opacity-90'"
              aria-hidden="true"
            />

            <div
              v-if="wheelLoading && isLoggedIn && !mockWheelOnly"
              class="flex min-h-[200px] w-full max-w-[300px] items-center justify-center rounded-full bg-zinc-800/80 text-sm text-white/80"
            >
              {{ t("Loading…", "ဆောင်ရွက်နေသည်…", "加载中…", "กำลังโหลด…") }}
            </div>
            <div
              v-else
              class="relative aspect-square w-full rounded-full p-[5px]"
              :style="{
                boxShadow: reduceEffectsMode
                  ? '0 0 0 4px #c9a227, inset 0 0 20px rgba(0,0,0,0.4)'
                  : '0 0 0 5px #e8b84a, 0 0 28px rgba(255,140,60,0.55), 0 0 48px rgba(220,80,30,0.35), inset 0 0 24px rgba(0,0,0,0.35)',
              }"
            >
              <!-- Marquee bulbs (white dots on gold ring) -->
              <svg
                class="pointer-events-none absolute inset-0 z-[6] h-full w-full overflow-visible"
                viewBox="-110 -110 220 220"
                aria-hidden="true"
              >
                <defs>
                  <filter
                    id="lucky-spin-bulb-glow"
                    x="-80%"
                    y="-80%"
                    width="260%"
                    height="260%"
                  >
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <g
                  v-for="n in marqueeBulbCount"
                  :key="n"
                  :transform="`rotate(${(n - 1) * (360 / marqueeBulbCount)})`"
                >
                  <circle
                    cx="0"
                    cy="-104"
                    r="3"
                    :fill="reduceEffectsMode ? '#fef9c3' : '#fffbeb'"
                    :filter="
                      reduceEffectsMode ? 'none' : 'url(#lucky-spin-bulb-glow)'
                    "
                    opacity="0.95"
                  />
                </g>
              </svg>

              <div
                class="absolute inset-[14px] rounded-full border border-amber-500/25 bg-amber-950/20"
                :class="reduceEffectsMode ? '' : 'lucky-spin-bulbs'"
              />

              <div
                class="absolute inset-[12px] rounded-full overflow-hidden"
                :class="[isSpinning ? 'transition-[transform] ease-out' : '']"
                :style="{
                  transform: `rotate(${rotationDeg}deg)`,
                  transitionDuration: isSpinning
                    ? `${spinDurationMs}ms`
                    : '0ms',
                }"
              >
                <!-- Slices only: geometry stays in SVG -->
                <svg
                  viewBox="-100 -100 200 200"
                  class="absolute inset-0 h-full w-full"
                  shape-rendering="geometricPrecision"
                  aria-hidden="true"
                >
                  <g
                    v-for="(seg, i) in segments"
                    :key="`wedge-${seg.id}-${i}`"
                    :transform="`rotate(${-90 + seg.cumStartDeg})`"
                  >
                    <path
                      :d="segmentPath(seg.angleDeg)"
                      :fill="SEGMENT_FILLS[i % 2]"
                      stroke="rgba(212,175,55,0.55)"
                      stroke-width="0.65"
                    />
                  </g>
                </svg>
                <!-- Labels: HTML + flex (easier to style than SVG text) -->
                <div
                  class="pointer-events-none absolute inset-0 z-[1]"
                  aria-hidden="true"
                >
                  <div
                    v-for="(seg, i) in segments"
                    :key="`lbl-${seg.id}-${i}`"
                    class="absolute flex max-w-[min(22vw,5.5rem)] items-center justify-center gap-0.5 text-center"
                    :class="
                      labelLayouts[i].radialStackReverse
                        ? 'flex-col-reverse'
                        : 'flex-col'
                    "
                    :style="labelOverlayStyle(labelLayouts[i])"
                  >
                    <!-- Reference: text nearer hub, icon toward outer rim; text sits under icon along radius -->
                    <span
                      v-for="(line, li) in prizeLines(seg)"
                      :key="li"
                      class="select-none font-['Pyidaungsu','Padauk',system-ui,sans-serif] text-[0.625rem] font-bold leading-tight text-stone-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]"
                      >{{ line }}</span
                    >
                    <img
                      v-if="
                        seg.imageUrl && !prizeImageFailed[prizeImageKey(seg, i)]
                      "
                      :src="resolvePrizeImageUrl(seg.imageUrl)"
                      alt=""
                      class="h-7 w-7 shrink-0 object-contain"
                      @error="onPrizeImageError(seg, i)"
                    />
                    <span
                      class="select-none text-base leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      style="
                        font-family:
                          &quot;Apple Color Emoji&quot;,
                          &quot;Segoe UI Emoji&quot;, sans-serif;
                      "
                      >{{ segmentEmoji(seg.kind) }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Center GO + pointer on hub (reference: arrow on top of GO) -->
              <div
                class="absolute left-1/2 top-1/2 z-10 flex h-17 w-17 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center"
              >
                <div
                  class="pointer-events-none relative z-20 -mb-1 flex flex-col items-center"
                  aria-hidden="true"
                >
                  <div
                    class="h-0 w-0 border-x-[7px] border-x-transparent border-b-[12px] border-b-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                  />
                </div>
                <div
                  class="flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center rounded-full bg-gradient-to-b from-orange-500 via-red-600 to-red-900 ring-[3px] ring-amber-400/80 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                >
                  <button
                    type="button"
                    class="flex h-full w-full flex-col items-center justify-center rounded-full px-3 py-2 transition enabled:active:scale-95 enabled:hover:brightness-110 disabled:opacity-40"
                    :disabled="!goEnabled"
                    @click="handleGo"
                  >
                    <span
                      class="text-xl font-black tracking-widest text-white drop-shadow-md"
                      >GO</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="!isLoggedIn"
            class="mt-1 text-center text-xs text-amber-200/70 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Log in to spin",
                "လည်ပတ်ရန် လော့ဂ်အင်ဝင်ပါ",
                "登录后抽奖",
                "เข้าสู่ระบบเพื่อหมุน",
              )
            }}
          </p>
          <p
            v-else-if="isLoggedIn && mockWheelOnly && !mockGoUnlocked"
            class="mt-1 text-center text-xs text-amber-200/70 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Tap Request below to unlock GO.",
                "GO ဖွင့်ရန် အောက်ရှိ တောင်းဆိုမှု ကိုနှိပ်ပါ။",
                "点击下方申请以解锁 GO。",
                "กดขอด้านล่างเพื่อปลดล็อก GO",
              )
            }}
          </p>
          <p
            v-else-if="
              isLoggedIn &&
              !mockWheelOnly &&
              wheelApiLoaded &&
              !canSpinToday &&
              !wheelForbidden
            "
            class="mt-1 text-center text-xs text-amber-200/70 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              spinWheelMeta && !spinWheelMeta.deposit_eligible_today
                ? t(
                    "Meet today’s deposit target to spin.",
                    "ယနေ့ အပ်ငွေပန်းတိုင်ပြည့်မှ လည်ပတ်နိုင်သည်။",
                    "达到今日充值要求后即可抽奖。",
                    "ฝากให้ครบตามเป้าวันนี้เพื่อหมุน",
                  )
                : t(
                    "No spins left today.",
                    "ယနေ့ လည်ပတ်ခွင့် မရှိတော့ပါ။",
                    "今日抽奖次数已用完。",
                    "วันนี้หมุนไม่ได้แล้ว",
                  )
            }}
          </p>
          <p
            v-if="
              isLoggedIn && !mockWheelOnly && wheelApiLoaded && !wheelForbidden
            "
            class="mt-1 text-center text-xs font-semibold text-amber-300/90 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{
              t(
                "Spins left today: {n}",
                "ယနေ့ လည်ပတ်ခွင့် ကျန်ပါသေးသည် — {n}",
                "今日剩余抽奖次数：{n}",
                "เหลือสิทธิ์หมุนวันนี้: {n}",
              ).replace("{n}", String(remainingSpinsToday))
            }}
          </p>

          <button
            type="button"
            class="lucky-spin-request-btn mt-4 w-auto px-14 !text-red-500 py-1 rounded-full text-base font-black shadow-lg font-['Pyidaungsu','Padauk',sans-serif] transition active:scale-[0.99] hover:brightness-105"
            @click="handleRequest"
          >
            {{ t("Request", "တောင်းဆိုမှု", "申请", "ขอร่วม") }}
          </button>

          <!-- Mission / invite progress (reference: bar under Request) -->
          <div
            class="mt-3 w-full"
            role="status"
            :aria-label="t('Progress', 'တိုးတက်မှု', '进度', 'ความคืบหน้า')"
          >
            <div
              class="relative h-6 w-full overflow-hidden rounded-full bg-[#1c1c22] ring-1 ring-white/10"
            >
              <div
                class="lucky-spin-progress-fill absolute inset-y-0 left-0 rounded-md"
                :style="{
                  width: `${Math.min(100, Math.max(0, missionProgressPercent))}%`,
                  background: `linear-gradient(180deg, #f5d78e 0%, #e8b84a 45%, #c9952e 100%)`,
                }"
              />
              <span
                class="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
              >
                {{ progressDisplay }}%
              </span>
            </div>
          </div>

          <!-- Recent winners / spins (API) — marquee frame -->
          <div
            v-if="
              isLoggedIn &&
              !mockWheelOnly &&
              wheelApiLoaded &&
              historyItems.length
            "
            class="relative mx-auto mt-5 w-full max-w-[min(100%,340px)] text-left font-['Pyidaungsu','Padauk',sans-serif]"
          >
            <span
              class="lucky-spin-history-coin pointer-events-none absolute -left-0.5 top-1 z-20 text-[1.35rem] select-none"
              :class="
                reduceEffectsMode
                  ? 'opacity-85 drop-shadow-md'
                  : 'opacity-95 drop-shadow-[0_0_10px_rgba(250,204,21,0.75),0_0_22px_rgba(234,179,8,0.45),0_2px_4px_rgba(0,0,0,0.5)]'
              "
              aria-hidden="true"
              >🪙</span
            >
            <span
              class="lucky-spin-history-coin pointer-events-none absolute -right-0.5 bottom-14 z-20 text-xl select-none"
              :class="
                reduceEffectsMode
                  ? 'opacity-80 drop-shadow-md'
                  : 'opacity-90 drop-shadow-[0_0_8px_rgba(250,204,21,0.65),0_0_18px_rgba(234,179,8,0.35),0_2px_4px_rgba(0,0,0,0.45)]'
              "
              aria-hidden="true"
              >🪙</span
            >
            <span
              class="lucky-spin-history-coin pointer-events-none absolute -right-1 bottom-0 z-20 text-lg select-none"
              :class="
                reduceEffectsMode
                  ? 'opacity-75 drop-shadow-md'
                  : 'opacity-90 drop-shadow-[0_0_10px_rgba(250,204,21,0.7),0_0_20px_rgba(234,179,8,0.35),0_2px_4px_rgba(0,0,0,0.45)]'
              "
              aria-hidden="true"
              >🪙</span
            >
            <span
              class="pointer-events-none absolute -left-1 -top-2 z-30 text-[2rem] leading-none select-none"
              :class="
                reduceEffectsMode
                  ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
                  : 'drop-shadow-[0_0_12px_rgba(253,224,71,0.55),0_2px_8px_rgba(0,0,0,0.55)]'
              "
              aria-hidden="true"
              >🏆</span
            >

            <div
              class="lucky-spin-history-outer relative rounded-2xl"
              :class="reduceEffectsMode ? 'lucky-spin-history-outer--lite' : ''"
            >
              <div
                class="lucky-spin-history-frame relative overflow-hidden rounded-2xl p-[5px]"
              >
                <svg
                  class="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible rounded-2xl"
                  viewBox="-50 -25 100 50"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter
                      id="luckySpinHistoryMarqueeGlow"
                      x="-100%"
                      y="-100%"
                      width="300%"
                      height="300%"
                    >
                      <feGaussianBlur stdDeviation="0.85" result="hbulbBlur" />
                      <feMerge>
                        <feMergeNode in="hbulbBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter
                      id="luckySpinHistoryBulbHalo"
                      x="-150%"
                      y="-150%"
                      width="400%"
                      height="400%"
                    >
                      <feGaussianBlur stdDeviation="1.55" result="hHalo" />
                      <feMerge>
                        <feMergeNode in="hHalo" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g
                    v-for="(pt, i) in historyMarqueeBulbPoints"
                    :key="'hmb-' + i"
                    :transform="`translate(${pt.x}, ${pt.y})`"
                  >
                    <circle
                      v-if="!reduceEffectsMode"
                      r="3.45"
                      fill="#fcd34d"
                      opacity="0.5"
                      filter="url(#luckySpinHistoryBulbHalo)"
                    />
                    <circle
                      r="1.85"
                      :fill="reduceEffectsMode ? '#fef9c3' : '#fffef5'"
                      :filter="
                        reduceEffectsMode
                          ? 'none'
                          : 'url(#luckySpinHistoryMarqueeGlow)'
                      "
                      opacity="0.98"
                    />
                  </g>
                </svg>

                <div
                  class="lucky-spin-history-inner-rim pointer-events-none absolute inset-[4px] z-[1] rounded-[0.7rem]"
                  aria-hidden="true"
                />

                <div
                  class="lucky-spin-history-list relative z-[2] m-[2px] overflow-hidden rounded-[0.65rem] px-3 py-2.5 ring-1 ring-amber-950/80"
                >
                  <p
                    class="relative mb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-amber-400/95"
                  >
                    {{
                      t(
                        "Recent winners",
                        "မကြာသေးမီ အနိုင်ရသူများ",
                        "最近中奖",
                        "ผู้ชนะล่าสุด",
                      )
                    }}
                  </p>
                  <ul
                    class="relative divide-y divide-amber-600/20 text-left [box-shadow:inset_0_1px_0_rgba(251,191,36,0.06)]"
                  >
                    <li
                      v-for="(row, ri) in recentWinnersDisplayed"
                      :key="row.id ?? `rw-${ri}`"
                      class="flex items-center justify-between gap-2 py-2.5 first:pt-0"
                      :aria-label="`${historyRowMaskedName(row)}, ${historyRowPrizeKyat(row)}`"
                    >
                      <span
                        class="min-w-0 truncate text-[0.8125rem] font-medium text-white"
                        >{{ historyRowMaskedName(row) }}</span
                      >
                      <span
                        class="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-amber-300"
                        >{{ historyRowPrizeKyat(row) }}</span
                      >
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Ticket mission: separate fixed layer so it is not inside the wheel scroll area -->
  <Teleport to="body">
    <div
      v-show="isOpen && showTicketMissionPanel"
      class="fixed inset-0 z-[110] flex sm:items-center justify-center px-3 pb-6 sm:pb-0"
      :class="reduceEffectsMode ? 'bg-black/85' : 'bg-black/80'"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lucky-spin-ticket-mission-title"
      @click.self="closeTicketMissionPanel"
    >
      <div
        class="relative w-full max-h-[100vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.65)]"
        @click.stop
      >
        <div class="flex min-h-0 flex-col px-4 pb-6 pt-3" role="document">
          <div class="relative mb-2 flex shrink-0 items-center justify-between">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full text-zinc-800 shadow-md border-3 transition"
              :aria-label="t('Back', 'နောက်သို့', '返回', 'กลับ')"
              @click="closeTicketMissionPanel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full shadow-md transition border-3"
              aria-label="Close"
              @click="handleClose"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="text-center">
            <div class="mb-1 flex justify-center gap-1 text-amber-400/90">
              <span class="text-6xl" aria-hidden="true">🎺</span>
              <span class="text-6xl leading-none" aria-hidden="true">👑</span>
              <span class="text-6xl" aria-hidden="true">🎺</span>
            </div>
            <div
              id="lucky-spin-ticket-mission-title"
              class="mx-auto mb-3 inline-block rounded-sm bg-gradient-to-r from-red-800 via-red-600 to-red-800 px-10 py-1 text-lg font-bold text-amber-100 shadow-md ring-1 ring-amber-500/50 font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Prizes", "ဆုတောင်းများ", "奖品", "ของรางวัล") }}
            </div>

            <p
              class="mb-3 text-lg font-['Pyidaungsu','Padauk',sans-serif] font-semibold leading-snug text-white/95"
            >
              {{
                t(
                  "Please complete the task to claim your ticket.",
                  "သင့်လက်မှတ်ကို တောင်းဆိုရန် လုပ်ဆောင်စရာကို ပြီးအောင်လုပ်ပါ။",
                  "请完成任务以领取抽奖券。",
                  "ทำภารกิจให้ครบเพื่อรับตั๋ว",
                )
              }}
            </p>

            <div
              class="mb-4 w-full"
              role="status"
              :aria-label="t('Progress', 'တိုးတက်မှု', '进度', 'ความคืบหน้า')"
            >
              <div
                class="relative h-6 w-full overflow-hidden rounded-full bg-[#1c1c22] ring-2 ring-[#707070]"
              >
                <div
                  class="lucky-spin-progress-fill absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-zinc-500/90 to-zinc-400"
                  :style="{
                    width: `${Math.min(100, Math.max(0, missionProgressPercent))}%`,
                  }"
                />
                <span
                  class="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                >
                  {{ progressDisplay }}%
                </span>
              </div>
            </div>

            <div
              class="mx-auto w-full max-w-md mt-8 rounded-2xl bg-[#5F5F5F] p-3.5 ring-1 ring-white/10"
            >
              <div
                class="mb-3 flex flex-row gap-3 sm:flex-row items-center sm:justify-between sm:gap-4"
              >
                <p
                  class="flex-1 text-left text-lg font-medium leading-snug text-white/90 font-['Pyidaungsu','Padauk',sans-serif] sm:text-sm"
                >
                  {{ missionDepositHint }}
                </p>
                <button
                  type="button"
                  class="lucky-spin-deposit-btn shrink-0 rounded-full px-6 py-1 text-sm font-bold text-[#3d2a0a] shadow-lg font-['Pyidaungsu','Padauk',sans-serif] transition active:scale-[0.99] hover:brightness-105 sm:py-3"
                  @click="handleMissionDeposit"
                >
                  {{ t("Deposit", "အပ်ငွေ", "充值", "ฝากเงิน") }}
                </button>
              </div>

              <div class="relative w-full">
                <div
                  class="relative h-6 w-full overflow-hidden rounded-full bg-[#1c1c22] ring-2 ring-[#707070]"
                >
                  <div
                    class="lucky-spin-progress-fill absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-amber-600/90 to-amber-400/90"
                    :style="{ width: `${depositInnerBarWidth}%` }"
                  />
                  <span
                    class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                  >
                    {{ depositTaskDisplay }}
                  </span>
                </div>
                <div
                  class="mt-1 flex justify-between text-base font-light tabular-nums text-white"
                >
                  <span>0</span>
                  <span>{{
                    ticketDepositTotalTargetKyat.toLocaleString()
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lucky-spin-glow {
  background: radial-gradient(
    circle,
    rgba(255, 120, 40, 0.55) 0%,
    rgba(255, 80, 30, 0.28) 42%,
    transparent 68%
  );
  filter: blur(2px);
}

.lucky-spin-bulbs {
  background: repeating-conic-gradient(
    from 0deg,
    rgba(245, 197, 66, 0.35) 0deg 4deg,
    transparent 4deg 8deg
  );
  opacity: 0.3;
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 8px),
    #000 calc(100% - 6px)
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 8px),
    #000 calc(100% - 6px)
  );
}

.lucky-spin-progress-fill {
  transition: width 0.35s ease;
  min-width: 0;
}

.lucky-spin-request-btn {
  background: linear-gradient(180deg, #f5d78e 0%, #e8b84a 45%, #c9952e 100%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 4px 14px rgba(0, 0, 0, 0.35);
}

.lucky-spin-deposit-btn {
  background: linear-gradient(180deg, #ffb347 0%, #ff8c00 45%, #e67300 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.35);
}

.lucky-spin-history-outer {
  isolation: isolate;
}

.lucky-spin-history-outer::before {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 1.1rem;
  z-index: 0;
  pointer-events: none;
  /* Soft outer spill only — main “lit border” is on .lucky-spin-history-frame::before */
  background: radial-gradient(
    ellipse 88% 72% at 50% 48%,
    rgba(253, 224, 71, 0.14) 0%,
    rgba(234, 179, 8, 0.08) 48%,
    transparent 70%
  );
  box-shadow:
    0 0 14px 2px rgba(250, 204, 21, 0.35),
    0 0 28px 6px rgba(234, 179, 8, 0.18);
  animation: lucky-spin-history-border-glow 3s ease-in-out infinite;
}

.lucky-spin-history-outer--lite::before {
  animation: none;
  inset: -3px;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.18);
  background: transparent;
}

.lucky-spin-history-frame {
  position: relative;
  z-index: 1;
  background: linear-gradient(
    145deg,
    #4a3410 0%,
    #8b6914 22%,
    #d4a84b 42%,
    #f5e0a8 50%,
    #c9952e 58%,
    #6b4f12 82%,
    #2a1f0a 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -2px 10px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(120, 80, 20, 0.55),
    0 0 16px rgba(251, 191, 36, 0.28),
    0 0 32px rgba(234, 179, 8, 0.14);
}

/* Gold lighting confined to the ~5px frame band (same as p-[5px]) */
.lucky-spin-history-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: 1rem;
  padding: 5px;
  box-sizing: border-box;
  background: conic-gradient(
    from 200deg at 50% 50%,
    rgba(255, 252, 220, 0.95) 0deg,
    rgba(254, 243, 199, 0.85) 45deg,
    rgba(251, 191, 36, 0.9) 95deg,
    rgba(180, 110, 25, 0.88) 155deg,
    rgba(120, 70, 15, 0.75) 200deg,
    rgba(253, 224, 71, 0.92) 260deg,
    rgba(255, 248, 210, 0.9) 310deg,
    rgba(255, 252, 220, 0.95) 360deg
  );
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.55),
    inset 0 -3px 8px rgba(0, 0, 0, 0.42),
    inset 0 0 10px rgba(253, 224, 71, 0.45);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.65))
    drop-shadow(0 0 10px rgba(251, 191, 36, 0.4));
  animation: lucky-spin-history-inborder-shimmer 5s linear infinite;
}

.lucky-spin-history-outer--lite .lucky-spin-history-frame::before {
  animation: none;
  filter: none;
  opacity: 0.55;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.35),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
}

.lucky-spin-history-outer--lite .lucky-spin-history-frame {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 12px rgba(212, 175, 55, 0.22);
}

.lucky-spin-history-list {
  background-color: rgba(28, 20, 16, 0.98);
  background-image:
    radial-gradient(
      ellipse 100% 70% at 18% 25%,
      rgba(251, 191, 36, 0.07) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 78% 55%,
      rgba(245, 158, 11, 0.06) 0%,
      transparent 42%
    ),
    radial-gradient(
      circle at 45% 88%,
      rgba(90, 60, 30, 0.12) 0%,
      transparent 38%
    );
}

.lucky-spin-history-inner-rim {
  box-shadow:
    inset 0 0 18px rgba(252, 211, 77, 0.2),
    inset 0 0 6px rgba(254, 243, 199, 0.35),
    0 0 14px rgba(250, 204, 21, 0.28);
  border: 1px solid rgba(253, 224, 71, 0.35);
}

.lucky-spin-history-outer--lite .lucky-spin-history-inner-rim {
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.25);
  border-color: rgba(180, 140, 50, 0.35);
}

@keyframes lucky-spin-history-border-glow {
  0%,
  100% {
    opacity: 1;
    filter: brightness(1);
  }
  50% {
    opacity: 0.9;
    filter: brightness(1.08);
  }
}

@keyframes lucky-spin-history-inborder-shimmer {
  0% {
    filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.65))
      drop-shadow(0 0 10px rgba(251, 191, 36, 0.4)) hue-rotate(0deg);
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(253, 224, 71, 0.85))
      drop-shadow(0 0 16px rgba(252, 211, 77, 0.55)) hue-rotate(12deg);
  }
  100% {
    filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.65))
      drop-shadow(0 0 10px rgba(251, 191, 36, 0.4)) hue-rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lucky-spin-history-outer::before {
    animation: none;
  }

  .lucky-spin-history-frame::before {
    animation: none;
  }
}
</style>
