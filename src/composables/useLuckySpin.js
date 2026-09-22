import { ref, computed } from "vue";

/**
 * Mock wheel segments — uniform slices for `?debugSpin=1&spinMock=1` QA (logged-in only).
 */
export const LUCKY_SPIN_MOCK_SEGMENTS = [
  { id: "k198", label: "K 198", kind: "trophy" },
  { id: "iphone", label: "iPhone 16 Pro Max", kind: "phone" },
  { id: "k899998", label: "K 899,998", kind: "trophy" },
  { id: "k79998", label: "K 79,998", kind: "trophy" },
  { id: "k398", label: "K 398", kind: "money" },
  { id: "k298", label: "K 298", kind: "money" },
  { id: "k59998", label: "K 59,998", kind: "money" },
  { id: "k4998", label: "K 4,998", kind: "money" },
];

export const NO_PRIZE_SEGMENT_ID = "no_prize";

/** Next local midnight (end of calendar day for `at`) in ms. */
function endOfLocalDayMs(at = Date.now()) {
  const d = new Date(at);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + 1,
    0,
    0,
    0,
    0,
  ).getTime();
}

const SPIN_MS = 4200;
const FULL_ROTATIONS = 5;

function mapPrizeKind(prizeType) {
  const t = (prizeType || "").toLowerCase();
  if (t === "physical") return "trophy";
  if (t === "cash") return "money";
  return "money";
}

function prizeLabel(p) {
  const name = (p.name || "").trim();
  const isCash = (p.prize_type || "").toLowerCase() === "cash";
  if (isCash && p.reward_amount != null && p.reward_amount !== "") {
    const n = Number(p.reward_amount);
    if (!Number.isNaN(n)) {
      const amt = `K ${n.toLocaleString()}`;
      return name ? `${name} ${amt}` : amt;
    }
  }
  return name || "Prize";
}

/** First non-empty image field from API prize resource. */
function pickPrizeImageUrl(p) {
  const candidates = [p.image_url, p.image, p.thumbnail, p.icon];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== "") return String(c).trim();
  }
  return null;
}

/**
 * @param {object[]} prizes
 * @param {object} meta
 * @returns {object[]}
 */
export function buildWheelSegmentsFromApi(prizes, meta) {
  const list = Array.isArray(prizes) ? prizes : [];
  const segments = [];

  for (const p of list) {
    const rate = Number(p.winning_rate) || 0;
    if (rate <= 0) continue;
    const imageUrl = pickPrizeImageUrl(p);
    segments.push({
      id: p.id,
      label: prizeLabel(p),
      kind: mapPrizeKind(p.prize_type),
      winning_rate: rate,
      imageUrl,
      raw: p,
    });
  }

  let noRate = Number(meta?.no_prize_rate);
  if (Number.isNaN(noRate)) {
    const total = Number(meta?.total_winning_rate);
    noRate = Number.isNaN(total) ? 0 : Math.max(0, 100 - total);
  }
  if (noRate > 0) {
    segments.push({
      id: NO_PRIZE_SEGMENT_ID,
      label: "No Prize",
      kind: "none",
      winning_rate: noRate,
      imageUrl: null,
      raw: null,
    });
  }

  const n = segments.length;
  if (n === 0) return [];
  const angleDeg = 360 / n;
  return segments.map((s, i) => ({
    ...s,
    angleDeg,
    cumStartDeg: i * angleDeg,
  }));
}

function buildUniformMockSegments() {
  const list = [...LUCKY_SPIN_MOCK_SEGMENTS];
  const n = list.length;
  const angleDeg = 360 / n;
  return list.map((s, i) => ({
    ...s,
    angleDeg,
    cumStartDeg: i * angleDeg,
    winning_rate: 100 / n,
    imageUrl: null,
    raw: null,
  }));
}

/** Map POST /spin response to wheel segment index. */
export function segmentIndexForSpinRecord(spinRecord, segments) {
  if (!segments?.length) return -1;
  if (spinRecord.spin_wheel_prize_id == null) {
    return segments.findIndex((s) => s.id === NO_PRIZE_SEGMENT_ID);
  }
  const pid = spinRecord.spin_wheel_prize_id;
  return segments.findIndex((s) => s.id === pid);
}

