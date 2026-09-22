import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import { showLoadingToast, showDialog, closeToast } from "vant";
import { useModal } from "./useModal";
import { useTranslation } from "./useTranslation";
import { getApiErrorMessage } from "./useApiError";

const PROVIDER_LABELS = {
  Pragmatic: "PP",
  PGSoft: "PG",
  Jili: "JILI",
  Spade: "Spade",
  JDB: "JDB",
  Live22: "L22",
  CQ9: "CQ9",
  R88: "R88",
  Evolution: "Evolution",
  NetEnt: "NetEnt",
  FaChai: "FaChai",
};

/**
 * Composable for game launch modal/sheet (Play + Free Demo) - same UI and logic as SlotsPage.
 * Use on any page that initializes games via /games/url.
 *
 * @param {Object} options
 * @param {(game: Object) => boolean | Promise<boolean>} [options.beforePlay] - If returns true, caller handles (e.g. show limit modal); don't call gameInit.
 */
export function useGameLaunchModal(options = {}) {
  const router = useRouter();
  const store = useStore();
  const { t } = useTranslation();
  const { openLoginModal } = useModal();
  const { beforePlay } = options;

  const showGameModal = ref(false);
  const showGameActionSheet = ref(false);
  const selectedGameForModal = ref(null);
  const isMobile = ref(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  function checkMobile() {
    if (typeof window === "undefined") return;
    isMobile.value = window.innerWidth < 768;
  }

  onMounted(() => {
    checkMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkMobile);
    }
  });
  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", checkMobile);
    }
  });

  const gameInit = async (game, isTest = false) => {
    const msg = t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...");
    try {
      showLoadingToast({ message: msg, duration: 0, forbidClick: false });
      const authUser = await store.dispatch("fetchUser");
      if (!authUser) {
        openLoginModal();
        closeToast();
        return;
      }

      const playType = isTest ? "demo" : "real";
      const res = await axios.get("/games/url", {
        params: {
          gameID: game.gameID,
          provider: game.provider,
          type: playType,
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

      // PGSoft (and some providers) return HTML instead of a URL: render in iframe via blob URL
      let rawHtml =
        data.html ??
        res?.data?.html ??
        (typeof res?.data === "string" && res.data.trimStart().startsWith("<")
          ? res.data
          : null) ??
        (gameUrl && gameUrl.trimStart().startsWith("<") ? gameUrl : null);
      if (!rawHtml) rawHtml = "";
      if (rawHtml && typeof rawHtml === "string") {
        const blob = new Blob([rawHtml], { type: "text/html;charset=utf-8" });
        gameUrl = URL.createObjectURL(blob);
      } else if (gameUrl && !gameUrl.startsWith("blob:")) {
        gameUrl += gameUrl.includes("?") ? "&" : "?";
      }

      if (gameUrl) {
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
    } catch (error) {
      console.error("Game init error:", error);
      const message =
        getApiErrorMessage(error) ||
        t(
          "Failed to load game. Please try again.",
          "ဂိမ်းဖွင့်၍ မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ။",
          "加载游戏失败，请重试。",
          "โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        );
      closeToast();
      await showDialog({
        title: t("Notice", "အကြောင်းကြားချက်", "提示", "แจ้งเตือน"),
        message,
        confirmButtonText: t("OK", "အိုကေ", "好的", "ตกลง"),
        theme: "round-button",
        className: "logout-dialog-dark",
        confirmButtonColor: "#1986E1",
      });
    } finally {
      closeToast();
    }
  };

  const handleGameClick = (game) => {
    selectedGameForModal.value = game;
    if (isMobile.value) {
      showGameActionSheet.value = true;
    } else {
      showGameModal.value = true;
    }
  };

  const closeGameModal = () => {
    showGameModal.value = false;
    showGameActionSheet.value = false;
    selectedGameForModal.value = null;
  };

  const onPlayFromGameModal = async () => {
    const game = selectedGameForModal.value;
    if (!game) return;
    const original = game.originalGame || game;
    if (beforePlay) {
      const handled = await Promise.resolve(beforePlay(original));
      if (handled) {
        closeGameModal();
        return;
      }
    }
    gameInit(original);
    closeGameModal();
  };

  const onTestFromGameModal = () => {
    const game = selectedGameForModal.value;
    if (!game) return;
    const original = game.originalGame || game;
    gameInit(original, true);
    closeGameModal();
  };

  const providerShortLabel = (provider) => {
    if (!provider) return "";
    return PROVIDER_LABELS[provider] || provider;
  };

  return {
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
  };
}
