<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "../composables/useTranslation";
import axios from "axios";
import { showFailToast, showSuccessToast, showLoadingToast, closeToast, showConfirmDialog } from "vant";
import { ActionSheet as VanActionSheet, Popup as VanPopup } from "vant";

const router = useRouter();
const { t } = useTranslation();

const isLoading = ref(true);
const eWallets = ref([]);
const bankAccounts = ref([]);
const cryptoWallets = ref([]);
const showAddSheet = ref(false);

const E_WALLET_TYPE_IDS = [1, 2, 3, 4];
const bankTypeIds = ref([]);
const cryptoTypeIds = ref([]);

const editItem = ref(null);
const showEditModal = ref(false);
const editForm = ref({ name: "", account_number: "" });
const editQrFile = ref(null);
const editQrInputRef = ref(null);
const isSubmittingEdit = ref(false);

/**
 * Category from user_bank_types: "e-wallet" | "bank" | "crypto".
 * Uses bankType.category when API returns it; otherwise falls back to name-based guess.
 */
function getCategory(item) {
  const cat = String(item.bankType?.category ?? item.user_bank_type?.category ?? "").toLowerCase().replace(/-/g, "");
  if (cat === "ewallet") return "ewallet";
  if (cat === "bank") return "bank";
  if (cat === "crypto") return "crypto";
  const name = String(item.bankType?.name ?? item.name ?? "").toLowerCase();
  if (name.includes("wave") || name.includes("kbz pay") || name.includes("aya pay") || name.includes("cb pay")) return "ewallet";
  if (name.includes("bank")) return "bank";
  if (name.includes("usdt") || name.includes("bitcoin") || name.includes("btc") || name.includes("ethereum") || name.includes("eth")) return "crypto";
  return "ewallet";
}

function displayName(item) {
  return item.bankType?.name || item.name || "";
}

function maskedNumber(item) {
  return item.masked_number || (item.account_number ? "*******" + String(item.account_number).slice(-4) : "****");
}

/** Format for card display: **** **** **** 1234 */
function cardNumberFormatted(item) {
  const raw = maskedNumber(item).replace(/\s/g, "");
  if (raw.length <= 4) return raw;
  const last4 = raw.slice(-4);
  return "****  ****  ****  " + last4;
}

const KBZ_PAY_LOGO_URL = "https://images.9734232.com/mcs-images/bank/mcs_1618786949815_KBZPay.jpg";

/** Logo for card: use bankType.logo_url when set, else KBZ Pay fallback for e-wallet, else null */
function cardLogoUrl(item) {
  const url = item.bankType?.logo_url;
  if (url) return url;
  const name = displayName(item).toLowerCase();
  if (name.includes("kbz pay")) return KBZ_PAY_LOGO_URL;
  return null;
}

async function fetchUserBanks() {
  isLoading.value = true;
  const toast = showLoadingToast({
    message: t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    const res = await axios.get("/user/user-banks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    console.log("RESPONSE", res)
    const list = res?.data?.data ?? res?.data ?? [];
    const items = Array.isArray(list) ? list : [];
    const active = items.filter((a) => a.is_active !== false && a.bankType != null && a.user_bank_type_id != null);
    eWallets.value = active.filter((i) => getCategory(i) === "ewallet");
    bankAccounts.value = active.filter((i) => getCategory(i) === "bank");
    cryptoWallets.value = active.filter((i) => getCategory(i) === "crypto");
  } catch (e) {
    console.error("Fetch user banks failed:", e);
    eWallets.value = [];
    bankAccounts.value = [];
    cryptoWallets.value = [];
    showFailToast({
      message: t("Failed to load", "ပြသရန် မအောင်မြင်ပါ", "加载失败", "โหลดไม่สำเร็จ"),
      position: "top",
    });
  } finally {
    closeToast();
    if (toast?.close) toast.close();
    isLoading.value = false;
  }
}

/** Fetch /user-bank-types and set bankTypeIds + cryptoTypeIds for "all added" logic. */
async function fetchBankTypeIds() {
  try {
    const res = await axios.get("/user-bank-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    console.log("Bank types response:", res);
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const cat = (item) => String(item?.category ?? "").toLowerCase().replace(/-/g, "");
    const name = (item) => String(item?.name ?? "").toLowerCase();
    bankTypeIds.value = list
      .filter((item) => item.is_active !== false && (cat(item) === "bank" || name(item).includes("bank")))
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id));
    cryptoTypeIds.value = list
      .filter((item) => item.is_active !== false && (cat(item) === "crypto" || name(item).includes("crypto") || name(item).includes("usdt")))
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id));
  } catch (e) {
    console.error("Fetch bank types failed:", e);
    bankTypeIds.value = [];
    cryptoTypeIds.value = [];
  }
}

