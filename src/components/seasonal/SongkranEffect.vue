<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);

onMounted(async () => {
  await nextTick();
  particles.value = Array.from({ length: 70 }, (_, i) => {
    const size = 4 + Math.random() * 10;
    const duration = 3 + Math.random() * 5;
    const drift = -60 + Math.random() * 120;
    return {
      id: i,
      left: Math.random() * 100,
      animationDuration: duration,
      animationDelay: Math.random() * 3,
      size,
      drift,
      opacity: 0.4 + Math.random() * 0.4,
    };
  });
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="songkran-drop"
      :style="{
        left: p.left + '%',
        top: '-20px',
        width: p.size + 'px',
        height: p.size * 1.2 + 'px',
        animationDuration: p.animationDuration + 's',
        animationDelay: p.animationDelay + 's',
        '--drift': p.drift + 'px',
        opacity: p.opacity,
      }"
    />
  </div>
</template>

<style scoped>
.songkran-drop {
  position: absolute;
  will-change: transform;
  background: linear-gradient(180deg, rgba(147, 197, 253, 0.8) 0%, rgba(96, 165, 250, 0.5) 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: songkran-fall linear infinite;
}

@keyframes songkran-fall {
  0% {
    transform: translateY(-40px) translateX(0);
  }
  100% {
    transform: translateY(calc(100vh + 40px)) translateX(var(--drift, 0));
  }
}
</style>
