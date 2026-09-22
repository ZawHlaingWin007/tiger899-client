<script setup>
import { computed, ref, watch, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTranslation } from "../composables/useTranslation";

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const scrollContainer = ref(null);
const categoryRefs = ref({});

const setCategoryRef = (id, el) => {
  if (el) categoryRefs.value[id] = el;
};

const scrollToActive = () => {
  nextTick(() => {
    const el = categoryRefs.value[activeCategory.value];
    if (el && scrollContainer.value) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  });
};

const gameCategories = computed(() => [
  {
    id: "home",
    title: "HOME",
    name: t("Home", "အဓိက", "首页", "หน้าแรก"),
    image: "/hot.png",
    edgeBadge: "home",
  },
  {
    id: "live",
    title: "CASINO",
    name: t("Casino", "ကာစီနို", "娱乐场", "คาสิโน"),
    image: "https://storage.googleapis.com/spacetech2/yu95/livecasino.png",
  },
  {
    id: "slots",
    title: "SLOT",
    name: t("Slots", "စလော့", "老虎机", "สล็อต"),
    image: "/7.png",
  },
  {
    id: "fish",
    title: "FISH",
    name: t("Fish Shooting", "ငါးပစ်", "捕鱼", "ยิงปลา"),
    image: "/fish.png",
  },
  {
    id: "cards",
    title: "CARDS",
    name: t("Card Games", "ဖဲဂိမ်း", "棋牌游戏", "เกมไพ่"),
    image: "https://storage.googleapis.com/spacetech2/yu95/card.png",
  },
  {
    id: "buffalo",
    title: "BUFFALO",
    name: t("Buffalo", "ကျွဲ", "野牛", "ควาย"),
    image: "https://storage.googleapis.com/spacetech2/yu95/kYAWEL-Green.png",
  },
  {
    id: "sports",
    title: "SPORT",
    name: t("Sports", "အားကစား", "体育", "กีฬา"),
    image: "/sport.png",
  },
  {
    id: "lottery",
    title: "LOTTO",
    name: t("Lottery", "ထီ", "彩票", "ลอตเตอรี่"),
    image: "/lottery.png",
  },
  {
    id: "download",
    title: "DOWNLOAD",
    name: t("Download", "ဒေါင်းလုဒ်", "下载", "ดาวน์โหลด"),
    edgeBadge: "download",
  },
]);

const categoryRoutes = {
  home: "home",
  slots: "slots",
  fish: "fish-shooting",
  cards: "card-games",
  sports: "sports",
  lottery: "lottery",
  live: "live",
  cockfighting: "cockfighting",
  buffalo: "buffalo",
  download: "download",
};

const activeCategory = computed(() => {
  if (route.name === "download") return "download";
  if (route.name === "slots") return "slots";
  if (route.name === "fish-shooting") return "fish";
  if (route.name === "card-games") return "cards";
  if (route.name === "sports") return "sports";
  if (route.name === "lottery") return "lottery";
  if (route.name === "live") return "live";
  if (route.name === "cockfighting") return "cockfighting";
  if (route.name === "buffalo") return "buffalo";
  return "home";
});

const selectCategory = (categoryId) => {
  const routeName = categoryRoutes[categoryId];
  if (!routeName) return;
  if (route.name === routeName) return;
  router.push({ name: routeName });
};

watch(activeCategory, scrollToActive);
onMounted(scrollToActive);
</script>

<template>
  <nav class="game-category-bar" aria-label="Game categories">
    <ul ref="scrollContainer" class="game-category-bar__list scrollbar-hide">
      <li
        v-for="category in gameCategories"
        :key="category.id"
        class="game-category-bar__item"
      >
        <button
          :ref="(el) => setCategoryRef(category.id, el)"
          type="button"
          class="game-category-bar__btn"
          :class="{
            'is-active': activeCategory === category.id,
          }"
          @click="selectCategory(category.id)"
        >
          <span
            class="game-category-bar__icon"
            :class="{
              'game-category-bar__icon--badge-home': category.edgeBadge === 'home',
              'game-category-bar__icon--badge-download':
                category.edgeBadge === 'download',
            }"
          >
            <svg
              v-if="category.id === 'download'"
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 15V3" />
              <path d="m7 10 5 5 5-5" />
              <path d="M20 21H4" />
            </svg>
            <img
              v-else
              :src="category.image"
              alt=""
              class="game-category-bar__img"
            />
          </span>
          <span class="game-category-bar__title">{{ category.title }}</span>
          <span class="game-category-bar__label">{{ category.name }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.game-category-bar {
  margin: 0.5rem 0;
  box-shadow: #000 0 0 10px;
  background: linear-gradient(182deg, #511799 0%, #11031f 100%);
}

.game-category-bar__list {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  gap: 0;
  margin: 0;
  padding: 0 0.25rem;
  list-style: none;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
}

.game-category-bar__item {
  flex: 0 0 auto;
  min-width: 4.75rem;
  scroll-snap-align: center;
  margin: 0;
}

.game-category-bar__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 4.75rem;
  padding: 0.4rem 0.35rem;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.game-category-bar__icon {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.game-category-bar__icon--badge-home {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(180deg, #c9a227 0%, #8b6914 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.game-category-bar__icon--badge-download {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(180deg, #640ae0 0%, #511799 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 0 8px rgba(100, 10, 224, 0.45);
  color: #fff;
}

.game-category-bar__img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.game-category-bar__icon--badge-home .game-category-bar__img {
  width: 28px;
  height: 28px;
}

.game-category-bar__btn.is-active .game-category-bar__icon,
.game-category-bar__btn:hover .game-category-bar__icon {
  transform: translateY(-2px);
}

.game-category-bar__title {
  display: none;
  padding-top: 0.25rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.1;
  color: rgba(255, 255, 255, 0.85);
}

.game-category-bar__label {
  display: block;
  padding-top: 0.25rem;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
  font-size: 0.8rem;
  line-height: 1.15;
  color: #fff !important;
}

@media (min-width: 992px) {
  .game-category-bar {
    border-radius: 8px;
    background: linear-gradient(137.32deg, #511799 0.02%, #11031f 99.96%);
  }

  .game-category-bar__item,
  .game-category-bar__btn {
    min-width: 5.5rem;
  }

  .game-category-bar__icon {
    width: 55px;
    height: 55px;
  }

  .game-category-bar__img {
    width: 55px;
    height: 55px;
  }

  .game-category-bar__title {
    display: block;
  }
}
</style>

<style>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