function formatDateTime(val) {
  if (!val) return "";
  const d = new Date(val);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function openEdit(item) {
  editItem.value = item;
  editForm.value = {
    name: (item.name || "").trim(),
    account_number: (item.account_number || "").trim(),
  };
  editQrFile.value = null;
  if (editQrInputRef.value) editQrInputRef.value.value = "";
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  editItem.value = null;
}

function onEditQrChange(e) {
  const file = e.target?.files?.[0];
  editQrFile.value = file || null;
}

async function submitEdit() {
  const item = editItem.value;
  if (!item?.id) return;
  const name = (editForm.value.name || "").trim();
  const account_number = (editForm.value.account_number || "").trim();
  if (!name) {
    showFailToast({
      message: t("Please enter name", "အမည် ထည့်ပါ", "请输入名称", "กรุณากรอกชื่อ"),
      position: "top",
    });
    return;
  }
  if (!account_number) {
    showFailToast({
      message: t("Please enter account number", "အကောင့်နံပါတ် ထည့်ပါ", "请输入账号", "กรุณากรอกหมายเลขบัญชี"),
      position: "top",
    });
    return;
  }

  isSubmittingEdit.value = true;
  const toast = showLoadingToast({
    message: t("Saving...", "သိမ်းဆည်းနေသည်...", "保存中...", "กำลังบันทึก..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    const form = new FormData();
    form.append("_method", "PUT");
    form.append("name", name);
    form.append("account_number", account_number);
    form.append("user_bank_type_id", String(item.user_bank_type_id));
    if (editQrFile.value) form.append("qr_image", editQrFile.value);

    await axios.post(`/user/user-banks/${item.id}`, form, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    closeToast();
    if (toast?.close) toast.close();
    showSuccessToast({
      message: t("Updated successfully", "ပြင်ဆင်ပြီးပါပြီ", "更新成功", "อัปเดตสำเร็จ"),
      position: "top",
    });
    closeEditModal();
    await fetchUserBanks();
  } catch (err) {
    closeToast();
    if (toast?.close) toast.close();
    const status = err?.response?.status;
    const data = err?.response?.data || {};
    let msg = data.message || data.errors?.name?.[0] || data.errors?.account_number?.[0] ||
      t("Update failed. Please try again.", "ပြင်ဆင်၍ မရပါ။ ထပ်ကြိုးစားပါ။", "更新失败，请重试", "อัปเดตไม่สำเร็จ กรุณาลองใหม่");
    if (status === 422) {
      msg = t("Update is not allowed within 24 hours of last update.", "နောက်ဆုံး ပြင်ဆင်ပြီး ၂၄ နာရီ မပြည့်မီ ပြင်ဆင်ခွင့် မရှိပါ။", "距离上次更新未满24小时，无法更新。", "ไม่อนุญาตให้อัปเดตภายใน 24 ชม. หลังการอัปเดตล่าสุด");
    }
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmittingEdit.value = false;
  }
}

async function confirmDelete(item) {
  const display = displayName(item);
  try {
    await showConfirmDialog({
      title: t("Delete card?", "ကတ်ကို ဖျက်မလား?", "删除此卡？", "ลบบัตรนี้?"),
      message: t("This cannot be undone.", "ပြန်ပြင်လို့ မရပါ။", "此操作无法撤销。", "ไม่สามารถยกเลิกได้"),
      confirmButtonText: t("Delete", "ဖျက်မည်", "删除", "ลบ"),
      confirmButtonColor: "#dc2626",
      cancelButtonText: t("Cancel", "ပယ်မည်", "取消", "ยกเลิก"),
      className: "delete-card-dialog",
    });
  } catch {
    return;
  }

  const toast = showLoadingToast({
    message: t("Deleting...", "ဖျက်နေသည်...", "删除中...", "กำลังลบ..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.delete(`/user/user-banks/${item.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    closeToast();
    if (toast?.close) toast.close();
    showSuccessToast({
      message: t("Deleted successfully", "ဖျက်ပြီးပါပြီ", "删除成功", "ลบสำเร็จ"),
      position: "top",
    });
    await fetchUserBanks();
  } catch (e) {
    closeToast();
    if (toast?.close) toast.close();
    const msg = e?.response?.data?.message || t("Delete failed.", "ဖျက်၍ မရပါ။", "删除失败。", "ลบไม่สำเร็จ");
    showFailToast({ message: msg, position: "top" });
  }
}

function goAddEWallet() {
  showAddSheet.value = false;
  router.push({ name: "add-e-wallet" });
}

function goAddBank() {
  showAddSheet.value = false;
  router.push({ name: "add-bank-account" });
}

function goAddCrypto() {
  showAddSheet.value = false;
  router.push({ name: "add-crypto-wallet" });
}

/** Options for add sheet: only show E-wallet / Bank / Crypto if user has not yet added all of that category. */
const addOptions = computed(() => {
  const addedEwalletIds = new Set(
    (eWallets.value || []).map((a) => Number(a.user_bank_type_id)).filter((id) => Number.isFinite(id)),
  );
  const addedBankIds = new Set(
    (bankAccounts.value || []).map((a) => Number(a.user_bank_type_id)).filter((id) => Number.isFinite(id)),
  );
  const addedCryptoIds = new Set(
    (cryptoWallets.value || []).map((a) => Number(a.user_bank_type_id)).filter((id) => Number.isFinite(id)),
  );
  const hasAllEwallets = E_WALLET_TYPE_IDS.every((id) => addedEwalletIds.has(id));
  const bankIds = bankTypeIds.value || [];
  const cryptoIds = cryptoTypeIds.value || [];
  const hasAllBanks = bankIds.length > 0 && bankIds.every((id) => addedBankIds.has(id));
  const hasAllCrypto = cryptoIds.length > 0 && cryptoIds.every((id) => addedCryptoIds.has(id));

  const options = [];
  if (!hasAllEwallets) {
    options.push({ name: t("Pay", "Pay", "电子钱包", "Pay"), value: "ewallet" });
  }
  if (!hasAllBanks) {
    options.push({ name: t("Bank Account", "ဘဏ်အကောင့်", "银行账户", "บัญชีธนาคาร"), value: "bank" });
  }
  if (!hasAllCrypto) {
    options.push({ name: t("Crypto Wallet", "Crypto ပိုက်ဆံအိတ်", "加密货币钱包", "กระเป๋า Crypto"), value: "crypto" });
  }
  return options;
});

function onSelectAdd(option) {
  if (option.value === "ewallet") goAddEWallet();
  else if (option.value === "bank") goAddBank();
  else if (option.value === "crypto") goAddCrypto();
}

onMounted(() => {
  fetchUserBanks();
  fetchBankTypeIds();
});
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F9] pb-24">
    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-4 flex items-center gap-4">
      <button
        @click="router.back()"
        class="text-white p-1 -ml-1"
      >
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
      <h1 class="flex-1 text-xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif] text-center">
        {{ t("My Cards", "ကတ်များ", "我的卡", "บัตรของฉัน") }}
      </h1>
      <div class="w-8"></div>
    </div>

    <div class="pt-16 px-4">
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="py-12 text-center text-gray-500 font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ t("Loading...", "ခေတ္တစောင့်ပါ...", "加载中...", "กำลังโหลด...") }}
      </div>

      <template v-else>
        <!-- Pay section -->
        <section class="mb-6">
          <h2
            class="flex items-center gap-2 text-base font-medium text-gray-800 font-['Pyidaungsu','Padauk',sans-serif] mb-3"
          >
            <span class="w-2 h-2 rounded-full bg-orange-500"></span>
            {{ t("Pay added", "Pay ထည့်ထားသည်", "已添加电子钱包", "เพิ่ม Pay แล้ว") }} - {{ eWallets.length }}
          </h2>
          <div
            v-if="eWallets.length"
            class="space-y-4"
          >
            <div
              v-for="item in eWallets"
              :key="item.id"
              class="bank-card bank-card-ewallet relative overflow-hidden rounded-2xl shadow-lg min-h-30 flex flex-col justify-between p-4"
            >
              <div class="flex items-start justify-between gap-2 min-w-0">
                <div
                  class="bank-card-chip rounded-lg bg-amber-400/90 w-10 h-8 flex items-center justify-center shadow-inner shrink-0"
                >
                  <div class="w-full h-full flex flex-wrap gap-px p-1">
                    <span
                      v-for="i in 12"
                      :key="i"
                      class="w-1.5 h-1 bg-amber-600/60 rounded-sm"
                    ></span>
                  </div>
                </div>
                <img
                  v-if="cardLogoUrl(item)"
                  :src="cardLogoUrl(item)"
                  :alt="displayName(item)"
                  class="h-8 max-w-20 object-contain object-right shrink-0"
                />
                <span
                  v-else
                  class="text-white/90 text-[10px] font-['Pyidaungsu','Padauk',sans-serif] tracking-wider uppercase truncate"
                >{{ displayName(item) }}</span>
              </div>
              <p class="font-mono text-white text-sm md:text-base tracking-[0.2em] font-medium">
                {{ cardNumberFormatted(item) }}
              </p>
              <div class="flex items-center justify-between gap-2 min-w-0">
                <span class="text-white/90 text-sm font-['Pyidaungsu','Padauk',sans-serif] truncate min-w-0 flex-1">{{
                  item.name || "Cardholder" }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Edit', 'ပြင်မည်', '编辑', 'แก้ไข')"
                    @click.stop="openEdit(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Delete', 'ဖျက်မည်', '删除', 'ลบ')"
                    @click.stop="confirmDelete(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line
                        x1="10"
                        y1="11"
                        x2="10"
                        y2="17"
                      ></line>
                      <line
                        x1="14"
                        y1="11"
                        x2="14"
                        y2="17"
                      ></line>
                    </svg>
                  </button>
                </div>
                <img
                  v-if="cardLogoUrl(item)"
                  :src="cardLogoUrl(item)"
                  :alt="displayName(item)"
                  class="h-7 w-auto max-w-18 object-contain object-right rounded bg-white/10 p-0.5 shrink-0"
                />
                <div
                  v-else
                  class="w-10 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold font-['Pyidaungsu','Padauk',sans-serif] shrink-0"
                >{{ displayName(item).slice(0, 2).toUpperCase() }}</div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="bank-card-add rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/80 min-h-30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1986E1] hover:bg-gray-200/80 transition-colors p-6"
            @click="goAddEWallet"
          >
            <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                ></line>
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                ></line>
              </svg>
            </div>
            <span class="text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] text-sm">{{ t("Payment Card",
              "ငွေရှင်းကတ်ကတ်", "支付卡", "บัตรชำระเงิน") }}</span>
          </div>
        </section>

        <!-- Bank Account Section -->
        <section class="mb-6">
          <h2
            class="flex items-center gap-2 text-base font-medium text-gray-800 font-['Pyidaungsu','Padauk',sans-serif] mb-3"
          >
            <span class="w-2 h-2 rounded-full bg-[#1986E1]"></span>
            {{ t("Bank Account added", "ဘဏ်အကောင့် ထည့်ထားသည်", "已添加银行账户", "เพิ่มบัญชีธนาคารแล้ว") }} - {{
              bankAccounts.length }}
          </h2>
          <div
            v-if="bankAccounts.length"
            class="space-y-4"
          >
            <div
              v-for="item in bankAccounts"
              :key="item.id"
              class="bank-card bank-card-bank relative overflow-hidden rounded-2xl shadow-lg min-h-30 flex flex-col justify-between p-4"
            >
              <div class="flex items-start justify-between gap-2 min-w-0">
                <div
                  class="bank-card-chip rounded-lg bg-amber-400/90 w-10 h-8 flex items-center justify-center shadow-inner shrink-0"
                >
                  <div class="w-full h-full flex flex-wrap gap-px p-1">
                    <span
                      v-for="i in 12"
                      :key="i"
                      class="w-1.5 h-1 bg-amber-600/60 rounded-sm"
                    ></span>
                  </div>
                </div>
                <img
                  v-if="cardLogoUrl(item)"
                  :src="cardLogoUrl(item)"
                  :alt="displayName(item)"
                  class="h-8 max-w-20 object-contain object-right shrink-0"
                />
                <span
                  v-else
                  class="text-white/90 text-[10px] font-['Pyidaungsu','Padauk',sans-serif] tracking-wider uppercase truncate"
                >{{ displayName(item) }}</span>
              </div>
              <p class="font-mono text-white text-sm md:text-base tracking-[0.2em] font-medium">
                {{ cardNumberFormatted(item) }}
              </p>
              <div class="flex items-center justify-between gap-2 min-w-0">
                <span class="text-white/90 text-sm font-['Pyidaungsu','Padauk',sans-serif] truncate min-w-0 flex-1">{{
                  item.name || "Cardholder" }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Edit', 'ပြင်မည်', '编辑', 'แก้ไข')"
                    @click.stop="openEdit(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Delete', 'ဖျက်မည်', '删除', 'ลบ')"
                    @click.stop="confirmDelete(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line
                        x1="10"
                        y1="11"
                        x2="10"
                        y2="17"
                      ></line>
                      <line
                        x1="14"
                        y1="11"
                        x2="14"
                        y2="17"
                      ></line>
                    </svg>
                  </button>
                </div>
                <img
                  v-if="cardLogoUrl(item)"
                  :src="cardLogoUrl(item)"
                  :alt="displayName(item)"
                  class="h-7 w-auto max-w-18 object-contain object-right rounded bg-white/10 p-0.5 shrink-0"
                />
                <div
                  v-else
                  class="w-10 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold font-['Pyidaungsu','Padauk',sans-serif] shrink-0"
                >{{ displayName(item).slice(0, 2).toUpperCase() }}</div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="bank-card-add rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/80 min-h-30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1986E1] hover:bg-gray-200/80 transition-colors p-6"
            @click="goAddBank"
          >
            <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                ></line>
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                ></line>
              </svg>
            </div>
            <span class="text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] text-sm">{{ t("Payment Card",
              "ငွေရှင်းကတ်ကတ်", "支付卡", "บัตรชำระเงิน") }}</span>
          </div>
        </section>

        <!-- Crypto Wallet Section -->
        <section class="mb-6">
          <h2
            class="flex items-center gap-2 text-base font-medium text-gray-800 font-['Pyidaungsu','Padauk',sans-serif] mb-3"
          >
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            {{ t("Crypto wallet added", "Crypto ပိုက်ဆံအိတ်ကို ထည့်ထားသည်", "已添加加密货币钱包", "เพิ่มกระเป๋า Crypto แล้ว") }}
            - {{ cryptoWallets.length }}
          </h2>
          <div
            v-if="cryptoWallets.length"
            class="space-y-4"
          >
            <div
              v-for="item in cryptoWallets"
              :key="item.id"
              class="bank-card bank-card-crypto relative overflow-hidden rounded-2xl shadow-lg min-h-30 flex flex-col justify-between p-4"
            >
              <div class="flex items-start justify-between gap-2 min-w-0">
                <div
                  class="bank-card-chip rounded-lg bg-amber-400/90 w-10 h-8 flex items-center justify-center shadow-inner shrink-0"
                >
                  <div class="w-full h-full flex flex-wrap gap-px p-1">
                    <span
                      v-for="i in 12"
                      :key="i"
                      class="w-1.5 h-1 bg-amber-600/60 rounded-sm"
                    ></span>
                  </div>
                </div>
                <span
                  class="text-white/90 text-[10px] font-['Pyidaungsu','Padauk',sans-serif] tracking-wider uppercase truncate"
                >{{ displayName(item) }}</span>
              </div>
              <p class="font-mono text-white text-sm md:text-base tracking-[0.2em] font-medium">
                {{ cardNumberFormatted(item) }}
              </p>
              <div class="flex items-center justify-between gap-2 min-w-0">
                <span class="text-white/90 text-sm font-['Pyidaungsu','Padauk',sans-serif] truncate min-w-0 flex-1">{{
                  item.name || "Cardholder" }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Edit', 'ပြင်မည်', '编辑', 'แก้ไข')"
                    @click.stop="openEdit(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors"
                    :aria-label="t('Delete', 'ဖျက်မည်', '删除', 'ลบ')"
                    @click.stop="confirmDelete(item)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line
                        x1="10"
                        y1="11"
                        x2="10"
                        y2="17"
                      ></line>
                      <line
                        x1="14"
                        y1="11"
                        x2="14"
                        y2="17"
                      ></line>
                    </svg>
                  </button>
                </div>
                <div
                  class="w-10 h-7 rounded bg-white/20 flex items-center justify-center text-white text-[10px] font-bold font-['Pyidaungsu','Padauk',sans-serif] shrink-0"
                >{{ displayName(item).slice(0, 2).toUpperCase() }}</div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="bank-card-add rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100/80 min-h-30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1986E1] hover:bg-gray-200/80 transition-colors p-6"
            @click="goAddCrypto"
          >
            <span class="text-3xl">₿</span>
            <span class="text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] text-sm">{{ t("Empty wallet list",
              "အချည်းနှီးသောပိုက်ဆံအိတ်စာရင်း", "空钱包列表", "รายการกระเป๋าว่าง") }}</span>
          </div>
        </section>
      </template>
    </div>

    <!-- FAB: hide when user has added all e-wallets, banks, and crypto -->
    <button
      v-if="addOptions.length > 0"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95 transition-transform"
      aria-label="Add"
      @click="showAddSheet = true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line
          x1="12"
          y1="5"
          x2="12"
          y2="19"
        ></line>
        <line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
        ></line>
      </svg>
    </button>

    <!-- Edit card action sheet (bottom sheet) -->
    <VanPopup
      v-model:show="showEditModal"
      position="bottom"
      round
      class="edit-card-modal"
      :style="{ maxHeight: '90vh' }"
      @closed="closeEditModal"
    >
      <div class="bg-[#F5F5F9] max-h-[90vh] overflow-hidden flex flex-col">
        <div class="bg-[#080E1E] px-4 py-3 flex items-center justify-between shrink-0">
          <h3 class="text-lg font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Edit card", "ကတ် ပြင်ဆင်မည်", "编辑卡", "แก้ไขบัตร") }}
          </h3>
          <button
            type="button"
            class="p-1.5 text-white/80 hover:text-white rounded"
            aria-label="Close"
            @click="closeEditModal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              ></line>
              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              ></line>
            </svg>
          </button>
        </div>
        <form
          @submit.prevent="submitEdit"
          class="p-4 overflow-y-auto flex-1 space-y-3"
        >
          <div class="bg-white rounded-xl border border-black/10 overflow-hidden">
            <label class="block text-xs font-medium text-gray-700 font-['Pyidaungsu','Padauk',sans-serif] px-3 pt-2">
              {{ t("Name", "အမည်", "名称", "ชื่อ") }}
            </label>
            <input
              v-model="editForm.name"
              type="text"
              maxlength="100"
              class="w-full px-3 pb-3 pt-0.5 text-base font-['Pyidaungsu','Padauk',sans-serif] bg-white border-0 outline-none text-gray-900 placeholder:text-gray-400"
              :placeholder="t('Account or card name', 'အကောင့်/ကတ် အမည်', '账户或卡名称', 'ชื่อบัญชีหรือบัตร')"
            />
          </div>
          <div class="bg-white rounded-xl border border-black/10 overflow-hidden">
            <label class="block text-xs font-medium text-gray-700 font-['Pyidaungsu','Padauk',sans-serif] px-3 pt-2">
              {{ t("Account number", "အကောင့်နံပါတ်", "账号", "หมายเลขบัญชี") }}
            </label>
            <input
              v-model="editForm.account_number"
              type="text"
              maxlength="50"
              class="w-full px-3 pb-3 pt-0.5 text-base font-['Pyidaungsu','Padauk',sans-serif] bg-white border-0 outline-none text-gray-900 placeholder:text-gray-400"
              :placeholder="t('Account number', 'အကောင့်နံပါတ်', '账号', 'หมายเลขบัญชี')"
            />
          </div>
          <div class="bg-white rounded-xl border border-black/10 overflow-hidden px-3 py-2">
            <label class="block text-xs font-medium text-gray-700 font-['Pyidaungsu','Padauk',sans-serif] mb-1">
              {{ t("QR image (optional)", "QR ပုံ (ရွေးချယ်မှု)", "二维码图片（选填）", "รูป QR (ไม่บังคับ)") }}
            </label>
            <input
              ref="editQrInputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              class="w-full text-sm font-['Pyidaungsu','Padauk',sans-serif] text-gray-800 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-200 file:text-gray-800"
              @change="onEditQrChange"
            />
            <p class="mt-1 text-xs text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]">
              {{ t(
                "JPG, PNG or WebP, max 5MB",
                "JPG, PNG သို့ WebP၊ အများဆုံး ၅MB",
                "JPG、PNG 或 WebP，最大 5MB",
                "JPG, PNG หรือ WebP สูงสุด 5MB")
              }}
            </p>
          </div>
          <div class="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              class="edit-modal-cancel flex-1 py-3 rounded-xl border border-gray-300 font-['Pyidaungsu','Padauk',sans-serif] font-medium bg-white"
              @click="closeEditModal"
            >
              {{ t("Cancel", "ပယ်မည်", "取消", "ยกเลิก") }}
            </button>
            <button
              type="submit"
              class="flex-1 py-3 rounded-xl bg-red-500 text-white font-['Pyidaungsu','Padauk',sans-serif] font-medium hover:bg-red-600 disabled:opacity-50"
              :disabled="isSubmittingEdit"
            >
              {{ t("Save", "သိမ်းမည်", "保存", "บันทึก") }}
            </button>
          </div>
        </form>
      </div>
    </VanPopup>

    <!-- Add options sheet -->
    <VanActionSheet
      v-model:show="showAddSheet"
      :actions="addOptions"
      :cancel-text="t('Cancel', 'ပယ်မည်', '取消', 'ยกเลิก')"
      @select="onSelectAdd"
    />
  </div>
</template>

<style scoped>
.bank-card {
  position: relative;
  background: linear-gradient(135deg, #374164 0%, #374164 50%, #374164 100%);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.35);
}

.bank-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.bank-card-ewallet {
  background: linear-gradient(135deg, #1e40af 0%, #1986E1 45%, #1986E1 100%);
}

.bank-card-bank {
  background: linear-gradient(135deg, #172240 0%, #080E1E 50%, #080E1E 100%);
}

.bank-card-crypto {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
}

.bank-card-chip {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
}

/* Ensure edit modal inputs are always readable (override Vant/global) */
.edit-card-modal input[type="text"] {
  color: #172240 !important;
}

.edit-card-modal input[type="text"]::placeholder {
  color: #9ca3af !important;
}

.edit-modal-cancel {
  color: #1f2937 !important;
}
</style>
