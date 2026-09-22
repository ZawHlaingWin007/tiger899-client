<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#dc2626", "#b91c1c", "#fbbf24", "#f59e0b", "#fcd34d"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 70 }, (_, i) => {
    const size = 10 + Math.random() * 18;
    const duration = 8 + Math.random() * 14;
    const drift = -25 + Math.random() * 50;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * duration,
      size,
      drift,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.5 + Math.random() * 0.4,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="cny-piece"
      :style="{
        left: p.left + '%',
        top: '-30px',
        width: p.size + 'px',
        height: p.size + 'px',
        animationDuration: p.animationDuration + 's',
        animationDelay: p.animationDelay + 's',
        '--drift': p.drift + 'px',
        opacity: p.opacity,
      }"
    >
      <svg viewBox="0 0 24 24" class="w-full h-full" :style="{ color: p.color }">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.4)" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.cny-piece {
  position: absolute;
  will-change: transform;
  animation: cny-fall linear infinite;
}

@keyframes cny-fall {
  0% {
    transform: translateY(-80px) translateX(0) rotate(0deg);
  }
  100% {
    transform: translateY(calc(100vh + 80px)) translateX(var(--drift, 0)) rotate(360deg);
  }
}
</style>
