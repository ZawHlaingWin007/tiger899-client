<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#fbbf24", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4", "#22c55e", "#fff"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 80 }, (_, i) => {
    const size = 6 + Math.random() * 12;
    const duration = 5 + Math.random() * 12;
    const drift = -40 + Math.random() * 80;
    const rot = 360 + Math.random() * 720;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * 6,
      size,
      drift,
      rot,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.7 + Math.random() * 0.3,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="confetti-piece"
      :style="{
        left: p.left + '%',
        top: '-20px',
        width: p.size + 'px',
        height: p.size * 0.6 + 'px',
        backgroundColor: p.color,
        opacity: p.opacity,
        animationDuration: p.animationDuration + 's',
        animationDelay: p.animationDelay + 's',
        '--drift': p.drift + 'px',
        '--rot': p.rot + 'deg',
      }"
    />
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  will-change: transform;
  border-radius: 2px;
  animation: confetti-fall linear infinite;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-50px) translateX(0) rotate(0deg);
  }
  100% {
    transform: translateY(calc(100vh + 50px)) translateX(var(--drift, 0)) rotate(var(--rot, 360deg));
  }
}
</style>
