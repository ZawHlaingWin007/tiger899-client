<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "@/composables/useTranslation";
import { useModal } from "@/composables/useModal";

const router = useRouter();
const { t } = useTranslation();
const { openLuckySpinModal } = useModal();

const expanded = ref(false);
const dismissed = ref(false);

/** en, mm, cn, th — passed to t() for each quick-bar label */
const staticItemsBase = [
  {
    id: "promo",
    image: "/promo.png",
    to: { name: "promo-code-claim" },
    alt: "Promotion",
    labelKey: ["Promo Code", "ပရိုမိုကုဒ်", "优惠码", "รหัสโปรโมชั่น"],
  },
  {
    id: "invite",
    image: "/rewards.png",
    to: { name: "invite" },
    alt: "Invite",
    labelKey: ["Invite", "ဖိတ်ခေါ်ခြင်း", "邀请", "เชิญชวน"],
  },
  {
    id: "spin",
    image: "/spin.png",
    to: { name: "home" },
    alt: "Spin",
    labelKey: ["Lucky Spin", "ကံစမ်းလှည့်", "幸运转盘", "หมุนลุ้นโชค"],
  },
];

const items = computed(() => {
  const list = [];
  const staticWithLabels = staticItemsBase.map(({ labelKey, ...rest }) => ({
    ...rest,
    label: t(...labelKey),
  }));
  return [...list, ...staticWithLabels];
});

const go = (to) => {
  if (!to?.name) return;
  router.push(to).catch(() => {});
};

const handleItemClick = (item) => {
  if (item?.id === "spin") {
    openLuckySpinModal();
    return;
  }
  go(item?.to);
};

const dismissBar = () => {
  dismissed.value = true;
};

const swipeKey = ref(0);
watch(expanded, (isExpanded) => {
  if (!isExpanded) swipeKey.value += 1;
});
</script>

<template>
  <div
    v-if="!dismissed"
    class="fq-anchor pointer-events-none fixed right-3 z-55 flex flex-col items-end md:right-20"
  >
    <div class="pointer-events-auto flex flex-col items-end gap-2">
      <Transition name="fq-mode" mode="out-in">
        <!-- Expanded: pill + collapse -->
        <div
          v-if="expanded"
          key="expanded"
          class="flex flex-col items-end gap-2"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-md ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
              aria-label="Close quick bar"
              @click="dismissBar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-2 ring-white/20 transition hover:bg-orange-600 active:scale-95"
              aria-label="Collapse quick bar"
              @click="expanded = false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
                <path d="M6 15l6 6 6-6" />
              </svg>
            </button>
          </div>

          <div
            class="fq-expanded-shell w-24 overflow-hidden rounded-full border border-white/15 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-md transition-[max-height] duration-300 ease-in-out"
            style="max-height: min(70vh, 420px)"
          >
            <div
              class="flex max-h-[min(70vh,380px)] flex-col items-center gap-2.5 overflow-y-auto px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                v-for="item in items"
                :key="item.id"
                type="button"
                class="group flex w-16 shrink-0 flex-col items-center gap-1 text-center active:scale-95"
                @click="handleItemClick(item)"
              >
                <span
                  class="relative block h-12 w-12 overflow-hidden rounded-xl ring-1 ring-white/10 transition group-hover:ring-orange-400/60"
                >
                  <img
                    :src="item.image"
                    :alt="item.alt"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span
                  class="w-full text-[10px] font-medium leading-tight text-white/85"
                >
                  {{ item.label || item.alt }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Collapsed: label, close + expand, wide promo card + swipe -->
        <div
          v-else
          :key="`collapsed-${swipeKey}`"
          class="fq-collapsed flex w-20 flex-col gap-1.5"
        >
          <div class="flex items-center justify-center gap-2">
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-md ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
              aria-label="Close quick bar"
              @click="dismissBar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-2 ring-white/25 transition hover:bg-orange-600 active:scale-95"
              aria-label="Expand quick bar"
              @click="expanded = true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 15l-6-6-6 6" />
                <path d="M18 9l-6-6-6 6" />
              </svg>
            </button>
          </div>

          <div
            class="relative overflow-hidden rounded-md rounded-tr-xl border border-white/15 bg-black/50 shadow-lg backdrop-blur-sm transition-[height,width] duration-300 ease-in-out"
          >
            <van-swipe
              class="fq-swipe-collapsed"
              :show-indicators="items.length > 1"
              indicator-color="#fb923c"
            >
              <van-swipe-item v-for="item in items" :key="item.id">
                <button
                  type="button"
                  class="relative block h-14 w-full overflow-hidden transition active:opacity-95"
                  @click="handleItemClick(item)"
                >
                  <img
                    :src="item.image"
                    :alt="item.alt"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    class="pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500 shadow-sm ring-1 ring-black/40"
                    aria-hidden="true"
                  />
                </button>
              </van-swipe-item>
            </van-swipe>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fq-swipe-collapsed {
  width: 100%;
  height: 3.5rem; /* matches h-14 */
}

.fq-swipe-collapsed :deep(.van-swipe__indicators) {
  bottom: 2px;
}

.fq-swipe-collapsed :deep(.van-swipe__indicator) {
  width: 4px;
  height: 4px;
}

.fq-mode-enter-active,
.fq-mode-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.fq-mode-enter-from,
.fq-mode-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}

.fq-anchor {
  bottom: calc(8.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .fq-anchor {
    bottom: 2rem;
  }
}
</style>
