<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { showConfirmDialog } from "vant";
import { useTranslation } from "../composables/useTranslation";
import { usePerformanceMode } from "../composables/usePerformanceMode";

const gradientStyle = ref("");
const imageRef = ref(null);
const { reduceEffects } = usePerformanceMode();

const route = useRoute();
const { t } = useTranslation();

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["unfavorited"]);

// Favorite state: from game.is_favourite, updated on toggle
const isFavourite = ref(Boolean(props.game?.is_favourite));
watch(
  () => props.game?.is_favourite,
  (val) => {
    isFavourite.value = Boolean(val);
  },
  { immediate: true },
);

async function toggleFavorite(ev) {
  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  const gameId = props.game?.id ?? props.game?.gameID;
  if (gameId == null) return;
  const next = !isFavourite.value;

  // When removing from favorites, show confirm dialog first
  if (!next) {
    try {
      await showConfirmDialog({
        title: t("Remove from Favorites?", "အကြိုက်ဆုံးစာရင်းမှ ဖယ်မှာလား?", "确定从收藏中移除？", "ลบออกจากรายการโปรด?"),
        message: t("This game will be removed from your favorites.", "ဤဂိမ်းကို သင့်အကြိုက်ဆုံးစာရင်းမှ ဖယ်ရှားပါမည်။", "此游戏将从您的收藏中移除。", "เกมนี้จะถูกลบออกจากรายการโปรดของคุณ"),
        cancelButtonText: t("Cancel", "မလုပ်တော့ပါ။", "取消", "ยกเลิก"),
        confirmButtonText: t("Remove", "ဖယ်ရှားမည်", "移除", "ลบ"),
        theme: "round-button",
        className: "unfavorite-confirm-dialog",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#94a3b8",
      });
    } catch {
      return; // User cancelled
    }
  }

  try {
    await axios.post(
      `/user/favorites/games/${gameId}/toggle`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );
    isFavourite.value = next;
    if (!next) emit("unfavorited", props.game);
  } catch (e) {
    console.error("Toggle favorite failed:", e);
  }
}

// Stop click from bubbling to parent wrapper so game play popup doesn't open when clicking favorite
function onRootClick(ev) {
  if (ev.target.closest("[data-game-card-favorite]")) {
    ev.stopPropagation();
    ev.preventDefault();
  }
}

const showTitle = computed(() => {
  const hiddenRoutes = ["lottery", "live", "cockfighting", "card-games", "sports"];
  return !hiddenRoutes.includes(route.name);
});

