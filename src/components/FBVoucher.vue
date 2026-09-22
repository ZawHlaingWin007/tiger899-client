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
        <div class="card-body pt-4 px-4 text-sm">
          <div class="mb-3 flex justify-between flex-wrap gap-4">
            <div>
              <div>
                Draw : <b>{{ datas.length > 0 ? datas[0].draw_date : "" }}</b>
              </div>
              <div>
                {{ t("Slip id", "ဘောက်ချာနံပါတ်", "单号", "หมายเลขสลิป") }} -
                <b>{{ slipId }}</b>
              </div>
              <div>
                {{ t("Type", "Type", "类型", "ประเภท") }} -
                <b class="capitalize">{{ type }}</b>
              </div>

              <div
                v-for="(comm, commIndex) in commInfo"
                :key="commIndex"
                v-show="commInfo && commInfo.length > 0"
              >
                {{ comm["name"] }} -
                <b class="capitalize">{{ comm["value"] }} MMK</b>
              </div>
            </div>

            <div>
              <div>
                {{ t("Bet Time", "ထိုးချိန်", "投注时间", "เวลาวางเดิมพัน") }} :
                <b>{{ currentTime }}</b>
              </div>
              <div>
                {{ t("Boards", "အရေအတွတ်", "注数", "จำนวนชุด") }} :
                <b>{{ datas.length > 0 ? datas.length : 0 }}</b>
              </div>
              <div>
                {{ t("Total", "စုစုပေါင်းငွေ", "合计", "รวม") }} :
                <b>
                  {{ onlyTotalAmount() }}
                  {{ t("MMK", "ကျပ်", "MMK", "จ๊าด") }}</b
                >
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-white/20">
                  <th
                    class="text-center text-sm py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Game", "Game", "游戏", "เกม") }}
                  </th>
                  <th
                    class="text-center text-sm py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    {{ t("Selected", "Selected", "已选", "เลือกแล้ว") }}
                  </th>
                  <th
                    class="text-center text-sm py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    v-if="isHistory"
                  >
                    {{ t("Result", "Result", "结果", "ผลลัพธ์") }}
                  </th>
                  <th
                    class="text-center text-sm py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    v-if="type === 'body'"
                  >
                    {{ t("Amount", "Amount", "金额", "จำนวนเงิน") }}
                  </th>
                  <th
                    class="text-center text-sm py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    v-if="isHistory"
                  ></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(data, index) in datas"
                  :key="index"
                  class="border-b border-white/10"
                >
                  <td
                    class="text-center text-xs py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                  >
                    <div
                      v-if="isHistory && data.league"
                      class="flex justify-center mt-1"
                    >
                      <span
                        class="text-xs text-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif]"
                      >
                        {{ data.league }}
                      </span>
                      <span
                        class="text-xs text-[#1986E1] font-['Pyidaungsu','Padauk',sans-serif]"
                      >
                        &nbsp; - &nbsp;{{ matchTimeOnly(data.start_time) }}
                      </span>
                    </div>
                    <div v-if="isHistory">
                      {{
                        language === "en"
                          ? data.first_team_en
                          : language === "th"
                            ? data.first_team_en
                            : data.first_team
                      }}
                      <span class="text-red-500"
                        >{{
                          data.first_team === data.kyayed_team &&
                          !data.goal_up_down
                            ? `&nbsp;(${
                                data.kyay === "~" ? "==" : data.kyay
                              })&nbsp;`
                            : ""
                        }}{{
                          data.goal_up_down
                            ? `&nbsp;&nbsp;(GP${data.goal_kyay})&nbsp;`
                            : ""
                        }}</span
                      >{{ data.goal_up_down ? "" : "-" }}

                      {{
                        language === "en"
                          ? data.second_team_en
                          : language === "th"
                            ? data.second_team_en
                            : data.second_team
                      }}
                      <span class="text-red-500">{{
                        data.second_team === data.kyayed_team &&
                        !data.goal_up_down
                          ? `&nbsp;(${
                              data.kyay === "~" ? "==" : data.kyay
                            })&nbsp;`
                          : ""
                      }}</span>
                    </div>

                    <div v-else>
                      {{
                        language === "en"
                          ? data.first_team_en
                          : language === "th"
                            ? data.first_team_en
                            : data.first_team
                      }}
                      <span class="text-red-500"
                        >{{
                          data.first_team === data.kyayed_team &&
                          !data.goal_up_down
                            ? `&nbsp;(${
                                type === "maung"
                                  ? data.maung_kyay
                                  : data.body_kyay === "~"
                                  ? "=="
                                  : type === "maung"
                                  ? data.maung_kyay
                                  : data.body_kyay
                              })&nbsp;`
                            : ""
                        }}{{
                          data.goal_up_down
                            ? `&nbsp;&nbsp;(GP${
                                getFBOrder?.type === "maung"
                                  ? data.maung_goal_kyay
                                  : data.body_goal_kyay
                              })&nbsp;`
                            : ""
                        }}</span
                      >

                      {{ data.goal_up_down ? "" : "-" }}

                      {{
                        language === "en"
                          ? data.second_team_en
                          : language === "th"
                            ? data.second_team_en
                            : data.second_team
                      }}
                      <span class="text-red-500">{{
                        data.second_team === data.kyayed_team &&
                        !data.goal_up_down
                          ? `&nbsp;(${
                              type === "maung"
                                ? data.maung_kyay
                                : data.body_kyay === "~"
                                ? "=="
                                : type === "maung"
                                ? data.maung_kyay
                                : data.body_kyay
                            })&nbsp;`
                          : ""
                      }}</span>
                    </div>
                  </td>
                  <td
                    class="text-center text-xs py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    :class="data.league ? 'pt-3' : ''"
                  >
                    <div>
                      <span v-if="!data.goal_up_down && !data.sone_ma">
                        {{
                          language === "en"
                            ? data.selected_team_en
                            : language === "th"
                              ? data.selected_team_en
                              : data.selected_team
                        }}
                      </span>

                      <span
                        class="text-red-500 whitespace-nowrap"
                        v-if="data.goal_up_down === 'up'"
                      >
                        {{ t("Goal Up", "ဂိုးပေါ်", "上盘", "สูง") }}
                      </span>
                      <span
                        class="text-red-500 whitespace-nowrap"
                        v-if="data.goal_up_down === 'down'"
                      >
                        {{ t("Goal Down", "ဂိုးအောက်", "下盘", "ต่ำ") }}
                      </span>

                      <!-- SONE MA  -->
                      <span
                        class="text-red-500 whitespace-nowrap"
                        v-if="data.sone_ma === 'sone'"
                      >
                        {{ t("Even", "စုံ", "双", "คู่") }}
                      </span>
                      <span
                        class="text-red-500 whitespace-nowrap"
                        v-if="data.sone_ma === 'ma'"
                      >
                        {{ t("Odd", "မ", "单", "คี่") }}
                      </span>
                      <!-- END SONE MA  -->
                    </div>
                  </td>
                  <td
                    class="text-center text-xs py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    :class="data.league ? 'pt-3' : ''"
                    v-if="isHistory"
                  >
                    <div
                      v-if="
                        (data.first_team_result ||
                          data.first_team_result === 0) &&
                        (data.second_team_result ||
                          data.second_team_result === 0)
                      "
                    >
                      <span class="text-red-500" v-if="data.is_cancel">{{
                        t("(Cancel)", "(ပွဲပျက်)", "（取消）", "(ยกเลิก)")
                      }}</span>
                      <span v-else>{{
                        data.first_team_result + " : " + data.second_team_result
                      }}</span>
                    </div>
                    <div v-else>{{ "-" }}</div>
                  </td>
                  <td
                    class="text-center text-xs py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    :class="data.league ? 'pt-3' : ''"
                    v-if="type === 'body'"
                  >
                    <div>
                      {{ $formatAmount(data.bet_amount) }}
                    </div>
                  </td>
                  <td
                    class="text-center text-xs py-2 text-white font-['Pyidaungsu','Padauk',sans-serif]"
                    :class="data.league ? 'pt-3' : ''"
                    v-if="isHistory && is_result"
                  >
                    <div
                      v-if="data.bingo_amount > 0 || data.isBingo"
                      class="flex items-center justify-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-green-500"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {{ $formatAmount(data.bingo_amount) }}
                    </div>
                    <div
                      v-if="!data.bingo_amount > 0 && !data.isBingo"
                      class="flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-red-500"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            class="mb-3 flex justify-between flex-wrap gap-4"
            v-if="isHistory && is_result"
          >
            <div></div>
            <div>
              <div>
                {{
                  t("Total Bet Amount", "စုစုပေါင်းအနိုင်ရငွေ", "总投注额", "ยอดเดิมพันรวม")
                }}
                :
                <b>
                  {{ $formatAmount(bingo_amount) }}
                  {{ t("MMK", "ကျပ်", "MMK", "จ๊าด") }}</b
                >
              </div>
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

