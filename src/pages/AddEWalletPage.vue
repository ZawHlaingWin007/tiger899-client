<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTranslation } from "../composables/useTranslation";
import axios from "axios";
import {
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from "vant";

const router = useRouter();
const route = useRoute();
const { t } = useTranslation();

const name = ref("");
const accountNumber = ref("");
const password = ref("");
const showPassword = ref(false);
const selectedWalletType = ref("wave"); // 'wave' | 'kbz' | 'cb' | 'aya'
/** Account type id from /user-bank-types (1 KBZ, 2 Wave, 3 AYA Pay, 4 CB Pay). Required for store API. */
const accountTypeId = ref(null);
const isSubmitting = ref(false);

const WALLET_TYPE_IDS = { wave: 2, kbz: 1, cb: 4, aya: 3 };
/** E-wallet type keys in display order */
const ALL_WALLET_TYPES = ["wave", "kbz", "cb", "aya"];

/** Wallet types the user has not added yet (ids 1,2,3,4 only). Empty until loaded. */
const availableWalletTypes = ref([]);
const loadingAvailable = ref(true);

function selectWallet(type) {
  selectedWalletType.value = type;
  accountTypeId.value = WALLET_TYPE_IDS[type] ?? null;
}

function isWalletTypeAvailable(type) {
  return availableWalletTypes.value.includes(type);
}

async function fetchAvailableWalletTypes() {
  loadingAvailable.value = true;
  try {
    const res = await axios.get("/user/user-banks", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const list = res?.data?.data ?? res?.data ?? [];
    const items = Array.isArray(list) ? list : [];
    const eWalletTypeIds = [1, 2, 3, 4];
    const addedTypeIds = new Set(
      items
        .filter((a) => a.is_active !== false && eWalletTypeIds.includes(Number(a.user_bank_type_id)))
        .map((a) => Number(a.user_bank_type_id)),
    );
    const available = ALL_WALLET_TYPES.filter(
      (type) => !addedTypeIds.has(WALLET_TYPE_IDS[type]),
    );
    availableWalletTypes.value = available;

    const type = route.query.type;
    if (type === "kbz" || type === "wave" || type === "cb" || type === "aya") {
      if (available.includes(type)) {
        selectedWalletType.value = type;
      } else if (available.length > 0) {
        selectedWalletType.value = available[0];
      }
    } else if (available.length > 0) {
      selectedWalletType.value = available[0];
    }
    const id = route.query.accountTypeId;
    if (id != null && id !== "") {
      accountTypeId.value = Number(id) || id;
    } else {
      accountTypeId.value = WALLET_TYPE_IDS[selectedWalletType.value] ?? null;
    }
  } catch (e) {
    console.error("Fetch user banks failed:", e);
    availableWalletTypes.value = [...ALL_WALLET_TYPES];
  } finally {
    loadingAvailable.value = false;
  }
}

onMounted(() => {
  fetchAvailableWalletTypes();
});

async function handleSubmit() {
  const trimmedName = (name.value || "").trim();
  const trimmedAccount = (accountNumber.value || "").trim();
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
  if (!trimmedAccount) {
    showFailToast({
      message: t(
        "Please enter wallet number",
        "ပိုက်ဆံအိတ်နံပါတ် ထည့်ပါ",
        "请输入钱包号码",
        "กรุณากรอกหมายเลขกระเป๋าเงิน",
      ),
      position: "top",
    });
    return;
  }
  if (accountTypeId.value == null) {
    showFailToast({
      message: t(
        "Invalid account type. Please go back and try again.",
        "အကောင့်အမျိုးအစား မမှန်ကန်ပါ။ ပြန်ရွေးပါ။",
        "账户类型无效，请返回重试",
        "ประเภทบัญชีไม่ถูกต้อง กรุณากลับไปเลือกใหม่",
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
        user_bank_type_id: accountTypeId.value,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );
    closeToast();
    showSuccessToast({
      message: t(
        "Pay added successfully.",
        "Pay ချိတ်ဆက်ပြီးပါပြီ။",
        "电子钱包添加成功",
        "เพิ่ม Pay สำเร็จ",
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
        "Failed to add pay. Please try again.",
        "Pay ချိတ်ဆက်၍ မရပါ။ ထပ်ကြိုးစားပါ။",
        "添加失败，请重试",
        "เพิ่ม Pay ไม่สำเร็จ กรุณาลองใหม่",
      );
    showFailToast({ message: msg, position: "top" });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F5F5F9] pb-24">
    <div
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
            "Connect Pay",
            "Pay ချိတ်ဆက်မည်",
            "连接电子钱包",
            "เชื่อมต่อ Pay",
          )
        }}
      </h1>
      <div></div>
    </div>
    <div class="pt-24 px-4">
      <p
        class="text-black/60 text-lg font-medium font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{
          t(
            "Choose Pay Group",
            "Pay အုပ်စု ရွေးချယ်မည်",
            "选择电子钱包类型",
            "เลือกกลุ่ม Pay",
          )
        }}
      </p>
      <div v-if="loadingAvailable" class="flex mt-2 items-center gap-2 text-black/60 py-4">
        {{ t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...") }}
      </div>
      <div v-else-if="availableWalletTypes.length === 0" class="mt-2 py-4 px-3 bg-amber-50 border border-amber-200 rounded-xl text-black/80">
        {{
          t(
            "You have already added all pay types.",
            "Pay အမျိုးအစား အားလုံး ချိတ်ဆက်ပြီးသားပါ။",
            "您已添加所有电子钱包类型。",
            "คุณเพิ่มประเภท Pay ครบทั้งหมดแล้ว",
          )
        }}
      </div>
      <div v-else class="flex mt-2 flex-wrap gap-3">
        <button
          v-if="isWalletTypeAvailable('wave')"
          type="button"
          class="w-[90px] border-2 px-1 py-2 h-[70px] rounded-lg overflow-hidden transition-colors"
          :class="
            selectedWalletType === 'wave'
              ? 'border-red-500 bg-red-50'
              : 'border-black/10'
          "
          @click="selectWallet('wave')"
        >
          <img
            class="w-full h-full object-contain"
            src="https://yt3.googleusercontent.com/ytc/AIdro_n8JoWWWC4bvYfAgoHtZtoaNwDlD7kTk_CN-g6O06CaB4o=s900-c-k-c0x00ffffff-no-rj"
            alt="Wave Pay"
          />
        </button>
        <button
          v-if="isWalletTypeAvailable('kbz')"
          type="button"
          class="w-[90px] border-2 px-1 py-2 h-[70px] rounded-lg overflow-hidden transition-colors"
          :class="
            selectedWalletType === 'kbz'
              ? 'border-red-500 bg-red-50'
              : 'border-black/10'
          "
          @click="selectWallet('kbz')"
        >
          <img
            class="w-full h-full object-contain"
            src="https://play-lh.googleusercontent.com/cnKJYzzHFAE5ZRepCsGVhv7ZnoDfK8Wu5z6lMefeT-45fTNfUblK_gF3JyW5VZsjFc4"
            alt="KBZ Pay"
          />
        </button>
        <button
          v-if="isWalletTypeAvailable('cb')"
          type="button"
          class="w-[90px] border-2 px-1 py-2 h-[70px] rounded-lg overflow-hidden transition-colors"
          :class="
            selectedWalletType === 'cb'
              ? 'border-red-500 bg-red-50'
              : 'border-black/10'
          "
          @click="selectWallet('cb')"
        >
          <img
            class="w-full h-full object-contain"
            src="https://play-lh.googleusercontent.com/ErPz7wvjl-tmKkfsTDtxz4XepVocji0Mo0k9Somq7ydxA7y49JHU9EnGMUGDUY9Nveq-"
            alt="CB Pay"
          />
        </button>
        <button
          v-if="isWalletTypeAvailable('aya')"
          type="button"
          class="w-[90px] border-2 px-1 py-2 h-[70px] rounded-lg overflow-hidden transition-colors"
          :class="
            selectedWalletType === 'aya'
              ? 'border-red-500 bg-red-50'
              : 'border-black/10'
          "
          @click="selectWallet('aya')"
        >
          <img
            class="w-full h-full object-contain"
            src="https://play-lh.googleusercontent.com/Lgulng3ncFuuFVYTmT-JQxuZ_IQ9-iPCojY5lM6c3wK9uvSx_ZRqLGcq8dTQcez1HDvQiSvfmJHZN1EHg1oWfLk"
            alt="AYA Pay"
          />
        </button>
      </div>
      <div
        v-if="!loadingAvailable && availableWalletTypes.length > 0"
        class="bg-white rounded-xl border-1 border-black/10 py-2 px-3 pb-7 mt-8"
      >
        <p
          class="text-black/60 mt-3 text-[18px] font-thin font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{
            t(
              "Pay Type",
              "Pay အမျိုးအစား",
              "电子钱包类型",
              "ประเภท Pay",
            )
          }}
        </p>
        <div
          class="py-4 px-7 mt-2 uppercase text-black text-xl bg-red-100 border border-red-500 rounded-lg w-fit"
        >
          {{
            selectedWalletType === "kbz"
              ? "KBZPAY"
              : selectedWalletType === "cb"
                ? "CBPAY"
                : selectedWalletType === "aya"
                  ? "AYAPAY"
                  : "WavePay"
          }}
        </div>
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
            v-model="name"
            type="text"
            maxlength="100"
            :placeholder="
              t(
                'Please enter your wallet name',
                'သင့်ပိုက်ဆံအိတ်အမည် ထည့်ပါ',
                '请输入您的钱包名称',
                'กรุณากรอกชื่อกระเป๋าเงิน',
              )
            "
            class="!text-black text-xl w-full font-medium font-['Pyidaungsu','Padauk',sans-serif]"
          />
        </div>
        <div
          class="flex items-center text-[#A5A5A5] gap-2 bg-[#EFEFEF] px-3 py-4 rounded-lg mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
          >
            <g fill="none">
              <path
                d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
              />
              <path
                fill="currentColor"
                d="M19 4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm1 6H4v7a1 1 0 0 0 .883.993L5 18h14a1 1 0 0 0 .993-.883L20 17zm-3 3a1 1 0 0 1 .117 1.993L17 15h-3a1 1 0 0 1-.117-1.993L14 13zm2-7H5a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1"
              />
            </g>
          </svg>
          <input
            v-model="accountNumber"
            type="text"
            maxlength="50"
            :placeholder="
              t(
                'Please enter your wallet number',
                'သင့်ပိုက်ဆံအိတ်နံပါတ် ထည့်ပါ',
                '请输入您的钱包号码',
                'กรุณากรอกหมายเลขกระเป๋าเงิน',
              )
            "
            class="!text-black text-xl w-full font-medium font-['Pyidaungsu','Padauk',sans-serif]"
          />
        </div>
      </div>
      <div
        v-if="!loadingAvailable && availableWalletTypes.length > 0"
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
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="
            t(
              'Please enter your password',
              'သင့်လျို့ဝှက်နံပါတ် ထည့်ပါ',
              '请输入您的密码',
              'กรุณากรอกรหัสผ่าน',
            )
          "
          class="!text-black text-xl w-full font-medium font-['Pyidaungsu','Padauk',sans-serif]"
        />
        <button
          type="button"
          class="shrink-0 p-1 text-[#A5A5A5] hover:text-black/70 transition-colors"
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
            stroke-linecap="round"
            stroke-linejoin="round"
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
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <button
        v-if="!loadingAvailable && availableWalletTypes.length > 0"
        type="button"
        :disabled="isSubmitting"
        class="w-full mt-6 py-3.5 rounded-xl bg-[#C8C8C8] !text-black !text-lg font-medium font-['Pyidaungsu','Padauk',sans-serif] text-center shadow-sm hover:bg-gray-300 transition-colors active:opacity-90 disabled:opacity-60"
        @click="handleSubmit"
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
