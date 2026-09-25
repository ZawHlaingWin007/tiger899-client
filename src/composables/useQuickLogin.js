import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import {
  showSuccessToast,
  showFailToast,
  showLoadingToast,
  closeToast,
} from "vant";
import { useTranslation } from "./useTranslation";

export function ensureDeviceUuid() {
  if (localStorage.getItem("device_uuid")) {
    return;
  }
  const deviceUuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
  localStorage.setItem("device_uuid", deviceUuid);
}

/**
 * One-tap login via persisted device_uuid (matches shweyote quick login).
 */
export function useQuickLogin() {
  const isQuickLogin = ref(false);
  const store = useStore();
  const router = useRouter();
  const route = useRoute();
  const { t } = useTranslation();

  const quickLogin = async ({ onSuccess, redirectTo = "/" } = {}) => {
    if (isQuickLogin.value) {
      return;
    }
    isQuickLogin.value = true;
    ensureDeviceUuid();

    showLoadingToast({
      message: t(
        "Loading...",
        "ဆောင်ရွက်နေသည်...",
        "加载中...",
        "กำลังโหลด...",
      ),
      duration: 0,
      forbidClick: true,
    });

    try {
      const deviceUuid = localStorage.getItem("device_uuid");
      const res = await axios.post("/auth/login-with-device", {
        device_uuid: deviceUuid,
        referralCode: localStorage.getItem("referralCode"),
      });

      localStorage.setItem("token", res.data.token);
      const currentTime = new Date();
      localStorage.setItem(
        "tokenExpire",
        new Date(currentTime.getTime() + 60 * 60 * 1000).toISOString(),
      );
      axios.defaults.headers.common.Authorization = `Bearer ${res.data.token}`;

      if (res.data.is_first_time === 1) {
        const platform =
          route.query.ref ||
          route.query.referrer ||
          localStorage.getItem("user_platform_ref");
        if (platform) {
          try {
            await axios.post("/auth/update-user-platform", {
              user_platform: String(platform).toLowerCase(),
            });
          } catch (err) {
            console.error("Failed to update user platform:", err);
          }
        }
      }

      await store.dispatch("fetchUser");
      closeToast();
      showSuccessToast({
        message: t(
          "Login successful!",
          "အကောင့်ဝင်ခြင်း အောင်မြင်ပါသည်။",
          "登录成功！",
          "เข้าสู่ระบบสำเร็จ!",
        ),
        position: "top",
      });

      onSuccess?.();
      await router.push(redirectTo);
    } catch (err) {
      closeToast();
      showFailToast({
        message: t(
          "Login Failed!",
          "အကောင့်ဝင်ခြင်း ကျရှုံးပါသည်။",
          "登录失败！",
          "เข้าสู่ระบบไม่สำเร็จ!",
        ),
        position: "top",
      });
      console.error(err);
    } finally {
      isQuickLogin.value = false;
    }
  };

  return { isQuickLogin, quickLogin };
}
