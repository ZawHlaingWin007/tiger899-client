<script setup>
import { ref } from "vue";

defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
});

const expanded = ref(false);

const links = [
  {
    label: "Telegram",
    icon: "telegram",
    href: "https://t.me/Eazywin8",
  },
  {
    label: "Facebook",
    icon: "facebook",
    href: "https://www.facebook.com/profile.php?id=61593202325346",
  },
  {
    label: "Viber",
    icon: "viber",
    href: "https://viber.me/959663263464",
  },
];

const toggle = () => {
  expanded.value = !expanded.value;
};
</script>

<template>
  <transition name="slide-right">
    <div
      v-if="visible"
      class="fixed right-0 top-[42%] z-40 flex flex-col items-end"
    >
      <transition-group name="fab-stack" tag="div" class="flex flex-col items-end gap-2 mb-2 pr-2">
        <a
          v-for="link in expanded ? links : []"
          :key="link.icon"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="fab-btn fab-dark w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white"
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
        aria-label="Contact"
        @click="toggle"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
          <path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2z" />
          <path d="M20 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z" />
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
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 16px 0 0 16px;
  color: #fff;
  background: linear-gradient(180deg, #640ae0 0%, #511799 100%);
  box-shadow: 0 8px 20px rgba(81, 23, 153, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-stack-enter-active,
.fab-stack-leave-active {
  transition: all 0.2s ease;
}
.fab-stack-enter-from,
.fab-stack-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
