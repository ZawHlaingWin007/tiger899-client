<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#ec4899", "#f472b6", "#fbbf24", "#fda4af", "#fff"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 60 }, (_, i) => {
    const size = 12 + Math.random() * 16;
    const duration = 7 + Math.random() * 12;
    const drift = -30 + Math.random() * 60;
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
      class="valentine-piece"
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
        <path
          fill="currentColor"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.valentine-piece {
  position: absolute;
  will-change: transform;
  animation: valentine-fall linear infinite;
}

@keyframes valentine-fall {
  0% {
    transform: translateY(-60px) translateX(0) rotate(-20deg);
  }
  100% {
    transform: translateY(calc(100vh + 60px)) translateX(var(--drift, 0)) rotate(340deg);
  }
}
</style>
