<template>
  <!-- Game launch modal (Play / Free Demo) - desktop only -->
  <div
    v-if="showModal && game && !isMobile"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    @click.self="$emit('close')"
  >
    <div
      class="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
      @click.stop
    >
      <button
        type="button"
        class="absolute top-3 right-3 z-10 p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close"
        @click="$emit('close')"
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
      <div class="relative p-4 flex gap-4">
        <div class="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          <img
            :src="game.image"
            :alt="game.title"
            class="w-full h-full object-cover object-top"
          />
        </div>
        <div class="flex-1 min-w-0 pt-1">
          <p
            class="text-base font-semibold text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ providerLabel(game.provider || game.originalGame?.provider) }}
          </p>
          <h3
            class="text-lg font-bold text-gray-900 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif] line-clamp-2"
          >
            {{ game.title }}
          </h3>
        </div>
      </div>
      <div class="px-4 pb-4 flex flex-col gap-2">
        <button
          type="button"
          class="w-full py-3 rounded-lg bg-[#118EE9] hover:bg-[#118EE9]/80 text-white font-semibold font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
          @click="$emit('play')"
        >
          {{ t("Start Game", "စတင်ကစား", "开始游戏", "เริ่มเกม") }}
        </button>
        <button
          v-if="!shouldHideDemo"
          type="button"
          class="w-full py-3 rounded-lg border-2 border-[#118EE9] !text-[#118EE9] bg-white hover:bg-[#118EE9]/10 font-semibold font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
          @click="$emit('test')"
        >
          {{
            t("Free Demo Play", "အခမဲ့အစမ်းကစား", "免费试玩", "ทดลองเล่นฟรี")
          }}
        </button>
      </div>
    </div>
  </div>

  <!-- Game launch bottom sheet (Play / Free Demo) - mobile only -->
  <VanPopup
    :show="showSheet"
    position="bottom"
    @update:show="onSheetUpdate"
    round
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
    teleport="body"
  >
    <div v-if="game" class="relative bg-white rounded-t-xl">
      <button
        type="button"
        class="absolute top-3 right-3 z-10 p-1.5 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Close"
        @click="$emit('close')"
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
      <div class="p-4 flex gap-4">
        <div
          class="shrink-0 w-[170px] h-[170px] translate-y-[-50px] rounded-lg overflow-hidden bg-gray-100"
        >
          <img
            :src="game.image"
            :alt="game.title"
            class="w-full h-full object-cover object-top"
          />
        </div>
        <div class="flex-1 min-w-0 pt-1">
          <p
            class="text-lg font-semibold text-gray-600 font-['Pyidaungsu','Padauk',sans-serif]"
          >
            {{ providerLabel(game.provider || game.originalGame?.provider) }}
          </p>
          <h3
            class="text-2xl font-bold text-gray-900 mt-0.5 font-['Pyidaungsu','Padauk',sans-serif] line-clamp-2"
          >
            {{ game.title }}
          </h3>
        </div>
      </div>
      <div class="px-4 pb-4 flex mt-[-50px] flex-col gap-2">
        <button
          type="button"
          class="w-full py-4 rounded-lg bg-[#118EE9] hover:bg-[#118EE9]/80 text-white text-lg font-semibold font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
          @click="$emit('play')"
        >
          {{ t("Start Game", "စတင်ကစား", "开始游戏", "เริ่มเกม") }}
        </button>
        <button
          v-if="!shouldHideDemo"
          type="button"
          class="w-full py-4 rounded-lg border-2 border-[#118EE9] !text-[#118EE9] bg-white hover:bg-[#118EE9]/10 text-lg font-semibold font-['Pyidaungsu','Padauk',sans-serif] transition-colors"
          @click="$emit('test')"
        >
          {{
            t("Free Demo Play", "အခမဲ့အစမ်းကစား", "免费试玩", "ทดลองเล่นฟรี")
          }}
        </button>
      </div>
    </div>
  </VanPopup>
</template>

<script setup>
import { computed } from "vue";
import { Popup as VanPopup } from "vant";
import { useTranslation } from "../composables/useTranslation";

defineOptions({ name: "GameLaunchModal" });

const props = defineProps({
  showModal: { type: Boolean, default: false },
  showSheet: { type: Boolean, default: false },
  game: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
  providerLabel: { type: Function, default: (p) => p || "" },
});

const emit = defineEmits(["close", "play", "test"]);

const { t } = useTranslation();

// Hide Demo button for:
// - AfricanBuffalo
// - All Card Games
// - Live Casino (e.g. PP Live)
// - Lottery (tcglottery)
// - All Sport games (AFBSport, MyanmarOdds, bti, saba, sbo, etc.)
// - VA, AceWin, PGSoft, TCG (no demo mode)
const shouldHideDemo = computed(() => {
  const g = props.game;
  if (!g) return false;
  const provider = (g.provider || g.originalGame?.provider) ?? "";
  const isAfricanBuffalo = provider === "AfricanBuffalo";
  const isLiveCasino = typeof provider === "string" && provider.toLowerCase().includes("live");
  const isLottery = provider === "tcglottery";
  const isSport =
    provider === "AFB" ||
    provider === "AFBSport" ||
    provider === "MyanmarOdds" ||
    provider === "myanmar-odds" ||
    provider === "bti" ||
    provider === "BTi" ||
    provider === "saba" ||
    provider === "sbo";
  const isNoDemoProvider =
    provider === "VA" ||
    provider === "AceWin" ||
    provider === "PGSoft" ||
    provider === "TCG";
  // Card games on this site are wrapped with originalGame and have custom actions
  const isCardGame = !!g.originalGame?.action;
  return isAfricanBuffalo || isLiveCasino || isLottery || isSport || isNoDemoProvider || isCardGame;
});

function onSheetUpdate(show) {
  if (!show) emit("close");
}
</script>
