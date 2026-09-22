import { showLoadingToast, closeToast } from "vant";
import { useTranslation } from "./useTranslation";

/**
 * Composable for Vant loading toast - show during async work, close when done.
 * Use in try/finally: showLoading(); try { ... } finally { hideLoading(); }
 */
export function useLoadingToast() {
  const { t } = useTranslation();

  const showLoading = (message) => {
    const msg =
      message ?? t("Loading...", "ဆောင်ရွက်နေသည်...", "加载中...", "กำลังโหลด...");
    showLoadingToast({
      message: msg,
      duration: 0,
      // Don't block page interactions while loading; just show visual feedback.
      forbidClick: false,
    });
  };

  const hideLoading = () => {
    closeToast();
  };

  return { showLoading, hideLoading };
}
