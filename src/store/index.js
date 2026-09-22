import { createStore } from "vuex";
import axios from "axios";
import userBanks from "./modules/userBanks";

const store = createStore({
  modules: {
    userBanks
  },
  state: {
    authUser: JSON.parse(localStorage.getItem("userData")) || {},
    isLoginModalOpen: false,
    isRegisterModalOpen: false,
    fb_order: {
      fb_matches: [],
    },
    androidVersion: "1.1.0",
    amount: 0.0,
    totalWithdraw: 0.0,
    betAmount: null,
    twod_slip_data: [],
    threed_slip_data: [],
    twod_numbers: [],
    threed_numbers: [],
    language: localStorage.getItem("language") || "mm",
    contactInfo: "testing",
    music: false,
    sideNav: "hot",
    iframeURL: null,
    forceMobileFrame: false,
    isLoading: false,
    profileModalOpen: false,
  },
  mutations: {
    SET_LOGIN_MODAL(state, status) {
      state.isLoginModalOpen = status;
    },
    SET_REGISTER_MODAL(state, status) {
      state.isRegisterModalOpen = status;
    },
    setContactInfo(state, value) {
      state.contactInfo = value;
    },
    setLoading(state, value) {
      state.isLoading = value;
    },
    setIframeURL(state, value) {
      state.iframeURL = value;
    },
    setForceMobileFrame(state, value) {
      state.forceMobileFrame = !!value;
    },
    setProfileModalOpen(state, value) {
      state.profileModalOpen = !!value;
    },
    SET_USER(state, value) {
      state.authUser = value;
    },
    setTotalWithdraw(state, value) {
      state.totalWithdraw = value;
    },
    setMusic(state, value) {
      state.music = value;
    },
    setBetAmount(state, value) {
      state.betAmount = value;
    },
    setAmount(state, value) {
      state.amount = value;
    },
    setTwodSlip(state, value) {
      state.twod_slip_data = value;
    },
    setThreedSlip(state, value) {
      state.threed_slip_data = value;
    },
    setTwodnumbers(state, value) {
      state.twod_numbers = value;
    },
    setThreednumbers(state, value) {
      state.threed_numbers = value;
    },
    setLanguage(state, value) {
      state.language = value;
      localStorage.setItem("language", value);
    },
    setIsDeposits(state, value) {
      state.isDeposits = value;
    },
    setIsWithdraws(state, value) {
      state.isWithdraws = value;
    },
    setWholeFBMatches(state, data) {
      state.fb_order.fb_matches = [];
      state.fb_order.fb_matches = data;
    },
    setFBMatches(state, value) {
      state.fb_order.fb_matches.push(value);
    },
    updateFBMatches(state, data) {
      state.fb_order.fb_matches.splice(data.index, 1);
      state.fb_order.fb_matches[data.index] = data.value;
    },
    removeFBMatch(state, index) {
      state.fb_order.fb_matches.splice(index, 1);
    },
    updateFBOrder(state, data) {
      state.fb_order[data.type] = data.value;
    },
    updateSideNav(state, data) {
      state.sideNav = data;
    },
  },
  actions: {
    async fetchUser({ commit }) {
      try {
        const userRes = await axios.get("/auth/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        commit("SET_USER", userRes.data.data);
        commit("setAmount", userRes.data.data.amount);
        commit("setTotalWithdraw", userRes.data.totalWithdraw);
        localStorage.setItem(
          "userData",
          JSON.stringify(userRes.data.data)
        );

        return userRes.data.data;
      } catch (error) {
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpire");
        commit("SET_USER", {});
        commit("setAmount", 0.0);
        return null;
      }
    },
    /** Reload user from API without clearing session on network errors (401 still logs out). */
    async refreshUser({ commit }) {
      try {
        const userRes = await axios.get("/auth/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        commit("SET_USER", userRes.data.data);
        commit("setAmount", userRes.data.data.amount);
        commit("setTotalWithdraw", userRes.data.totalWithdraw);
        localStorage.setItem(
          "userData",
          JSON.stringify(userRes.data.data),
        );

        return userRes.data.data;
      } catch (error) {
        const status = error.response?.status;
        if (status === 401) {
          localStorage.removeItem("userData");
          localStorage.removeItem("token");
          localStorage.removeItem("tokenExpire");
          commit("SET_USER", {});
          commit("setAmount", 0.0);
        }
        throw error;
      }
    },
    async fetchProfile({ commit, state }) {
      try {
        const res = await axios.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const profile = res?.data?.data ?? res?.data ?? {};
        if (profile && Object.keys(profile).length) {
          const current = state.authUser || {};
          const merged = { ...current, ...profile, profile_image: profile.profile ?? current.profile_image };
          commit("SET_USER", merged);
          const stored = JSON.parse(localStorage.getItem("userData") || "{}");
          localStorage.setItem("userData", JSON.stringify({ ...stored, ...profile, profile_image: profile.profile ?? stored.profile_image }));
        }
        return profile;
      } catch (error) {
        return null;
      }
    },
    async logoutUser({ commit }) {
      await axios.post(
        "/auth/logout",
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      commit("SET_USER", {});
      commit("setAmount", 0.0);
      localStorage.removeItem("userData");
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpire");
    },

    openLoginModal({ commit }) {
      commit('SET_LOGIN_MODAL', true);
    },
    closeLoginModal({ commit }) {
      commit('SET_LOGIN_MODAL', false);
    },
    openRegisterModal({ commit }) {
      commit('SET_REGISTER_MODAL', true);
    },
    closeRegisterModal({ commit }) {
      commit('SET_REGISTER_MODAL', false);
    }
  },
  getters: {
    getFBOrder(state) {
      return state.fb_order;
    },
    isLoggedIn: (state) => {
      return !!(state.authUser && state.authUser.id);
    },
    currentUser: (state) => state.authUser
  },
});

export default store;
