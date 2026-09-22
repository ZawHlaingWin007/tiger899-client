<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useTranslation } from "../composables/useTranslation";

const emit = defineEmits(["open-privacy", "open-faq", "open-guide"]);

const router = useRouter();
const store = useStore();
const { t } = useTranslation();

const handlePrivacy = () => emit("open-privacy");
const handleFaq = () => emit("open-faq");
const handleGuide = (key) => emit("open-guide", key);

const gameLinks = computed(() => [
  { label: t("Slots", "စလော့", "老虎机", "สล็อต"), route: { name: "slots" } },
  {
    label: t("Card Games", "ဖဲဂိမ်း", "棋牌游戏", "เกมไพ่"),
    route: { name: "card-games" },
  },
  { label: t("Sports", "အားကစား", "体育", "กีฬา"), route: { name: "sports" } },
  {
    label: t("Fish Shooting", "ငါးပစ်", "捕鱼", "ยิงปลา"),
    route: { name: "fish-shooting" },
  },
]);

const tagLinks = computed(() => [
  { label: "Tiger899", route: { name: "home" } },
  { label: t("Slots", "စလော့", "老虎机", "สล็อต"), route: { name: "slots" } },
  { label: t("Sports", "ဘောလုံး", "体育", "กีฬา"), route: { name: "sports" } },
  { label: t("Casino", "ကာစီနို", "娱乐场", "คาสิโน"), route: { name: "live" } },
  { label: t("Fish", "ငါးပစ်", "捕鱼", "ยิงปลา"), route: { name: "fish-shooting" } },
  { label: t("Lottery", "ထี", "彩票", "ลอตเตอรี่"), route: { name: "lottery" } },
  { label: "Sport betting", route: { name: "sports" } },
  { label: "Casino online", route: { name: "live" } },
]);

const bankLogos = [
  { name: "KBZ Pay", src: "https://play-lh.googleusercontent.com/_mHHv8vs7kKh3eusAOV-hFFsGGPLWNsmSiKLCVwvN8oisVUbA92cfgadtift2Sfdb4o" },
  { name: "Wave Pay", src: "https://yt3.googleusercontent.com/ytc/AIdro_n8JoWWWC4bvYfAgoHtZtoaNwDlD7kTk_CN-g6O06CaB4o=s900-c-k-c0x00ffffff-no-rj" },
  { name: "AYA Pay", src: "https://play-lh.googleusercontent.com/Lgulng3ncFuuFVYTmT-JQxuZ_IQ9-iPCojY5lM6c3wK9uvSx_ZRqLGcq8dTQcez1HDvQiSvfmJHZN1EHg1oWfLk" },
  { name: "AYA Bank", src: "https://play-lh.googleusercontent.com/1jHtoS0x173CQwK9Pg2VnNTttB01AQkAf58C6bcv0JSqj-go-p0JMfnPJBdoZ_ElCg" },
];

const guideLinks = computed(() => [
  {
    label: t(
      "Registration Tutorial",
      "စာရင်းသွင်းနည်း",
      "注册教程",
      "วิธีลงทะเบียน",
    ),
    action: () => handleGuide("registration"),
  },
  {
    label: t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน"),
    action: () => handleGuide("deposit"),
  },
  {
    label: t("Withdrawal", "ငွေထုတ်", "提款", "ถอนเงิน"),
    action: () => handleGuide("withdrawal"),
  },
  {
    label: t("Games", "ဂိမ်း", "游戏", "เกม"),
    action: () => handleGuide("games"),
  },
]);

const languageOptions = [
  {
    text: "English",
    value: "en",
    icon: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/united-kingdom.png",
  },
  {
    text: "မြန်မာ",
    value: "mm",
    icon: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/myanmar.png",
  },
  {
    text: "中文",
    value: "cn",
    icon: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/china.png",
  },
  {
    text: "ไทย",
    value: "th",
    icon: "https://cdn.myanmarshankoeme.com/build/assets/img/bf688/thailand.png",
  },
];

const language = computed(() => store.state.language || "mm");
const currentLanguageOption = computed(
  () => languageOptions.find((opt) => opt.value === language.value) || languageOptions[0]
);
const showFooterLanguageDropdown = ref(false);
const footerLanguageDropdownRef = ref(null);

