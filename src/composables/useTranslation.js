import { computed } from "vue";
import { useStore } from "vuex";

export const useTranslation = () => {
  const store = useStore();
  const language = computed(() => store.state.language || "mm");

  const t = (en, mm, cn, th) => {
    if (language.value === "en") return en;
    if (language.value === "cn") return cn ?? en;
    if (language.value === "th") return th ?? en;
    return mm ?? en;
  };

  return { t, language };
};
