<script setup>
import { ref, h, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Navigation, Pagination, Grid } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/grid";
import GameCard from "../components/GameCard.vue";
import GameSection from "../components/GameSection.vue";
import GameLaunchModal from "../components/GameLaunchModal.vue";
import GameCategoryScroller from "../components/GameCategoryScroller.vue";
import { Dialog, showDialog, closeToast } from "vant";
import axios from "axios";
import { useModal } from "../composables/useModal";
import { useGameLaunchModal } from "../composables/useGameLaunchModal";
import { useLoadingToast } from "../composables/useLoadingToast";
import { useTranslation } from "../composables/useTranslation";
import { usePerformanceMode } from "../composables/usePerformanceMode";
import { getApiErrorMessage } from "../composables/useApiError";
import BannerSection from "../components/BannerSection.vue";

const store = useStore();
const { reduceEffects: reduceEffectsMode } = usePerformanceMode();
const router = useRouter();
const {
  openLoginModal,
  openRegisterModal,
  openDepositModal,
  openWithdrawModal,
} = useModal();

const { t } = useTranslation();
const { showLoading, hideLoading } = useLoadingToast();

const searchQuery = ref("");
const initialSlide = ref(2);
const isLoading = ref(false);
const hotGames = ref({
  slotGames: [],
  fishingGames: [],
  arcadeGames: [],
  buffaloGames: [],
});
const websiteInfo = ref({
  noticeText: "",
  home_banners: [],
});
const limitText = ref("");
const desiredGame = ref(null);

const isLoggedIn = computed(() => {
  const authUser = store.state.authUser;
  return authUser && Object.keys(authUser).length > 0 && authUser.id;
});
const isLimitModalOpen = ref(false);
const isCardGameModalOpen = ref(false);
const selectedCardGame = ref(null); // 'skm' or 'bgy'

// Icon components using render functions
const IconHome = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-white",
    },
    [
      h("path", {
        d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      }),
      h("polyline", { points: "9 22 9 12 15 12 15 22" }),
    ],
  );

const IconSlots = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-orange-500",
    },
    [
      h("rect", {
        x: "2",
        y: "2",
        width: "20",
        height: "20",
        rx: "2.18",
        ry: "2.18",
      }),
      h("line", { x1: "7", y1: "2", x2: "7", y2: "22" }),
      h("line", { x1: "17", y1: "2", x2: "17", y2: "22" }),
      h("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
      h("line", { x1: "2", y1: "7", x2: "7", y2: "7" }),
      h("line", { x1: "2", y1: "17", x2: "7", y2: "17" }),
      h("line", { x1: "17", y1: "17", x2: "22", y2: "17" }),
      h("line", { x1: "17", y1: "7", x2: "22", y2: "7" }),
    ],
  );

const IconFish = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-[#1986E1]",
    },
    [
      h("path", {
        d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",
      }),
      h("circle", { cx: "12", cy: "12", r: "3" }),
      h("path", { d: "M12 1v6m0 6v6" }),
    ],
  );

const IconCards = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-purple-500",
    },
    [
      h("rect", {
        x: "3",
        y: "2",
        width: "18",
        height: "20",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
      h("path", { d: "M8 10h8M8 14h8" }),
    ],
  );

const IconChip = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-green-500",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("circle", { cx: "12", cy: "12", r: "6" }),
      h("path", { d: "M12 2v4m0 12v4M2 12h4m12 0h4" }),
    ],
  );

const IconSports = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-gray-400",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("path", {
        d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
      }),
      h("path", { d: "M2 12h20" }),
    ],
  );

const IconEsports = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-teal-500",
    },
    [
      h("line", { x1: "6", y1: "12", x2: "10", y2: "12" }),
      h("line", { x1: "8", y1: "10", x2: "8", y2: "14" }),
      h("line", { x1: "15", y1: "13", x2: "15.01", y2: "13" }),
      h("line", { x1: "18", y1: "11", x2: "18.01", y2: "11" }),
      h("rect", {
        x: "2",
        y: "6",
        width: "20",
        height: "12",
        rx: "2",
      }),
    ],
  );

const IconCockfighting = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "text-red-500",
    },
    [
      h("path", {
        d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
      }),
    ],
  );

// Marquee text
const marqueeText = computed(() => {
  return (
    websiteInfo.value.noticeText ||
    "Tiger899 Game Paradise မှကြိုဆိုပါတယ်၊ Welcome to Tiger899 - Best Online Gaming Platform - အကောင်းဆုံး အွန်လိုင်း ဂိမ်းပလက်ဖောင်း"
  );
});

