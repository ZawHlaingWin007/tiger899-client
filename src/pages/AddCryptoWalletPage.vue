<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Popup as VanPopup,
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from "vant";
import { useTranslation } from "../composables/useTranslation";
import axios from "axios";

const router = useRouter();
const { t } = useTranslation();

const selectedCryptoType = ref("");
const walletName = ref("");
const walletAddress = ref("");
const isSubmitting = ref(false);
const showCryptoPicker = ref(false);
const cryptoSearch = ref("");
const cryptoOptions = ref([]);
const isLoadingCryptoTypes = ref(false);
/** Type ids the user has already connected (from /user/user-banks). */
const connectedTypeIds = ref(new Set());

/** Fetch user's connected accounts to know which type ids to hide from picker. */
async function fetchConnectedTypeIds() {
  try {
    const res = await axios.get("/user/user-banks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const list = res?.data?.data ?? res?.data ?? [];
    const items = Array.isArray(list) ? list : [];
    const ids = new Set(
      items
        .filter((a) => a.is_active !== false && a.user_bank_type_id != null)
        .map((a) => Number(a.user_bank_type_id))
        .filter((id) => Number.isFinite(id)),
    );
    connectedTypeIds.value = ids;
  } catch (e) {
    console.error("Fetch user banks failed:", e);
    connectedTypeIds.value = new Set();
  }
}

/** Fetch crypto wallet types from API (category crypto or name contains crypto/usdt). */
async function fetchCryptoTypes() {
  isLoadingCryptoTypes.value = true;
  try {
    const res = await axios.get("/user-bank-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const cat = (item) =>
      String(item?.category ?? "")
        .toLowerCase()
        .replace(/-/g, "");
    const name = (item) => String(item?.name ?? "").toLowerCase();
    const isCrypto = (item) =>
      cat(item) === "crypto" ||
      name(item).includes("crypto") ||
      name(item).includes("usdt") ||
      name(item).includes("bitcoin") ||
      name(item).includes("btc") ||
      name(item).includes("ethereum") ||
      name(item).includes("eth");
    const active = list.filter(
      (item) => item.is_active !== false && isCrypto(item),
    );
    cryptoOptions.value = active.map((item) => {
      const label =
        item.name ??
        item.name_en ??
        item.label ??
        item.title ??
        String(item.id || "");
      return {
        value: item.id,
        labelKey: String(label),
        ...item,
      };
    });
  } catch (e) {
    console.error("Fetch crypto types failed:", e);
    cryptoOptions.value = [];
  } finally {
    isLoadingCryptoTypes.value = false;
  }
}

onMounted(() => {
  fetchConnectedTypeIds();
  fetchCryptoTypes();
});

/** Crypto options excluding types the user has already connected. */
const availableCrypto = computed(() => {
  const connected = connectedTypeIds.value;
  return (cryptoOptions.value || []).filter(
    (c) => !connected.has(Number(c.value)),
  );
});

const filteredCrypto = computed(() => {
  const q = cryptoSearch.value.trim().toLowerCase();
  const options = availableCrypto.value;
  if (!q) return options;
  return options.filter(
    (c) =>
      (c.labelKey || "").toLowerCase().includes(q) ||
      String(c.value || "")
        .toLowerCase()
        .includes(q),
  );
});

const selectedCryptoLabel = computed(() => {
  if (!selectedCryptoType.value) return "";
  const opt = cryptoOptions.value.find(
    (c) => c.value === selectedCryptoType.value,
  );
  return opt ? opt.labelKey : "";
});

const isFormValid = computed(() => {
  const name = (walletName.value || "").trim();
  const address = (walletAddress.value || "").trim();
  return !!selectedCryptoType.value && name.length > 0 && address.length > 0;
});

function openCryptoPicker() {
  showCryptoPicker.value = true;
  cryptoSearch.value = "";
}

function closeCryptoPicker() {
  showCryptoPicker.value = false;
}

function selectCrypto(opt) {
  selectedCryptoType.value = opt.value;
  closeCryptoPicker();
}

async function onSubmit() {
  const trimmedName = (walletName.value || "").trim();
  const trimmedAddress = (walletAddress.value || "").trim();
  if (!trimmedName) {
    showFailToast({
      message: t(
        "Please enter wallet name",
        "ပိုက်ဆံအိတ်အမည် ထည့်ပါ",
        "请输入钱包名称",
        "กรุณากรอกชื่อกระเป๋าเงิน",
      ),
      position: "top",
    });
    return;
  }
  if (!trimmedAddress) {
    showFailToast({
      message: t(
        "Please enter wallet address",
        "ပိုက်ဆံအိတ်လိပ်စာ ထည့်ပါ",
        "请输入钱包地址",
        "กรุณากรอกที่อยู่กระเป๋าเงิน",
      ),
      position: "top",
    });
    return;
  }
  if (!selectedCryptoType.value) {
    showFailToast({
      message: t(
        "Please select a crypto wallet type",
        "Crypto အမျိုးအစား ရွေးချယ်ပါ",
        "请选择加密货币类型",
        "กรุณาเลือกประเภท Crypto",
      ),
      position: "top",
    });
    return;
  }

  isSubmitting.value = true;
  showLoadingToast({
    message: t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด..."),
    duration: 0,
    forbidClick: true,
  });
  try {
    await axios.post(
      "/user/user-banks",
      {
        name: trimmedName,
        account_number: trimmedAddress,
        user_bank_type_id: selectedCryptoType.value,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );
    closeToast();
    showSuccessToast({
      message: t(
        "Crypto wallet added successfully.",
        "Crypto ပိုက်ဆံအိတ် ချိတ်ဆက်ပြီးပါပြီ။",
        "加密货币钱包添加成功",
        "เพิ่มกระเป๋า Crypto สำเร็จ",
      ),
      position: "top",
    });
    router.back();
  } catch (error) {
    closeToast();
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.account_number?.[0] ||
      error?.response?.data?.errors?.name?.[0] ||
      error?.response?.data?.errors?.user_bank_type_id?.[0] ||
      t(
        "Failed to add crypto wallet. Please try again.",
        "Crypto ပိုက်ဆံအိတ် ချိတ်ဆက်၍ မရပါ။ ထပ်ကြိုးစားပါ။",
        "添加失败，请重试",
        "เพิ่มไม่สำเร็จ กรุณาลองใหม่",
      );
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F9] pb-24">
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-4 flex items-center justify-between"
    >
      <button @click="router.back()" class="text-white">
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
      <h1
        class="text-2xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{
          t(
            "Add Crypto Wallet",
            "Crypto ပိုက်ဆံအိတ် ချိတ်ဆက်မည်",
            "添加加密货币钱包",
            "เพิ่มกระเป๋า Crypto",
          )
        }}
      </h1>
      <div class="w-10"></div>
    </header>

    <div class="pt-24 px-4">
      <div
        class="bg-white rounded-xl border border-black/10 py-4 px-4 font-['Pyidaungsu','Padauk',sans-serif]"
      >
        <!-- Select Crypto Type -->
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-2 bg-[#EFEFEF] rounded-lg mt-2 cursor-pointer min-h-[56px] px-3"
          @click="openCryptoPicker"
        >
          <span
            class="flex-1 text-2xl font-medium py-4"
            :class="selectedCryptoLabel ? 'text-black' : 'text-gray-500'"
          >
            {{
              selectedCryptoLabel
                ? selectedCryptoLabel
                : t(
                    "* Select crypto wallet type",
                    "* Crypto အမျိုးအစား ရွေးချယ်ပါ",
                    "* 选择加密货币类型",
                    "* เลือกประเภท Crypto",
                  )
            }}
          </span>
          <div
            class="shrink-0 w-10 h-10 flex items-center justify-center text-[#1986E1]"
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
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <!-- Crypto type picker bottom sheet -->
        <VanPopup
          v-model:show="showCryptoPicker"
          position="bottom"
          round
          :style="{ height: '70%' }"
          class="crypto-picker-popup"
        >
          <div
            class="p-4 pb-safe font-['Pyidaungsu','Padauk',sans-serif] bg-white text-gray-900"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-thin text-gray-800">
                {{
                  t(
                    "Select crypto wallet type",
                    "Crypto အမျိုးအစား ရွေးချယ်ပါ",
                    "选择加密货币类型",
                    "เลือกประเภท Crypto",
                  )
                }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-red-500 hover:text-black"
                aria-label="Close"
                @click="closeCryptoPicker"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div
              class="flex items-center gap-2 bg-[#EFEFEF] rounded-lg px-3 py-4 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="text-gray-400 shrink-0"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                v-model="cryptoSearch"
                type="text"
                :placeholder="t('Search', 'ရှာဖွေမှု', '搜索', 'ค้นหา')"
                class="flex-1 bg-transparent text-black py-1 outline-none placeholder:text-lg placeholder:font-thin placeholder:text-gray-400"
              />
            </div>
            <div
              class="overflow-y-auto max-h-[60vh] -mx-4 min-h-[120px] bg-white"
            >
              <template v-if="isLoadingCryptoTypes">
                <p class="px-4 py-6 text-center text-gray-700 text-lg">
                  {{
                    t(
                      "Loading...",
                      "ဆောင်ရွက်နေသည်...",
                      "加载中...",
                      "กำลังโหลด...",
                    )
                  }}
                </p>
              </template>
              <template v-else>
                <button
                  v-for="opt in filteredCrypto"
                  :key="opt.value"
                  type="button"
                  class="w-full text-left px-4 py-3.5 text-gray-900 text-xl font-medium hover:bg-gray-100 active:bg-gray-100 border-b border-gray-200 bg-white"
                  @click="selectCrypto(opt)"
                >
                  {{ opt.labelKey || opt.name || "Crypto" }}
                </button>
                <p
                  v-if="filteredCrypto.length === 0"
                  class="px-4 py-8 text-center text-gray-700 text-lg font-medium"
                >
                  {{
                    t(
                      "No crypto type found",
                      "Crypto အမျိုးအစား မရှိပါ",
                      "未找到类型",
                      "ไม่พบประเภท",
                    )
                  }}
                </p>
              </template>
            </div>
          </div>
        </VanPopup>

        <!-- Wallet name -->
        <div
          class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 1024 1024"
            fill="currentColor"
          >
            <path
              fill-opacity=".15"
              d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32m-40 632H136V232h752z"
            />
            <path
              d="M610.3 476h123.4c1.3 0 2.3-3.6 2.3-8v-48c0-4.4-1-8-2.3-8H610.3c-1.3 0-2.3 3.6-2.3 8v48c0 4.4 1 8 2.3 8"
            />
          </svg>
          <input
            v-model="walletName"
            type="text"
            maxlength="100"
            :placeholder="
              t(
                'Please enter wallet name',
                'ပိုက်ဆံအိတ်အမည် ထည့်ပါ',
                '请输入钱包名称',
                'กรุณากรอกชื่อกระเป๋าเงิน',
              )
            "
            class="flex-1 bg-transparent text-xl font-medium outline-none placeholder:text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] !text-black"
          />
        </div>

        <!-- Wallet address -->
        <div
          v-if="selectedCryptoType"
          class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
        >
          <span class="text-2xl shrink-0">₿</span>
          <input
            v-model="walletAddress"
            type="text"
            maxlength="200"
            :placeholder="
              t(
                'Wallet address',
                'ပိုက်ဆံအိတ်လိပ်စာ',
                '钱包地址',
                'ที่อยู่กระเป๋าเงิน',
              )
            "
            class="flex-1 bg-transparent text-xl font-medium outline-none placeholder:text-gray-500 font-['Pyidaungsu','Padauk',sans-serif] text-black"
          />
        </div>
      </div>

      <button
        type="button"
        :disabled="isSubmitting || !isFormValid"
        class="w-full mt-6 py-3.5 rounded-xl text-xl font-medium font-['Pyidaungsu','Padauk',sans-serif] text-center shadow-sm transition-colors active:opacity-90 disabled:opacity-60"
        :class="isFormValid && !isSubmitting
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-[#CACACA] text-black hover:bg-gray-300'"
        @click="onSubmit"
      >
        {{
          isSubmitting
            ? t("Submitting...", "တင်သွင်းနေသည်...", "提交中...", "กำลังส่ง...")
            : t("Submit", "တင်သွင်းပါ", "提交", "ส่ง")
        }}
      </button>
    </div>
  </div>
</template>
