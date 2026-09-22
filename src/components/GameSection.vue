<script setup>
import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Grid } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/grid";
import GameCard from "./GameCard.vue";

import { ref } from "vue";
import { useTranslation } from "../composables/useTranslation";

const { t } = useTranslation();
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  games: {
    type: Array,
    required: true,
  },
  swiperRef: {
    type: Object,
    required: true,
  },
  // Optional number of grid rows (1 = single row)
  gridRows: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["next", "prev", "game-click", "more-click"]);

const handleGameClick = (game) => {
  emit("game-click", game);
};

const swiperInstance = ref(null);

const onSwiper = (swiper) => {
  swiperInstance.value = swiper;
};

const handlePrev = () => {
  swiperInstance.value?.slidePrev();
  emit("prev");
};

const handleNext = () => {
  swiperInstance.value?.slideNext();
  emit("next");
};
</script>

<template>
  <div class="px-1 space-y-2 md:px-0 md:space-y-4 md:rounded-2xl md:bg-[#080E1E] md:border md:border-white/10 md:p-5">
    <!-- Section Header -->
    <div class="flex items-center justify-between">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#1986E1] text-white">
        <img :src="image" alt="" class="w-4 h-4" />
        <h2
          class="text-sm md:text-base font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ title }}
        </h2>
      </div>
      <div class="flex items-center gap-2">
        <span
          @click="emit('more-click')"
          class="btn-app btn-app-blue text-[11px] md:text-xs py-1 px-2.5 font-semibold block font-['Pyidaungsu','Padauk',sans-serif] cursor-pointer"
        >
          {{ t("See more", "အားလုံးကြည့်ရန်", "查看全部", "ดูทั้งหมด") }}
        </span>
        <div class="flex gap-1.5">
          <button
            @click="handlePrev"
            class="btn-app btn-app-dark w-7 h-7 text-white flex items-center justify-center hover:bg-[#1986E1] transition-colors"
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
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            @click="handleNext"
            class="btn-app btn-app-dark w-7 h-7 text-white flex items-center justify-center hover:bg-[#1986E1] transition-colors"
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
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Games Swiper -->
    <div class="relative">
      <Swiper
        :ref="swiperRef"
        :modules="props.gridRows > 1 ? [Navigation, Grid] : [Navigation]"
        :slides-per-view="3"
        :space-between="10"
        :speed="250"
        v-bind="props.gridRows > 1
          ? {
              grid: {
                rows: props.gridRows,
                fill: 'row',
              },
            }
          : {}"
        @swiper="onSwiper"
        :breakpoints="{
          640: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 24,
          },
          1280: {
            slidesPerView: 6,
            spaceBetween: 24,
          },
        }"
        class="games-swiper"
      >
        <SwiperSlide v-for="game in games" :key="game.id">
          <div @click="handleGameClick(game)">
            <GameCard :game="game" />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  </div>
</template>
