<template>
  <div>
    <!-- Page content -->
    <div class="mx-auto">
      <div class="bg-[#080E1E] rounded-lg mb-0 border border-white/10">
        <div
          class="card-header text-center font-bold border-b border-white/10 py-3 px-4"
        >
          {{ t("Betslip", "ဘောက်ချာ", "投注单", "สลิปเดิมพัน") }}
        </div>

        <div class="card-body pt-4 px-4" v-if="type === 'normal'">
          <div class="flex justify-between flex-wrap gap-4 mb-3">
            <div v-show="isTwod">
              For
              <b
                >{{ currentDate }} -
                {{ datas.length > 0 ? datas[0].draw : "" }}</b
              >
            </div>
            <div v-show="!isTwod">
              For
              <b>{{ threedDrawDate }}</b>
            </div>
            <div>
              <b>{{ currentTime }}</b>
            </div>
          </div>
          <div class="mb-3 mt-2">
            <b>{{ authUserName }}, {{ remark }}</b>
          </div>
          <div class="mb-3 mt-2">
            {{ t("Slip id", "ဘောက်ချာနံပါတ်", "单号", "หมายเลขสลิป") }} -
            <b>{{ slipId }}</b>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/20">
                  <th
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Number", "ဂဏန်း", "号码", "หมายเลข") }}
                  </th>
                  <th
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Amount", "ငွေပမာဏ", "金额", "จำนวนเงิน") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data, index) in datas"
                  :key="index"
                  class="border-b border-white/10"
                >
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ data.number }}
                  </td>
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ $formatAmount(data.solo_amount) }}
                  </td>
                </tr>

                <tr class="border-t-2 border-white/20">
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Boards", "အရေအတွတ်", "注数", "จำนวนชุด") }} :
                    {{ datas.length }}
                  </td>
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Total", "စုစုပေါင်းငွေပမာဏ", "合计", "รวม") }} :
                    {{ $formatAmount(totalAmount) }}
                    {{ t("MMK", "ကျပ်", "MMK", "จ๊าด") }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="text-center mt-4">
              <h2
                class="text-white text-lg font-['Pyidaungsu','Padauk',sans-serif]"
              >
                {{
                  t(
                    "We will give as slip.",
                    "စလစ်အတိုင်းသာ လျော်မည်။",
                    "按单据支付。",
                    "จ่ายตามสลิป"
                  )
                }}
              </h2>
            </div>
          </div>
        </div>
        <div class="card-body pt-4 px-4" v-else>
          <div class="flex justify-between flex-wrap gap-4 mb-3">
            <div>
              <span v-show="isTwod"> For</span>
              <b v-show="isTwod"
                >{{ historyDate(currentTime) }} -
                {{ datas.length > 0 ? datas[0].draw : "" }}</b
              >
              <b v-show="!isTwod"> {{ name }} </b>
            </div>
            <div>
              {{ t("Bet Time", "ထိုးချိန်", "投注时间", "เวลาวางเดิมพัน") }} :
              <b>{{ currentTime }}</b>
            </div>
          </div>
          <div class="mb-3 mt-2" v-show="isTwod">
            <b>{{ name }}, {{ remark }}</b>
          </div>
          <div class="mb-3 mt-2">
            {{ t("Slip id", "ဘောက်ချာနံပါတ်", "单号", "หมายเลขสลิป") }} -
            <b>{{ slipId }}</b>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/20">
                  <th
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Number", "ဂဏန်း", "号码", "หมายเลข") }}
                  </th>
                  <th
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Amount", "ငွေပမာဏ", "金额", "จำนวนเงิน") }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data, index) in datas"
                  :key="index"
                  class="border-b border-white/10"
                >
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ data.number }}
                  </td>
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ $formatAmount(data.amount) }}
                  </td>
                </tr>

                <tr class="border-t-2 border-white/20">
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Boards", "အရေအတွတ်", "注数", "จำนวนชุด") }} :
                    {{ datas.length }}
                  </td>
                  <td
                    class="text-center py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Total", "စုစုပေါင်းငွေပမာဏ", "合计", "รวม") }} :
                    {{ $formatAmount(totalAmountHistory) }}
                    {{ t("MMK", "ကျပ်", "MMK", "จ๊าด") }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="text-center mt-4">
              <h2
                class="text-white text-lg font-['Pyidaungsu','Padauk',sans-serif]"
              >
                {{
                  t(
                    "We will give as slip.",
                    "စလစ်အတိုင်းသာ လျော်မည်။",
                    "按单据支付。",
                    "จ่ายตามสลิป"
                  )
                }}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import moment from "moment";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  type: {
    type: String,
    default: "history",
  },
  datas: {
    type: Array,
    default: () => [],
  },
  slip: {
    type: Object,
    default: null,
  },
  currentTime: {
    type: String,
    default: "",
  },
  isTwod: {
    type: Boolean,
    default: true,
  },
  slipId: {
    type: [String, Number],
    default: null,
  },
  remark: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: "",
  },
});

const { t } = useTranslation();

// Access Vuex store
let store = null;
try {
  store = useStore();
} catch (error) {
  console.warn("Vuex store not available, using props/defaults");
}

// Get auth user name from store
const authUserName = computed(() => {
  return store?.state?.authUser?.name || "";
});

// Methods
const historyDate = (time) => {
  if (!time) return "";
  return moment(time).format("l");
};

// Computed properties
const threedDrawDate = computed(() => {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  if (currentDay < 17) {
    currentDate.setDate(16);
    return moment(currentDate).format("l");
  }
  currentDate.setDate(1);
  currentDate.setMonth(currentDate.getMonth() + 1);
  return moment(currentDate).format("ll");
});

const totalAmount = computed(() => {
  let total = 0;
  for (let i = 0; i < props.datas.length; i += 1) {
    total += parseInt(props.datas[i]?.solo_amount || 0, 10);
  }
  return total;
});

const totalAmountHistory = computed(() => {
  let total = 0;
  for (let i = 0; i < props.datas.length; i += 1) {
    total += parseInt(props.datas[i]?.amount || 0, 10);
  }
  return total;
});

const currentDate = computed(() => {
  return moment(new Date()).format("L");
});
</script>

<style scoped>
.action-icons {
  font-size: 15px;
}
</style>
