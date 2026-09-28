import { ref } from "vue";
import axios from "axios";

/** Shared across the app so the wheel is shown or hidden from one status check. */
const isEnabled = ref(false);
const loaded = ref(false);
let pending = null;

export function useSpinWheelFeature() {
  const loadSpinWheelFeature = () => {
    if (loaded.value) return Promise.resolve(isEnabled.value);
    if (pending) return pending;

    pending = axios
      .get("/spinwheel-status")
      .then((res) => {
        isEnabled.value = res?.data?.data?.is_enabled !== false;
      })
      .catch(() => {
        isEnabled.value = true;
      })
      .finally(() => {
        loaded.value = true;
        pending = null;
      });

    return pending;
  };

  return {
    isEnabled,
    spinWheelFeatureLoaded: loaded,
    loadSpinWheelFeature,
  };
}