const setFooterLanguage = (lang) => {
  store.commit("setLanguage", lang);
  showFooterLanguageDropdown.value = false;
};

const toggleFooterLanguageDropdown = (e) => {
  e.stopPropagation();
  showFooterLanguageDropdown.value = !showFooterLanguageDropdown.value;
};

const closeFooterLanguageDropdown = (e) => {
  if (
    footerLanguageDropdownRef.value &&
    !footerLanguageDropdownRef.value.contains(e.target)
  ) {
    showFooterLanguageDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", closeFooterLanguageDropdown);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", closeFooterLanguageDropdown);
});
</script>

<template>
  <footer class="footer-section text-white">
    <div class="footer-inner">
      <div class="footer-hero">
        <img src="@/assets/tiger899-logo.png" alt="Tiger899 Logo" class="footer-logo" />
        <p class="footer-tagline font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Game rooms and deposit / withdraw banks", "ဂိမ်းခန်းများနဲ့ ငွေသွင်းငွေထုတ်ဘဏ်များ", "游戏厅与存取款银行", "ห้องเกมและธนาคารฝากถอน") }}
        </p>
      </div>

      <div class="footer-banks">
        <img
          v-for="bank in bankLogos"
          :key="bank.name"
          :src="bank.src"
          :alt="bank.name"
          class="footer-bank-logo"
        />
      </div>

      <div class="footer-intro-wrap">
        <h2 class="footer-title font-['Pyidaungsu','Padauk',sans-serif]">
          {{ t("Welcome to the best online casino in Myanmar.", "မြန်မာနိုင်ငံတွင်အကောင်းဆုံးအွန်လိုင်းကာစီနိုမှကြိုဆိုပါသည်။", "欢迎来到缅甸最佳在线娱乐场。", "ยินดีต้อนรับสู่คาสิโนออนไลน์ที่ดีที่สุดในเมียนมาร์") }}
        </h2>
        <p class="footer-intro font-['Pyidaungsu','Padauk',sans-serif]">
          {{
            t(
              "We provide a premium online gaming experience. Play mobile casino, slots, live casino, sports betting and card games in one trusted place at Tiger899.",
              "ကျွန်ုပ်တို့သည် ပရီမီယံအွန်လိုင်းလောင်းကစားအတွေ့အကြုံကို ပေးဆောင်ပါသည်။ Tiger899 ထံတွင် မိုဘိုင်းအွန်လိုင်းကာစီနို၊ စလော့ဂိမ်းများ၊ တိုက်ရိုက်ကာစီနို၊ sports betting နှင့် ဖဲချပ်ဂိမ်းပေါင်းများစွာကို တစ်နေရာထဲတွင်ဆော့ကစားလို့ရပါသည်။",
              "我们提供优质线上娱乐体验。您可在 Tiger899 一次畅玩手机娱乐场、老虎机、真人娱乐场、体育博彩与棋牌游戏。",
              "เรามอบประสบการณ์เดิมพันออนไลน์ระดับพรีเมียม ที่ Tiger899 คุณเล่นคาสิโนมือถือ สล็อต คาสิโนสด กีฬา และเกมไพ่ได้ในที่เดียว",
            )
          }}
        </p>
      </div>

      <div class="footer-tags">
        <span class="footer-tags-label">TAG</span>
        <button
          v-for="(item, index) in tagLinks"
          :key="index"
          type="button"
          class="footer-tag font-['Pyidaungsu','Padauk',sans-serif]"
          @click="router.push(item.route)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="footer-meta">
        <div class="footer-meta-col">
          <h3 class="footer-heading">{{ t("Games", "ဂိမ်းခန်း", "游戏", "เกม") }}</h3>
          <nav class="footer-links">
            <button
              v-for="(item, index) in gameLinks"
              :key="index"
              type="button"
              class="footer-link font-['Pyidaungsu','Padauk',sans-serif]"
              @click="router.push(item.route)"
            >
              {{ item.label }}
            </button>
          </nav>
        </div>
        <div class="footer-meta-col">
          <h3 class="footer-heading">PAYMENTS</h3>
          <button
            type="button"
            class="footer-link font-['Pyidaungsu','Padauk',sans-serif]"
            @click="handlePrivacy"
          >
            {{ t("Terms and Conditions", "စည်းမျဉ်းနှင့်အခြေအနေများ", "条款与条件", "ข้อกำหนดและเงื่อนไข") }}
          </button>
          <button
            type="button"
            class="footer-link font-['Pyidaungsu','Padauk',sans-serif]"
            @click="handleFaq"
          >
            {{ t("Frequent Questions", "မကြာခဏ မေးလေ့ရှိသော မေးခွန်းများ", "常见问题", "คำถามที่พบบ่อย") }}
          </button>
        </div>
        <div class="footer-meta-col">
          <h3 class="footer-heading">{{ t("Languages", "ဘာသာစကား", "语言", "ภาษา") }}</h3>
          <div
            ref="footerLanguageDropdownRef"
            class="footer-lang-wrap font-['Pyidaungsu','Padauk',sans-serif] relative"
          >
            <button
              type="button"
              class="footer-language-trigger"
              @click="toggleFooterLanguageDropdown"
            >
              <img
                :src="currentLanguageOption.icon"
                :alt="currentLanguageOption.text"
                class="footer-language-trigger__icon"
              />
              <span>{{ currentLanguageOption.text }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="footer-language-trigger__chevron"
                :class="{ 'footer-language-trigger__chevron--open': showFooterLanguageDropdown }"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-show="showFooterLanguageDropdown"
                class="footer-language-panel"
              >
                <button
                  v-for="opt in languageOptions"
                  :key="opt.value"
                  type="button"
                  class="footer-language-option"
                  :class="{ 'footer-language-option--active': language === opt.value }"
                  @click="setFooterLanguage(opt.value)"
                >
                  <img
                    :src="opt.icon"
                    :alt="opt.text"
                    class="footer-language-option__icon"
                  />
                  <span>{{ opt.text }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copy font-['Pyidaungsu','Padauk',sans-serif]">
          {{
            t(
              "Copyright © 2025 Tiger899 Casino All Rights Reserved.",
              "Copyright © 2025 Tiger899 Casino All Rights Reserved.",
              "Copyright © 2025 Tiger899 Casino All Rights Reserved.",
              "Copyright © 2025 Tiger899 Casino All Rights Reserved.",
            )
          }}
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-section {
  background: linear-gradient(180deg, #511799 0%, #11031f 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 2.25rem 1.25rem 0;
}

.footer-inner {
  max-width: 72rem;
  margin: 0 auto;
}

.footer-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.footer-logo {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 50%;
  filter: brightness(1.05);
}

.footer-tagline {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.88);
}

.footer-banks {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 1.5rem 0 2rem;
}

.footer-bank-logo {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 12px;
  background: #fff;
  padding: 4px;
}

.footer-intro-wrap {
  text-align: center;
  max-width: 52rem;
  margin: 0 auto 1.75rem;
}

.footer-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.footer-intro {
  font-size: 0.875rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.78);
}

.footer-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.footer-tags-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #facc15;
}

