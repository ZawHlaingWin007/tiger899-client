<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useModal } from "../composables/useModal";
import { useGameLaunchModal } from "../composables/useGameLaunchModal";
import GameCard from "../components/GameCard.vue";
import GameLaunchModal from "../components/GameLaunchModal.vue";
import GameCategoryScroller from "../components/GameCategoryScroller.vue";
import { useTranslation } from "../composables/useTranslation";

const store = useStore();
const { openDepositModal, openWithdrawModal } = useModal();
const { t } = useTranslation();

const lotteryCard = ref({
  id: "tcglottery",
  gameID: "tcglottery",
  title: "TGC",
  image: "https://storage.googleapis.com/spacetech2/yu95/TGC.webp",
  provider: "tcglottery",
});

const isLoggedIn = computed(() => {
  const authUser = store.state.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

const {
  showGameModal,
  showGameActionSheet,
  selectedGameForModal,
  isMobile,
  handleGameClick,
  closeGameModal,
  onPlayFromGameModal,
  onTestFromGameModal,
  providerShortLabel,
} = useGameLaunchModal();
</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-8">
    <div
      class="mx-1 md:mx-4 mt-0 mb-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <img src="/lottery.png" alt="" class="w-12 h-12 md:w-10 md:h-10" />
      <div>
        <h1 class="text-xl md:text-4xl font-bold text-white mb-2">
          {{ t("Lottery", "ထီ", "彩票游戏", "ลอตเตอรี่") }}
        </h1>
        <p
          class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Play your favorite lottery", "သင့်စိတ်ကြိုက် ဂဏန်းများကို လောင်းနိုင်ပါပြီ", "玩您喜欢的彩票", "เล่นหวยที่คุณชอบ") }}
        </p>
      </div>
    </div>

    <div v-if="isLoggedIn" class="flex items-center gap-3 px-2 md:px-4 mt-2">
      <button
        type="button"
        class="flex-1 py-1 rounded-full font-bold text-white text-sm! font-['Pyidaungsu','Padauk',sans-serif] bg-[#1986E1] hover:bg-[#156FBD] shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-colors border border-white/10"
        @click="openDepositModal"
      >
        {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
      </button>
      <button
        type="button"
        class="flex-1 py-1 rounded-full font-bold text-white text-sm! font-['Pyidaungsu','Padauk',sans-serif] bg-transparent hover:bg-white/5 border border-white/80 transition-colors"
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
        <div @click="handleGameClick(lotteryCard)">
          <GameCard :game="lotteryCard" />
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
