<script setup>
import { computed } from "vue";
import { useTranslation } from "../composables/useTranslation";

const props = defineProps({
  promotion: {
    type: Object,
    required: true,
  },
});

const { t } = useTranslation();

const isClaimed = computed(() => props.promotion?.claimed === true);
const isClaimOnce = computed(() => !!props.promotion?.claim_once_per_user);
</script>

<template>
  <router-link
    :to="`/promotion/${promotion.id}`"
    class="flex flex-col rounded-xl overflow-hidden bg-[#080E1E] border border-white/10 active:scale-[0.99] transition-transform touch-manipulation"
  >
    <div class="relative w-full overflow-hidden bg-[#0b1224]">
      <img
        v-if="promotion.image"
        :src="promotion.image"
        :alt="promotion.title || promotion.name"
        class="block w-full h-auto"
      />
      <div
        v-else
        class="w-full aspect-21/9 flex items-center justify-center text-[#1986E1] text-xl md:text-2xl font-bold opacity-30 px-4 text-center font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ promotion.title || promotion.name }}
      </div>
      <span
        v-if="isClaimed"
        class="absolute top-2 right-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] md:text-xs font-bold text-white font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ t("Claimed", "ရယူပြီး", "已领取", "รับแล้ว") }}
      </span>
    </div>

    <div class="flex items-center justify-between gap-3 px-3 py-2.5 md:px-3.5 md:py-3">
      <h3
        class="min-w-0 flex-1 text-white text-left font-['Pyidaungsu','Padauk',sans-serif] text-sm md:text-base font-bold leading-snug line-clamp-2"
      >
        {{ promotion.title || promotion.name }}
      </h3>
      <span
        v-if="isClaimed && isClaimOnce"
        class="shrink-0 text-amber-400 text-xs md:text-sm font-bold font-['Pyidaungsu','Padauk',sans-serif]"
      >
        {{ t("Already claimed", "ရယူပြီးသား", "已领取", "รับแล้ว") }}
      </span>
      <span
        v-else
        class="shrink-0 text-[#1986E1] text-xs md:text-sm font-bold font-['Pyidaungsu','Padauk',sans-serif] inline-flex items-center gap-0.5"
      >
        {{ t("Read more", "ပိုမိုဖတ်ရှုရန်", "阅读更多", "อ่านเพิ่มเติม") }}
        <span aria-hidden="true">></span>
      </span>
    </div>
  </router-link>
</template>
