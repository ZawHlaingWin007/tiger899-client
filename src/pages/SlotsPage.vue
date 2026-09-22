<script setup>
import { ref, computed, watch, nextTick } from "vue";
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
    name: "Pragmatic",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PP-WHITE.png",
  },
  {
    id: 2,
    name: "PGSoft",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PG-WHITE.png",
  },

  {
    id: 3,
    name: "2J",
    logo: "https://storage.googleapis.com/spacetech2/yu95/2j.webp",
  },
  {
    id: 4,
    name: "JILI",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JL-WHITE.png",
  },
  {
    id: 5,
    name: "HotDog",
    logo: "https://storage.googleapis.com/spacetech2/yu95/hotdog-renew.png",
  },
  {
    id: 6,
    name: "VA",
    logo: "https://storage.googleapis.com/spacetech2/yu95/va-white.webp",
  },
  {
    id: 7,
    name: "Live22",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/L22-WHITE.png",
  },
  {
    id: 8,
    name: "AceWin",
    logo: "https://storage.googleapis.com/spacetech2/yu95/acewin-new.png",
  },
  {
    id: 9,
    name: "JDB",
    logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JDB-WHITE.png",
  },
  {
    id: 10,
    name: "5G",
    logo: "https://storage.googleapis.com/spacetech2/yu95/new-5g-white.png",
  },
  {
    id: 11,
    name: "FaChai",
    logo: "https://storage.googleapis.com/spacetech2/yu95/FC-WHITE.png",
  },
  {
    id: 12,
    name: "BTG",
    logo: "https://storage.googleapis.com/spacetech2/yu95/BT-WHITE.png",
  },
  {
    id: 13,
    name: "KA",
    logo: "https://storage.googleapis.com/spacetech2/yu95/KA-WHITE.png",
  },
  {
    id: 14,
    name: "Playstar",
    logo: "https://storage.googleapis.com/spacetech2/yu95/PS-WHITE.png",
  },
  {
    id: 15,
    name: "Rich",
    logo: "https://storage.googleapis.com/spacetech2/yu95/rich-white.png",
  },
  {
    id: 16,
    name: "BNG",
    logo: "https://storage.googleapis.com/spacetech2/yu95/BNG-WHITE.png",
  },
  // {
  //   id: 17,
  //   name: "Joker",
  //   logo: "https://storage.googleapis.com/spacetech2/yu95/Joker-Logo.png",
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
  } if (type === 'HotDog') {
    return `https://res.hotdog-gaming.com/banners/380x500/${gameId}.png`;
  } if (type === 'Rich') {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/rich/${gameId}.webp`;
  } if (type === 'CQ9' || type === 'cq9' || type === 'SexySlot') {
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/cq9/cq9_${gameId}.webp`;
  } if (type === 'BTG') {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/btg/${gameId}.webp`;
  } if (type === '2J') {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/2j/${gameId}.webp`;
  } if (type === 'VA') {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/va/${gameId}_en.webp`;
  } if (type === 'BNG') {
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
        "R88 RICH88": "R88",
        Joker: "JOKER",
        EVOLUTION: "Evolution",
        NETENT: "NetEnt",
      };

      const apiProviderName = providerMap[provider.name] || provider.name;
      filtered = filtered.filter(
        (game) =>
          game.provider?.toLowerCase() === apiProviderName.toLowerCase()
      );
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
        "R88 RICH88": "R88",
        Joker: "JOKER",
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
        provider: route.query.provider || null,
      },
    });

    if (res.data.data && Array.isArray(res.data.data)) {
      // Filter games - only show slot games (exclude 'vs' type games)
      allSlotGames.value = res.data.data.filter(
        (game) => game.gameTypeID && game.gameTypeID.includes("vs")
      );
      // console.log(res.data.data);
      originalSlotGames.value = [...allSlotGames.value];

      // Add playerCount if not present (for display purposes)
      allSlotGames.value.forEach((game) => {
        if (!game.playerCount) {
          game.playerCount = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
        }
      });

      // Sort games - Pragmatic first
      allSlotGames.value = allSlotGames.value.sort((a, b) => {
        if (a.provider === "Pragmatic" && b.provider !== "Pragmatic") return -1;
        if (a.provider !== "Pragmatic" && b.provider === "Pragmatic") return 1;
        return 0;
      });

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
        // After setting, auto-scroll so the active provider button is visible
        nextTick(() => {
          const container = providerScrollRef.value;
          if (!container) return;
          const activeEl = container.querySelector(
            `[data-provider-id="${provider.id}"]`
          );
          if (!activeEl) return;
          const offset =
            activeEl.offsetLeft -
            (container.clientWidth - activeEl.clientWidth) / 2;
          container.scrollTo({
            left: Math.max(offset, 0),
            behavior: "smooth",
          });
        });
      }
    }
    fetchSlotGames();
  },
  { immediate: true }
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

</script>

<template>
  <div class="min-h-screen bg-[#172240] pb-8">
    <div class="mx-1 md:mx-4 mt-0 mb-0 hidden md:flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <img
        src="/7.png"
        alt=""
        class="w-12 h-12 md:w-10 md:h-10"
      />
      <div>
        <h1 class="text-xl md:text-4xl font-bold text-white mb-2">
          {{ t("Slots", "စလော့", "老虎机", "สล็อต") }}
        </h1>
        <p class="text-sm text-white/70 font-['Pyidaungsu','Padauk',sans-serif]">
          {{
            t(
              "Spin and win your favorites",
              "စိတ်ကြိုက်ဂိမ်းများတွင် အနိုင်ရပါ",
              "旋转赢取你喜欢的游戏",
              "หมุนและชนะเกมโปรดของคุณ"
            )
          }}
        </p>
      </div>
    </div>

    <div
      v-if="isLoggedIn"
      class="hidden md:flex items-center gap-3 px-2 md:px-4 mt-2"
    >
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

    <div class="relative px-1 md:px-0">
      <div class="flex items-center gap-1 bg-[#080E1E] rounded-full px-1 py-1">
        <button
          type="button"
          @click="selectedProvider = null"
          :class="[
            'shrink-0 px-3 h-8 rounded-full text-xs font-bold font-[\'Pyidaungsu\',\'Padauk\',sans-serif]',
            selectedProvider == null
              ? 'bg-[#1986E1] text-white'
              : 'text-white/80',
          ]"
        >
          {{ t("All", "အားလုံး", "全部", "ทั้งหมด") }}
        </button>
        <!-- Left Arrow Button -->
        <button
          @click="scrollProviders('left')"
          class="shrink-0 p-1 cursor-pointer rounded-full border border-[#1986E1]/40 text-[#1986E1] bg-transparent transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- Provider Logos Container -->
        <div
          ref="providerScrollRef"
          class="flex-1 flex items-center gap-1.5 px-1 py-1 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div
            v-for="provider in providers"
            :key="provider.id"
            :data-provider-id="provider.id"
            @click="selectProvider(provider.id)"
            :class="[
              'shrink-0 cursor-pointer transition-all rounded-lg p-1 bg-white/5 flex items-center justify-center h-[36px] md:h-[44px]',
              selectedProvider === provider.id
                ? 'bg-white/10 ring-2 ring-white/20'
                : '',
            ]"
          >
            <img
              :src="provider.logo"
              :alt="provider.name"
              :class="[
                'md:w-[100px] w-[70px] h-full object-contain',
                provider.name === 'Joker' ? 'grayscale brightness-200' : '',
              ]"
            />
          </div>
        </div>

        <!-- Right Arrow Button -->
        <button
          @click="scrollProviders('right')"
          class="shrink-0 p-1 cursor-pointer rounded-full border border-[#1986E1]/40 text-[#1986E1] bg-transparent transition-colors z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <div class="px-2 md:px-4 mt-2 flex items-center gap-2">
      <div class="relative flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          ></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('Search games', 'ဂိမ်းရှာရန်', '搜索游戏', 'ค้นหาเกม')"
          class="w-full bg-[#080E1E] border border-white/10 rounded-full px-4 py-2.5 pl-12 text-white placeholder:text-white/40 focus:outline-none focus:border-[#1986E1] transition-colors font-['Pyidaungsu','Padauk',sans-serif]"
        />
      </div>
      <button
        type="button"
        @click="handleShuffleClick('clock')"
        class="shrink-0 w-10 h-10 rounded-xl bg-[#080E1E] text-white flex items-center justify-center"
        aria-label="Recent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z" />
        </svg>
      </button>
      <button
        type="button"
        @click="handleShuffleClick('heart')"
        class="shrink-0 w-10 h-10 rounded-xl bg-[#080E1E] text-white flex items-center justify-center"
        aria-label="Favorites"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>

    <div class="hidden md:flex items-center justify-between py-1 pb-0">
      <div class="flex items-center gap-2">
        <img
          src="/7.png"
          alt=""
          class="w-12 h-12 md:w-10 md:h-10"
        />
        <p class="text-xl md:text-4xl font-bold text-white">
          {{ t("Slot Games", "စလော့ဂိမ်းများ", "老虎机游戏", "เกมสล็อต") }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="handleShuffleClick('fire')"
          :class="[
            'w-9 h-9 flex items-center justify-center cursor-pointer transition-transform active:scale-95',
            activeShuffleIcon === 'fire'
              ? 'bg-[#1986E1] shadow-[0_0_12px_rgba(25, 134, 225,0.6)]'
              : 'bg-white/5 hover:bg-white/10 active:bg-white/15',
          ]"
          aria-label="Shuffle games"
        >
          <img
            src="/fire.png"
            alt=""
            class="w-6 h-6"
          />
        </button>
        <button
          type="button"
          @click="handleShuffleClick('clock')"
          :class="[
            'w-9 h-9 flex items-center justify-center cursor-pointer transition-transform active:scale-95',
            activeShuffleIcon === 'clock'
              ? 'bg-[#1986E1] shadow-[0_0_12px_rgba(25, 134, 225,0.6)]'
              : 'bg-white/5 hover:bg-white/10 active:bg-white/15',
          ]"
          aria-label="Shuffle games"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8a8 8 0 0 0-8 8a8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10a10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67l-.75 1.23L11 13V7z"
            />
          </svg>
        </button>
        <button
          type="button"
          @click="handleShuffleClick('heart')"
          :class="[
            'w-9 h-9 flex items-center justify-center cursor-pointer transition-transform active:scale-95',
            activeShuffleIcon === 'heart'
              ? 'bg-[#1986E1] shadow-[0_0_12px_rgba(25, 134, 225,0.6)]'
              : 'bg-white/5 hover:bg-white/10 active:bg-white/15',
          ]"
          aria-label="Shuffle games"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="m8.962 18.91l.464-.588zM12 5.5l-.54.52l.01.011zm3.038 13.41l.465.59zM13.47 8.03a.75.75 0 1 0 1.06-1.06zM9.426 18.322C7.91 17.127 6.253 15.96 4.938 14.48C3.65 13.028 2.75 11.335 2.75 9.137h-1.5c0 2.666 1.11 4.7 2.567 6.339c1.43 1.61 3.254 2.9 4.68 4.024zM2.75 9.137c0-2.15 1.215-3.954 2.874-4.713c1.612-.737 3.778-.541 5.836 1.597l1.08-1.04C10.1 2.444 7.264 2.025 5 3.06C2.786 4.073 1.25 6.425 1.25 9.137zM8.497 19.5c.513.404 1.063.834 1.62 1.16s1.193.59 1.883.59v-1.5c-.31 0-.674-.12-1.126-.385c-.453-.264-.922-.628-1.448-1.043zm7.006 0c1.426-1.125 3.25-2.413 4.68-4.024c1.457-1.64 2.567-3.673 2.567-6.339h-1.5c0 2.198-.9 3.891-2.188 5.343c-1.315 1.48-2.972 2.647-4.488 3.842zM22.75 9.137c0-2.712-1.535-5.064-3.75-6.077c-2.264-1.035-5.098-.616-7.54 1.92l1.08 1.04c2.058-2.137 4.224-2.333 5.836-1.596c1.659.759 2.874 2.562 2.874 4.713zm-8.176 9.185c-.526.415-.995.779-1.448 1.043s-.816.385-1.126.385v1.5c.69 0 1.326-.265 1.883-.59c.558-.326 1.107-.756 1.62-1.16zM11.47 6.032l2 1.998l1.06-1.06l-2-2z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Games Grid -->
    <div class="md:px-4 px-1 pt-3">
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="text-center py-20"
      >
        <div class="text-white font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Please wait!", "ခဏစောင့်ပါ", "请稍候！", "โปรดรอสักครู่!") }}
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="games.length === 0"
        class="text-center py-5"
      >
        <Empty
          image="search"
          :description="t(
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
      <div
        v-if="hasMoreGames"
        class="flex justify-center mt-8"
      >
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
            <line
              x1="18"
              y1="6"
              x2="6"
              y2="18"
            ></line>
            <line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            ></line>
          </svg>
        </button>
        <div class="text-center my-5 mx-3">
          <span class="text-red-500 text-lg font-bold font-['Pyidaungsu','Padauk',sans-serif]">
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
