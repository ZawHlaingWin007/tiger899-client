<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  announcements: {
    type: Array,
    default: () => [],
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
  // Optional fallback image if no announcements are provided
  imageUrl: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);

const selectedIndex = ref(props.initialIndex);

const clampIndex = () => {
  const total = props.announcements?.length || 0;
  if (total === 0) {
    selectedIndex.value = 0;
    return;
  }
  if (selectedIndex.value >= total) {
    selectedIndex.value = total - 1;
  }
  if (selectedIndex.value < 0) {
    selectedIndex.value = 0;
  }
};

watch(
  () => props.announcements,
  (val) => {
    if (val && val.length) {
      clampIndex();
    }
  }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedIndex.value = props.initialIndex || 0;
      clampIndex();
    }
  }
);

const selectedAnnouncement = computed(() => {
  if (props.announcements && props.announcements.length > 0) {
    return props.announcements[selectedIndex.value] || props.announcements[0];
  }
  return props.imageUrl
    ? { title: "ကြေငြာချက်", imageUrl: props.imageUrl }
    : null;
});

const handleClose = () => {
  emit("close");
};

const handleSelect = (idx) => {
  selectedIndex.value = idx;
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-2 sm:px-4"
    @click.self="handleClose"
  >
    <div
      class="bg-[#080E1E] rounded-lg sm:rounded-lg w-full max-w-4xl relative shadow-2xl overflow-hidden border border-white/10 h-[90vh] sm:h-auto flex flex-col"
    >
      <!-- Close Button -->
      <button
        @click="handleClose"
        class="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-white cursor-pointer hover:text-gray-300 transition-colors p-2"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          class="sm:w-6 sm:h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Title -->
      <div class="p-3 sm:p-5 text-center border-b border-white/5">
        <h2
          class="text-white text-xl sm:text-3xl font-bold font-['Pyidaungsu','Padauk',sans-serif]"
        >
          ကြေငြာချက်
        </h2>
      </div>

      <div class="flex flex-col sm:flex-row border-t border-white/5 flex-1 overflow-hidden">
        <!-- Left announcement list -->
        <div
          class="w-full sm:w-[280px] bg-[#172240] border-b sm:border-b-0 sm:border-r border-white/5 max-h-[200px] sm:max-h-[75vh] overflow-y-auto shrink-0"
        >
          <ul class="divide-y divide-white/5 flex sm:flex-col flex-row overflow-x-auto sm:overflow-x-visible">
            <li v-for="(item, idx) in announcements" :key="idx" class="group shrink-0 sm:shrink">
              <button
                class="w-full sm:w-full min-w-[120px] sm:min-w-0 text-left px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2 text-white transition-colors"
                :class="[
                  idx === selectedIndex
                    ? 'bg-[#1986E1] text-white'
                    : 'hover:bg-white/5',
                ]"
                @click="handleSelect(idx)"
              >
                <span
                  class="font-['Pyidaungsu','Padauk',sans-serif] text-xs sm:text-sm line-clamp-1"
                >
                  {{ item.title }}
                </span>
                <span
                  class="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center transition-transform shrink-0"
                  :class="idx === selectedIndex ? 'rotate-180' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    class="sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Main banner -->
        <div class="flex-1 bg-[#172240] max-h-[calc(90vh-180px)] sm:max-h-[75vh] overflow-auto">
          <div
            class="p-2 sm:p-4 flex min-h-[300px] sm:h-[400px] overflow-auto items-center justify-center"
          >
            <img
              v-if="selectedAnnouncement?.imageUrl"
              :src="selectedAnnouncement.imageUrl"
              :alt="selectedAnnouncement.title || 'Announcement Banner'"
              class="w-full h-auto max-h-[calc(90vh-200px)] sm:max-h-[70vh] object-contain rounded-md shadow-lg"
            />
            <div
              v-else
              class="w-full h-[300px] sm:h-[500px] bg-gradient-to-br from-[#10b981]/20 to-[#059669]/10 flex items-center justify-center rounded-md"
            >
              <p class="text-white/50 font-['Pyidaungsu','Padauk',sans-serif] text-sm sm:text-base">
                Promotional Banner
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
