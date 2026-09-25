<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import GameCard from "../components/GameCard.vue";
import GameLaunchModal from "../components/GameLaunchModal.vue";
import { Dialog, Empty } from "vant";
import axios from "axios";
import { useGameLaunchModal } from "../composables/useGameLaunchModal";
import { useLoadingToast } from "../composables/useLoadingToast";
import GameCategoryScroller from "../components/GameCategoryScroller.vue";
import { useModal } from "../composables/useModal";
import { useTranslation } from "../composables/useTranslation";
const store = useStore();
const router = useRouter();
const route = useRoute();
const { showLoading, hideLoading } = useLoadingToast();
const { t } = useTranslation();
const { openDepositModal, openWithdrawModal } = useModal();
// Game providers data
const providers = [
  {
    id: 1,
    name: "PRAGMATIC PLAY",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PP-WHITE.png",
  },
  {
    id: 2,
    name: "PG POCKET GAMES SOFT",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PG-WHITE.png",
  },
  {
    id: 3,
    name: "JILI",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JL-WHITE.png",
  },
  {
    id: 12,
    name: "HotDog",
    logo: "https://storage.googleapis.com/spacetech2/yu95/hotdog.png",
  },
  {
    id: 4,
    name: "Live22",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/L22-WHITE.png",
  },
  {
    id: 5,
    name: "CQ9 GAMING",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/CQ9-WHITE.png",
  },
  {
    id: 6,
    name: "JDB",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JDB-WHITE.png",
  },
  {
    id: 7,
    name: "5G",
    logo: "https://storage.googleapis.com/spacetech2/yu95/new-5g-white.png",
  },
  // {
  //   id: 8,
  //   name: "Spade",
  //   logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/FC-WHITE.png",
  // },
  {
    id: 11,
    name: "FaChai",
    logo: "https://storage.googleapis.com/spacetech2/yu95/FC-WHITE.png",
  },
  {
    id: 9,
    name: "BTG",
    logo: "https://storage.googleapis.com/spacetech2/yu95/BT-WHITE.png",
  },
  {
    id: 10,
    name: "KA",
    logo: "https://storage.googleapis.com/spacetech2/yu95/KA-WHITE.png",
  },
  {
    id: 11,
    name: "Playstar",
    logo: "https://storage.googleapis.com/spacetech2/yu95/PS-WHITE.png",
  },
  // {
  //   id: 10,
  //   name: "NETENT",
  //   logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/CG-WHITE.png",
  // },
  // {
  //   id: 10,
  //   name: "NETENT",
  //   logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/MG-WHITE.png",
  // },
  // {
  //   id: 10,
  //   name: "NETENT",
  //   logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/VT-WHITE.png",
  // },
];

const providerScrollRef = ref(null);
const selectedProvider = ref(null);
const isLoading = ref(false);
const allSlotGames = ref([]);
const originalSlotGames = ref([]);
const searchQuery = ref("");
const limitText = ref("");
const desiredGame = ref(null);
const isLimitModalOpen = ref(false);

// Pagination
const gamesPerPage = ref(24); // Number of games to show per page
const displayedGamesCount = ref(gamesPerPage.value); // How many games are currently displayed
const activeShuffleIcon = ref(null);

// Image link generation function (same as HomePage)
const imageLinkGenerate = (gameId, type) => {
  if (type === 'Jili') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/jili/${gameId}.webp`;
    } if (type === 'Rich88') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/rich88/${gameId}.webp`;
    } if (type === 'Live22') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/live22/${gameId}.webp`;
    } if (type === 'Spade') {
        return `https://merchantapi.silverkirin88.com/thumbnail/en_US/${gameId}.jpg`;
    } if (type === 'Fastspin') {
        return `http://api-egame-staging.fsuat.com/thumbnail/en_US/${gameId}.jpg`;
    } if (type === 'Playstar') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/playstar/${gameId}.webp`;
    } if (type === 'FaChai') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/fachai/${gameId}.webp`;
    } if (type === 'PGSoft') {
        // return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/pgsoft/pgsoft_${gameId}.webp`;
        return `https://cdn.myanmarshankoeme.com/build/assets/img/fgg/${gameId}.webp`;
    } if (type === 'JOKER' || type === 'Joker') {
        return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/joker/${gameId}.webp`;
    } if (type === '5G') {
          return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/5g/${gameId}.webp`;
    } if (type === 'KA') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/newKA/${gameId}.webp`;
    } if (type === 'AceWin') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/acewin/${gameId}_EN.webp`;
    } if (type === 'JDB') {
          return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/jdb/${gameId}.webp`;
    } if (type === 'Buffalo') {
        return this.buffaloImage(gameId, provider)
    } if (type === 'HotDog'){
        return `https://res.hotdog-gaming.com/banners/380x500/${gameId}.png`;
    } if (type === 'Rich'){
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/rich/${gameId}.webp`;
    } if (type === 'CQ9' || type === 'cq9' || type === 'SexySlot'){
        return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/cq9/cq9_${gameId}.webp`;
    } if (type === 'BTG'){
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/btg/${gameId}.webp`;
    } if (type === '2J'){
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/2j/${gameId}.webp`;
    } if (type === 'VA'){
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/va/${gameId}_en.webp`;
    } if (type === 'BNG'){
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/bng/${gameId}.webp`;
    } if (type === 'AfricanBuffalo') {
        return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/afb/${gameId}.webp`;
    }

      return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/pp/${gameId}.webp`;
};

