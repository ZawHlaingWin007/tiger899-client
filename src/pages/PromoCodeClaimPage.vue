<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import {
  showDialog,
  showSuccessToast,
  showLoadingToast,
  closeToast,
  Popup as VanPopup,
} from "vant";
import { useTranslation } from "../composables/useTranslation";
import { getApiErrorMessage } from "../composables/useApiError";

const router = useRouter();
const store = useStore();
const { t } = useTranslation();

const promoCodeInput = ref("");
const checking = ref(false);
const claiming = ref(false);

const claimedPromoCodes = ref([]);
const loadingClaims = ref(false);

const showDetailModal = ref(false);
const selectedPromoCode = ref(null);
const detailMode = ref("view"); // view | claim

const activePromoCodeId = computed(() => {
  const active = claimedPromoCodes.value.find((p) => p.active);
  return active?.id ?? null;
});

function isActivePromoCode(item) {
  return item?.id === activePromoCodeId.value;
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const INVALID_CODE_MESSAGE = () =>
  t(
    "Promo code is not correct.",
    "Promo code မမှန်ပါ။",
    "优惠码不正确。",
    "รหัสโปรโมชั่นไม่ถูกต้อง"
  );

function translateKnownClaimMessage(message) {
  const normalized = String(message || "").trim();

  if (!normalized) {
    return t(
      "Something went wrong. Please try again.",
      "တစ်ခုခုမှားယွင်းနေပါသည်။ ထပ်စမ်းပါ။",
      "发生错误，请重试。",
      "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
    );
  }

  const exactMessages = {
    "Promo code is not correct.": INVALID_CODE_MESSAGE(),
    "This promo code is not available at the moment.": t(
      "This promo code is not available at the moment.",
      "ဒီ promo code ကို ယခုအချိန်တွင် မရနိုင်ပါ။",
      "该优惠码目前不可领取。",
      "รหัสโปรโมชั่นนี้ยังไม่พร้อมใช้งานในขณะนี้"
    ),
    "Already claimed": t(
      "Already claimed.",
      "ရယူပြီးသားဖြစ်ပါသည်။",
      "已领取。",
      "รับไปแล้ว"
    ),
    "Daily claim limit reached for this promo code.": t(
      "Daily claim limit reached for this promo code.",
      "ဒီ promo code အတွက် ယနေ့ရယူခွင့်ကန့်သတ်ချက် ပြည့်သွားပါပြီ။",
      "该优惠码今日领取次数已达上限。",
      "ถึงจำนวนการรับรหัสนี้สูงสุดต่อวันแล้ว"
    ),
    "Daily claim limit reached for this promotion.": t(
      "Daily claim limit reached for this promotion.",
      "ဒီ promotion အတွက် ယနေ့ရယူခွင့်ကန့်သတ်ချက် ပြည့်သွားပါပြီ။",
      "该优惠今日领取次数已达上限。",
      "ถึงจำนวนการรับโปรโมชั่นนี้สูงสุดต่อวันแล้ว"
    ),
    "You have a pending deposit. Please wait for approval before claiming a promo code.": t(
      "You have a pending deposit. Please wait for approval before claiming a promo code.",
      "သင့်မှာ အတည်ပြုရန်စောင့်နေသော ငွေသွင်းတစ်ခုရှိပါသည်။ promo code မရယူမီ အတည်ပြုချက်ကို စောင့်ပါ။",
      "您有一笔待审核的存款，请等待审核后再领取优惠码。",
      "คุณมียอดฝากที่กำลังรออนุมัติ กรุณารอให้อนุมัติก่อนรับรหัสโปรโมชั่น"
    ),
    "You have a pending deposit. Please wait for approval before claiming a promotion.": t(
      "You have a pending deposit. Please wait for approval before claiming a promotion.",
      "သင့်မှာ အတည်ပြုရန်စောင့်နေသော ငွေသွင်းတစ်ခုရှိပါသည်။ promotion မရယူမီ အတည်ပြုချက်ကို စောင့်ပါ။",
      "您有一笔待审核的存款，请等待审核后再领取优惠。",
      "คุณมียอดฝากที่กำลังรออนุมัติ กรุณารอให้อนุมัติก่อนรับโปรโมชั่น"
    ),
  };

  if (exactMessages[normalized]) {
    return exactMessages[normalized];
  }

  const depositRequirementMatch = normalized.match(
    /^To claim this promo code, you need at least ([\d,.]+) in confirmed deposits within the last (\d+) day\(s\)\. Your confirmed deposits in that period total ([\d,.]+), so you need ([\d,.]+) more\.$/
  );

  if (depositRequirementMatch) {
    const [, required, days, confirmed, shortfall] = depositRequirementMatch;
    return t(
      `To claim this promo code, you need at least ${required} in confirmed deposits within the last ${days} day(s). Your confirmed deposits in that period total ${confirmed}, so you need ${shortfall} more.`,
      `ဒီ promo code ကို ရယူရန် နောက်ဆုံး ${days} ရက်အတွင်း အတည်ပြုပြီး ငွေသွင်းစုစုပေါင်း ${required} အနည်းဆုံး လိုအပ်ပါသည်။ လက်ရှိ အတည်ပြုထားသော ငွေသွင်းစုစုပေါင်းမှာ ${confirmed} ဖြစ်ပြီး ${shortfall} ထပ်လိုအပ်နေပါသည်။`,
      `要领取此优惠码，您在过去 ${days} 天内的已确认存款至少需要达到 ${required}。您当前该时段内的已确认存款总额为 ${confirmed}，还差 ${shortfall}。`,
      `หากต้องการรับรหัสนี้ คุณต้องมียอดฝากที่ยืนยันแล้วอย่างน้อย ${required} ภายใน ${days} วันที่ผ่านมา ขณะนี้ยอดฝากที่ยืนยันแล้วของคุณในช่วงเวลาดังกล่าวคือ ${confirmed} ดังนั้นยังขาดอีก ${shortfall}`
    );
  }

  return normalized;
}

function getClaimErrorMessage(error) {
  const apiMessage = getApiErrorMessage(error);
  return translateKnownClaimMessage(apiMessage);
}

async function showErrorDialog(message) {
  await showDialog({
    title: t("Error", "အမှား", "错误", "ข้อผิดพลาด"),
    message,
    confirmButtonText: t("OK", "အိုကေ", "确定", "ตกลง"),
    theme: "round-button",
  });
}

async function fetchClaimedPromoCodes() {
  loadingClaims.value = true;
  try {
    const res = await axios.get("/user/promo-codes", { headers: authHeaders() });
    const list = res?.data?.data ?? res?.data ?? [];
    claimedPromoCodes.value = Array.isArray(list) ? list : [];
  } catch (error) {
    claimedPromoCodes.value = [];
  } finally {
    loadingClaims.value = false;
  }
}

async function checkPromoCode() {
  const code = (promoCodeInput.value || "").trim().toUpperCase();
  if (!code) {
    await showErrorDialog(
      t(
        "Please enter promo code.",
        "Promo code ထည့်ပါ။",
        "请输入优惠码。",
        "กรุณากรอกรหัสโปรโมชั่น"
      )
    );
    return;
  }

  checking.value = true;
  showLoadingToast({
    message: t("Checking...", "စစ်ဆေးနေသည်...", "检查中...", "กำลังตรวจสอบ..."),
    duration: 0,
    forbidClick: true,
  });

  try {
    const res = await axios.post(
      "/user/promo-codes/check",
      { promo_code: code },
      { headers: authHeaders() }
    );

    closeToast();
    selectedPromoCode.value = res?.data?.data ?? null;
    detailMode.value = "claim";
    showDetailModal.value = true;
  } catch (error) {
    closeToast();
    await showErrorDialog(getClaimErrorMessage(error));
  } finally {
    checking.value = false;
  }
}

function openClaimedDetail(item) {
  selectedPromoCode.value = item;
  detailMode.value = "view";
  showDetailModal.value = true;
}

async function claimPromoCode() {
  if (!selectedPromoCode.value?.id || claiming.value) return;

  claiming.value = true;
  showLoadingToast({
    message: t("Claiming...", "ရယူနေသည်...", "领取中...", "กำลังรับ..."),
    duration: 0,
    forbidClick: true,
  });

  try {
    await axios.post(
      `/user/promo-codes/${selectedPromoCode.value.id}/claim`,
      {},
      { headers: authHeaders() }
    );

    closeToast();
    showSuccessToast({
      message: t(
        "Promo code claimed successfully.",
        "Promo code ရယူမှု အောင်မြင်ပါသည်။",
        "优惠码领取成功。",
        "รับรหัสโปรโมชั่นสำเร็จ"
      ),
      position: "top",
    });

    showDetailModal.value = false;
    promoCodeInput.value = "";
    await Promise.all([fetchClaimedPromoCodes(), store.dispatch("fetchUser")]);
  } catch (error) {
    closeToast();
    await showErrorDialog(getClaimErrorMessage(error));
  } finally {
    claiming.value = false;
  }
}

function formatDateRange(code) {
  if (!code) return "-";
  if (code.date_type === "every") {
    const day = Array.isArray(code.date_values?.days) ? code.date_values.days[0] : "";
    return day ? `Every ${day}` : "Every";
  }
  if (code.date_type !== "custom") return code.date_type || "-";

  const from = code.date_values?.from
    ? new Date(code.date_values.from).toLocaleDateString("en-GB")
    : "-";
  const to = code.date_values?.to
    ? new Date(code.date_values.to).toLocaleDateString("en-GB")
    : "-";
  return `${from} - ${to}`;
}

function goBack() {
  router.back();
}

onMounted(async () => {
  await fetchClaimedPromoCodes();
});
</script>

<template>
  <div class="min-h-screen bg-[#F2F2F2] pb-24 pt-16 md:pt-20">
    <div class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-3 flex items-center justify-between">
      <button
        @click="goBack"
        class="text-white p-1 rounded-lg hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="text-white text-xl font-medium font-['Pyidaungsu','Padauk',sans-serif]">
        {{ t("Promo Code", "Promo Code", "优惠码", "รหัสโปรโมชั่น") }}
      </h1>
      <div class="w-6"></div>
    </div>

    <div class="w-full max-w-3xl mx-auto px-4 space-y-4">
      <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <p class="text-base font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Enter promo code", "Promo code ထည့်ပါ", "输入优惠码", "กรอกรหัสโปรโมชั่น") }}
        </p>
        <div class="flex gap-2">
          <input
            v-model="promoCodeInput"
            type="text"
            maxlength="13"
            class="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-black uppercase placeholder-gray-500"
            style="color: #172240"
            :placeholder="t('13-character code', '၁၃ လုံး code', '13位代码', 'โค้ด 13 ตัว')"
          />
          <button
            type="button"
            @click="checkPromoCode"
            :disabled="checking"
            class="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
          >
            {{ t("Check", "စစ်ဆေး", "检查", "ตรวจสอบ") }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-base font-semibold text-gray-900 font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Claimed promo codes", "ရယူထားသော promo code များ", "已领取优惠码", "รหัสที่รับแล้ว") }}
          </p>
          <span class="text-xs text-gray-500">{{ claimedPromoCodes.length }}</span>
        </div>

        <div
          v-if="loadingClaims"
          class="text-sm text-gray-500"
        >
          {{ t("Loading...", "လုပ်ဆောင်နေသည်...", "加载中...", "กำลังโหลด...") }}
        </div>

        <div
          v-else-if="claimedPromoCodes.length === 0"
          class="text-sm text-gray-500 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("No claimed promo code yet.", "Promo code မရယူရသေးပါ။", "暂无已领取优惠码。", "ยังไม่มีรหัสที่รับแล้ว") }}
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <button
            v-for="item in claimedPromoCodes"
            :key="`${item.id}-${item.last_claimed_at || item.claimed_at || ''}`"
            type="button"
            @click="openClaimedDetail(item)"
            class="w-full text-left border rounded-xl px-3 py-3 transition shadow-sm"
            :class="isActivePromoCode(item)
              ? 'border-red-500 bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 ring-1 ring-red-300'
              : 'border-gray-200 bg-gray-50 opacity-80 hover:opacity-100'"
          >
            <div class="flex items-center justify-between">
              <span
                class="font-semibold tracking-wide"
                :class="isActivePromoCode(item) ? 'text-red-700' : 'text-gray-700'"
              >{{ item.promo_code }}</span>
              <div class="flex items-center gap-2">
                <span
                  v-if="isActivePromoCode(item)"
                  class="text-[11px] font-bold text-white bg-red-600 px-2 py-1 rounded-full"
                >
                  {{ t("Active", "အသက်ဝင်", "生效中", "ใช้งานอยู่") }}
                </span>
                <span
                  v-else
                  class="text-[11px] font-semibold text-gray-600 bg-gray-200 px-2 py-1 rounded-full"
                >
                  {{ t("Used", "အသုံးပြုပြီး", "已使用", "ใช้งานแล้ว") }}
                </span>
              </div>
            </div>
            <p
              class="text-sm mt-1"
              :class="isActivePromoCode(item) ? 'text-gray-800' : 'text-gray-500'"
            >{{ item.name }}</p>
            <p
              class="text-xs mt-1"
              :class="isActivePromoCode(item) ? 'text-gray-700' : 'text-gray-500'"
            >
              {{ t("Claimed times", "ရယူထားသော အကြိမ်", "领取次数", "จำนวนครั้งที่รับ") }}:
              <span class="font-semibold">{{ Number(item.claim_count || 0) }}</span>
            </p>
            <p
              class="text-xs mt-1"
              :class="isActivePromoCode(item) ? 'text-red-600' : 'text-gray-400'"
            >
              {{ isActivePromoCode(item)
                ? t("This promo code is currently active.", "ဤ promo code သည် လက်ရှိအသက်ဝင်နေသည်။", "该优惠码当前生效中。",
                  "รหัสนี้กำลังใช้งานอยู่")
                : t("Already claimed and not active now.", "ရယူထားပြီးပါပြီ။", "已领取但当前未生效。",
              "รับแล้วแต่ไม่ใช้งานอยู่ตอนนี้")
              }}
            </p>
          </button>
        </div>
      </div>
    </div>

    <VanPopup
      v-model:show="showDetailModal"
      position="bottom"
      round
      closeable
      close-on-click-overlay
      :style="{ maxHeight: '85vh' }"
      class="font-['Pyidaungsu','Padauk',sans-serif]"
    >
      <div
        v-if="selectedPromoCode"
        class="p-4 pb-8 bg-white text-gray-900 overflow-y-auto"
        style="max-height: 85vh;"
      >
        <h3 class="text-xl font-bold mb-2">{{ selectedPromoCode.name }}</h3>
        <p class="text-sm text-gray-700 mb-3">{{ selectedPromoCode.promo_code }}</p>

        <div
          v-if="selectedPromoCode.description"
          class="text-sm text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none"
          v-html="selectedPromoCode.description"
        />

        <div class="border-t pt-4 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Amount', 'ပမာဏ', '金额', 'จำนวนเงิน')
              }}</span><span class="font-medium">{{ Number(selectedPromoCode.promotion_amount || 0).toLocaleString()
              }}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Valid', 'သက်တမ်း', '有效期', 'ช่วงใช้งาน')
              }}</span><span class="font-medium">{{ formatDateRange(selectedPromoCode) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Min turnover', 'အနည်းဆုံးကစားအား', '最低流水',
              'เทิร์นโอเวอร์ขั้นต่ำ') }}</span><span class="font-medium">{{ selectedPromoCode.turn_over_type === 'times'
                ? `${selectedPromoCode.turn_over_times || '-'}x` : (selectedPromoCode.minimum_turn_over_amount ?? '-')
              }}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Min withdraw times', 'အနည်းဆုံးထုတ်ကြိမ်',
            '最低提现次数', 'จำนวนถอนขั้นต่ำ') }}</span><span class="font-medium">{{
                selectedPromoCode.minimum_withdraw_times ?? '-' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Check deposit days', 'သွင်းငွေစစ်ဆေးရက်',
            '存款检查天数', 'ตรวจสอบยอดฝาก(วัน)') }}</span><span class="font-medium">{{ selectedPromoCode.check_deposit_days
              ?? '-' }}</span></div>
          <div class="flex justify-between"><span class="text-gray-600">{{ t('Min total deposit',
            'အနည်းဆုံးစုစုပေါင်းသွင်းငွေ', '最低总存款', 'ยอดฝากรวมขั้นต่ำ') }}</span><span class="font-medium">{{
                selectedPromoCode.min_total_deposit ?? '-' }}</span></div>
          <div
            class="flex flex-col gap-1"
            v-if="selectedPromoCode.allowed_providers?.length"
          >
            <span class="text-gray-600">{{ t('Allowed providers', 'ခွင့်ပြု provider များ', '允许平台',
              'ผู้ให้บริการที่อนุญาต') }}</span>
            <span class="font-medium">{{ selectedPromoCode.allowed_providers.join(', ') }}</span>
          </div>
          <div
            class="flex flex-col gap-1"
            v-if="selectedPromoCode.allowed_game_types?.length"
          >
            <span class="text-gray-600">{{ t('Allowed game types', 'ခွင့်ပြု game type များ', '允许游戏类型',
              'ประเภทเกมที่อนุญาต') }}</span>
            <span class="font-medium">{{ selectedPromoCode.allowed_game_types.join(', ') }}</span>
          </div>
        </div>

        <button
          v-if="detailMode === 'claim'"
          type="button"
          class="w-full mt-6 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
          :disabled="claiming"
          @click="claimPromoCode"
        >
          {{ claiming
            ? t('Claiming...', 'ရယူနေသည်...', '领取中...', 'กำลังรับ...')
            : t('Claim Promo Code', 'Promo Code ရယူမည်', '领取优惠码', 'รับรหัสโปรโมชั่น')
          }}
        </button>

        <button
          type="button"
          class="w-full mt-3 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold"
          @click="showDetailModal = false"
        >
          {{ t("Close", "ပိတ်မည်", "关闭", "ปิด") }}
        </button>
      </div>
    </VanPopup>
  </div>
</template>
