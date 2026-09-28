<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
});

const SIZE = 40;
const MARGIN = 8;
const DRAG_THRESHOLD = 8;
const STORAGE_KEY = "tiger899-contact-fab-pos";

const expanded = ref(false);
const dragging = ref(false);

let pointerId = null;
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;
let moved = false;

const clamp = (x, y) => {
  const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - SIZE - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, x), maxX),
    y: Math.min(Math.max(MARGIN, y), maxY),
  };
};

const defaultPosition = () =>
  clamp(window.innerWidth - SIZE - MARGIN, Math.round(window.innerHeight * 0.42));

const readPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return clamp(saved.x, saved.y);
    }
  } catch {
    // Ignore unreadable storage and fall back to the default spot.
  }
  return defaultPosition();
};

const pos = ref(readPosition());
const openBelow = computed(() => pos.value.y < 168);

const onResize = () => {
  pos.value = clamp(pos.value.x, pos.value.y);
};

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

const links = [
  {
    label: "Telegram",
    icon: "telegram",
    href: "https://t.me/Tiger899_supportbot",
  },
  {
    label: "Facebook",
    icon: "facebook",
    href: "https://www.facebook.com/share/1Gjd9xnBye/",
  },
  {
    label: "Viber",
    icon: "viber",
    href: "https://msng.link/o?959764319867=vi",
  },
];

const onPointerDown = (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  dragging.value = true;
  moved = false;
  pointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  originX = pos.value.x;
  originY = pos.value.y;
  event.currentTarget.setPointerCapture(event.pointerId);
};

const onPointerMove = (event) => {
  if (!dragging.value || event.pointerId !== pointerId) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (!moved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    moved = true;
    originX = pos.value.x - dx;
    originY = pos.value.y - dy;
  }
  pos.value = clamp(originX + dx, originY + dy);
};

const finishPointer = (event, toggleOnTap) => {
  if (event.pointerId !== pointerId) return;
  dragging.value = false;
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  pointerId = null;
  if (moved) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos.value));
    } catch {
      // Position still applies for this visit if storage is unavailable.
    }
    return;
  }
  if (toggleOnTap) expanded.value = !expanded.value;
};

const onPointerUp = (event) => finishPointer(event, true);
const onPointerCancel = (event) => finishPointer(event, false);
</script>

<template>
  <transition name="slide-right">
    <div
      v-if="visible"
      class="fixed z-40"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    >
      <transition-group
        name="fab-stack"
        tag="div"
        class="absolute left-1/2 flex w-max -translate-x-1/2 flex-col items-center gap-2"
        :class="openBelow ? 'top-full mt-2' : 'bottom-full mb-2'"
      >
        <a
          v-for="link in expanded ? links : []"
          :key="link.icon"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="fab-btn fab-dark flex h-11 w-11 items-center justify-center rounded-full text-white md:h-12 md:w-12"
          :title="link.label"
        >
          <svg
            v-if="link.icon === 'telegram'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21.5 3.5 2.8 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3.9-.1.6.2l-9 8.7-.3 4.6c.4 0 .6-.2.9-.5l2.1-2 4.4 3.2c.8.5 1.4.2 1.6-.7l3.7-17.3c.3-1.2-.5-1.8-1.6-1.3z" />
          </svg>
          <svg
            v-else-if="link.icon === 'facebook'"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M14.5 8.5V6.8c0-.8.5-1 1.1-1h2.3V2h-3.2C11.8 2 10 3.8 10 6.6v1.9H7.5V12H10v10h4.5V12h3l.5-3.5h-3.5z" />
          </svg>
          <svg
            v-else-if="link.icon === 'viber'"
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16.5 3h-9A3.5 3.5 0 0 0 4 6.5v11A3.5 3.5 0 0 0 7.5 21h4.8l1.7-1.7a1.2 1.2 0 0 1 .85-.35H16a4 4 0 0 0 4-4v-8a4 4 0 0 0-3.5-3.95Z"></path>
            <path d="M8 9h1"></path>
            <path d="M8 12h3"></path>
            <path d="M8 15h2"></path>
            <path d="M12 9h4"></path>
          </svg>
        </a>
      </transition-group>

      <button
        type="button"
        class="fab-contact"
        :class="{ 'is-dragging': dragging }"
        aria-label="Contact"
        title="Drag to move"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @contextmenu.prevent
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(130%);
  opacity: 0;
}

.fab-btn {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
.fab-dark {
  background: #16062b;
}

.fab-contact {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(180deg, #640ae0 0%, #511799 100%);
  box-shadow: 0 6px 16px rgba(81, 23, 153, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.fab-contact.is-dragging {
  cursor: grabbing;
}

.fab-stack-enter-active,
.fab-stack-leave-active {
  transition: all 0.2s ease;
}
.fab-stack-enter-from,
.fab-stack-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