// Image link generation function
const imageLinkGenerate = (gameId, type) => {
  if (type === "Jili") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/jili/${gameId}.webp`;
  }
  if (type === "Rich88") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/rich88/${gameId}.webp`;
  }
  if (type === "Live22") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/live22/${gameId}.webp`;
  }
  if (type === "Spade") {
    return `https://merchantapi.silverkirin88.com/thumbnail/en_US/${gameId}.jpg`;
  }
  if (type === "Fastspin") {
    return `http://api-egame-staging.fsuat.com/thumbnail/en_US/${gameId}.jpg`;
  }
  if (type === "Playstar") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/playstar/${gameId}.webp`;
  }
  if (type === "FaChai") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/fachai/${gameId}.webp`;
  }
  if (type === "PGSoft") {
    // return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/pgsoft/pgsoft_${gameId}.webp`;
    return `https://cdn.myanmarshankoeme.com/build/assets/img/fgg/${gameId}.webp`;
  }
  if (type === "JOKER" || type === "Joker") {
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/joker/${gameId}.webp`;
  }
  if (type === "5G") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/5g/${gameId}.webp`;
  }
  if (type === "KA") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/newKA/${gameId}.webp`;
  }
  if (type === "AceWin") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/acewin/${gameId}_EN.webp`;
  }
  if (type === "JDB") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/jdb/${gameId}.webp`;
  }
  if (type === "Buffalo") {
    return this.buffaloImage(gameId, provider);
  }
  if (type === "HotDog") {
    return `https://res.hotdog-gaming.com/banners/380x500/${gameId}.png`;
  }
  if (type === "Rich") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/rich/${gameId}.webp`;
  }
  if (type === "CQ9" || type === "cq9" || type === "SexySlot") {
    return `https://space-tech.sgp1.cdn.digitaloceanspaces.com/slot-images/cq9/cq9_${gameId}.webp`;
  }
  if (type === "BTG") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/btg/${gameId}.webp`;
  }
  if (type === "2J") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/2j/${gameId}.webp`;
  }
  if (type === "VA") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/va/${gameId}_en.webp`;
  }
  if (type === "BNG") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/bng/${gameId}.webp`;
  }
  if (type === "AfricanBuffalo") {
    return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/afb/${gameId}.webp`;
  }

  return `https://cdn.myanmarshankoeme.com/build/assets/img/bf688/pp/${gameId}.webp`;
};

// Show alert box for PGSoft/FaChai
const showAlertBox = (game) => {
  if (game.provider === "PGSoft") {
    limitText.value = t(
      "In PG Soft, 1K unit equals 1,000 Kyats.",
      "PG Soft တွင် 1K unit သည် 1,000 ကျပ်နှင့်ညီမျပါသည်။",
      "PG Soft 中 1K 单位等于 1,000 缅币。",
      "ใน PG Soft หน่วย 1K เท่ากับ 1,000 จ๊าด",
    );
  } else if (game.provider === "FaChai") {
    limitText.value = t(
      "In FaChai, 1 unit equals 100 Kyats.",
      "FaChai Provider တွင် 1 unit သည် 100 ကျပ်နှင့်ညီမျပါသည်။",
      "FaChai 中 1 单位等于 100 缅币。",
      "ใน FaChai หน่วย 1 เท่ากับ 100 จ๊าด",
    );
  }
  isLimitModalOpen.value = true;
  desiredGame.value = game;
};

// Hide limit modal
const hideLimit = () => {
  isLimitModalOpen.value = false;
};