export function useLuckySpin() {
  const segments = ref([]);
  const rotationDeg = ref(0);
  const isSpinning = ref(false);
  const lastWinIndex = ref(null);
  const lastPrize = ref(null);

  /** Last GET /user/spinwheel meta; null before first successful load. */
  const spinWheelMeta = ref(null);
  const wheelApiLoaded = ref(false);
  const wheelLoading = ref(false);

  /** Dev: bypass deposit for uniform mock wheel only */
  const requestUnlocked = ref(false);

  const countdownEndsAt = ref(endOfLocalDayMs());
  const countdown = ref({ h: 0, m: 0, s: 0 });

  const tickCountdown = () => {
    const now = Date.now();
    if (now >= countdownEndsAt.value) {
      countdownEndsAt.value = endOfLocalDayMs(now);
    }
    const ms = Math.max(0, countdownEndsAt.value - now);
    countdown.value = {
      h: Math.floor(ms / 3600000),
      m: Math.floor((ms % 3600000) / 60000),
      s: Math.floor((ms % 60000) / 1000),
    };
  };

  /** Resync to “time until local midnight” (e.g. when opening the modal). */
  const syncCountdownToEndOfToday = () => {
    countdownEndsAt.value = endOfLocalDayMs();
    tickCountdown();
  };

  const requiredDepositAmount = computed(() => {
    const m = spinWheelMeta.value;
    if (!m) return 0;
    const v = Number(m.required_daily_deposit_amount);
    return Number.isNaN(v) ? 0 : v;
  });

  const todayDepositAmount = computed(() => {
    const m = spinWheelMeta.value;
    if (!m) return 0;
    const v = Number(m.today_confirmed_deposit_amount);
    return Number.isNaN(v) ? 0 : v;
  });

  /** Daily total deposit target across all spin chances. */
  const totalDailyDepositTarget = computed(() => {
    const m = spinWheelMeta.value;
    if (!m) return 0;
    const req = Number(m.required_daily_deposit_amount);
    const chances = Number(m.daily_spin_chance_count ?? m.daily_limit);
    const safeReq = Number.isNaN(req) ? 0 : Math.max(0, req);
    const safeChances = Number.isNaN(chances) ? 0 : Math.max(0, chances);
    return safeReq * safeChances;
  });

  /** Deposit progress toward today’s required amount (0–100). */
  const missionProgressPercent = computed(() => {
    const m = spinWheelMeta.value;
    if (!m) return 0;
    const earned = Number(m.earned_spins_today);
    const total = Number(m.daily_spin_chance_count ?? m.daily_limit);
    const safeEarned = Number.isNaN(earned) ? 0 : Math.max(0, earned);
    const safeTotal = Number.isNaN(total) ? 0 : Math.max(0, total);
    if (safeTotal <= 0) return 0;
    return Math.min(100, (safeEarned / safeTotal) * 100);
  });

  /** Progress toward full-day deposit target (0–100). */
  const depositTaskProgressPercent = computed(() => {
    const total = totalDailyDepositTarget.value;
    if (total <= 0) return 0;
    return Math.min(100, (todayDepositAmount.value / total) * 100);
  });

  const canSpinToday = computed(
    () => !!spinWheelMeta.value?.can_spin_today,
  );

  const remainingSpinsToday = computed(() => {
    const m = spinWheelMeta.value;
    if (!m) return 0;
    const n = Number(m.remaining_spins_today);
    return Number.isNaN(n) ? 0 : n;
  });

  const applyWheelFromApi = (prizeList, meta) => {
    spinWheelMeta.value = meta && typeof meta === "object" ? { ...meta } : {};
    segments.value = buildWheelSegmentsFromApi(prizeList, spinWheelMeta.value);
    wheelApiLoaded.value = true;
  };

  const loadUniformMockSegments = () => {
    spinWheelMeta.value = null;
    wheelApiLoaded.value = false;
    segments.value = buildUniformMockSegments();
  };

  const clearWheelApiState = () => {
    spinWheelMeta.value = null;
    wheelApiLoaded.value = false;
    segments.value = [];
  };

  /**
   * Land pointer on segment index (equal display slices; server picks index).
   * Pointer at top (-90°); segment center: -90 + cumStart + angle/2.
   */
  const spinToSegmentIndex = (winIndex) => {
    const segs = segments.value;
    if (!segs.length) {
      return Promise.resolve(null);
    }
    const i = Math.min(Math.max(0, winIndex), segs.length - 1);
    const seg = segs[i];
    const centerDeg = -90 + seg.cumStartDeg + seg.angleDeg / 2;
    const rem = ((rotationDeg.value % 360) + 360) % 360;
    const targetRem = ((-90 - centerDeg) % 360 + 360) % 360;
    let diff = targetRem - rem;
    if (diff < 0) diff += 360;
    const delta = FULL_ROTATIONS * 360 + diff;
    const next = rotationDeg.value + delta;

    return new Promise((resolve) => {
      isSpinning.value = true;
      lastWinIndex.value = null;
      lastPrize.value = null;
      rotationDeg.value = next;

      window.setTimeout(() => {
        isSpinning.value = false;
        lastWinIndex.value = i;
        lastPrize.value = segs[i] ?? null;
        resolve(lastPrize.value);
      }, SPIN_MS);
    });
  };

  /** @deprecated use spinToSegmentIndex — kept for mock mode */
  const spinToIndex = (winIndex) => spinToSegmentIndex(winIndex);

  const markRequestDone = () => {
    requestUnlocked.value = true;
  };

  return {
    segments,
    rotationDeg,
    isSpinning,
    lastWinIndex,
    lastPrize,
    spinWheelMeta,
    wheelApiLoaded,
    wheelLoading,
    requestUnlocked,
    requiredDepositAmount,
    todayDepositAmount,
    missionProgressPercent,
    depositTaskProgressPercent,
    canSpinToday,
    remainingSpinsToday,
    applyWheelFromApi,
    loadUniformMockSegments,
    clearWheelApiState,
    countdownEndsAt,
    countdown,
    tickCountdown,
    syncCountdownToEndOfToday,
    spinToSegmentIndex,
    spinToIndex,
    markRequestDone,
    spinDurationMs: SPIN_MS,
    /** Per-spin deposit threshold (for mission copy text) */
    ticketDepositThresholdKyat: requiredDepositAmount,
    /** Full-day total target shown as progress max */
    ticketDepositTotalTargetKyat: totalDailyDepositTarget,
    /** Shown in inner bar — today confirmed deposit amount */
    depositAccumulatedKyat: computed(() => {
      const total = totalDailyDepositTarget.value;
      if (total <= 0) return 0;
      return Math.max(0, Math.min(total, todayDepositAmount.value));
    }),
  };
}