// Transform game data for GameCard component
const transformGame = (game) => {
  return {
    id: game.id || game.gameID,
    title: game.name || game.gameName,
    image: imageLinkGenerate(game.gameID, game.provider),
    gameID: game.gameID,
    provider: game.provider,
    originalGame: game,
  };
};

// Filter games by selected provider
const filteredGames = computed(() => {
  let filtered = allSlotGames.value;

  if (selectedProvider.value) {
    const provider = providers.find((p) => p.id === selectedProvider.value);
    if (provider) {
      // Map provider names to match API provider names
      const providerMap = {
        "PRAGMATIC PLAY": "Pragmatic",
        "PG POCKET GAMES SOFT": "PGSoft",
        JILI: "Jili",
        "SPADE GAMING": "Spade",
        "JDB JUST DO THE BEST": "JDB",
        "LIVE22 METAVERSE": "Live22",
        "CQ9 GAMING": "CQ9",
        Rich88: "Rich88",
        "R88 RICH88": "Rich88",
        R88: "Rich88",
        EVOLUTION: "Evolution",
        NETENT: "NetEnt",
      };

      const apiProviderName = providerMap[provider.name] || provider.name;
      filtered = filtered.filter((game) => game.provider === apiProviderName);
    }
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((game) => {
      const name = (game.name || game.gameName || "").toLowerCase();
      return name.includes(query);
    });
  }

  return filtered.map(transformGame);
});

const shuffleGames = () => {
  const shuffled = [...allSlotGames.value];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  allSlotGames.value = shuffled;
  displayedGamesCount.value = gamesPerPage.value;
};

const resetOrder = () => {
  allSlotGames.value = [...originalSlotGames.value];
  displayedGamesCount.value = gamesPerPage.value;
};

const handleShuffleClick = (icon) => {
  if (activeShuffleIcon.value === icon) {
    activeShuffleIcon.value = null;
    resetOrder();
    return;
  }
  activeShuffleIcon.value = icon;
  shuffleGames();
};

// Paginated games (only show displayedGamesCount games)
const games = computed(() => {
  return filteredGames.value.slice(0, displayedGamesCount.value);
});

// Check if there are more games to show
const hasMoreGames = computed(() => {
  return displayedGamesCount.value < filteredGames.value.length;
});

// Show more games
const showMoreGames = () => {
  displayedGamesCount.value += gamesPerPage.value;
};

// Reset pagination when provider changes
const selectProvider = (providerId) => {
  selectedProvider.value =
    selectedProvider.value === providerId ? null : providerId;
  // Reset pagination when filter changes
  displayedGamesCount.value = gamesPerPage.value;

  // Update URL query parameter
  if (selectedProvider.value) {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      // Map provider to API provider name
      const providerMap = {
        "PRAGMATIC PLAY": "Pragmatic",
        "PG POCKET GAMES SOFT": "PGSoft",
        JILI: "Jili",
        "SPADE GAMING": "Spade",
        "JDB JUST DO THE BEST": "JDB",
        "LIVE22 METAVERSE": "Live22",
        "CQ9 GAMING": "CQ9",
        Rich88: "Rich88",
        "R88 RICH88": "Rich88",
        R88: "Rich88",
        EVOLUTION: "Evolution",
        NETENT: "NetEnt",
      };
      const apiProviderName = providerMap[provider.name] || provider.name;
      router.push({ query: { provider: apiProviderName } });
    }
  } else {
    router.push({ query: {} });
  }
};

// Show alert box for PGSoft/FaChai
const showAlertBox = (game) => {
  if (game.provider === "PGSoft") {
    limitText.value = t(
      "In PG Soft, 1K unit equals 1,000 Kyats.",
      "PG Soft တွင် 1K unit သည် 1,000 ကျပ်နှင့်ညီမျပါသည်။",
      "PG Soft 中 1K 单位等于 1,000 缅币。",
      "ใน PG Soft หน่วย 1K เท่ากับ 1,000 จ๊าด"
    );
  } else if (game.provider === "FaChai") {
    limitText.value = t(
      "In FaChai, 1 unit equals 100 Kyats.",
      "FaChai Provider တွင် 1 unit သည် 100 ကျပ်နှင့်ညီမျပါသည်။",
      "FaChai 中 1 单位等于 100 缅币。",
      "ใน FaChai หน่วย 1 เท่ากับ 100 จ๊าด"
    );
  }
  isLimitModalOpen.value = true;
  desiredGame.value = game;
};

// Hide limit modal
const hideLimit = () => {
  isLimitModalOpen.value = false;
};

// Game launch modal/sheet (Play + Free Demo) - shared composable
const {
  showGameModal,
  showGameActionSheet,
  selectedGameForModal,
  isMobile,
  gameInit,
  handleGameClick,
  closeGameModal,
  onPlayFromGameModal,
  onTestFromGameModal,
  providerShortLabel,
} = useGameLaunchModal({
});

