<script setup>
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import GameCard from "../components/GameCard.vue";
import { showDialog, closeToast } from "vant";
import axios from "axios";
import { useModal } from "../composables/useModal";
import { useLoadingToast } from "../composables/useLoadingToast";
import GameCategoryScroller from "../components/GameCategoryScroller.vue";
import { useTranslation } from "../composables/useTranslation";
import { getApiErrorMessage } from "../composables/useApiError";

const router = useRouter();
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
      t("Failed to load game. Please try again.", "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။", "加载游戏失败，请重试。", "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
      t("Failed to load game. Please try again.", "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။", "加载游戏失败，请重试。", "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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

    const amount = Number(
      store.state.authUser?.amount || authUser?.amount || 0
    );

    // Level validation
    if (level == 0 && amount < 1000) {
      limitText.value =
        "1,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 0 && amount > 100000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 1 && amount < 3000) {
      limitText.value =
        "3,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 1 && amount > 300000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 2 && amount < 5000) {
      limitText.value =
        "5,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 2 && amount > 500000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 3 && amount < 10000) {
      limitText.value =
        "10,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 4 && amount < 30000) {
      limitText.value =
        "30,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 5 && amount < 50000) {
      limitText.value =
        "50,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
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
      t("Failed to load game. Please try again.", "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။", "加载游戏失败，请重试。", "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
      store.state.authUser?.amount || authUser?.amount || 0
    );
    // Level validation (same as SKM)
    if (level == 0 && amount < 1000) {
      limitText.value =
        "1,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 0 && amount > 100000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 1 && amount < 3000) {
      limitText.value =
        "3,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 1 && amount > 300000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 2 && amount < 5000) {
      limitText.value =
        "5,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 2 && amount > 500000) {
      limitText.value =
        "သတ်မှတ်ထားသော ငွေပမာဏထပ် ကျော်လွန်နေပါသည်။ သင့်လျော်သောအခန်းတွင်သာ ကစားပေးပါ။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }

    if (level == 3 && amount < 10000) {
      limitText.value =
        "10,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 4 && amount < 30000) {
      limitText.value =
        "30,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
      return false;
    }
    if (level == 5 && amount < 50000) {
      limitText.value =
        "50,000 အောက်ရောက်နေပါသည်။ ငွေထပ်မံဖြည့်သွင်းပြီးမှ သည်အခန်းကို ဆော့လို့ရပါမည်။";
      isLoading.value = false;
      closeCardGameModal();
      await nextTick();
      isLimitModalOpen.value = true;
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
      t("Failed to load game. Please try again.", "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။", "加载游戏失败，请重试。", "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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

const handleGameClick = (game) => {
  if (game.originalGame && game.originalGame.action) {
    const cardGame = game.originalGame;
    if (cardGame.action === "changeSideNav") {
      openCardGameModal(cardGame.value);
    } else if (cardGame.action === "fetchForestData") {
      fetchForestData();
    } else if (cardGame.action === "fetchGaloneData") {
      fetchGaloneData();
    }
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
      <img src="https://storage.googleapis.com/spacetech2/yu95/card.png" alt="" class="w-12 h-12 md:w-10 md:h-10" />
      <div>
        <h1 class="text-xl md:text-4xl font-bold text-white mb-2">မြန်မာ့ရိုးရာဖဲဂိမ်းများ</h1>
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
        <div class="flex flex-wrap justify-center gap-1">
          <img
            v-for="level in 6"
            :key="level - 1"
            :src="
              selectedCardGame === 'skm'
                ? `https://storage.googleapis.com/spacetech2/yu95/${getSKMImageName(
                    level - 1
                  )}.webp`
                : `https://storage.googleapis.com/spacetech2/yu95/${getBGYImageName(
                    level - 1
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
