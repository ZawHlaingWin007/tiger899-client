<script setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { showSuccessToast, showLoadingToast, closeToast, showDialog } from "vant";
import { getApiErrorMessage } from "../composables/useApiError";
import { useTranslation } from "../composables/useTranslation";
import { getMockPromotionById } from "../data/mockPromotions";

const route = useRoute();
const router = useRouter();
const store = useStore();
const { t, language } = useTranslation();

const promotion = ref(null);
const loading = ref(true);
const claiming = ref(false);
const id = route.params.id;

const alreadyClaimedMessage = () =>
  t(
    "You have already claimed this promotion.",
    "ဤပရိုမိုးရှင်းကို ရယူပြီးသားဖြစ်ပါသည်။",
    "您已经领取过此优惠。",
    "คุณได้รับโปรโมชั่นนี้แล้ว"
  );

const translateClaimError = (error) => {
  const raw = getApiErrorMessage(error) || error?.message || "";
  if (
    raw === "You have already claimed this promotion." ||
    raw === "Already claimed"
  ) {
    return alreadyClaimedMessage();
  }
  const claimableMatch = raw.match(
    /^The minimum deposit amount for this promotion is (.+)\.$/
  );
  if (claimableMatch) {
    return t(
      `The minimum deposit amount for this promotion is ${claimableMatch[1]}.`,
      `ဤပရိုမိုးရှင်းအတွက် အနည်းဆုံး ငွေသွင်းပမာဏမှာ ${claimableMatch[1]} ဖြစ်ပါသည်။`,
      `此优惠的最低存款金额为 ${claimableMatch[1]}。`,
      `ยอดฝากขั้นต่ำสำหรับโปรโมชั่นนี้คือ ${claimableMatch[1]}`
    );
  }
  return raw || t("Claim failed", "ရယူ၍မရပါ", "领取失败", "รับไม่สำเร็จ");
};

const isLoggedIn = computed(() => !!localStorage.getItem("token"));
const isClaimed = computed(() => promotion.value?.claimed === true);
const isClaimOnce = computed(() => !!promotion.value?.claim_once_per_user);
const isNoDepositPromotion = computed(() => {
  const p = promotion.value;
  if (!p) return false;
  const rd = p.requires_deposit;
  const noDepositFlag =
    rd === false ||
    rd === 0 ||
    String(rd).toLowerCase() === "false" ||
    String(rd) === "0";
  const hasFixedBonus = p.fixed_bonus_amount != null && p.fixed_bonus_amount !== "";
  return noDepositFlag && hasFixedBonus;
});

const fetchPromotion = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.get(`/promotions/${id}`, { headers });
    const resolved = data.data ?? (data?.id ? data : null);
    promotion.value = resolved || getMockPromotionById(id);
  } catch (error) {
    console.error(error);
    if (!silent) {
      promotion.value = getMockPromotionById(id);
    }
  } finally {
    loading.value = false;
  }
};

// API may return content in content, description, or body
const promotionBody = computed(() => {
  const p = promotion.value;
  if (!p) return "";
  return p.content ?? p.description ?? p.body ?? "";
});

const promotionTitle = computed(() => {
  const p = promotion.value;
  return p ? (p.title ?? p.name ?? "") : "";
});

const promotionImage = computed(() => {
  const p = promotion.value;
  return p ? (p.image ?? p.image_url ?? p.thumbnail ?? "") : "";
});

const validPeriod = computed(() => {
  const p = promotion.value;
  if (!p) return null;
  const start = p.start_date ?? p.start_at ?? p.valid_from;
  const end = p.end_date ?? p.end_at ?? p.valid_to;
  if (!start && !end) return null;
  return { start, end };
});

const termsText = computed(() => {
  const p = promotion.value;
  if (!p) return "";
  return p.terms ?? p.terms_and_conditions ?? p.terms_and_conditions_text ?? "";
});

const yesNo = (val) => (val ? t("Yes", "ဟုတ်ကဲ့", "是", "ใช่") : t("No", "မဟုတ်ပါ", "否", "ไม่"));