// Play game from limit modal
const playFromLimit = () => {
  if (desiredGame.value) {
    gameInit(desiredGame.value);
    hideLimit();
  }
};

// Fetch slot games from /games API
const fetchSlotGames = async () => {
  showLoading();
  try {
    isLoading.value = true;

    const res = await axios.get("/games", {
      params: {
        provider: 'Buffalo'
      },
    });

    if (res.data.data && Array.isArray(res.data.data)) {
      // Filter games - only show slot games (exclude 'vs' type games)
      allSlotGames.value = res.data.data.filter(
        (game) =>  game.gameTypeID && game.gameTypeID.includes("vs")
      );
      // console.log(res.data.data);
      originalSlotGames.value = [...allSlotGames.value];

      // Add playerCount if not present (for display purposes)
      allSlotGames.value.forEach((game) => {
        if (!game.playerCount) {
          game.playerCount = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
        }
n      });

      // Reset pagination when new data is loaded
      displayedGamesCount.value = gamesPerPage.value;
    }
  } catch (error) {
    console.error("Error fetching slot games:", error);
  } finally {
    isLoading.value = false;
    hideLoading();
  }
};

const isLoggedIn = computed(() => {
  const authUser = store.state.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});

// Watch for route query changes (provider filter from URL)
watch(
  () => route.query.provider,
  (newProvider) => {
    if (newProvider) {
      // Update selected provider based on URL query
      const provider = providers.find(
        (p) =>
          p.name.toLowerCase().includes(newProvider.toLowerCase()) ||
          newProvider.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );
      if (provider) {
        selectedProvider.value = provider.id;
      }
    }
    fetchSlotGames();
  },
  { immediate: false }
);

const scrollProviders = (direction) => {
  if (providerScrollRef.value) {
    const scrollAmount = 300;
    const currentScroll = providerScrollRef.value.scrollLeft;
    const newScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;
    providerScrollRef.value.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  }
};

// Initialize on mount
onMounted(async () => {
  await fetchSlotGames();
});
</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-8">
    <div
      class="mx-1 md:mx-4 mt-0 mb-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <img src="https://storage.googleapis.com/spacetech2/yu95/kYAWEL-Green.png" alt="" class="w-12 h-12 md:w-10 md:h-10" />
      <div>
        <h1 class="text-xl md:text-4xl font-bold text-white mb-2">
          {{ t("Buffalo Games", "ကျွဲဂိမ်းများ", "捕鱼游戏", "ปลาเล่นของคุณ") }}
        </h1>
        <p
          class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{
            t(
              "Catch your favorite Buffalos",
              "သင့်စိတ်ကြိုက် ကျွဲများကို ဖမ်းလိုက်ပါ။",
              "旋转赢取你喜欢的游戏",
              "หมุนและชนะเกมโปรดของคุณ"
            )
          }}
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
    <!-- Provider Navigation Bar -->

    <!-- Games Grid -->
    <div class="md:px-4 px-1 pt-3">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="text-white font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Please wait!", "ခဏစောင့်ပါ", "请稍候！", "โปรดรอสักครู่!") }}
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="games.length === 0" class="text-center py-5">
        <Empty
          image="search"
          :description="
            t(
              'No matching results',
              'ကိုက်ညီ သောအချက်အလက်မရှိပါ',
              '没有匹配结果',
              'ไม่พบผลลัพธ์ที่ตรงกัน'
            )
          "
          class="slots-empty"
        />
      </div>

      <!-- Games Grid -->
      <div
        v-else
        class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 gap-2"
      >
        <div
          v-for="game in games"
          :key="game.id"
          @click="handleGameClick(game)"
        >
          <GameCard :game="game" />
        </div>
      </div>

      <!-- Show More Button -->
      <div v-if="hasMoreGames" class="flex justify-center mt-8">
        <button
          @click="showMoreGames"
          class="bg-[#1986E1] hover:bg-[#156FBD] text-white px-8 py-3 rounded-lg font-semibold text-base transition-colors font-['Pyidaungsu','Padauk',sans-serif]"
        >
          {{ t("Show More", "ပိုမိုကြည့်ရှု", "查看更多", "แสดงเพิ่มเติม") }}
          ({{ filteredGames.length - displayedGamesCount }})
        </button>
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
            <b>
              {{ t("Important Notice", "အထူးသတိပြုရန်။", "重要提示", "ประกาศสำคัญ") }}
            </b>
            <br /><br />
          </span>
          <span class="text-white font-['Pyidaungsu','Padauk',sans-serif]">{{
            limitText
          }}</span>
          <br /><br />
          <span class="text-white text-sm">
            <button
              @click="playFromLimit"
              class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold font-['Pyidaungsu','Padauk',sans-serif]"
            >
              {{ t("Play The Game", "ဂိမ်းဆော့မည်။", "开始游戏", "เล่นเกม") }}
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- Game launch modal/sheet (Play / Free Demo) - same UI as before -->
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

<style scoped>
:deep(.slots-empty .van-empty__description) {
  color: #ffffff;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
