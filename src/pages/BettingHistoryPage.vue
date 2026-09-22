<script setup>
import { useRouter } from "vue-router";
import { useTranslation } from "../composables/useTranslation";
import BettingHistoryContent from "../components/BettingHistoryContent.vue";

const router = useRouter();
const { t } = useTranslation();

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-[#080E1E] px-4 py-4 flex items-center justify-between"
    >
      <button @click="goBack" class="text-white p-1 -ml-1" aria-label="Back">
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1
        class="text-2xl font-medium text-white font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{
          t(
            "Betting History",
            "လောင်းကြေးမှတ်တမ်း",
            "投注记录",
            "บันทึกการเดิมพัน",
          )
        }}
      </h1>
      <div class="w-10" aria-hidden="true"></div>
    </header>

    <div class="h-[60px]" aria-hidden="true"></div>

    <BettingHistoryContent />
  </div>
</template>