.footer-tag {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  color: #fff;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.footer-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

@media (min-width: 768px) {
  .footer-meta {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

.footer-heading {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.95);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(100, 10, 224, 0.7);
  margin-bottom: 0.5rem;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-link {
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: color 0.2s ease, padding-left 0.2s ease;
}

.footer-link:hover {
  color: rgba(255, 255, 255, 1);
  padding-left: 4px;
}

.footer-lang-wrap {
  font-size: 0.9375rem;
  font-weight: 500;
}

/* Custom footer language dropdown (opens next to trigger, not in sidebar) */
.footer-language-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.8);
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  min-width: 160px;
  max-width: 220px;
  justify-content: space-between;
}
.footer-language-trigger:hover {
  background: rgba(30, 41, 59, 0.9);
}
.footer-language-trigger__icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}
.footer-language-trigger__chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.footer-language-trigger__chevron--open {
  transform: rotate(180deg);
}
.footer-language-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  min-width: 100%;
  width: 220px;
  background: #172240;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  z-index: 2001;
  overflow: hidden;
}
.footer-language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  text-align: left;
  background: #172240;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  transition: background 0.15s ease;
}
.footer-language-option:hover {
  background: rgba(255, 255, 255, 0.08);
}
.footer-language-option--active {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}
.footer-language-option__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1.25rem 0;
  text-align: center;
}

.footer-copy {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

</style>
