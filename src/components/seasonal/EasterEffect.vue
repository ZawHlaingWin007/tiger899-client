<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#fce7f3", "#fbcfe8", "#ddd6fe", "#c4b5fd", "#bbf7d0", "#fef08a", "#fed7aa"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 50 }, (_, i) => {
    const size = 16 + Math.random() * 20;
    const duration = 8 + Math.random() * 14;
    const drift = -35 + Math.random() * 70;
    const rot = 180 + Math.random() * 360;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * duration,
      size,
      drift,
      rot,
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
      class="easter-piece"
      :style="{
        left: p.left + '%',
        top: '-50px',
        width: p.size + 'px',
        height: p.size * 0.85 + 'px',
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
.easter-piece {
  position: absolute;
  will-change: transform;
  border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%;
  animation: easter-fall linear infinite;
}

@keyframes easter-fall {
  0% {
    transform: translateY(-60px) translateX(0) rotate(0deg);
  }
  100% {
    transform: translateY(calc(100vh + 60px)) translateX(var(--drift, 0)) rotate(var(--rot, 360deg));
  }
}
</style>
