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

const selectedBank = ref("");
const accountName = ref("");
const accountNumber = ref("");
const withdrawalPassword = ref("");
const isSubmitting = ref(false);
const showPassword = ref(false);
const showBankPicker = ref(false);
const bankSearch = ref("");
const bankOptions = ref([]);
const isLoadingBankTypes = ref(false);
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

/** Known bank name substrings (API may return names without "bank", e.g. CB, Yoma, UAB). */
const BANK_NAME_HINTS = ["bank", "cb bank", "yoma", "uab"];

/** Fetch bank types from API; keep only types that are banks (category, name contains "bank", or known bank names). */
async function fetchBankTypes() {
  isLoadingBankTypes.value = true;
  try {
    const res = await axios.get("/user-bank-types", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const raw = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const name = (item) => (item?.name ?? "").toString().toLowerCase();
    const category = (item) => (item?.category ?? "").toString().toLowerCase();
    const isBank = (item) =>
      category(item) === "bank" ||
      BANK_NAME_HINTS.some((hint) => name(item).includes(hint));
    const active = list.filter(
      (item) => item.is_active !== false && isBank(item),
    );
    bankOptions.value = active.map((item) => ({
      value: item.id,
      labelKey: item.name || "",
      ...item,
    }));
  } catch (e) {
    console.error("Fetch bank types failed:", e);
    bankOptions.value = [];
  } finally {
    isLoadingBankTypes.value = false;
  }
}

onMounted(() => {
  fetchConnectedTypeIds();
  fetchBankTypes();
});

/** Bank options excluding types the user has already connected. */
const availableBanks = computed(() => {
  const connected = connectedTypeIds.value;
  return (bankOptions.value || []).filter(
    (b) => !connected.has(Number(b.value)),
  );
});

const filteredBanks = computed(() => {
  const q = bankSearch.value.trim().toLowerCase();
  const options = availableBanks.value;
  if (!q) return options;
  return options.filter(
    (b) =>
      (b.labelKey || "").toLowerCase().includes(q) ||
      String(b.value || "")
        .toLowerCase()
        .includes(q),
  );
});

const selectedBankLabel = computed(() => {
  if (selectedBank.value === "" || selectedBank.value == null) return "";
  const opt = bankOptions.value.find((b) => b.value == selectedBank.value);
  return opt ? opt.labelKey : "";
});

function openBankPicker() {
  showBankPicker.value = true;
  bankSearch.value = "";
}

function closeBankPicker() {
  showBankPicker.value = false;
}

function selectBank(opt) {
  selectedBank.value = opt.value;
  closeBankPicker();
}

async function onSubmit() {
  const trimmedName = (accountName.value || "").trim();
  const trimmedAccount = (accountNumber.value || "").trim();
  if (!trimmedName) {
    showFailToast({
      message: t(
        "Please enter account name",
        "အကောင့်အမည် ထည့်ပါ",
        "请输入账户名称",
        "กรุณากรอกชื่อบัญชี",
      ),
      position: "top",
    });
    return;
  }
  if (!trimmedAccount) {
    showFailToast({
      message: t(
        "Please enter account number",
        "အကောင့်နံပါတ် ထည့်ပါ",
        "请输入账号",
        "กรุณากรอกหมายเลขบัญชี",
      ),
      position: "top",
    });
    return;
  }
  if (!selectedBank.value) {
    showFailToast({
      message: t(
        "Please select a bank",
        "ဘဏ်ရွေးချယ်ပါ",
        "请选择银行",
        "กรุณาเลือกธนาคาร",
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
        account_number: trimmedAccount,
        user_bank_type_id: selectedBank.value,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );
    closeToast();
    showSuccessToast({
      message: t(
        "Bank account added successfully.",
        "ဘဏ်အကောင့် ချိတ်ဆက်ပြီးပါပြီ။",
        "银行账户添加成功",
        "เพิ่มบัญชีธนาคารสำเร็จ",
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
        "Failed to add bank account. Please try again.",
        "ဘဏ်အကောင့် ချိတ်ဆက်၍ မရပါ။ ထပ်ကြိုးစားပါ။",
        "添加失败，请重试",
        "เพิ่มบัญชีไม่สำเร็จ กรุณาลองใหม่",
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
            "Bank Account Number",
            "ဘဏ်အကောင့်နံပါတ်",
            "银行账号",
            "หมายเลขบัญชีธนาคาร",
          )
        }}
      </h1>
      <div class="w-10"></div>
    </header>

    <div class="pt-24 px-4">
      <div
        class="bg-white rounded-xl border border-black/10 py-4 px-4 font-['Pyidaungsu','Padauk',sans-serif]"
      >
        <!-- Select Bank (opens bottom sheet). Selected type not shown. -->
        <div
          role="button"
          tabindex="0"
          class="flex items-center gap-2 bg-[#EFEFEF] rounded-lg mt-2 cursor-pointer min-h-[56px] px-3"
          @click="openBankPicker"
        >
          <span class="flex-1 text-2xl font-medium py-4 text-gray-600">
            {{
              t(
                "* Select Bank",
                "* ဘဏ်အားရွေးချယ်ပါ",
                "* 选择银行",
                "* เลือกธนาคาร",
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

        <!-- Bank picker bottom sheet (Vant Popup) -->
        <VanPopup
          v-model:show="showBankPicker"
          position="bottom"
          round
          :style="{ height: '70%' }"
          class="bank-picker-popup"
        >
          <div class="p-4 pb-safe font-['Pyidaungsu','Padauk',sans-serif]">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-thin text-black/70">
                {{
                  t(
                    "Select Bank",
                    "ဘဏ်အားရွေးချယ်ပါ",
                    "选择银行",
                    "เลือกธนาคาร",
                  )
                }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-red-500 hover:text-black"
                aria-label="Close"
                @click="closeBankPicker"
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
                v-model="bankSearch"
                type="text"
                :placeholder="t('Search', 'ရှာဖွေမှု', '搜索', 'ค้นหา')"
                class="flex-1 bg-transparent text-black py-1 outline-none placeholder:text-lg placeholder:font-thin placeholder:text-gray-400"
              />
            </div>
            <div class="overflow-y-auto max-h-[60vh] -mx-4">
              <button
                v-for="opt in filteredBanks"
                :key="opt.value"
                type="button"
                class="w-full text-left px-4 py-3.5 !text-black !text-xl hover:bg-gray-100 active:bg-gray-100 border-b border-gray-100"
                @click="selectBank(opt)"
              >
                {{ opt.labelKey }}
              </button>
              <p
                v-if="filteredBanks.length === 0"
                class="px-4 py-6 text-center text-gray-500"
              >
                {{
                  t("No bank found", "ဘဏ်မရှိပါ", "未找到银行", "ไม่พบธนาคาร")
                }}
              </p>
            </div>
          </div>
        </VanPopup>

        <div
          class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 1024 1024"
          >
            <path
              fill="currentColor"
              d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32m-40 632H136V232h752z"
            />
            <path
              fill="currentColor"
              fill-opacity=".15"
              d="M136 792h752V232H136zm472-372c0-4.4 1-8 2.3-8h123.4c1.3 0 2.3 3.6 2.3 8v48c0 4.4-1 8-2.3 8H610.3c-1.3 0-2.3-3.6-2.3-8zm0 144c0-4.4 3.2-8 7.1-8h185.7c3.9 0 7.1 3.6 7.1 8v48c0 4.4-3.2 8-7.1 8H615.1c-3.9 0-7.1-3.6-7.1-8zM216.2 664.6c2.8-53.3 31.9-99.6 74.6-126.1c-18.1-20-29.1-46.4-29.1-75.5c0-61.9 49.9-112 111.4-112s111.4 50.1 111.4 112c0 29.1-11 55.6-29.1 75.5c42.6 26.4 71.8 72.8 74.6 126.1a8 8 0 0 1-8 8.4h-43.9c-4.2 0-7.6-3.3-7.9-7.5c-3.8-50.5-46-90.5-97.2-90.5s-93.4 40-97.2 90.5c-.3 4.2-3.7 7.5-7.9 7.5H224c-4.6 0-8.2-3.8-7.8-8.4"
            />
            <path
              fill="currentColor"
              fill-opacity=".15"
              d="M321.3 463a51.7 52 0 1 0 103.4 0a51.7 52 0 1 0-103.4 0"
            />
            <path
              fill="currentColor"
              d="M610.3 476h123.4c1.3 0 2.3-3.6 2.3-8v-48c0-4.4-1-8-2.3-8H610.3c-1.3 0-2.3 3.6-2.3 8v48c0 4.4 1 8 2.3 8m4.8 144h185.7c3.9 0 7.1-3.6 7.1-8v-48c0-4.4-3.2-8-7.1-8H615.1c-3.9 0-7.1 3.6-7.1 8v48c0 4.4 3.2 8 7.1 8M224 673h43.9c4.2 0 7.6-3.3 7.9-7.5c3.8-50.5 46-90.5 97.2-90.5s93.4 40 97.2 90.5c.3 4.2 3.7 7.5 7.9 7.5H522a8 8 0 0 0 8-8.4c-2.8-53.3-32-99.7-74.6-126.1a111.8 111.8 0 0 0 29.1-75.5c0-61.9-49.9-112-111.4-112s-111.4 50.1-111.4 112c0 29.1 11 55.5 29.1 75.5a158.09 158.09 0 0 0-74.6 126.1c-.4 4.6 3.2 8.4 7.8 8.4m149-262c28.5 0 51.7 23.3 51.7 52s-23.2 52-51.7 52s-51.7-23.3-51.7-52s23.2-52 51.7-52"
            />
          </svg>
          <input
            v-model="accountName"
            type="text"
            maxlength="100"
            :placeholder="
              t(
                'Please enter account name',
                'အကောင့်အမည် ထည့်ပါ',
                '请输入账户名称',
                'กรุณากรอกชื่อบัญชี',
              )
            "
            class="!text-black text-xl w-full font-medium font-['Pyidaungsu','Padauk',sans-serif]"
          />
        </div>

        <!-- Account Number -->
        <div
          v-if="selectedBank"
          class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <input
            v-model="accountNumber"
            type="text"
            :placeholder="
              t('Account number', 'အကောင့်နံပါတ်', '账号', 'หมายเลขบัญชี')
            "
            class="flex-1 bg-transparent !text-black text-xl font-medium outline-none placeholder:text-gray-400"
          />
        </div>

        <!-- Withdrawal Password -->
      </div>
      <div
        class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <input
          v-model="withdrawalPassword"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="
            t(
              '* Withdrawal Password',
              '* ငွေထုတ်စကားဝှက်',
              '* 提现密码',
              '* รหัสผ่านถอนเงิน',
            )
          "
          class="flex-1 bg-transparent !text-black text-xl font-medium outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          class="shrink-0 p-1 text-[#A5A5A5] hover:text-black/70"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword"
        >
          <svg
            v-if="showPassword"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
            ></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
      <button
        type="button"
        :disabled="isSubmitting"
        class="w-full mt-6 py-3.5 rounded-xl bg-[#CACACA] !text-xl !text-black font-medium font-['Pyidaungsu','Padauk',sans-serif] text-center shadow-sm hover:bg-gray-300 transition-colors active:opacity-90 disabled:opacity-60"
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
