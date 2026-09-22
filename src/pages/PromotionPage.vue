<script setup>
import { onMounted, ref, watch, computed } from "vue";
import PromotionCard from "../components/PromotionCard.vue";
import { useTranslation } from "../composables/useTranslation";
import {
  MOCK_CATEGORIES,
  getMockPromotions,
} from "../data/mockPromotions";

const { t } = useTranslation();
const categories = ref([{ id: "all", name: "all" }, ...MOCK_CATEGORIES]);
const promotions = ref([]);
const activeCategory = ref("all");
const loading = ref(false);

const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId;
};

const categoriesWithTranslation = computed(() => {
  const allOption = { id: "all", name: t("All", "အားလုံး", "全部", "ทั้งหมด") };
  return [allOption, ...categories.value.filter((c) => c.id !== "all")];
});

const loadPromotions = () => {
  loading.value = true;
  promotions.value = getMockPromotions(activeCategory.value);
  loading.value = false;
};

onMounted(() => {
  loadPromotions();
});

watch(activeCategory, () => {
  loadPromotions();
});
</script>

<template>
  <div class="w-full px-0.5 py-1 md:px-2 md:py-2">
    <!-- Page Title -->
    <h1 class="text-white text-xl md:text-3xl font-bold mb-3 font-['Pyidaungsu','Padauk',sans-serif] text-center">
      {{ t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น") }}
    </h1>

    <!-- Category Navigation -->
    <div class="flex items-center gap-2 mb-3 md:mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
      <button
        v-for="category in categoriesWithTranslation"
        :key="category.id"
        @click="setActiveCategory(category.id)"
        :class="[
          'btn-app px-3 py-1.5 md:px-3 md:py-1.5 whitespace-nowrap text-xs md:text-sm font-medium touch-manipulation',
          activeCategory === category.id
            ? 'btn-app-blue'
            : 'btn-app-dark hover:bg-[#1986E1]/50',
        ]"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Promotion Section -->
    <div class="min-h-62.5">

      <!-- Loading Skeleton -->
      <div
        v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="bg-[#080E1E] rounded-xl aspect-21/9 animate-pulse"
        ></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading && promotions.length === 0"
        class="flex flex-col items-center justify-center py-10 text-gray-400"
      >
        <svg
          class="w-16 h-16 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 13h6m-3-3v6m9 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <p class="text-lg font-medium">
          {{ t("No promotions yet", "ပရိုမိုးရှင်း မရှိသေးပါ", "暂无优惠", "ยังไม่มีโปรโมชั่น") }}
        </p>
        <p class="text-sm mt-1 text-gray-500">
          {{ t("Please check again later.", "နောက်တစ်ကြိမ် ပြန်လည်စစ်ဆေးပါ။", "请稍后再查看。",
          "กรุณาตรวจสอบอีกครั้งในภายหลัง") }}
        </p>
      </div>

      <!-- Promotion Cards -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <PromotionCard
          v-for="promotion in promotions"
          :key="promotion.id"
          :promotion="promotion"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
