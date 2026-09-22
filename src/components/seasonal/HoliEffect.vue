<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#1986E1", "#8b5cf6", "#ec4899"];

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 90 }, (_, i) => {
    const size = 8 + Math.random() * 20;
    const duration = 5 + Math.random() * 10;
    const drift = -50 + Math.random() * 100;
    const rot = 180 + Math.random() * 540;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * 5,
      size,
      drift,
      rot,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.6 + Math.random() * 0.4,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="holi-piece"
      :style="{
        left: p.left + '%',
        top: '-30px',
        width: p.size + 'px',
        height: p.size + 'px',
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
.holi-piece {
  position: absolute;
  will-change: transform;
  border-radius: 50%;
  animation: holi-fall linear infinite;
}

@keyframes holi-fall {
  0% {
    transform: translateY(-80px) translateX(0) rotate(0deg) scale(1);
  }
  100% {
    transform: translateY(calc(100vh + 80px)) translateX(var(--drift, 0)) rotate(var(--rot, 360deg)) scale(0.8);
  }
}
</style>