// Game launch modal/sheet (Play + Free Demo) - same UI and logic as SlotsPage
const {
  showGameModal,
  showGameActionSheet,
  selectedGameForModal,
  isMobile,
  gameInit,
  handleGameClick: openGameLaunchModal,
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

// Fetch hot games
const fetchHotGames = async () => {
  try {
    const res = await axios.get("/hot-games");
    hotGames.value = res.data.data;

    // Sort games - Pragmatic first
    if (hotGames.value.slotGames) {
      hotGames.value.slotGames = hotGames.value.slotGames.sort((a, b) => {
        if (a.provider === "Pragmatic" && b.provider !== "Pragmatic") return -1;
        if (a.provider !== "Pragmatic" && b.provider === "Pragmatic") return 1;
        return 0;
      });
    }
    if (hotGames.value.fishingGames) {
      hotGames.value.fishingGames = hotGames.value.fishingGames.sort((a, b) => {
        if (a.provider === "Pragmatic" && b.provider !== "Pragmatic") return -1;
        if (a.provider !== "Pragmatic" && b.provider === "Pragmatic") return 1;
        return 0;
      });
    }
    if (hotGames.value.arcadeGames) {
      hotGames.value.arcadeGames = hotGames.value.arcadeGames.sort((a, b) => {
        if (a.provider === "Pragmatic" && b.provider !== "Pragmatic") return -1;
        if (a.provider !== "Pragmatic" && b.provider === "Pragmatic") return 1;
        return 0;
      });
    }
  } catch (error) {
    console.error("Error fetching hot games:", error);
  }
};

// Fetch website info
const fetchWebsiteData = async () => {
  try {
    const res = await axios.get("/website-infos");
    if (res.data.data && res.data.data.length > 0) {
      websiteInfo.value = res.data.data[0];
    }
  } catch (error) {
    console.error("Error fetching website data:", error);
  }
};

// Card games data
const cardGamesData = [
  {
    id: "skm",
    name: "Shan Ko Mee",
    image:
      "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/bufalo688_skm.webp",
    action: "changeSideNav",
    value: "skm",
  },
  {
    id: "bgy",
    name: "Bugyee",
    image:
      "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/buffalo688_bgy.webp",
    action: "changeSideNav",
    value: "bgy",
  },
  {
    id: "forest",
    name: "Forest",
    image:
      "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/buffalo688_forest.webp",
    action: "fetchForestData",
  },
  {
    id: "galone",
    name: "Galone",
    image:
      "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/buffalo688_galone.webp",
    action: "fetchGaloneData",
  },
];

// Transform card games for GameCard component
const cardGames = computed(() => {
  return cardGamesData.map((game) => ({
    id: game.id,
    title: game.name,
    image: game.image,
    originalGame: game,
  }));
});

// Change side nav
const changeSideNav = (nav) => {
  store.commit("updateSideNav", nav);
};

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

// Fetch Forest Data
const fetchForestData = async () => {
  showLoading();
  try {
    isLoading.value = true;
    const authUser = await store.dispatch("fetchUser");
    if (!authUser) {
      openLoginModal();
      hideLoading();
      return;
    }

    const res = await axios.get("/forest-data", {
      params: {
        id: store.state.authUser.name,
        balance: store.state.authUser.game_balance,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res?.data?.data ?? res?.data ?? {};
      const apiDescription =
        data?.description ??
        res?.data?.description ??
        data?.message ??
        res?.data?.message ??
        "";
      let gameUrl =
        data.gameUrl ??
        data.game_url ??
        data.url ??
        res?.data?.gameUrl ??
        res?.data?.url ??
        "";
      gameUrl = String(gameUrl || "").trim();

      if (gameUrl) {
        gameUrl += gameUrl.includes("?") ? "&" : "?";
        store.commit("setIframeURL", gameUrl);
        const useMobileFrame = typeof window !== "undefined" && window.innerWidth >= 768;
        store.commit("setForceMobileFrame", useMobileFrame);
        await router.push({
          name: "game-iframe",
          state: { gameUrl, forceMobileFrame: useMobileFrame },
        });
      } else {
        closeToast();
        await showDialog({
          title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
          message:
            String(apiDescription).trim() ||
            t(
              "Game URL not available. Please contact customer service.",
              "ဂိမ်းလင့်မရရှိပါ။ Customer service သို့ ဆက်သွယ်ပေးပါ။",
              "无法获取游戏链接，请联系客服。",
              "ไม่สามารถโหลดลิงก์เกมได้ กรุณาติดต่อฝ่ายบริการลูกค้า",
            ),
          confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
          theme: "round-button",
          className: "logout-dialog-dark",
          confirmButtonColor: "#1986E1",
        });
      }
  } catch (error) {
    console.error("Error fetching forest data:", error);
    const message =
      getApiErrorMessage(error) ||
      t(
        "Failed to load game. Please try again.",
        "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
        "加载游戏失败，请重试。",
        "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    await showDialog({
      title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
      message,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      className: "logout-dialog-dark",
      confirmButtonColor: "#1986E1",
    });
  } finally {
    isLoading.value = false;
    hideLoading();
  }
};

// Fetch Galone Data
const fetchGaloneData = async () => {
  showLoading();
  try {
    isLoading.value = true;
    const authUser = await store.dispatch("fetchUser");
    if (!authUser) {
      openLoginModal();
      hideLoading();
      return;
    }

    const res = await axios.get("/galone-data", {
      params: {
        id: store.state.authUser.name,
        balance: store.state.authUser.game_balance,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res?.data?.data ?? res?.data ?? {};
      const apiDescription =
        data?.description ??
        res?.data?.description ??
        data?.message ??
        res?.data?.message ??
        "";
      let gameUrl =
        data.gameUrl ??
        data.game_url ??
        data.url ??
        res?.data?.gameUrl ??
        res?.data?.url ??
        "";
      gameUrl = String(gameUrl || "").trim();

      if (gameUrl) {
        gameUrl += gameUrl.includes("?") ? "&" : "?";
        store.commit("setIframeURL", gameUrl);
        const useMobileFrame = typeof window !== "undefined" && window.innerWidth >= 768;
        store.commit("setForceMobileFrame", useMobileFrame);
        await router.push({
          name: "game-iframe",
          state: { gameUrl, forceMobileFrame: useMobileFrame },
        });
      } else {
        closeToast();
        await showDialog({
          title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
          message:
            String(apiDescription).trim() ||
            t(
              "Game URL not available. Please contact customer service.",
              "ဂိမ်းလင့်မရရှိပါ။ Customer service သို့ ဆက်သွယ်ပေးပါ။",
              "无法获取游戏链接，请联系客服。",
              "ไม่สามารถโหลดลิงก์เกมได้ กรุณาติดต่อฝ่ายบริการลูกค้า",
            ),
          confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
          theme: "round-button",
          className: "logout-dialog-dark",
          confirmButtonColor: "#1986E1",
        });
      }
  } catch (error) {
    console.error("Error fetching galone data:", error);
    const message =
      getApiErrorMessage(error) ||
      t(
        "Failed to load game. Please try again.",
        "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
        "加载游戏失败，请重试。",
        "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    await showDialog({
      title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
      message,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      className: "logout-dialog-dark",
      confirmButtonColor: "#1986E1",
    });
  } finally {
    isLoading.value = false;
    hideLoading();
  }
};

// Fetch Shan Ko Mee Data
const fetchShanKoMeeData = async (level = null) => {
  showLoading();
  try {
    isLoading.value = true;
    const authUser = await store.dispatch("fetchUser");
    if (!authUser) {
      openLoginModal();
      hideLoading();
      return;
    }

    // Use authUser.game_balance directly since fetchUser returns the updated user data
    // The store is also updated, but use the returned value for immediate access
    const amount = Number(
      store.state.authUser?.amount || authUser?.amount || 0,
    );

    // Level validation
    if (level == 0 && amount < 1000) {
      limitText.value = t(
        "Below 1,000. Please deposit more to play this room.",
        "1,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于1,000。请先充值后再进入此房间。",
        "ต่ำกว่า 1,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 0 && amount > 100000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 1 && amount < 3000) {
      limitText.value = t(
        "Below 3,000. Please deposit more to play this room.",
        "3,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于3,000。请先充值后再进入此房间。",
        "ต่ำกว่า 3,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 1 && amount > 300000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 2 && amount < 5000) {
      limitText.value = t(
        "Below 5,000. Please deposit more to play this room.",
        "5,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于5,000。请先充值后再进入此房间。",
        "ต่ำกว่า 5,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 2 && amount > 500000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 3 && amount < 10000) {
      limitText.value = t(
        "Below 10,000. Please deposit more to play this room.",
        "10,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于10,000。请先充值后再进入此房间。",
        "ต่ำกว่า 10,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 4 && amount < 30000) {
      limitText.value = t(
        "Below 30,000. Please deposit more to play this room.",
        "30,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于30,000。请先充值后再进入此房间。",
        "ต่ำกว่า 30,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 5 && amount < 50000) {
      limitText.value = t(
        "Below 50,000. Please deposit more to play this room.",
        "50,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于50,000。请先充值后再进入此房间。",
        "ต่ำกว่า 50,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    const res = await axios.get("/shankomee-data", {
      params: {
        id: store.state.authUser.name,
        level,
        balance: store.state.authUser.game_balance,
        info: {
          nickname: store.state.authUser.user_name,
          profile: 3,
        },
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res?.data?.data ?? res?.data ?? {};
      const apiDescription =
        data?.description ??
        res?.data?.description ??
        data?.message ??
        res?.data?.message ??
        "";
      let gameUrl =
        data.gameUrl ??
        data.game_url ??
        data.url ??
        res?.data?.gameUrl ??
        res?.data?.url ??
        "";
      gameUrl = String(gameUrl || "").trim();

      if (gameUrl) {
        gameUrl += gameUrl.includes("?") ? "&" : "?";
        store.commit("setIframeURL", gameUrl);
        await router.push({ name: "game-iframe", state: { gameUrl } });
      } else {
        closeToast();
        await showDialog({
          title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
          message:
            String(apiDescription).trim() ||
            t(
              "Game URL not available. Please contact customer service.",
              "ဂိမ်းလင့်မရရှိပါ။ Customer service သို့ ဆက်သွယ်ပေးပါ။",
              "无法获取游戏链接，请联系客服。",
              "ไม่สามารถโหลดลิงก์เกมได้ กรุณาติดต่อฝ่ายบริการลูกค้า",
            ),
          confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
          theme: "round-button",
          className: "logout-dialog-dark",
          confirmButtonColor: "#1986E1",
        });
      }
    closeCardGameModal();
  } catch (error) {
    console.error("Error fetching Shan Ko Mee data:", error);
    closeCardGameModal();
    const message =
      getApiErrorMessage(error) ||
      t(
        "Failed to load game. Please try again.",
        "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
        "加载游戏失败，请重试。",
        "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    await showDialog({
      title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
      message,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      className: "logout-dialog-dark",
      confirmButtonColor: "#1986E1",
    });
  } finally {
    isLoading.value = false;
    hideLoading();
  }
};

// Fetch Bugyee Data
const fetchBugyee = async (level = null) => {
  showLoading();
  try {
    isLoading.value = true;
    const authUser = await store.dispatch("fetchUser");
    if (!authUser) {
      openLoginModal();
      hideLoading();
      return;
    }

    const amount = Number(
      store.state.authUser?.amount || authUser?.amount || 0,
    );

    // Level validation (same as SKM)
    if (level == 0 && amount < 1000) {
      limitText.value = t(
        "Below 1,000. Please deposit more to play this room.",
        "1,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于1,000。请先充值后再进入此房间。",
        "ต่ำกว่า 1,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 0 && amount > 100000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 1 && amount < 3000) {
      limitText.value = t(
        "Below 3,000. Please deposit more to play this room.",
        "3,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于3,000。请先充值后再进入此房间。",
        "ต่ำกว่า 3,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 1 && amount > 300000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 2 && amount < 5000) {
      limitText.value = t(
        "Below 5,000. Please deposit more to play this room.",
        "5,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于5,000。请先充值后再进入此房间。",
        "ต่ำกว่า 5,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 2 && amount > 500000) {
      limitText.value = t(
        "Above the limit. Please play in a suitable room.",
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။",
        "超过上限。请在合适的房间进行游戏。",
        "เกินวงเงิน กรุณาเล่นในห้องที่เหมาะสม",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    if (level == 3 && amount < 10000) {
      limitText.value = t(
        "Below 10,000. Please deposit more to play this room.",
        "10,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于10,000。请先充值后再进入此房间。",
        "ต่ำกว่า 10,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 4 && amount < 30000) {
      limitText.value = t(
        "Below 30,000. Please deposit more to play this room.",
        "30,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于30,000。请先充值后再进入此房间。",
        "ต่ำกว่า 30,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }
    if (level == 5 && amount < 50000) {
      limitText.value = t(
        "Below 50,000. Please deposit more to play this room.",
        "50,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။",
        "低于50,000。请先充值后再进入此房间。",
        "ต่ำกว่า 50,000 กรุณาฝากเงินเพิ่มเติมเพื่อเข้าเล่นห้องนี้",
      );
      isLimitModalOpen.value = true;
      isLoading.value = false;
      closeCardGameModal();
      return false;
    }

    const res = await axios.get("/bugyee-data", {
      params: {
        id: store.state.authUser.name,
        level,
        balance: store.state.authUser.game_balance,
        info: {
          nickname: store.state.authUser.user_name,
          profile: 3,
        },
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = res?.data?.data ?? res?.data ?? {};
      const apiDescription =
        data?.description ??
        res?.data?.description ??
        data?.message ??
        res?.data?.message ??
        "";
      let gameUrl =
        data.gameUrl ??
        data.game_url ??
        data.url ??
        res?.data?.gameUrl ??
        res?.data?.url ??
        "";
      gameUrl = String(gameUrl || "").trim();

      if (gameUrl) {
        gameUrl += gameUrl.includes("?") ? "&" : "?";
        store.commit("setIframeURL", gameUrl);
        await router.push({ name: "game-iframe", state: { gameUrl } });
      } else {
        closeToast();
        await showDialog({
          title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
          message:
            String(apiDescription).trim() ||
            t(
              "Game URL not available. Please contact customer service.",
              "ဂိမ်းလင့်မရရှိပါ။ Customer service သို့ ဆက်သွယ်ပေးပါ။",
              "无法获取游戏链接，请联系客服。",
              "ไม่สามารถโหลดลิงก์เกมได้ กรุณาติดต่อฝ่ายบริการลูกค้า",
            ),
          confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
          theme: "round-button",
          className: "logout-dialog-dark",
          confirmButtonColor: "#1986E1",
        });
      }
    closeCardGameModal();
  } catch (error) {
    console.error("Error fetching Bugyee data:", error);
    closeCardGameModal();
    const message =
      getApiErrorMessage(error) ||
      t(
        "Failed to load game. Please try again.",
        "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
        "加载游戏失败，请重试。",
        "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    await showDialog({
      title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
      message,
      confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
      theme: "round-button",
      className: "logout-dialog-dark",
      confirmButtonColor: "#1986E1",
    });
  } finally {
    isLoading.value = false;
    hideLoading();
  }
};

// Handle "more" button click in game sections
const handleMoreClick = (routeName) => {
  router.push({ name: routeName });
};

// Handle game card click
const handleGameClick = (game) => {
  // Check if it's a card game
  if (game.originalGame && game.originalGame.action) {
    const cardGame = game.originalGame;
    if (cardGame.action === "changeSideNav") {
      // Open modal for SKM or BGY
      if (cardGame.value === "skm" || cardGame.value === "bgy") {
        openCardGameModal(cardGame.value);
      } else {
        changeSideNav(cardGame.value);
      }
    } else if (cardGame.action === "fetchForestData") {
      fetchForestData();
    } else if (cardGame.action === "fetchGaloneData") {
      fetchGaloneData();
    }
    return;
  }

  // Regular game logic - show Play/Free Demo modal or sheet
  openGameLaunchModal(game);
};

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    console.log("Searching for:", searchQuery.value);
    // Add your search logic here
  }
};

// Get SKM image name by level
const getSKMImageName = (level) => {
  const images = [
    "R1", // Level 0
    "R2", // Level 1
    "R3", // Level 2
    "R4", // Level 3
    "R5", // Level 4
    "R6", // Level 5
  ];
  return images[level] || images[0];
};

// Get BGY image name by level (same as SKM)
const getBGYImageName = (level) => {
  return getSKMImageName(level);
};

// Initialize on mount
onMounted(async () => {
  showLoading();
  try {
    await fetchWebsiteData();
    await fetchHotGames();
  } finally {
    hideLoading();
  }
});

const swiperModules = [Autoplay, Navigation, Pagination];

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

// Hot games transformed for display
const hotSlotGames = computed(() =>
  hotGames.value.slotGames.map(transformGame),
);
const hotFishingGames = computed(() =>
  hotGames.value.fishingGames.map(transformGame),
);
const hotArcadeGames = computed(() =>
  hotGames.value.arcadeGames.map(transformGame),
);
const hotBuffaloGames = computed(() =>
  hotGames.value.buffaloGames.map(transformGame),
);
// All hot games combined for the main hot section (limit on mobile for smoother Android scroll)
const HOT_GAMES_MOBILE_LIMIT = 12;
const allHotGames = computed(() => {
  const list = [
    ...hotGames.value.slotGames,
    ...hotGames.value.fishingGames,
    ...hotGames.value.arcadeGames,
    ...hotGames.value.buffaloGames,
  ].map(transformGame);
  if (isMobile.value && list.length > HOT_GAMES_MOBILE_LIMIT) {
    return list.slice(0, HOT_GAMES_MOBILE_LIMIT);
  }
  return list;
});

const gamesSwiperRef = ref(null);
const slotsSwiperRef = ref(null);
const fishingSwiperRef = ref(null);
const cardSwiperRef = ref(null);
const sportSwiperRef = ref(null);
const buffaloSwiperRef = ref(null);

const navigateSwiper = (swiperRef, direction) => {
  if (swiperRef.value) {
    const swiper = swiperRef.value.$el?.swiper || swiperRef.value.swiper;
    if (swiper) {
      direction === "next" ? swiper.slideNext() : swiper.slidePrev();
    }
  }
};

const nextGames = () => navigateSwiper(gamesSwiperRef, "next");
const prevGames = () => navigateSwiper(gamesSwiperRef, "prev");
const nextSlots = () => navigateSwiper(slotsSwiperRef, "next");
const prevSlots = () => navigateSwiper(slotsSwiperRef, "prev");
const nextFishing = () => navigateSwiper(fishingSwiperRef, "next");
const prevFishing = () => navigateSwiper(fishingSwiperRef, "prev");

// All game providers (merged from Slots, Fish, Buffalo) for the scrollable list below Fishing section
const allProviders = [
  // { id: 0, name: "Gold", logo: "https://storage.googleapis.com/spacetech2/yu95/gold549.avif" },
  // { id: -1, name: "ShweSpin", logo: "https://storage.googleapis.com/spacetech2/yu95/shwespin.avif" },
  { id: 1, name: "Pragmatic", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PP-WHITE.png" },
  { id: 2, name: "PGSoft", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/PG-WHITE.png" },
  { id: 3, name: "JILI", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JL-WHITE.png" },
  { id: 4, name: "2J", logo: "https://storage.googleapis.com/spacetech2/yu95/2j.webp" },
  { id: 5, name: "HotDog", logo: "https://storage.googleapis.com/spacetech2/yu95/hotdog-renew.png" },
  { id: 6, name: "VA", logo: "https://storage.googleapis.com/spacetech2/yu95/va-white.webp" },
  { id: 7, name: "Live22", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/L22-WHITE.png" },
  { id: 8, name: "AceWin", logo: "https://storage.googleapis.com/spacetech2/yu95/acewin-new.png" },
  { id: 9, name: "JDB", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/JDB-WHITE.png" },
  { id: 10, name: "5G", logo: "https://storage.googleapis.com/spacetech2/yu95/new-5g-white.png" },
  { id: 11, name: "FaChai", logo: "https://storage.googleapis.com/spacetech2/yu95/FC-WHITE.png" },
  { id: 12, name: "BTG", logo: "https://storage.googleapis.com/spacetech2/yu95/BT-WHITE.png" },
  { id: 13, name: "KA", logo: "https://storage.googleapis.com/spacetech2/yu95/KA-WHITE.png" },
  { id: 14, name: "Playstar", logo: "https://storage.googleapis.com/spacetech2/yu95/PS-WHITE.png" },
  { id: 15, name: "Rich", logo: "https://storage.googleapis.com/spacetech2/yu95/rich-white.png" },
  { id: 16, name: "CQ9", logo: "https://images.484930494.com//TCG_PROD_IMAGES/RNG_LIST_VENDOR/CQ9-WHITE.png" },
  { id: 17, name: "Rich88", logo: "/assets/rich88-logo.png" },
];
const nextCard = () => navigateSwiper(cardSwiperRef, "next");
const prevCard = () => navigateSwiper(cardSwiperRef, "prev");
const nextBuffalo = () => navigateSwiper(buffaloSwiperRef, "next");
const prevBuffalo = () => navigateSwiper(buffaloSwiperRef, "prev");
const nextSport = () => navigateSwiper(sportSwiperRef, "next");
const prevSport = () => navigateSwiper(sportSwiperRef, "prev");

// "Coming Soon" handlers for Slots & Fishing sections
const showComingSoonDialog = () => {
  Dialog.alert({
    title: t("Coming Soon", "မကြာမီ လာရောက်မည်", "即将推出", "เร็วๆ นี้"),
    message: t(
      "This game section will be available soon.",
      "ဤအစိတ်အပိုင်းကို မကြာမီ အသုံးပြုနိုင်မည် ဖြစ်ပါသည်။",
      "该游戏专区即将上线。",
      "ส่วนเกมนี้จะเปิดให้เล่นในเร็วๆ นี้",
    ),
    confirmButtonText: t("OK", "သဘောတူပါသည်", "好的", "ตกลง"),
  });
};

const handleSlotsSectionClick = () => {
  showComingSoonDialog();
};

const handleFishingSectionClick = () => {
  showComingSoonDialog();
};
</script>

<template>
  <div class="home-page-root">
    <!-- SEO: single H1 for Myanmar slot / casino (sr-only for crawlers & screen readers) -->
    <h1 class="sr-only">{{ t("Tiger899 - Myanmar Slot Games | Best Online Casino & Slots", "Tiger899 - မြန်မာစလော့ဂိမ်း အကောင်းဆုံး အွန်လိုင်းကာစီနို", "Tiger899 - 缅甸老虎机 最佳在线娱乐场", "Tiger899 - สล็อตเมียนมาร์ คาสิโนออนไลน์ที่ดีที่สุด") }}</h1>

    <div class="ixmm-ticker">
      <div class="flex items-center py-1.5">
        <div class="flex-shrink-0 px-3 text-[#f3d27a]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </div>
        <div class="flex-1 marquee-container overflow-hidden">
          <div class="marquee-content marquee-gpu">
            <span class="text-white/90 font-['Pyidaungsu','Padauk',sans-serif] text-xs md:text-sm font-medium">
              {{ marqueeText }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="ixmm-banner">
      <BannerSection :is-mobile="isMobile" />
    </div>

    <div class="ixmm-home-body space-y-4 md:space-y-6">
      <div class="flex items-center justify-center gap-3 px-3 pt-3">
        <template v-if="isLoggedIn">
          <button
            type="button"
            class="btn-ixmm-login px-6 py-2 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openWithdrawModal"
          >
            {{ t("Withdraw", "ငွေထုတ်", "提款", "ถอนเงิน") }}
          </button>
          <button
            type="button"
            class="btn-ixmm-register px-6 py-2 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openDepositModal"
          >
            {{ t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน") }}
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="btn-ixmm-login px-6 py-2 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openLoginModal"
          >
            {{ t("Login", "လော့ဂ်အင်", "登录", "เข้าสู่ระบบ") }}
          </button>
          <button
            type="button"
            class="btn-ixmm-register px-6 py-2 text-sm font-['Pyidaungsu','Padauk',sans-serif]"
            @click="openRegisterModal"
          >
            {{ t("Register", "အကောင့်ဖွင့်ရန်", "注册", "สมัครบัญชี") }}
          </button>
        </template>
      </div>

      <div class="px-4 text-center max-w-3xl mx-auto">
        <h2 class="text-base md:text-xl font-bold text-white font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Welcome to the best online casino in Myanmar.", "မြန်မာနိုင်ငံတွင်အကောင်းဆုံးအွန်လိုင်းကာစီနိုမှကြိုဆိုပါသည်။", "欢迎来到缅甸最佳在线娱乐场。", "ยินดีต้อนรับสู่คาสิโนออนไลน์ที่ดีที่สุดในเมียนมาร์") }}
        </h2>
        <p class="mt-2 text-xs md:text-sm text-white/75 font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("We provide a premium online gaming experience with slots, live casino, sports and more.", "ကျွန်ုပ်တို့သည် ပရီမီယံအွန်လိုင်းလောင်းကစားအတွေ့အကြုံကို ပေးဆောင်ပါသည်။", "我们提供优质线上娱乐体验。", "เรามอบประสบการณ์เดิมพันออนไลน์ระดับพรีเมียม") }}
        </p>
      </div>

      <GameCategoryScroller />

    <!-- Hot Games Section -->
    <div class="px-1 space-y-2 md:px-0 md:space-y-4 md:rounded-2xl md:bg-[#080E1E] md:border md:border-white/10 md:p-5">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#1986E1] text-white">
          <img
            src="/hot.png"
            alt=""
            class="w-4 h-4"
          />
          <h2 class="text-sm md:text-base font-semibold font-['Pyidaungsu','Padauk',sans-serif]">
            {{ t("Hot Games", "ဟော့ဂိမ်းများ", "热门游戏", "เกมยอดนิยม") }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <span
            @click="router.push({ name: 'slots' })"
            class="btn-app btn-app-blue text-[11px] md:text-xs py-1 px-2.5 font-semibold block font-['Pyidaungsu','Padauk',sans-serif] cursor-pointer"
          >
            {{ t("See more", "အားလုံးကြည့်ရန်", "查看全部", "ดูทั้งหมด") }}
          </span>
          <div class="flex gap-1.5">
            <button
              @click="prevGames"
              class="btn-app btn-app-dark w-7 h-7 text-white flex items-center justify-center hover:bg-[#1986E1] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              @click="nextGames"
              class="btn-app btn-app-dark w-7 h-7 text-white flex items-center justify-center hover:bg-[#1986E1] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Games Swiper -->
      <div class="relative">
        <Swiper
          ref="gamesSwiperRef"
          :modules="[Navigation, Grid]"
          :slides-per-view="3"
          :space-between="10"
          :speed="250"
          :grid="{
            rows: 2,
            fill: 'row',
          }"
          :breakpoints="{
            640: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 6,
              spaceBetween: 24,
            },
          }"
          class="games-swiper"
        >
          <SwiperSlide
            v-for="game in allHotGames"
            :key="game.id"
          >
            <div @click="handleGameClick(game)">
              <GameCard :game="game" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>

    <!-- Buffalo Games Section -->
    <GameSection
      :title="t('Buffalo', 'ကျွဲ', '野牛', 'ควาย')"
      :image="'https://storage.googleapis.com/spacetech2/yu95/kYAWEL-Green.png'"
      :games="hotBuffaloGames"
      :swiper-ref="buffaloSwiperRef"
      :grid-rows="1"
      @next="nextBuffalo"
      @prev="prevBuffalo"
      @game-click="handleGameClick"
      @more-click="handleMoreClick('buffalo')"
    />

    <!-- Card Games Section -->
    <GameSection
      :title="t('Cards', 'ဖဲဂိမ်း', '棋牌游戏', 'ไพ่')"
      :image="'/card.png'"
      :games="cardGames"
      :swiper-ref="cardSwiperRef"
      :grid-rows="1"
      @next="nextCard"
      @prev="prevCard"
      @game-click="handleGameClick"
      @more-click="handleMoreClick('card-games')"
    />

    <!-- Slot Games Section -->
    <GameSection
      :title="t('Slots', 'စလော့', '老虎机', 'สล็อต')"
      :image="'/7.png'"
      :games="hotSlotGames"
      :swiper-ref="slotsSwiperRef"
      :grid-rows="2"
      @next="nextSlots"
      @prev="prevSlots"
      @game-click="handleGameClick"
      @more-click="handleMoreClick('slots')"
    />

    <!-- Fishing Games Section -->
    <GameSection
      :title="t('Fish', 'ငါးပစ်', '捕鱼', 'ยิงปลา')"
      :image="'/fish.png'"
      :games="hotFishingGames"
      :swiper-ref="fishingSwiperRef"
      :grid-rows="2"
      @next="nextFishing"
      @prev="prevFishing"
      @game-click="handleGameClick"
      @more-click="handleMoreClick('fish-shooting')"
    />

    <!-- Providers -->
    <div class="px-1 space-y-1 md:px-0 md:space-y-4 md:rounded-2xl md:bg-[#080E1E] md:border md:border-white/10 md:p-5">
      <h2 class="text-lg md:text-2xl font-bold text-white font-['Pyidaungsu','Padauk',sans-serif]">
        {{ t("Providers", "ပံ့ပိုးသူများ", "游戏供应商", "ผู้ให้บริการ") }}
      </h2>
      <div class="flex items-center gap-1 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-0.5 md:py-1 -mx-1 px-1 md:mx-0 md:px-0">
        <div
          v-for="provider in allProviders"
          :key="provider.id"
          class="shrink-0 rounded-md bg-white/5 p-1 hover:bg-white/10 transition-colors md:rounded-xl md:bg-[#172240] md:border md:border-white/8 md:px-3 md:py-2"
        >
          <img
            :src="provider.logo"
            :alt="provider.name"
            :class="[
              'w-[65px] h-[35px] md:w-[72px] md:h-[36px] object-contain',
              provider.name === 'Rich88' ? 'grayscale contrast-200' : '',
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Sport Games Section -->
    <!-- <GameSection
      title="အားကစား"
      :icon="IconSports"
      :games="[]"
      :swiper-ref="sportSwiperRef"
      @next="nextSport"
      @prev="prevSport"
      @game-click="handleGameClick"
    /> -->

    </div>

    <!-- Game launch modal/sheet (Play / Free Demo) -->
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

    <!-- Limit Modal -->
    <div
      v-if="isLimitModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4 modal-overlay"
      :class="reduceEffectsMode ? 'bg-black/70' : 'bg-black/60 backdrop-blur-sm'"
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
              {{
                t(
                  "Important Notice",
                  "အထူးသတိပြုရန်။",
                  "重要提示",
                  "ประกาศสำคัญ",
                )
              }}
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

    <!-- Card Game Level Selection Modal -->
    <div
      v-if="isCardGameModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4 modal-overlay"
      :class="reduceEffectsMode ? 'bg-black/70' : 'bg-black/60 backdrop-blur-sm'"
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

        <!-- Modal Title -->
        <h2 class="text-white text-xl font-bold mb-6 text-center font-['Pyidaungsu','Padauk',sans-serif]">
          {{ selectedCardGame === "skm" ? "Shan Ko Mee" : "Bugyee" }}
          - Level Selection
        </h2>

        <!-- Level Selection Grid -->
        <div class="flex flex-wrap justify-center gap-1">
          <img
            v-for="level in 6"
            :key="level - 1"
            :src="selectedCardGame === 'skm'
              ? `https://storage.googleapis.com/spacetech2/yu95/${getSKMImageName(
                level - 1,
              )}.webp`
              : `https://storage.googleapis.com/spacetech2/yu95/${getBGYImageName(
                level - 1,
              )}.webp`
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
  </div>
</template>

<style scoped>
.marquee-container {
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.marquee-content {
  display: inline-block;
  animation: marquee 30s linear infinite;
  padding-left: 100%;
}

.marquee-gpu {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.marquee-content:hover {
  animation-play-state: paused;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-100%);
  }
}

/* Hide scrollbar for menu bar */

/* Swiper Custom Styles */
:deep(.banner-swiper) {
  padding: 20px 40px 30px 40px;
  overflow: hidden;
}

/* Mobile: single full-width slide, no peek */
@media (max-width: 767px) {
  :deep(.banner-swiper) {
    /* padding: 10px 12px 20px; */
    padding: 0;
    overflow: hidden;
  }

  :deep(.banner-swiper .swiper-slide) {
    width: 100% !important;
    max-width: 100%;
  }
}

:deep(.banner-swiper .swiper-wrapper) {
  align-items: stretch;
}

:deep(.banner-swiper .swiper-slide) {
  transition:
    transform 0.3s ease,
    z-index 0.3s ease;
  height: auto;
  z-index: 1;
  /* Mobile: normal scale */
  transform: scale(1);
}

:deep(.banner-swiper .swiper-slide-active) {
  z-index: 10;
}

:deep(.banner-swiper .swiper-slide-prev),
:deep(.banner-swiper .swiper-slide-next) {
  z-index: 5;
}

/* Desktop (md+): scale effect for active/prev/next */
@media (min-width: 768px) {
  :deep(.banner-swiper .swiper-slide) {
    transform: scale(0.9);
  }

  :deep(.banner-swiper .swiper-slide-active) {
    transform: scale(1.1) !important;
  }

  :deep(.banner-swiper .swiper-slide-prev),
  :deep(.banner-swiper .swiper-slide-next) {
    transform: scale(0.9);
  }
}

:deep(.banner-swiper .swiper-button-next),
:deep(.banner-swiper .swiper-button-prev) {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

:deep(.banner-swiper .swiper-button-next:hover),
:deep(.banner-swiper .swiper-button-prev:hover) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

:deep(.banner-swiper .swiper-button-next::after),
:deep(.banner-swiper .swiper-button-prev::after) {
  font-size: 20px;
  font-weight: bold;
}

:deep(.banner-swiper .swiper-pagination) {
  bottom: 20px;
}

:deep(.banner-swiper .swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.5);
  width: 12px;
  height: 12px;
  transition: all 0.3s ease;
}

:deep(.banner-swiper .swiper-pagination-bullet-active) {
  background: white;
  width: 32px;
  border-radius: 6px;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Home page: containment for smoother scroll on Android */
.home-page-root {
  contain: layout style;
}

.ixmm-ticker {
  background: #11031f;
  border-bottom: 1px solid rgba(243, 210, 122, 0.18);
}

.ixmm-banner :deep(.banner-swiper-wrap) {
  border-radius: 0;
  margin-bottom: 0;
}

.ixmm-home-body {
  max-width: 1180px;
  margin-inline: auto;
  padding: 0 0.75rem 1.5rem;
}

@media (min-width: 768px) {
  .ixmm-home-body {
    padding: 0 1.5rem 2rem;
  }

  :deep(.banner-swiper .swiper-slide-active) {
    transform: scale(1);
  }
}

/* Games Swiper Styles */
:deep(.games-swiper) {
  padding: 10px 0;
}

:deep(.games-swiper .swiper-slide) {
  height: auto;
}

.heart-beat-animation {
  animation: heartbeat 1.5s infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.3);
  }

  50% {
    transform: scale(1);
  }

  60% {
    transform: scale(1.3);
  }

  70% {
    transform: scale(1);
  }

  100% {
    transform: scale(1);
  }
}
</style>
