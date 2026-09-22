import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { getSeoForRoute, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '@/config/seo'
import { getBaseUrl } from '@/config/domain'

import MainLayout from '../layouts/MainLayout.vue'
import NoNavbarLayout from '../layouts/NoNavbarLayout.vue'
import HomePage from '../pages/HomePage.vue'

// Lazy-load all other pages so initial bundle stays small (only home + layouts load first)
const FavoritesPage = () => import('../pages/FavoritesPage.vue')
const LastGamePage = () => import('../pages/LastGamePage.vue')
const BettingHistoryPage = () => import('../pages/BettingHistoryPage.vue')
const SlotsPage = () => import('../pages/SlotsPage.vue')
const FishShootingPage = () => import('../pages/FishShootingPage.vue')
const LivePage = () => import('../pages/LivePage.vue')
const CardGamesPage = () => import('../pages/CardGamesPage.vue')
const SportsPage = () => import('../pages/SportsPage.vue')
const ESportsPage = () => import('../pages/ESportsPage.vue')
const CockfightingPage = () => import('../pages/CockfightingPage.vue')
const PromotionPage = () => import('../pages/PromotionPage.vue')
const DownloadPage = () => import('../pages/DownloadPage.vue')
const InvitePage = () => import('../pages/InvitePage.vue')
const RewardsPage = () => import('../pages/RewardsPage.vue')
const AccountPage = () => import('../pages/AccountPage.vue')
const PromoCodeClaimPage = () => import('../pages/PromoCodeClaimPage.vue')
const PromotionDetailPage = () => import('../pages/PromotionDetailPage.vue')
const HistoryPage = () => import('../pages/HistoryPage.vue')
const WithdrawHistoryPage = () => import('../pages/WithdrawHistoryPage.vue')
const DepositHistoryPage = () => import('../pages/DepositHistoryPage.vue')
const DepositStep1 = () => import('../pages/deposit/DepositStep1.vue')
const DepositStep2 = () => import('../pages/deposit/DepositStep2.vue')
const WithdrawPage = () => import('../pages/WithdrawPage.vue')
const AddEWalletPage = () => import('../pages/AddEWalletPage.vue')
const AddBankAccountPage = () => import('../pages/AddBankAccountPage.vue')
const AddCryptoWalletPage = () => import('../pages/AddCryptoWalletPage.vue')
const MyCardsPage = () => import('../pages/MyCardsPage.vue')
const UserBanksPage = () => import('../pages/user_banks/Index.vue')
const LotteryPage = () => import('../pages/LotteryPage.vue')
const BuffaloPage = () => import('../pages/BuffaloPage.vue')
const GameIframePage = () => import('../pages/GameIframePage.vue')

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
      },
      {
        path: 'favorites',
        name: 'favorites',
        component: FavoritesPage,
      },
      {
        path: 'last-game',
        name: 'last-game',
        component: LastGamePage,
      },
      {
        path: 'slots',
        name: 'slots',
        component: SlotsPage,
      },
      {
        path: 'fish-shooting',
        name: 'fish-shooting',
        component: FishShootingPage,
      },
      {
        path: 'live',
        name: 'live',
        component: LivePage,
      },
      {
        path: 'card-games',
        name: 'card-games',
        component: CardGamesPage,
      },
      {
        path: 'sports',
        name: 'sports',
        component: SportsPage,
      },
      {
        path: 'e-sports',
        name: 'e-sports',
        component: ESportsPage,
      },
      {
        path: 'cockfighting',
        name: 'cockfighting',
        component: CockfightingPage,
      },
      {
        path: 'promotion',
        name: 'promotion',
        component: PromotionPage,
      },
      {
        path: 'promotion/:id',
        name: 'promotion-detail',
        component: PromotionDetailPage,
      },
      {
        path: 'download',
        name: 'download',
        component: DownloadPage,
      },
      {
        path: 'rewards',
        name: 'rewards',
        component: RewardsPage,
      },

      {
        path: 'lottery',
        name: 'lottery',
        component: LotteryPage,
      },
      {
        path: 'buffalo',
        name: 'buffalo',
        component: BuffaloPage,
      },
    ],
  },
  {
    path: '/',
    component: NoNavbarLayout,
    children: [
      {
        path: 'betting-history',
        name: 'betting-history',
        component: BettingHistoryPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'invite',
        name: 'invite',
        component: InvitePage,
        meta: { requiresAuth: true }
      },
      {
        path: 'account',
        name: 'account',
        component: AccountPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'promo-code-claim',
        name: 'promo-code-claim',
        component: PromoCodeClaimPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'deposit/step-1',
        name: 'deposit-step-1',
        component: DepositStep1,
        meta: { requiresAuth: true }
      },
      {
        path: 'deposit/step-2',
        name: 'deposit-step-2',
        component: DepositStep2,
        meta: { requiresAuth: true }
      },
      {
        path: 'deposit-history',
        name: 'deposit-history',
        component: DepositHistoryPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'withdraw-history',
        name: 'withdraw-history',
        component: WithdrawHistoryPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'withdraw',
        name: 'withdraw',
        component: WithdrawPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'add-e-wallet',
        name: 'add-e-wallet',
        component: AddEWalletPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'add-bank-account',
        name: 'add-bank-account',
        component: AddBankAccountPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'add-crypto-wallet',
        name: 'add-crypto-wallet',
        component: AddCryptoWalletPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'my-cards',
        name: 'my-cards',
        component: UserBanksPage,
        meta: { requiresAuth: true }
      },
      {
        path: 'history',
        name: 'history',
        component: HistoryPage,
      },
      {
        path: 'play',
        name: 'game-iframe',
        component: GameIframePage,
      },
      // Add more no-navbar pages here in future
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');

  // Refresh user/balance in the background when navigating if we have a token,
  // but don't block page navigation so it feels snappy.
  if (token) {
    store.dispatch("fetchUser").catch(() => { });
  }

  // Store ref/r/code from any route for streamer/referral attribution; use as referral_code on register
  const referralParam = to.query.ref || to.query.r || to.query.code;
  if (referralParam) {
    localStorage.setItem("referralCode", String(referralParam).trim());
    if (!store.getters.isLoggedIn) {
      store.dispatch("openRegisterModal");
    }
  }

  if (to.meta.requiresAuth) {
    const isLoggedIn = store.getters.isLoggedIn;

    if (!token && !isLoggedIn) {
      store.dispatch('openLoginModal');
      if (!from.name) {
        return next({ name: 'home' })
      }
      return next(false);
    }
  }

  next();
});

// SEO: set document title, meta description, canonical and og:url per route (dynamic domain)
router.afterEach((to) => {
  const routeName = to.name || 'home'
  const { title, description } = getSeoForRoute(routeName)
  document.title = title || DEFAULT_TITLE
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', description || DEFAULT_DESCRIPTION)
  const ogTitle = document.querySelector('meta[property="og:title"]')
  const ogDesc = document.querySelector('meta[property="og:description"]')
  if (ogTitle) ogTitle.setAttribute('content', title || DEFAULT_TITLE)
  if (ogDesc) ogDesc.setAttribute('content', description || DEFAULT_DESCRIPTION)
  const base = getBaseUrl()
  const fullUrl = base + (to.fullPath.startsWith('/') ? to.fullPath : '/' + to.fullPath)
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', fullUrl)
  const ogUrl = document.querySelector('meta[property="og:url"]')
  if (ogUrl) ogUrl.setAttribute('content', fullUrl)
})

export default router

