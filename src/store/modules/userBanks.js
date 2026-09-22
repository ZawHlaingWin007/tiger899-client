import axios from 'axios';

export default {
    namespaced: true,
    state: {
        userBanks: [],
        bankTypes: [],
    },
    mutations: {
        SET_USER_BANKS(state, data) {
            state.userBanks = Array.isArray(data) ? data : (data.data || []);
        },
        SET_BANK_TYPES(state, data) {
            state.bankTypes = Array.isArray(data) ? data : (data.data || []);
        }
    },
    actions: {
        async fetchBankTypes({ commit }) {
            const response = await axios.get('/user-bank-types', {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            commit('SET_BANK_TYPES', response.data);
        },
        async fetchUserBanks({ commit }) {
            const response = await axios.get('/user/user-banks', {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            commit('SET_USER_BANKS', response.data);
        },
        async saveUserBank({ dispatch }, { id, formData }) {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (id) {
                formData.append('_method', 'PUT');
                await axios.post(`/user/user-banks/${id}`, formData, config);
            } else {
                await axios.post('/user/user-banks', formData, config);
            }

            await dispatch('fetchUserBanks');
        },
        async deleteUserBank({ dispatch }, id) {
            await axios.delete(`/user/user-banks/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            await dispatch('fetchUserBanks');
        }
    },
    getters: {
        banksByCategory: (state) => (category) => {
            return state.userBanks.filter(bank =>
                bank.bankType && bank.bankType.category === category
            );
        },
        typesByCategory: (state) => (category) => {
            return state.bankTypes.filter(type => type.category === category);
        }
    }
};