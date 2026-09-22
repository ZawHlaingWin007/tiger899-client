<script setup>
import { computed, ref, watch } from "vue";
import { useTranslation } from "../composables/useTranslation";

const { t, language } = useTranslation();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  selectedKey: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "select"]);

const currentKey = ref(props.selectedKey);
const expanded = ref(new Set());

const findParentKey = (arr, key, parent = null) => {
  for (const i of arr) {
    if (i.key === key) return parent;
    if (i.children) {
      const found = findParentKey(i.children, key, i.key);
      if (found) return found;
    }
  }
  return null;
};

const initExpanded = () => {
  const set = new Set();
  const parentKey = findParentKey(props.items || [], currentKey.value);
  if (parentKey) set.add(parentKey);
  expanded.value = set;
};

watch(
  () => props.selectedKey,
  (key) => {
    currentKey.value = key;
  }
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      currentKey.value = props.selectedKey || props.items?.[0]?.key || "";
      initExpanded();
    }
  }
);

const findItem = (arr, key) => {
  for (const i of arr) {
    if (i.key === key) return i;
    if (i.children) {
      const found = findItem(i.children, key);
      if (found) return found;
    }
  }
  return null;
};

const selectedItem = computed(() => {
  if (!props.items || props.items.length === 0) return null;
  return findItem(props.items, currentKey.value) || props.items[0];
});

// Resolve contentHtml: support object { en, mm, cn, th } or plain string
const resolvedContentHtml = computed(() => {
  const html = selectedItem.value?.contentHtml;
  if (!html) return null;
  if (typeof html === "string") return html;
  const lang = language.value || "mm";
  return html[lang] ?? html.en ?? html.mm ?? html.cn ?? html.th ?? "";
});

const handleClose = () => {
  emit("close");
};

const handleSelect = (key) => {
  currentKey.value = key;
  emit("select", key);
};

const toggleExpand = (key) => {
  const set = new Set(expanded.value);
  if (set.has(key)) {
    set.delete(key);
  } else {
    set.add(key);
  }
  expanded.value = set;
};
</script>

<template>
  <div
    v-if="isOpen"
    class="guide-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    @click.self="handleClose"
  >
    <div
      class="guide-modal-box bg-[#172240] text-white w-full max-w-6xl max-h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
    >
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-white/10"
      >
        <h2 class="text-2xl font-bold font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Guides", "လမ်းညွှန်ချက်များ", "指南", "คู่มือ") }}
        </h2>
        <button
          @click="handleClose"
          class="text-white hover:text-gray-300 transition-colors p-1"
          :aria-label="t('Close', 'ပိတ်မည်', '关闭', 'ปิด')"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
      </div>

      <div class="grid md:grid-cols-[260px_1fr] flex-1 min-h-0">
        <!-- Left nav -->
        <div
          class="border-r border-white/10 overflow-y-auto bg-[#0d1520]"
        >
          <ul class="divide-y divide-white/5">
            <li v-for="item in items" :key="item.key">
              <div class="flex flex-col">
                <button
                  @click="
                    item.children && item.children.length
                      ? toggleExpand(item.key)
                      : handleSelect(item.key)
                  "
                  class="w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors"
                  :class="[
                    item.key === selectedItem?.key
                      ? 'bg-[#1986E1] text-white'
                      : 'hover:bg-white/5 text-white',
                  ]"
                >
                  <span class="font-['Pyidaungsu','Padauk',sans-serif] text-sm">
                    {{ item.title }}
                  </span>
                  <svg
                    v-if="item.children && item.children.length"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform"
                    :class="expanded.has(item.key) ? 'rotate-180' : ''"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div
                  v-if="
                    item.children &&
                    item.children.length &&
                    expanded.has(item.key)
                  "
                  class="pl-4 pb-2 space-y-1 bg-black/10"
                >
                  <button
                    v-for="child in item.children"
                    :key="child.key"
                    @click="handleSelect(child.key)"
                    class="w-full text-left px-3 py-2 rounded-md transition-colors"
                    :class="[
                      child.key === selectedItem?.key
                        ? 'bg-[#1986E1] text-white'
                        : 'hover:bg-white/5 text-white',
                    ]"
                  >
                    <span
                      class="font-['Pyidaungsu','Padauk',sans-serif] text-xs"
                    >
                      {{ child.title }}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Content -->
        <div class="bg-[#0b1320] min-h-0 flex flex-col">
          <div
            class="p-4 flex-1 min-h-0 overflow-auto"
          >
            <div
              class="w-full max-h-full bg-black/20 rounded-lg overflow-auto p-4 flex flex-col min-h-0"
              :class="{ 'min-h-full': !!selectedItem?.imageUrl && !resolvedContentHtml }"
            >
              <template v-if="resolvedContentHtml">
                <div
                  class="prose prose-invert max-w-none text-white/90 font-['Pyidaungsu','Padauk',sans-serif]"
                  v-html="resolvedContentHtml"
                ></div>
              </template>
              <template v-else-if="selectedItem?.imageUrl">
                <div class="flex-1 min-h-0 flex items-stretch">
                  <img
                    :src="selectedItem.imageUrl"
                    :alt="selectedItem.title"
                    class="w-full min-h-full object-contain object-center"
                  />
                </div>
              </template>
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#1e3a8a]/40 to-[#156FBD]/30 flex items-center justify-center text-white/60 font-['Pyidaungsu','Padauk',sans-serif]"
              >
                {{ t("Intro page", "မိတ်ဆက်ပုံဆွဲစာမျက်နှာ", "介绍页", "หน้าแนะนำ") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
