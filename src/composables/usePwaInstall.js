import { ref } from "vue";

const deferredPrompt = ref(null);
const canInstall = ref(false);
const isInstalled = ref(false);
let listenersBound = false;

const getPlatform = () => {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || navigator.vendor || "";
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const getInstallUrl = () => {
  if (typeof window === "undefined") return "https://tiger899.com/";
  const { origin } = window.location;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "https://tiger899.com/";
  }
  return `${origin}/`;
};

export const initPwaInstall = () => {
  if (typeof window === "undefined" || listenersBound) return;
  listenersBound = true;

  isInstalled.value = isStandalone();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt.value = event;
    canInstall.value = true;
  });

  window.addEventListener("appinstalled", () => {
    isInstalled.value = true;
    deferredPrompt.value = null;
    canInstall.value = false;
  });
};

export const usePwaInstall = () => {
  initPwaInstall();

  const platform = getPlatform();

  const promptInstall = async () => {
    if (isStandalone()) {
      isInstalled.value = true;
      return { outcome: "already-installed" };
    }

    if (platform === "ios") {
      return { outcome: "ios-instructions" };
    }

    if (deferredPrompt.value) {
      deferredPrompt.value.prompt();
      const choice = await deferredPrompt.value.userChoice;
      deferredPrompt.value = null;
      canInstall.value = false;
      return choice;
    }

    return { outcome: "unavailable" };
  };

  return {
    canInstall,
    isInstalled,
    platform,
    isIos: platform === "ios",
    isAndroid: platform === "android",
    promptInstall,
    getInstallUrl,
  };
};