// User-facing info: matches API fields (total_quantity, available_quantity, daily_usage_limit, etc.)
const infoItems = computed(() => {
  const p = promotion.value;
  void language.value;
  if (!p) return [];
  const items = [];

  const totalQty = p.total_quantity ?? p.quantity ?? p.limit ?? p.total_limit ?? p.max_claims;
  if (totalQty != null && totalQty !== "") {
    items.push({ key: "total_quantity", label: t("Total quantity", "စုစုပေါင်းအရေအတွက်", "总数量", "จำนวนทั้งหมด"), value: String(totalQty) });
  }

  const availableQty = p.available_quantity ?? p.remaining ?? p.remaining_quantity ?? p.remaining_count ?? p.left;
  if (availableQty != null && availableQty !== "") {
    items.push({ key: "available_quantity", label: t("Available quantity", "ရရှိနိုင်သည့်အရေအတွက်", "可用数量", "จำนวนที่ใช้ได้"), value: String(availableQty) });
  }

  const dailyLimit = p.daily_usage_limit ?? p.daily_limit ?? p.daily_max ?? p.per_day_limit ?? p.max_per_day;
  if (dailyLimit != null && dailyLimit !== "") {
    items.push({ key: "daily_limit", label: t("Daily limit", "နေ့စဉ်ကန့်သတ်ချက်", "每日限额", "จำกัดต่อวัน"), value: String(dailyLimit) });
  }

  if (p.claim_once_per_user) {
    items.push({
      key: "claim_once",
      label: t("Claim once per user", "တစ်ဦးလျှင် တစ်ကြိမ်သာ", "每人限领一次", "รับได้คนละครั้งเดียว"),
      value: t("Yes", "ဟုတ်ကဲ့", "是", "ใช่"),
    });
  }

  const claimableAmount = Number(p.claimable_amount);
  if (Number.isFinite(claimableAmount) && claimableAmount > 0) {
    items.push({
      key: "claimable_amount",
      label: t("Claimable amount", "ရယူရန် လိုအပ်သော ပမာဏ", "最低存款", "ยอดฝากขั้นต่ำ"),
      value: claimableAmount.toLocaleString(),
    });
  }

  const bonusPct = p.promotion_percent ?? p.bonus_percentage ?? p.bonus_percent ?? p.percentage;
  if (bonusPct != null && bonusPct !== "") {
    const v = String(bonusPct).match(/%$/) ? String(bonusPct) : String(bonusPct) + "%";
    items.push({ key: "bonus_pct", label: t("Bonus %", "ဘောနပ်စ် %", "奖金%", "โบนัส %"), value: v });
  }

  const fixedBonus = p.fixed_bonus_amount ?? p.bonus_amount ?? p.bonus ?? p.amount ?? p.bonus_value;
  if (fixedBonus != null && fixedBonus !== "") {
    items.push({ key: "fixed_bonus", label: t("Fixed bonus", "သတ်မှတ်ဘောနပ်စ်", "固定奖金", "โบนัสคงที่"), value: String(fixedBonus) });
  }

  const minTurnOver = p.minimum_turn_over_amount ?? p.min_turn_over ?? p.turn_over_min;
  if (minTurnOver != null && minTurnOver !== "") {
    items.push({ key: "min_turn_over", label: t("Min. turn over", "အနည်းဆုံးလည်ပတ်ငွေ", "最低流水", "เทิร์นโอเวอร์ขั้นต่ำ"), value: String(minTurnOver) });
  }

  const minWithdrawTimes = p.minimum_withdraw_times ?? p.min_withdraw_times;
  if (minWithdrawTimes != null && minWithdrawTimes !== "") {
    items.push({ key: "min_withdraw_times", label: t("Min. withdraw times", "အနည်းဆုံးထုတ်ယူမှုအကြိမ်", "最低提款次数", "จำนวนถอนขั้นต่ำ"), value: String(minWithdrawTimes) });
  }

  const requiresDeposit = p.requires_deposit;
  if (requiresDeposit !== undefined && requiresDeposit !== null) {
    items.push({ key: "requires_deposit", label: t("Requires deposit", "ငွေသွင်းရမည်", "需要存款", "ต้องฝากเงิน"), value: yesNo(requiresDeposit) });
  }

  const dateType = p.date_type;
  if (dateType != null && dateType !== "") {
    items.push({ key: "date_type", label: t("Date type", "ရက်အမျိုးအစား", "日期类型", "ประเภทวันที่"), value: String(dateType) });
  }

  const active = p.active;
  if (active !== undefined && active !== null) {
    items.push({ key: "active", label: t("Active", "အသက်ဝင်သည်", "有效", "ใช้งาน"), value: yesNo(active) });
  }

  const claimed = p.claimed;
  if (claimed !== undefined && claimed !== null) {
    items.push({ key: "claimed", label: t("Claimed", "ရယူပြီး", "已领取", "รับแล้ว"), value: yesNo(claimed) });
  }

  const used = p.used;
  if (used !== undefined && used !== null) {
    items.push({ key: "used", label: t("Used", "အသုံးပြုပြီး", "已使用", "ใช้แล้ว"), value: yesNo(used) });
  }

  const turnOverType = p.turn_over_type;
  if (turnOverType != null && turnOverType !== "") {
    items.push({ key: "turn_over_type", label: t("Turn over type", "လည်ပတ်အမျိုးအစား", "流水类型", "ประเภทเทิร์นโอเวอร์"), value: String(turnOverType) });
  }

  const category = p.category_name ?? p.promotion_category_id ?? p.category?.name ?? p.category;
  if (category != null && category !== "") {
    const catVal = typeof category === "string" ? category : String(category);
    items.push({ key: "category", label: t("Category", "အမျိုးအစား", "分类", "หมวดหมู่"), value: catVal });
  }

  return items;
});