// Stable random pastel color per game (same game = same color)
const pastelColor = computed(() => {
  const seed = `${props.game?.id ?? ""}-${props.game?.title ?? ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash % 360);
  const s = 52 + (Math.abs(hash) % 18);
  const l = 78 + (Math.abs(hash >> 8) % 12);
  return `hsl(${h}, ${s}%, ${l}%)`;
});

// Gradient overlay: pastel at bottom fading to transparent so game image shows through
const pastelGradientStyle = computed(() => {
  const pastel = pastelColor.value;
  const pastelWithAlpha = pastel.replace("hsl(", "hsla(").replace(")", ", 0.82)");
  return `linear-gradient(to top, ${pastelWithAlpha} 0%, ${pastel.replace("hsl(", "hsla(").replace(")", ", 0.45)")} 40%, transparent 100%)`;
});

// Values that change every 2s
const activeUsers = ref("0");
const rtpPercent = ref("96.00");
let tickInterval = null;

function updateBadgeValues() {
  activeUsers.value = String(0 + Math.floor(Math.random() * 70));
  rtpPercent.value = (96 + Math.random() * 15).toFixed(2);
}

// Extract dominant colors from image bottom portion
const extractColorsFromImage = (img) => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Check if image has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Focus on bottom 40% of the image for gradient colors
      const bottomStart = Math.floor(canvas.height * 0.6);
      const sampleHeight = canvas.height - bottomStart;
      const sampleWidth = canvas.width;

      // Sample pixels from bottom portion
      const imageData = ctx.getImageData(
        0,
        bottomStart,
        sampleWidth,
        sampleHeight,
      );
      const pixels = imageData.data;

      // Collect colors with their frequencies
      const colorMap = new Map();
      const step = 4; // Sample every 4th pixel for performance

      for (let i = 0; i < pixels.length; i += step * 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Skip very transparent pixels
        if (a < 128) continue;

        // Quantize colors to reduce noise
        const quantizedR = Math.floor(r / 32) * 32;
        const quantizedG = Math.floor(g / 32) * 32;
        const quantizedB = Math.floor(b / 32) * 32;

        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }

      // Get top 3 most frequent colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([color]) => {
          const [r, g, b] = color.split(",").map(Number);
          return { r, g, b };
        });

      // If we have colors, use them; otherwise use default
      if (sortedColors.length > 0) {
        const color1 = sortedColors[0];
        const color2 = sortedColors[1] || sortedColors[0];
        const color3 = sortedColors[2] || sortedColors[0];

        // Create gradient with extracted colors
        const fromColor = `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.85)`;
        const viaColor = `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.6)`;
        const toColor = `rgba(${color3.r}, ${color3.g}, ${color3.b}, 0.3)`;

        resolve({
          from: fromColor,
          via: viaColor,
          to: "transparent",
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      // Handle CORS or other errors silently
      console.warn("Could not extract colors from image:", error);
      resolve(null);
    }
  });
};

const defaultGradient =
  "linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.45) 35%, rgba(0, 0, 0, 0.2) 65%, transparent 100%)";

const handleImageLoad = async () => {
  if (!imageRef.value?.complete) return;
  if (reduceEffects.value) {
    gradientStyle.value = defaultGradient;
    return;
  }
  const colors = await extractColorsFromImage(imageRef.value);
  if (colors) {
    gradientStyle.value = `linear-gradient(to top, ${colors.from} 0%, ${colors.via} 40%, ${colors.to} 70%, transparent 100%)`;
  } else {
    gradientStyle.value = defaultGradient;
  }
};

onMounted(() => {
  updateBadgeValues();
  if (!reduceEffects.value) {
    tickInterval = setInterval(updateBadgeValues, 2000);
  }
  if (imageRef.value?.complete) {
    handleImageLoad();
  }
});

onBeforeUnmount(() => {
  if (tickInterval) clearInterval(tickInterval);
});
</script>

<template>
  <div
    class="relative group cursor-pointer rounded-xl overflow-hidden bg-[#080E1E] transition-all duration-300 hover:scale-105 md:hover:scale-[1.04] md:hover:ring-2 md:hover:ring-[#1986E1]/40 game-card-container"
    @click="onRootClick"
  >
    <!-- Game Image -->
    <div class="relative aspect-3/4 overflow-hidden">
      <img
        ref="imageRef"
        :src="game?.image"
        :alt="game?.title"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
        :class="{ 'group-hover:blur-sm': !reduceEffects }"
        @load="handleImageLoad"
      />

      <!-- Gradient Overlay at Bottom (extracted from image colors) -->
      <div
        v-if="gradientStyle"
        class="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none"
        :style="{ background: gradientStyle }"
      ></div>
      <!-- Default gradient overlay while loading -->
      <div
        v-else
        class="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none"
        style="
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.75) 0%,
            rgba(0, 0, 0, 0.45) 35%,
            rgba(0, 0, 0, 0.2) 65%,
            transparent 100%
          );
        "
      ></div>

      <!-- Shimmer wave: transparent light sweep left to right (disabled when reduceEffects for smoother Android) -->
      <div
        class="card-shimmer absolute inset-0 pointer-events-none z-1"
        :class="{ 'card-shimmer-off': reduceEffects }"
        aria-hidden="true"
      ></div>

      <!-- Active users badge (green paw) -->
      <div
        class="absolute top-5 left-0.5 z-10 flex items-center gap-1.5 px-1 py-0.4 rounded-lg badge-bg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="#22c55e"
          class="shrink-0"
        >
          <ellipse cx="12" cy="16" rx="4" ry="3" />
          <circle cx="9" cy="10" r="2" />
          <circle cx="15" cy="10" r="2" />
          <circle cx="12" cy="8" r="1.5" />
        </svg>
        <span class="text-white text-[7px] font-medium">{{ activeUsers }}</span>
      </div>

      <!-- RTP badge (blue diamond) -->
      <div
        class="absolute top-0.5 left-0.5 z-10 flex items-center gap-1.5 px-1 py-0.5 rounded-lg badge-bg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="#1986E1"
          class="shrink-0"
        >
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
        <span class="text-white text-[7px] font-medium"
          >RTP {{ rtpPercent }}%</span
        >
      </div>

      <!-- Heart Icon (Favorite) - wrapper stops propagation so parent game click never fires -->
      <div
        data-game-card-favorite
        class="absolute top-0.5 right-0.5 z-30"
        @click.stop.prevent
      >
        <button
          type="button"
          class="p-1 rounded-full transition-colors favorite-btn-bg"
          :class="isFavourite ? 'bg-red-500/80 hover:bg-red-500' : 'bg-black/50 hover:bg-black/70'"
          @click.stop.prevent="toggleFavorite($event)"
        >
        <!-- Filled heart when favourited -->
        <svg
          v-if="isFavourite"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
        <!-- Outline heart when not favourited -->
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          />
        </svg>
        </button>
      </div>

      <!-- Play Now Button (Shows on Hover) - pointer-events-none when hidden so heart receives clicks -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none group-hover:pointer-events-auto"
      >
        <button
          type="button"
          class="btn-app btn-app-blue px-4 py-2 font-bold text-sm transition-all transform scale-90 group-hover:scale-100 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          Play Now
        </button>
      </div>
      <!-- Title bar: stronger overlay + emphasized white title -->
      <div
        v-if="showTitle"
        class="absolute bottom-0 left-0 right-0 flex items-end"
      >
        <div
          class="w-full pt-8 pb-1.5 px-3 text-center"
          :style="{ background: pastelGradientStyle }"
        >
          <h3
            class="text-white font-['Pyidaungsu','Padauk',sans-serif] text-xs font-medium leading-snug line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          >
            {{ game?.title }}
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* GPU-friendly containment for smoother scrolling on Android */
.game-card-container {
  content-visibility: auto;
  contain-intrinsic-size: 0 180px;
}

/* Solid background instead of backdrop-blur for smoother Android */
.badge-bg {
  background: rgba(0, 0, 0, 0.65);
}

.favorite-btn-bg {
  background-clip: padding-box;
}

/* Transparent wave / shimmer: light sweep from left to right */
.card-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 25%,
    rgba(255, 255, 255, 0.12) 38%,
    rgba(255, 255, 255, 0.38) 50%,
    rgba(255, 255, 255, 0.12) 62%,
    transparent 75%,
    transparent 100%
  );
  background-size: 120% 100%;
  animation: shimmer-wave 4s ease-in-out infinite;
}

.card-shimmer-off {
  animation: none;
  opacity: 0;
}

@keyframes shimmer-wave {
  /* Fast left-to-right sweep; at 11% wave fades out so it disappears completely */
  0% {
    background-position: 200% 0;
    opacity: 1;
  }
  10% {
    background-position: -100% 0;
    opacity: 1;
  }
  11% {
    background-position: -100% 0;
    opacity: 0;
  }
  99% {
    opacity: 0;
  }
  100% {
    background-position: 200% 0;
    opacity: 0;
  }
}
</style>