// Try to access store, but make it optional
let store = null;
try {
  store = useStore();
} catch (error) {
  // Store not available yet, will use props/defaults
  console.warn("Vuex store not available, using props/defaults");
}

const { t } = useTranslation();

const props = defineProps({
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
  slipId: {
    type: [String, Number],
    default: null,
  },
  name: {
    type: String,
    default: "",
  },
  amount: {
    type: [String, Number],
    default: 0,
  },
  type: {
    type: String,
    required: true,
  },
  isHistory: {
    type: Boolean,
    default: false,
  },
  bingo_amount: {
    type: [String, Number],
    default: null,
  },
  is_result: {
    type: Boolean,
    default: false,
  },
  commInfo: {
    type: Array,
    default: () => [],
  },
  getFBOrder: {
    type: Object,
    default: () => ({ type: "maung" }),
  },
  language: {
    type: String,
    default: "mm",
  },
});

// Get language from store if not provided as prop
const language = computed(() => {
  return (
    props.language ||
    store?.state?.language ||
    localStorage.getItem("language") ||
    "mm"
  );
});

// Get FB Order from store if not provided as prop
const getFBOrder = computed(() => {
  return store?.getters?.getFBOrder || props.getFBOrder || { type: "maung" };
});

// Methods
const matchTimeOnly = (time) => {
  if (!time) return "";
  return moment(time).format("LT");
};

const firstMatchNo = (data) => {
  return data?.match_no * 2 - 1;
};

const secondMatchNo = (data) => {
  return data?.match_no * 2;
};

const selectedMatchNo = (data) => {
  if (data?.selected_team === data?.first_team) return firstMatchNo(data);
  if (data?.selected_team === data?.second_team) return secondMatchNo(data);
  return true;
};

const historyDate = (time) => {
  if (!time) return "";
  return moment(time).format("l");
};

const onlyTotalAmount = () => {
  let total = 0;
  if (props.type === "maung") {
    return parseInt(props.datas[0]?.bet_amount || 0, 10);
  }
  for (let i = 0; i < props.datas.length; i += 1) {
    total += parseInt(props.datas[i]?.bet_amount || 0, 10);
  }
  return total;
};
</script>

<style scoped>
.action-icons {
  font-size: 15px;
}
</style>
