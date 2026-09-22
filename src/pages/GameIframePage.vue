<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import { useTranslation } from "../composables/useTranslation";

const router = useRouter();
const route = useRoute();
const store = useStore();
const { t } = useTranslation();

const gameUrl = ref("");

// Only use mobile-style iframe on PC; on mobile always show normal full-width iframe
const isDesktop = ref(
  typeof window !== "undefined" && window.innerWidth >= 768
);
const updateIsDesktop = () => {
  isDesktop.value = window.innerWidth >= 768;
};

const shouldUseMobileFrame = computed(() => {
  const wantMobileFrame = !!(
    store.state.forceMobileFrame ||
    route.query?.mobileFrame === "1" ||
    (typeof history !== "undefined" && history.state?.forceMobileFrame)
  );
  return wantMobileFrame && isDesktop.value;
});

const goHome = () => {
  store.commit("setIframeURL", null);
  store.commit("setForceMobileFrame", false);
  router.replace({ name: "home" });
};

const goBack = () => {
  store.commit("setIframeURL", null);
  store.commit("setForceMobileFrame", false);
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace({ name: "home" });
  }
};

onMounted(() => {
  updateIsDesktop();
  window.addEventListener("resize", updateIsDesktop);
  const url =
    store.state.iframeURL ??
    route.state?.gameUrl ??
    route.query?.url ??
    (typeof route.params?.url === "string" ? route.params.url : "");
  if (url) {
    gameUrl.value = url;
  } else {
    goHome();
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", updateIsDesktop);
  store.commit("setIframeURL", null);
  store.commit("setForceMobileFrame", false);
});

watch(
  () => route.state?.gameUrl ?? store.state.iframeURL,
  (url) => {
    if (url) gameUrl.value = url;
  }
);

const hasUrl = computed(() => !!gameUrl.value);
</script>

<template>
  <div class="game-iframe-wrapper">
    <!-- Top bar: Back + Home (above iframe, own layer) -->
    <header class="game-iframe-header">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
        @click="goBack"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>{{ t("Back", "ပြန်သွား", "返回", "กลับ") }}</span>
      </button>
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1986E1] text-white hover:bg-[#156FBD] transition"
        @click="goHome"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span>{{ t("Home", "ပင်မစာမျက်နှာ", "首页", "หน้าแรก") }}</span>
      </button>
    </header>

    <!-- Iframe: full area below header, no overlay so game receives clicks -->
    <div
      v-if="hasUrl"
      class="game-iframe-container"
      :class="{ 'game-iframe-container--mobile-frame': shouldUseMobileFrame }"
    >
      <div
        v-if="shouldUseMobileFrame"
        class="game-iframe-mobile-frame"
      >
        <iframe
          :src="gameUrl"
          class="game-iframe-mobile"
          title="Game"
          allowfullscreen
          allow="payment; fullscreen; autoplay; pointer-lock"
        />
      </div>
      <iframe
        v-else
        :src="gameUrl"
        class="game-iframe"
        title="Game"
        allowfullscreen
        allow="payment; fullscreen; autoplay; pointer-lock"
      />
    </div>
  </div>
</template>

<style scoped>
.game-iframe-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-top: env(safe-area-inset-top, 0);
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  background: #172240;
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
}

/* Header: fixed height, on top, so iframe is strictly below */
.game-iframe-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(15, 25, 37, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1;
}

/* Iframe container: takes remaining height, no overlay, clicks pass through to iframe */
.game-iframe-container {
  flex: 1 1 0;
  min-height: 0;
  position: relative;
  z-index: 0;
  background: #172240;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* When showing mobile frame: subtle background so the phone stands out */
.game-iframe-container--mobile-frame {
  background: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(15, 23, 42, 0.98) 50%,
    #0a0f1a 100%
  );
}

.game-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  pointer-events: auto;
}

.game-iframe-mobile-frame {
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100%;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-iframe-mobile {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  pointer-events: auto;
}
</style>
