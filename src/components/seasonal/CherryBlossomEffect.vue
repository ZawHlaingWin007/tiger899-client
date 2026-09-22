<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#fff"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 55 }, (_, i) => {
    const size = 14 + Math.random() * 18;
    const duration = 10 + Math.random() * 16;
    const drift = -40 + Math.random() * 80;
    const rot = 90 + Math.random() * 360;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * duration,
      size,
      drift,
      rot,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.5 + Math.random() * 0.45,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="cherry-piece"
      :style="{
        left: p.left + '%',
        top: '-50px',
        width: p.size + 'px',
        height: p.size + 'px',
        animationDuration: p.animationDuration + 's',
        animationDelay: p.animationDelay + 's',
        '--drift': p.drift + 'px',
        '--rot': p.rot + 'deg',
        opacity: p.opacity,
      }"
    >
      <svg viewBox="0 0 24 24" class="w-full h-full" :style="{ color: p.color }">
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="currentColor" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="currentColor" transform="rotate(72 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="currentColor" transform="rotate(144 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="currentColor" transform="rotate(216 12 12)" />
        <ellipse cx="12" cy="12" rx="8" ry="4" fill="currentColor" transform="rotate(288 12 12)" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.cherry-piece {
  position: absolute;
  will-change: transform;
  animation: cherry-fall linear infinite;
}

@keyframes cherry-fall {
  0% {
    transform: translateY(-80px) translateX(0) rotate(0deg);
  }
  100% {
    transform: translateY(calc(100vh + 80px)) translateX(var(--drift, 0)) rotate(var(--rot, 360deg));
  }
}
</style>
