<template>
    <div class="banner-swiper-wrap relative rounded-lg md:rounded-2xl overflow-hidden mb-2 md:mb-0 md:h-full md:bg-[#080E1E]">
        <Swiper
            :modules="swiperModules"
            :slides-per-view="1"
            :space-between="0"
            :loop="true"
            :centered-slides="false"
            :initial-slide="initialSlide"
            :passive-listeners="true"
            :autoplay="{
                delay: 2000,
                disableOnInteraction: false,
            }"
            :pagination="{ clickable: true }"
            :navigation="navigationOptions"
            class="banner-swiper md:h-full"
        >
            <SwiperSlide
                v-for="(slide, index) in slides"
                :key="slide.id"
            >
                <div class="relative overflow-hidden cursor-pointer group md:h-full">
                    <img
                        :src="slide.image"
                        alt=""
                        class="w-full h-full object-cover banner-img md:min-h-[280px] lg:min-h-[320px]"
                        :loading="index === 0 ? 'eager' : 'lazy'"
                        decoding="async"
                    />
                </div>
            </SwiperSlide>
        </Swiper>
        <button
            v-if="!isMobile"
            type="button"
            class="banner-arrow banner-prev"
            aria-label="Previous slide"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>
        <button
            v-if="!isMobile"
            type="button"
            class="banner-arrow banner-next"
            aria-label="Next slide"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </button>
    </div>
</template>

<script setup>
import { ref, h, computed, onMounted } from "vue";

import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Navigation, Pagination, Grid } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/grid";
import axios from "axios";
import promo1 from "../assets/webp/promo1.webp";
import promo2 from "../assets/webp/promo2.webp";
import promo3 from "../assets/webp/promo3.webp";
import promo4 from "../assets/webp/promo4.webp";
import promo5 from "../assets/webp/promo5.webp";

const swiperModules = [Autoplay, Navigation, Pagination];

const MOCK_BANNER_IMAGES = [promo1, promo2, promo3, promo4, promo5];

const props = defineProps({
    isMobile: {
        type: Boolean,
        default: false,
    },
});

const navigationOptions = computed(() => {
    if (props.isMobile) return false;
    return {
        prevEl: ".banner-swiper-wrap .banner-prev",
        nextEl: ".banner-swiper-wrap .banner-next",
    };
});

const fetchBanners = async () => {
    loading.value = true;

    try {
        const { data } = await axios.get("/banners");
        // console.log("Fetched banners:", data);
        slides.value = data.data && data.data.length > 0 ? data.data : mockSlides.value;
    } catch (err) {
        console.error(err);
        slides.value = mockSlides.value;
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchBanners();
});

const slides = ref([]);
const loading = ref(false);


const mockSlides = ref(
    MOCK_BANNER_IMAGES.map((image, index) => ({
        id: index + 1,
        image,
    })),
);
</script>

<style scoped>
.banner-img {
  transform: translateZ(0);
}

:deep(.swiper-pagination) {
  bottom: 12px;
}
:deep(.swiper-pagination-bullet) {
  width: 7px;
  height: 7px;
  background: #fff;
  opacity: 0.35;
  transition: opacity 0.2s ease, width 0.2s ease;
}
:deep(.swiper-pagination-bullet-active) {
  width: 18px;
  border-radius: 999px;
  background: #640ae0;
  opacity: 1;
}
:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
  display: none;
}

.banner-arrow {
  position: absolute;
  top: 50%;
  z-index: 10;
  width: 34px;
  height: 34px;
  margin-top: -17px;
  display: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: rgba(8, 14, 30, 0.72);
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
  cursor: pointer;
}
@media (min-width: 768px) {
  .banner-arrow {
    display: flex;
  }
}
.banner-arrow:hover {
  background: #640ae0;
}
.banner-prev {
  left: 12px;
}
.banner-next {
  right: 12px;
}
</style>