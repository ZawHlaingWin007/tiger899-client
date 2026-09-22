<script setup>
import { onMounted, ref, nextTick } from "vue";

const particles = ref([]);
const TYPES = { bat: "bat", ghost: "ghost", pumpkin: "pumpkin" };

onMounted(async () => {
  await nextTick();
  const list = [];
  const add = (type, count) => {
    for (let i = 0; i < count; i++) {
      list.push({
        id: list.length,
        type,
        left: Math.random() * 100,
        size: type === "ghost" ? 18 + Math.random() * 20 : 12 + Math.random() * 18,
        duration: 8 + Math.random() * 14,
        delay: Math.random() * 10,
        drift: -35 + Math.random() * 70,
        sway: 15 + Math.random() * 25,
        opacity: type === "ghost" ? 0.5 + Math.random() * 0.35 : 0.6 + Math.random() * 0.35,
      });
    }
  };
  add("bat", 35);
  add("ghost", 25);
  add("pumpkin", 30);
  particles.value = list;
});
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="p in particles"
      :key="p.id"
      class="halloween-piece"
      :class="{ 'halloween-ghost': p.type === 'ghost' }"
      :style="{
        left: p.left + '%',
        top: '-60px',
        width: p.size + 'px',
        height: p.size + 'px',
        animationDuration: p.duration + 's',
        animationDelay: p.delay + 's',
        '--drift': p.drift + 'px',
        '--sway': p.sway + 'px',
        opacity: p.opacity,
      }"
    >
      <!-- Bat: silhouette with spread wings and body -->
      <svg v-if="p.type === 'bat'" viewBox="0 0 48 24" class="w-full h-full">
        <path
          fill="#1a1a2e"
          d="M24 0 L2 12 L12 14 L24 8 L36 14 L46 12 L24 0 Z"
        />
      </svg>
      <!-- Ghost: classic sheet ghost (body + eyes) -->
      <svg v-else-if="p.type === 'ghost'" viewBox="0 0 24 32" class="w-full h-full">
        <ellipse cx="12" cy="18" rx="10" ry="12" fill="rgba(255,255,255,0.9)" />
        <ellipse cx="12" cy="8" rx="6" ry="6" fill="rgba(255,255,255,0.9)" />
        <circle cx="9" cy="14" r="2.2" fill="#1f2937" />
        <circle cx="15" cy="14" r="2.2" fill="#1f2937" />
      </svg>
      <!-- Jack-o'-lantern: pumpkin with stem and face -->
      <svg v-else viewBox="0 0 32 32" class="w-full h-full">
        <ellipse cx="16" cy="18" rx="11" ry="9" fill="#ea580c" />
        <rect x="14.5" y="3" width="3" height="5" rx="1" fill="#166534" />
        <path fill="#172240" d="M11 15 L14 18 L11 21 Z" />
        <path fill="#172240" d="M21 15 L18 18 L21 21 Z" />
        <path fill="#172240" d="M13 22 L16 26 L19 22 L16 24 Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.halloween-piece {
  position: absolute;
  will-change: transform;
  animation: halloween-fall linear infinite;
}

.halloween-ghost {
  animation: halloween-ghost-fall linear infinite;
}

@keyframes halloween-fall {
  0% {
    transform: translateY(-80px) translateX(0) rotate(-5deg);
  }
  50% {
    transform: translateY(50vh) translateX(var(--drift, 0)) rotate(5deg);
  }
  100% {
    transform: translateY(calc(100vh + 80px)) translateX(var(--drift, 0)) rotate(-5deg);
  }
}

@keyframes halloween-ghost-fall {
  0% {
    transform: translateY(-80px) translateX(0);
  }
  25% {
    transform: translateY(25vh) translateX(calc(var(--drift, 0) + var(--sway, 20px)));
  }
  50% {
    transform: translateY(50vh) translateX(var(--drift, 0));
  }
  75% {
    transform: translateY(75vh) translateX(calc(var(--drift, 0) - var(--sway, 20px)));
  }
  100% {
    transform: translateY(calc(100vh + 80px)) translateX(var(--drift, 0));
  }
}
</style>
