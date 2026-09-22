<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#22c55e", "#16a34a", "#15803d", "#fbbf24", "#facc15"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 65 }, (_, i) => {
    const size = 14 + Math.random() * 14;
    const duration = 7 + Math.random() * 12;
    const drift = -25 + Math.random() * 50;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * duration,
      size,
      drift,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.6 + Math.random() * 0.35,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="stpat-piece"
      :style="{
        left: p.left + '%',
        top: '-40px',
        width: p.size + 'px',
        height: p.size + 'px',
        animationDuration: p.animationDuration + 's',
        animationDelay: p.animationDelay + 's',
        '--drift': p.drift + 'px',
        opacity: p.opacity,
      }"
    >
      <svg viewBox="0 0 24 24" class="w-full h-full" :style="{ color: p.color }">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <circle cx="8" cy="14" r="4" fill="currentColor" />
        <circle cx="16" cy="14" r="4" fill="currentColor" />
        <circle cx="12" cy="18" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.9" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.stpat-piece {
  position: absolute;
  will-change: transform;
  animation: stpat-fall linear infinite;
}

@keyframes stpat-fall {
  0% {
    transform: translateY(-60px) translateX(0) rotate(-15deg);
  }
  100% {
    transform: translateY(calc(100vh + 60px)) translateX(var(--drift, 0)) rotate(345deg);
  }
}
</style>
