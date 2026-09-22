<script setup>
import { ref, computed, nextTick } from "vue";
import { useStore } from "vuex";
import GameCard from "../components/GameCard.vue";
import GameLaunchModal from "../components/GameLaunchModal.vue";
import { showDialog } from "vant";
import axios from "axios";
import { useModal } from "../composables/useModal";
import { useGameLaunchModal } from "../composables/useGameLaunchModal";
import { useLoadingToast } from "../composables/useLoadingToast";
import GameCategoryScroller from "../components/GameCategoryScroller.vue";
import { useTranslation } from "../composables/useTranslation";

const store = useStore();
const { openLoginModal } = useModal();
const { showLoading, hideLoading } = useLoadingToast();
const { openDepositModal, openWithdrawModal } = useModal();
const { t } = useTranslation();

const isLoading = ref(false);
const limitText = ref("");
const isLimitModalOpen = ref(false);
const isCardGameModalOpen = ref(false);
const selectedCardGame = ref(null);

const isLoggedIn = computed(() => {
  const authUser = store.state.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

// Card games data (gameID + provider used for /games/url API)
const cardGamesData = [
  {
    id: "PP Live",
    gameID: "pplive",
    provider: "PP Live",
    name: "Pragmatic Play",
    image: "https://storage.googleapis.com/spacetech2/yu95/PP%20Live.webp",
    action: "changeSideNav",
    value: "PP Live",
  },
  {
    id: "BG",
    gameID: "BG",
    provider: "BG",
    name: "BG",
    image: "https://storage.googleapis.com/spacetech2/yu95/big-gaming.avif",
    action: "changeSideNav",
    value: "BG",
  },
  {
    id: "YeeBet",
    gameID: "YeeBet",
    provider: "YeeBet",
    name: "YeeBet",
    image: "https://storage.googleapis.com/spacetech2/yu95/YEEBET.webp",
    action: "changeSideNav",
    value: "YeeBet",
  },
];

// Transform card games for GameCard component
const cardGames = computed(() => {
  return cardGamesData.map((game) => ({
    id: game.id,
    gameID: game.gameID,
    provider: game.provider,
    title: game.name,
    image: game.image,
    originalGame: game,
  }));
});

// Open card game modal
const openCardGameModal = (gameType) => {
  selectedCardGame.value = gameType;
  isCardGameModalOpen.value = true;
};

// Close card game modal
const closeCardGameModal = () => {
  isCardGameModalOpen.value = false;
  selectedCardGame.value = null;
};


const {
  showGameModal,
  showGameActionSheet,
  selectedGameForModal,
  isMobile,
  handleGameClick: openGameLaunchModal,
  closeGameModal,
  onPlayFromGameModal,
  onTestFromGameModal,
  providerShortLabel,
} = useGameLaunchModal({
  beforePlay: async (game) => {
    if (game.provider === "BG") {
      await showDialog({
        title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
        message: t(
          "For this game (BG Live Casino), currency will be 1:1000 for MMK.",
          "ဤဂိမ်း (BG Live Casino) တွင် ငွေကြေးသည် MMK 1:1000 ဖြစ်ပါသည်။",
          "此游戏（BG Live Casino）的货币为 MMK 1:1000。",
          "สำหรับเกมนี้ (BG Live Casino) อัตราเงินคือ 1:1000 สำหรับ MMK"
        ),
        confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
        theme: "round-button",
        className: "logout-dialog-dark",
        confirmButtonColor: "#1986E1",
      });
    }
    return false;
  },
});

// Handle game card click
const handleGameClick = (game) => {
  if (game.originalGame && game.originalGame.action) {
    const cardGame = game.originalGame;
    if (cardGame.action === "changeSideNav") {
      if (cardGame.value === "skm" || cardGame.value === "bgy") {
        openCardGameModal(cardGame.value);
      } else {
        // Launch via /games/url (Play / Free Demo modal)
        const launchGame = {
          gameID: cardGame.gameID,
          provider: cardGame.provider,
          title: cardGame.name,
          image: cardGame.image,
        };
        openGameLaunchModal(launchGame);
      }
    }
    return;
  }
};

// Hide limit modal
const hideLimit = () => {
  isLimitModalOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-8">
    <div
      class="mx-1 md:mx-4 mt-0 mb-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <img src="https://storage.googleapis.com/spacetech2/yu95/livecasino.png" alt="" class="w-12 h-12 md:w-10 md:h-10" />
      <div>
        <h1 class="text-xl md:text-4xl font-bold text-white mb-2">ကာစီနိုဂိမ်းများ</h1>
        <p
          class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          သင့်စိတ်ကြိုက်အခန်းများတွင်ဆော့ကစားလိုက်ပါ။
        </p>
      </div>
    </div>
    <div v-if="isLoggedIn" class="flex items-center gap-3 px-2 md:px-4 mt-2">
      <button
        type="button"
        class="flex-1 py-1 rounded-full font-bold text-white !text-sm font-['Pyidaungsu','Padauk',sans-serif] bg-[#1986E1] hover:bg-[#156FBD] shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-colors border border-white/10"
        @click="openDepositModal"
      >
        {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
      </button>
      <button
        type="button"
        class="flex-1 py-1 rounded-full font-bold text-white !text-sm font-['Pyidaungsu','Padauk',sans-serif] bg-transparent hover:bg-white/5 border border-white/80 transition-colors"
        @click="openWithdrawModal"
      >
        {{ t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน") }}
      </button>
    </div>
    <div class="hidden md:block">
      <GameCategoryScroller />
    </div>
    <div class="md:px-4 px-1 pt-3">
      <div
        class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 gap-2"
      >
        <div
          v-for="game in cardGames"
          :key="game.id"
          @click="handleGameClick(game)"
        >
          <GameCard :game="game" />
        </div>
      </div>
    </div>

    <!-- Limit Modal -->
    <div
      v-if="isLimitModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="hideLimit"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-md relative shadow-2xl p-6"
        @click.stop
      >
        <button
          @click="hideLimit"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
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
        <div class="text-center my-5 mx-3">
          <span
            class="text-red-500 text-lg font-bold font-['Pyidaungsu','Padauk',sans-serif]"
          >
            <b>အထူးသတိပြုရန်။</b> <br /><br />
          </span>
          <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]">{{
            limitText
          }}</span>
        </div>
      </div>
    </div>

    <!-- Card Game Level Selection Modal -->
    <div
      v-if="isCardGameModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      @click="closeCardGameModal"
    >
      <div
        class="bg-[#080E1E] rounded-lg w-full max-w-2xl relative shadow-2xl p-6"
        @click.stop
      >
        <!-- Close Button -->
        <button
          @click="closeCardGameModal"
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
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

        <!-- Modal Title -->
        <h2
          class="text-white text-xl font-bold mb-6 text-center font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ selectedCardGame === "skm" ? "Shan Ko Mee" : "Bugyee" }} - Level
          Selection
        </h2>

        <!-- Level Selection Grid -->
        <div class="flex flex-wrap justify-center gap-3">
          <img
            v-for="level in 6"
            :key="level - 1"
            :src="
              selectedCardGame === 'skm'
                ? `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/${getSKMImageName(
                    level - 1
                  )}.png`
                : `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/${getBGYImageName(
                    level - 1
                  )}.png`
            "
            :alt="`Level ${level - 1}`"
            class="cursor-pointer rounded-lg transition-transform hover:scale-105"
            style="width: 31%; height: auto"
            @click="
              selectedCardGame === 'skm'
                ? fetchShanKoMeeData(level - 1)
                : fetchBugyee(level - 1)
            "
          />
        </div>
      </div>
    </div>

    <GameLaunchModal
      :show-modal="showGameModal"
      :show-sheet="showGameActionSheet"
      :game="selectedGameForModal"
      :is-mobile="isMobile"
      :provider-label="providerShortLabel"
      @close="closeGameModal"
      @play="onPlayFromGameModal"
      @test="onTestFromGameModal"
    />
  </div>
</template>
