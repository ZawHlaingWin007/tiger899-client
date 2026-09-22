import { ref, computed, onMounted } from "vue";

/**
 * Detects Android and mobile for performance optimizations.
 * Use to disable expensive effects (canvas, backdrop-blur, heavy animations) on Android.
 */
export function usePerformanceMode() {
  const isAndroid = ref(false);
  const isMobile = ref(false);
  const prefersReducedMotion = ref(false);

  onMounted(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || "";
      isAndroid.value = /Android/i.test(ua);
    }
    if (typeof window !== "undefined") {
      isMobile.value = window.innerWidth < 768;
      if (window.matchMedia) {
        prefersReducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
    }
  });

  const reduceEffects = computed(() => isAndroid.value || prefersReducedMotion.value);

  return { isAndroid, isMobile, prefersReducedMotion, reduceEffects };
}