const goBack = () => {
  router.back();
};

async function claimPromotion() {
  const p = promotion.value;
  if (!p?.id || claiming.value || isClaimed.value) return;

  if (!isLoggedIn.value) {
    store.commit("SET_LOGIN_MODAL", true);
    return;
  }

  claiming.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });

  try {
    await axios.post(
      `/user/promotions/${p.id}/claim`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    closeToast();
    showSuccessToast({
      message: t("Promotion claimed successfully", "ပရိုမိုးရှင်း ရယူပြီးပါပြီ", "优惠领取成功", "รับโปรโมชั่นสำเร็จ"),
      position: "top",
    });
    promotion.value = { ...p, claimed: true };
    await store.dispatch("fetchUser");
    await fetchPromotion(true);
  } catch (error) {
    closeToast();
    await showDialog({
      title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
      message: translateClaimError(error),
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      confirmButtonColor: "#dc2626",
    });
    if (
      error?.response?.status === 409 &&
      (error?.response?.data?.message === "You have already claimed this promotion." ||
        error?.response?.data?.message === "Already claimed")
    ) {
      promotion.value = { ...p, claimed: true };
    }
  } finally {
    claiming.value = false;
  }
}

onMounted(() => {
  fetchPromotion();
});
</script>


<template>
  <div class="px-3 py-4 md:py-6 text-white min-h-screen">
    <div class="max-w-5xl mx-auto space-y-3">

      <!-- Back Button -->
      <button
        class="inline-flex items-center gap-1.5 text-white hover:text-gray-300 transition-colors -ml-0.5"
        @click="goBack"
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
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>{{ t("Back", "နောက်ပြန်", "返回", "กลับ") }}</span>
      </button>

      <!-- Loading -->
      <div
        v-if="loading"
        class="text-center py-12"
      >
        {{ t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...") }}
      </div>

      <!-- Promotion Content -->
      <div
        v-else-if="promotion"
        class="rounded-2xl overflow-hidden"
      >
        <!-- 1. Banner first (full width at top) -->
        <div class="relative w-full aspect-[2/1] md:aspect-[21/9] bg-black/30 overflow-hidden">
          <img
            v-if="promotionImage"
            :src="promotionImage"
            :alt="promotionTitle"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center text-white/40 text-sm"
          >
            {{ t("No image", "ပုံမရှိပါ", "无图片", "ไม่มีรูปภาพ") }}
          </div>
        </div>

        <div class="p-3 md:p-4 space-y-4">

          <!-- Title -->
          <div>
            <p class="text-xs uppercase tracking-wider text-white/50 mb-1 font-medium">{{ t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น") }}</p>
            <h1 class="text-xl md:text-2xl font-bold font-['Pyidaungsu','Padauk',sans-serif] leading-snug text-white">
              {{ promotionTitle }}
            </h1>
          </div>

          <div
            v-if="isClaimed && isClaimOnce"
            class="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ alreadyClaimedMessage() }}
          </div>

          <!-- 2. Description second -->
          <div
            v-if="promotionBody"
            class="prose prose-invert max-w-none font-['Pyidaungsu','Padauk',sans-serif] text-white/90 text-[15px] leading-relaxed prose-p:my-3 prose-headings:my-3 prose-headings:text-white prose-img:my-3 prose-img:rounded-lg"
            v-html="promotionBody"
          />

          <!-- 3. Third: valid period, mini boxes, terms -->

          <!-- Valid period -->
          <div
            v-if="validPeriod && (validPeriod.start || validPeriod.end)"
            class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            <span v-if="validPeriod.start" class="flex items-center gap-1.5">
              <span class="text-white/50">{{ t("From", "စတင်", "从", "ตั้งแต่") }}</span>
              {{ validPeriod.start }}
            </span>
            <span v-if="validPeriod.end" class="flex items-center gap-1.5">
              <span class="text-white/50">{{ t("To", "အဆုံး", "至", "ถึง") }}</span>
              {{ validPeriod.end }}
            </span>
          </div>

          <!-- Mini boxes: grid of cards -->
          <div
            v-if="infoItems.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
          >
            <div
              v-for="item in infoItems"
              :key="item.key"
              class="rounded-xl bg-white/5 border border-white/10 p-2.5"
            >
              <p class="text-xs text-white/50 font-medium mb-0.5">{{ item.label }}</p>
              <p class="text-sm font-semibold text-white font-['Pyidaungsu','Padauk',sans-serif]">
                {{ item.value }}
              </p>
            </div>
          </div>

          <button
            v-if="isLoggedIn && isNoDepositPromotion"
            type="button"
            class="w-full py-3 rounded-xl font-semibold text-base transition-all font-['Pyidaungsu','Padauk',sans-serif] disabled:opacity-50 touch-manipulation border-2"
            :class="isClaimed
              ? 'border-amber-400/50 bg-amber-500/10 text-amber-200 cursor-not-allowed'
              : 'border-[#1986E1] bg-[#1986E1] text-white hover:bg-[#1676c7] active:scale-[0.98]'"
            :disabled="claiming || isClaimed"
            @click="claimPromotion"
          >
            <span v-if="claiming">
              {{ t("Loading...", "လုပ်ဆောင်နေသည်...", "加载中...", "กำลังโหลด...") }}
            </span>
            <span v-else-if="isClaimed">
              {{ alreadyClaimedMessage() }}
            </span>
            <span v-else>
              {{ t("Claim promotion", "ပရိုမိုးရှင်း ရယူမည်", "领取优惠", "รับโปรโมชั่น") }}
              <template v-if="promotion.fixed_bonus_amount">
                ({{ promotion.fixed_bonus_amount }})
              </template>
            </span>
          </button>

          <!-- Terms -->
          <div
            v-if="termsText"
            class="rounded-xl bg-white/5 border border-white/10 p-4"
          >
            <h3 class="text-sm font-semibold text-white/80 mb-2 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t("Terms & Conditions", "စည်းမျဉ်းများ", "条款与条件", "ข้อกำหนดและเงื่อนไข") }}
            </h3>
            <p class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif] leading-relaxed whitespace-pre-wrap">
              {{ termsText }}
            </p>
          </div>

        </div>
      </div>

      <!-- Not Found -->
      <div
        v-else
        class="text-center py-12"
      >
        {{ t("Promotion not found.", "ပရိုမိုးရှင်း မတွေ့ပါ။", "未找到优惠。", "ไม่พบโปรโมชั่น") }}
      </div>

    </div>
  </div>
</template>