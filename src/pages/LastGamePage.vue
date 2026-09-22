<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { Empty as VanEmpty, Loading as VanLoading } from "vant";
import GameCard from "../components/GameCard.vue";
import GameLaunchModal from "../components/GameLaunchModal.vue";
import { useTranslation } from "../composables/useTranslation";
import { useGameLaunchModal } from "../composables/useGameLaunchModal";

const { t } = useTranslation();
const {
  handleGameClick,
  showGameModal,
  showGameActionSheet,
  selectedGameForModal,
  isMobile,
  closeGameModal,
  onPlayFromGameModal,
  onTestFromGameModal,
  providerShortLabel,
} = useGameLaunchModal();
const recentGames = ref([]);
const isLoading = ref(true);

// Build game image URL from gameId + provider when API doesn't provide a valid image URL
function imageLinkGenerate(gameId, provider) {
  if (!gameId) return "";
  const type = provider || "";
  if (type === "Jili")
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/jili/${gameId}.webp`;
  if (type === "Live22")
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/live22/${gameId}.webp`;
  if (type === "Spade")
    return `https://merchantapi.silverkirin88.com/thumbnail/en_US/${gameId}.jpg`;
  if (type === "PGSoft")
    // return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/pgsoft/pgsoft_${gameId}.webp`;
    return `https://cdn.myanmarshankoeme.com/build/assets/img/fgg/${gameId}.webp`;
  if (type === "JOKER" || type === "Joker")
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/joker/${gameId}.webp`;
  if (type === "KA")
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/ka/${gameId}.webp`;
  if (type === "JDB")
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/jdb/${gameId}.webp`;
  if (type === "CQ9" || type === "cq9" || type === "SexySlot")
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/cq9/cq9_${gameId}.webp`;
  if (type === "Pragmatic" || type === "PP")
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/pp/${gameId}.webp`;
  if (type === "BNG")
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/bng/${gameId}.webp`;
  return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/pp/${gameId}.webp`;
}

// Normalize API game item to GameCard shape
function mapGame(item) {
  const gameId = item.game_id ?? item.gameID ?? item.id;
  const provider = item.provider ?? null;
  const rawImage =
    item.image ?? item.image_url ?? item.thumbnail ?? item.logo ?? "";
  const image =
    rawImage && String(rawImage).startsWith("http")
      ? rawImage
      : imageLinkGenerate(gameId, provider);

  return {
    id: item.id ?? gameId,
    title: item.name ?? item.title ?? item.gameName ?? "",
    image,
    gameID: gameId,
    provider,
    is_favourite: item.is_favourite !== false,
    originalGame: item,
  };
}

async function fetchRecentGames() {
  isLoading.value = true;
  try {
    const res = await axios.get("/user/recent-games", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = res?.data?.data ?? res?.data ?? [];
    const list = Array.isArray(data) ? data : [];
    recentGames.value = list.map(mapGame);
  } catch (e) {
    console.error("Fetch recent games failed:", e);
    recentGames.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchRecentGames();
});
</script>

<template>
  <div class="min-h-screen pb-24">
    <h1
      class="text-2xl font-bold py-4 text-white font-['Pyidaungsu','Padauk',sans-serif]"
    >
      {{ t("Last played games", "နောက်ဆုံးဂိမ်း", "最近游戏", "เกมล่าสุด") }}
    </h1>
    <!-- Content -->
    <div class="px-4 py-4">
      <VanLoading
        v-if="isLoading"
        type="spinner"
        vertical
        class="flex justify-center py-12"
      >
        ဆောင်ရွက်နေသည်...
      </VanLoading>

      <VanEmpty
        v-else-if="!recentGames.length"
        :description="
          t(
            'No recent games',
            'မည်သည့်နောက်ဆုံးဂိမ်းမျှ မရှိသေးပါ',
            '暂无最近游戏',
            'ไม่มีเกมล่าสุด',
          )
        "
        image="search"
        class="py-12"
      />

      <div
        v-else
        class="grid lg:grid-cols-6 md:grid-cols-6 grid-cols-3 gap-2 md:gap-4"
      >
        <div
          v-for="game in recentGames"
          :key="game.id"
          @click="handleGameClick(game)"
        >
          <GameCard :game="game" />
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

<style scoped>
:deep(.van-empty__description) {
  color: #666;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
}
</style>
