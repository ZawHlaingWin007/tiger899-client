<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTranslation } from "../composables/useTranslation";
import { useModal } from "../composables/useModal";

const route = useRoute();
const router = useRouter();
const { t, language } = useTranslation();
const { openDepositModal } = useModal();

const leftItems = computed(() => {
  void language.value;
  return [
    {
      name: t("Home", "အဓိက", "首页", "หน้าแรก"),
      icon: "home",
      route: "home",
    },
    {
      name: t("Promotion", "ပရိုမိုးရှင်း", "优惠", "โปรโมชั่น"),
      icon: "gift",
      route: "promotion",
    },
  ];
});

const rightItems = computed(() => {
  void language.value;
  return [
    {
      name: t("Deposit", "ငွေသွင်း", "存款", "ฝากเงิน"),
      icon: "deposit",
      action: "deposit",
    },
    {
      name: t("Profile", "ပရိုဖိုင်", "个人资料", "โปรไฟล์"),
      icon: "profile",
      route: "account",
    },
  ];
});

const isActive = (item) => {
  if (item.route === "home") return route.name === "home";
  if (item.route === "promotion") {
    return route.name === "promotion" || route.name === "promotion-detail";
  }
  if (item.route === "account") return route.name === "account";
  if (item.action === "deposit") {
    return (
      route.name === "deposit-step-1" ||
      route.name === "deposit-step-2" ||
      route.name === "deposit-history"
    );
  }
  return false;
};

const navigate = (item) => {
  if (item.action === "deposit") {
    openDepositModal();
    return;
  }
  router.push({ name: item.route });
};

const goHome = () => {
  router.push({ name: "home" });
};
</script>

<template>
  <nav
    id="account-actions-mobile"
    class="account-actions-mobile md:hidden"
    aria-label="Mobile navigation"
  >
    <div class="account-actions-mobile__outer">
      <div class="account-actions-mobile__side account-actions-mobile__side--left">
        <button
          v-for="item in leftItems"
          :key="item.icon"
          type="button"
          class="account-actions-mobile__item"
          :class="isActive(item) ? 'is-active' : ''"
          @click="navigate(item)"
        >
          <span
            class="account-actions-mobile__icon"
            :class="item.icon === 'home' ? 'account-actions-mobile__icon--badge' : ''"
            aria-hidden="true"
          >
            <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3 3 10.5V20a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1v-9.5z" />
            </svg>
            <svg v-else-if="item.icon === 'gift'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-2.18A3 3 0 0 0 13 4.18L12 5.1l-1-0.92A3 3 0 0 0 6.18 8H4a1 1 0 0 0-1 1v3h18V9a1 1 0 0 0-1-1zM9 6.2A1.2 1.2 0 1 1 10.2 5 1.2 1.2 0 0 1 9 6.2zm6 0A1.2 1.2 0 1 1 16.2 5 1.2 1.2 0 0 1 15 6.2z" />
              <path d="M3 13h8v8H4a1 1 0 0 1-1-1zm10 0h8v7a1 1 0 0 1-1 1h-7z" />
            </svg>
          </span>
          <span class="account-actions-mobile__text">{{ item.name }}</span>
        </button>
      </div>

      <button
        type="button"
        class="account-actions-mobile__center"
        :class="{ 'is-active': route.name === 'home' }"
        aria-label="Tiger899"
        @click="goHome"
      >
        <span class="account-actions-mobile__center-inner">
          <img
            src="@/assets/tiger899-logo.png"
            alt=""
            class="account-actions-mobile__center-logo"
          />
        </span>
      </button>

      <div class="account-actions-mobile__fake-bg" aria-hidden="true">
        <svg viewBox="-10 -1 30 12" preserveAspectRatio="none">
          <defs>
            <linearGradient
              id="tiger-tabbar-bar-gradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="20%" stop-color="#511799" />
              <stop offset="100%" stop-color="#11031f" />
            </linearGradient>
          </defs>
          <path
            fill="url(#tiger-tabbar-bar-gradient)"
            fill-rule="evenodd"
            d="M-10 -1 H30 V12 H-10z M 5 5 m -5, 0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0z"
          />
        </svg>
      </div>

      <div class="account-actions-mobile__side account-actions-mobile__side--right">
        <button
          v-for="item in rightItems"
          :key="item.icon"
          type="button"
          class="account-actions-mobile__item"
          :class="isActive(item) ? 'is-active' : ''"
          @click="navigate(item)"
        >
          <span class="account-actions-mobile__icon" aria-hidden="true">
            <svg v-if="item.icon === 'profile'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a3.6 3.6 0 1 0-3.6-3.6A3.6 3.6 0 0 0 12 12zm0 1.8c-3.1 0-7.2 1.55-7.2 4.6V20h14.4v-1.6c0-3.05-4.1-4.6-7.2-4.6z" />
            </svg>
            <svg v-else-if="item.icon === 'deposit'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm2 3h14V7H5zm7 7a2 2 0 1 0-2-2 2 2 0 0 0 2 2z" />
            </svg>
          </span>
          <span class="account-actions-mobile__text">{{ item.name }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.account-actions-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 50;
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.account-actions-mobile__outer {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 90px;
}

.account-actions-mobile__side {
  z-index: 2;
  display: flex;
  flex: 1 1 0%;
  align-items: flex-end;
  height: 70px;
  padding-bottom: 6px;
  background: linear-gradient(180deg, #511799 0%, #11031f 100%);
  transition: filter 0.2s;
}

.account-actions-mobile__side--left {
  border-top-left-radius: 10px;
  border-top-right-radius: 22px;
}

.account-actions-mobile__side--right {
  border-top-left-radius: 22px;
  border-top-right-radius: 10px;
}

.account-actions-mobile__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 50%;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.account-actions-mobile__item.is-active .account-actions-mobile__text {
  color: #facc15;
}

.account-actions-mobile__icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.account-actions-mobile__icon svg {
  width: 28px;
  height: 28px;
}

.account-actions-mobile__icon--badge {
  border-radius: 10px;
  background: linear-gradient(180deg, #c9a227 0%, #8b6914 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.account-actions-mobile__text {
  margin-top: 0.25rem;
  font-family: "Pyidaungsu", "Padauk", sans-serif;
  font-size: 0.8rem;
  line-height: 1.15;
  color: #fff;
  transition: color 0.2s;
}

.account-actions-mobile__center {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 74px;
  height: 74px;
  margin: 0 8px 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: linear-gradient(130deg, #640ae0 12%, #511799 88%);
  box-shadow: rgba(255, 255, 255, 0.4) 0 0 10px;
  color: #fff;
  overflow: hidden;
  cursor: pointer;
}

.account-actions-mobile__center.is-active {
  box-shadow:
    rgba(250, 204, 21, 0.55) 0 0 10px,
    rgba(255, 255, 255, 0.35) 0 0 10px;
}

.account-actions-mobile__center-inner {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
}

.account-actions-mobile__center-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.account-actions-mobile__fake-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  overflow: hidden;
  width: 100%;
  height: 50px;
  pointer-events: none;
}

.account-actions-mobile__fake-bg svg {
  position: absolute;
  bottom: 0;
  left: 50%;
  height: 108px;
  transform: translateX(-50%);
}
</style>
