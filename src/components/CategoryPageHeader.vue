<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTranslation } from "../composables/useTranslation";

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const titles = computed(() => ({
  slots: t("Slots", "စလော့ဂိမ်း", "老虎机", "สล็อต"),
  "fish-shooting": t("Fish Shooting", "ငါးပစ်", "捕鱼", "ยิงปลา"),
  "card-games": t("Card Games", "ဖဲဂိမ်း", "棋牌游戏", "เกมไพ่"),
  buffalo: t("Buffalo", "ကျွဲ", "野牛", "ควาย"),
  live: t("Live Casino", "ကာစီနို", "真人娱乐场", "คาสิโนสด"),
  lottery: t("Lottery", "ထီ", "彩票", "ลอตเตอรี่"),
  sports: t("Sports", "အားကစား", "体育", "กีฬา"),
  cockfighting: t("Cockfighting", "ကြက်တိုက်", "斗鸡", "ไก่ชน"),
  "e-sports": t("E-Sports", "အီးစပို့", "电竞", "อีสปอร์ต"),
}));

const title = computed(
  () => titles.value[route.name] || t("Games", "ဂိမ်း", "游戏", "เกม"),
);

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: "home" });
  }
};
</script>

<template>
  <header
    class="md:hidden sticky top-0 z-40 flex items-center gap-3 bg-[#080E1E] px-3 py-3 border-b border-white/5"
  >
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center text-white"
      aria-label="Back"
      @click="goBack"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <h1
      class="flex-1 text-center text-lg font-bold text-white font-['Pyidaungsu','Padauk',sans-serif] pr-9"
    >
      {{ title }}
    </h1>
  </header>
</template>
